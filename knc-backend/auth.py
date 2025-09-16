# auth.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from database import get_db
from models import User, Transaction, Company
import bcrypt
import random
import string
from datetime import datetime
from typing import Optional

router = APIRouter()

# --- Pydantic Schemas ---
class SignupSchema(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    username: str
    pin: str

class LoginSchema(BaseModel):
    username: str
    pin: str

class DepositSchema(BaseModel):
    username: str
    amount: float

class WithdrawSchema(BaseModel):
    username: str
    amount: float

class SendMoneySchema(BaseModel):
    sender_username: str
    recipient_username: str
    amount: float
    notes: Optional[str] = None

class PayBillsSchema(BaseModel):
    username: str
    company_name: str
    amount: float
    notes: Optional[str] = None

class BalanceResponse(BaseModel):
    balance: float
    username: str

class TransactionResponse(BaseModel):
    message: str
    new_balance: float
    transaction_id: str

class UpdateProfileSchema(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr

# --- Helper Functions ---
def generate_reference_number():
    """Generate a unique reference number for transactions"""
    timestamp = datetime.now().strftime("%Y%m")
    random_digits = ''.join(random.choices(string.digits, k=4))
    return f"{timestamp}{random_digits}"

def create_transaction(db: Session, user_id: int, transaction_type: str, amount: float, 
                      description: str, recipient_username: str = None, 
                      sender_username: str = None, bill_company: str = None, 
                      notes: str = None):
    """Helper function to create a transaction record"""
    reference_number = generate_reference_number()
    transaction = Transaction(
        user_id=user_id,
        transaction_type=transaction_type,
        amount=amount,
        description=description,
        reference_number=reference_number,
        recipient_username=recipient_username,
        sender_username=sender_username,
        bill_company=bill_company,
        notes=notes
    )
    db.add(transaction)
    return reference_number

# --- Authentication Routes ---
@router.post("/signup")
def signup(user: SignupSchema, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == user.username) | (User.email == user.email)).first():
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    hashed_pin = bcrypt.hashpw(user.pin.encode('utf-8'), bcrypt.gensalt())
    
    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        username=user.username,
        hashed_pin=hashed_pin.decode('utf-8'),
        balance=0.0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully"}

@router.post("/login")
def login(credentials: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid username or PIN")
    
    if not bcrypt.checkpw(credentials.pin.encode('utf-8'), user.hashed_pin.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid username or PIN")
    
    return {"message": "Login successful", "username": user.username}

# --- Balance Route ---
@router.get("/balance/{username}", response_model=BalanceResponse)
def get_balance(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return BalanceResponse(balance=user.balance, username=user.username)

# --- Deposit Route ---
@router.post("/deposit", response_model=TransactionResponse)
def deposit(deposit_data: DepositSchema, db: Session = Depends(get_db)):
    if deposit_data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    
    if deposit_data.amount < 100:
        raise HTTPException(status_code=400, detail="Minimum deposit amount is PHP 100")
    
    user = db.query(User).filter(User.username == deposit_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        user.balance += deposit_data.amount
        reference_number = create_transaction(
            db, user.id, "deposit", deposit_data.amount,
            f"Deposit of PHP {deposit_data.amount:.2f}"
        )
        
        db.commit()
        db.refresh(user)
        
        return TransactionResponse(
            message=f"Successfully deposited PHP {deposit_data.amount:.2f}",
            new_balance=user.balance,
            transaction_id=reference_number
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Deposit failed. Please try again.")

# --- Withdraw Route ---
@router.post("/withdraw", response_model=TransactionResponse)
def withdraw(withdraw_data: WithdrawSchema, db: Session = Depends(get_db)):
    if withdraw_data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    
    user = db.query(User).filter(User.username == withdraw_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.balance < withdraw_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    try:
        user.balance -= withdraw_data.amount
        reference_number = create_transaction(
            db, user.id, "withdraw", withdraw_data.amount,
            f"Withdrawal of PHP {withdraw_data.amount:.2f}"
        )
        
        db.commit()
        db.refresh(user)
        
        return TransactionResponse(
            message=f"Successfully withdrew PHP {withdraw_data.amount:.2f}",
            new_balance=user.balance,
            transaction_id=reference_number
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Withdrawal failed. Please try again.")

# --- Send Money Route ---
@router.post("/send-money", response_model=TransactionResponse)
def send_money(send_data: SendMoneySchema, db: Session = Depends(get_db)):
    if send_data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    
    # Get sender
    sender = db.query(User).filter(User.username == send_data.sender_username).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")
    
    # Get recipient
    recipient = db.query(User).filter(User.username == send_data.recipient_username).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    if sender.balance < send_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    if send_data.sender_username == send_data.recipient_username:
        raise HTTPException(status_code=400, detail="Cannot send money to yourself")
    
    try:
        # Deduct from sender
        sender.balance -= send_data.amount
        sender_ref = create_transaction(
            db, sender.id, "send_money", send_data.amount,
            f"Sent PHP {send_data.amount:.2f} to {send_data.recipient_username}",
            recipient_username=send_data.recipient_username,
            notes=send_data.notes
        )
        
        # Add to recipient
        recipient.balance += send_data.amount
        create_transaction(
            db, recipient.id, "receive_money", send_data.amount,
            f"Received PHP {send_data.amount:.2f} from {send_data.sender_username}",
            sender_username=send_data.sender_username,
            notes=send_data.notes
        )
        
        db.commit()
        db.refresh(sender)
        
        return TransactionResponse(
            message=f"Successfully sent PHP {send_data.amount:.2f} to {send_data.recipient_username}",
            new_balance=sender.balance,
            transaction_id=sender_ref
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Money transfer failed. Please try again.")

# --- Pay Bills Route ---
@router.post("/pay-bills", response_model=TransactionResponse)
def pay_bills(bill_data: PayBillsSchema, db: Session = Depends(get_db)):
    if bill_data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    
    user = db.query(User).filter(User.username == bill_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if company exists
    company = db.query(Company).filter(Company.name == bill_data.company_name).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if user.balance < bill_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    try:
        user.balance -= bill_data.amount
        reference_number = create_transaction(
            db, user.id, "pay_bills", bill_data.amount,
            f"Bill payment to {bill_data.company_name} - PHP {bill_data.amount:.2f}",
            bill_company=bill_data.company_name,
            notes=bill_data.notes
        )
        
        db.commit()
        db.refresh(user)
        
        return TransactionResponse(
            message=f"Successfully paid PHP {bill_data.amount:.2f} to {bill_data.company_name}",
            new_balance=user.balance,
            transaction_id=reference_number
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Bill payment failed. Please try again.")

# --- Transaction History Route ---
@router.get("/transactions/{username}")
def get_transactions(username: str, limit: int = 10, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user.id
    ).order_by(Transaction.timestamp.desc()).limit(limit).all()
    
    return [
        {
            "reference_number": t.reference_number,
            "type": t.transaction_type,
            "amount": t.amount,
            "description": t.description,
            "timestamp": t.timestamp.strftime("%m/%d/%Y %I:%M %p"),
            "date": t.timestamp.strftime("%m/%d/%Y"),
            "time": t.timestamp.strftime("%I:%M %p"),
            "recipient": t.recipient_username,
            "sender": t.sender_username,
            "company": t.bill_company,
            "notes": t.notes
        }
        for t in transactions
    ]

# --- Companies Route ---
@router.get("/companies")
def get_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).filter(Company.is_active == True).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "category": c.category
        }
        for c in companies
    ]

@router.post("/companies")
def create_company(name: str, category: str, db: Session = Depends(get_db)):
    existing_company = db.query(Company).filter(Company.name == name).first()
    if existing_company:
        raise HTTPException(status_code=400, detail="Company already exists")
    
    company = Company(name=name, category=category)
    db.add(company)
    db.commit()
    db.refresh(company)
    
    return {"message": f"Company {name} created successfully", "id": company.id}

# --- User Profile Route ---
@router.get("/profile/{username}")
def get_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "username": user.username,
        "balance": user.balance,
        "created_at": user.created_at
    }

# --- Edit Profile Route ---
@router.put("/profile/{username}")
def update_profile(username: str, profile_data: UpdateProfileSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if email is being changed and if it's already taken by another user
    if profile_data.email != user.email:
        existing_email = db.query(User).filter(
            User.email == profile_data.email,
            User.id != user.id
        ).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already exists")
    
    try:
        # Update user fields
        user.first_name = profile_data.first_name
        user.last_name = profile_data.last_name
        user.email = profile_data.email
        
        db.commit()
        db.refresh(user)
        
        return {
            "message": "Profile updated successfully",
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "username": user.username,
            "balance": user.balance,
            "created_at": user.created_at
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Profile update failed. Please try again.")
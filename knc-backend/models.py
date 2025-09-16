# models.py

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_pin = Column(String, nullable=False)
    balance = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    transaction_type = Column(String, nullable=False)  # 'deposit', 'withdraw', 'send_money', 'receive_money', 'pay_bills'
    amount = Column(Float, nullable=False)
    description = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    reference_number = Column(String, unique=True, index=True)
    
    # Additional fields for different transaction types
    recipient_username = Column(String, nullable=True)  # For send_money transactions
    sender_username = Column(String, nullable=True)     # For receive_money transactions
    bill_company = Column(String, nullable=True)        # For pay_bills transactions
    notes = Column(Text, nullable=True)                 # Additional notes

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=False)  # 'utility', 'telecom', 'internet', etc.
    is_active = Column(Boolean, default=True)  # Fixed: Should be Boolean, not String
    created_at = Column(DateTime(timezone=True), server_default=func.now())
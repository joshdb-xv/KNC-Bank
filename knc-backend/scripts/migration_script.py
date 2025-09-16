# improved_migration_script.py
from sqlalchemy import text, inspect
from database import engine

def run_migration():
    """Enhanced migration to support all transaction types"""
    
    with engine.connect() as connection:
        trans = connection.begin()
        
        try:
            print("Starting enhanced migration...")
            
            # Check if tables exist
            inspector = inspect(engine)
            existing_tables = inspector.get_table_names()
            
            # Add balance column to users table if it doesn't exist
            connection.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS balance FLOAT DEFAULT 0.0 NOT NULL
            """))
            print("Added balance column to users table")
            
            # Add created_at column to users table if it doesn't exist
            connection.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """))
            print("Added created_at column to users table")
            
            # Handle transactions table - either create or alter
            if 'transactions' not in existing_tables:
                # Create new table with all columns
                connection.execute(text("""
                    CREATE TABLE transactions (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        transaction_type VARCHAR NOT NULL,
                        amount FLOAT NOT NULL,
                        description TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        reference_number VARCHAR UNIQUE NOT NULL,
                        recipient_username VARCHAR,
                        sender_username VARCHAR,
                        bill_company VARCHAR,
                        notes TEXT
                    )
                """))
                print("Created new transactions table with all columns")
            else:
                # Add missing columns to existing table
                existing_columns = [col['name'] for col in inspector.get_columns('transactions')]
                
                missing_columns = [
                    ('recipient_username', 'VARCHAR'),
                    ('sender_username', 'VARCHAR'),
                    ('bill_company', 'VARCHAR'),
                    ('notes', 'TEXT')
                ]
                
                for column_name, column_type in missing_columns:
                    if column_name not in existing_columns:
                        connection.execute(text(f"""
                            ALTER TABLE transactions 
                            ADD COLUMN {column_name} {column_type}
                        """))
                        print(f"Added {column_name} column to transactions table")
            
            # Create companies table for bill payments
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS companies (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR UNIQUE NOT NULL,
                    category VARCHAR NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("Created companies table")
            
            # Insert sample companies
            connection.execute(text("""
                INSERT INTO companies (name, category) VALUES
                ('MERALCO', 'utility'),
                ('Maynilad', 'utility'),
                ('PLDT', 'telecom'),
                ('Globe', 'telecom'),
                ('Smart', 'telecom'),
                ('Sky Broadband', 'internet'),
                ('Converge', 'internet'),
                ('SSS', 'government'),
                ('PhilHealth', 'government'),
                ('Pag-IBIG', 'government')
                ON CONFLICT (name) DO NOTHING
            """))
            print("Inserted sample companies")
            
            # Create indexes for better performance
            indexes = [
                ("idx_transactions_reference_number", "transactions", "reference_number"),
                ("idx_transactions_user_id", "transactions", "user_id"),
                ("idx_transactions_timestamp", "transactions", "timestamp"),
                ("idx_transactions_type", "transactions", "transaction_type"),
                ("idx_companies_name", "companies", "name"),
                ("idx_companies_active", "companies", "is_active")
            ]
            
            for idx_name, table_name, column_name in indexes:
                connection.execute(text(f"""
                    CREATE INDEX IF NOT EXISTS {idx_name} 
                    ON {table_name} ({column_name})
                """))
            
            print("Created database indexes")
            
            # Commit all changes
            trans.commit()
            print("Enhanced migration completed successfully!")
            
            # Verify the schema
            print("\nVerifying schema...")
            tables = inspector.get_table_names()
            print(f"Tables in database: {tables}")
            
            if 'transactions' in tables:
                transaction_columns = [col['name'] for col in inspector.get_columns('transactions')]
                print(f"Transactions table columns: {transaction_columns}")
            
        except Exception as e:
            trans.rollback()
            print(f"Migration failed: {e}")
            raise

if __name__ == "__main__":
    run_migration()
# fix_companies_table.py
from sqlalchemy import text
from database import engine

def fix_companies_table():
    """Fix the is_active column data type in companies table"""
    
    with engine.connect() as connection:
        trans = connection.begin()
        
        try:
            print("Fixing companies table schema...")
            
            # First, let's see what data is currently in the table
            result = connection.execute(text("SELECT name, is_active FROM companies LIMIT 5"))
            existing_data = result.fetchall()
            print(f"Current data sample: {existing_data}")
            
            # Method 1: If table is empty or you want to recreate it
            print("Recreating companies table with correct schema...")
            
            # Drop existing table
            connection.execute(text("DROP TABLE IF EXISTS companies CASCADE"))
            
            # Create new table with correct Boolean type
            connection.execute(text("""
                CREATE TABLE companies (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR UNIQUE NOT NULL,
                    category VARCHAR NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Insert sample companies with proper boolean values
            connection.execute(text("""
                INSERT INTO companies (name, category, is_active) VALUES
                ('MERALCO', 'utility', TRUE),
                ('Maynilad', 'utility', TRUE),
                ('PLDT', 'telecom', TRUE),
                ('Globe', 'telecom', TRUE),
                ('Smart', 'telecom', TRUE),
                ('Sky Broadband', 'internet', TRUE),
                ('Converge', 'internet', TRUE),
                ('SSS', 'government', TRUE),
                ('PhilHealth', 'government', TRUE),
                ('Pag-IBIG', 'government', TRUE)
            """))
            
            # Create index
            connection.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_companies_active 
                ON companies (is_active)
            """))
            
            print("Companies table fixed successfully!")
            
            # Verify the fix
            result = connection.execute(text("SELECT name, is_active FROM companies LIMIT 3"))
            new_data = result.fetchall()
            print(f"New data sample: {new_data}")
            
            trans.commit()
            
        except Exception as e:
            trans.rollback()
            print(f"Error fixing companies table: {e}")
            
            # Alternative method: If you want to preserve existing data
            print("Trying alternative method with data preservation...")
            
            try:
                # Create a temporary table with correct schema
                connection.execute(text("""
                    CREATE TABLE companies_temp (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR UNIQUE NOT NULL,
                        category VARCHAR NOT NULL,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                
                # Copy data with proper conversion
                connection.execute(text("""
                    INSERT INTO companies_temp (name, category, is_active, created_at)
                    SELECT 
                        name, 
                        category, 
                        CASE 
                            WHEN is_active = 'true' OR is_active = 'TRUE' OR is_active = '1' THEN TRUE 
                            ELSE FALSE 
                        END,
                        created_at
                    FROM companies
                """))
                
                # Drop old table and rename
                connection.execute(text("DROP TABLE companies"))
                connection.execute(text("ALTER TABLE companies_temp RENAME TO companies"))
                
                # Create index
                connection.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_companies_active 
                    ON companies (is_active)
                """))
                
                trans.commit()
                print("Companies table fixed with data preservation!")
                
            except Exception as e2:
                trans.rollback()
                print(f"Both methods failed: {e2}")
                raise

if __name__ == "__main__":
    fix_companies_table()
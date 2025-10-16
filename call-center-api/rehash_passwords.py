import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from passlib.context import CryptContext
from models.user import User
from core.config import settings

async def rehash_passwords():
    # Initialize database connection
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    async with async_session() as db:
        # Fetch all users
        result = await db.execute(select(User))
        users = result.scalars().all()

        for user in users:
            try:
                # Check if hashed_password is valid bcrypt
                pwd_context.verify("test", user.hashed_password)
            except Exception:
                # Rehash password (replace 'default_password' with actual password)
                print(f"Rehashing password for user {user.email}")
                user.hashed_password = pwd_context.hash("default_password")  # Replace with actual password
                await db.commit()
                await db.refresh(user)

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(rehash_passwords())
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional, Annotated

from database import get_db
from auth import get_current_user
from schemas.user import UserCreate, UserOut, UserUpdate
from schemas.agent import AgentCreate, AgentUpdate
from models.user import User
from crud.user import user_crud

router = APIRouter()

@router.get("/", response_model=List[UserOut])
async def get_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    role: Optional[str] = Query(None, regex="^(super-admin|admin|agent|viewer)?$"),
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20
):
    """Retrieve all users with optional role filter and pagination."""
    users = await user_crud.get_users(db, current_user, role)
    start = (page - 1) * size
    end = start + size
    return users[start:end]

from pydantic import BaseModel

class CreateUserRequest(BaseModel):
    user_data: UserCreate
    agent_data: Optional[AgentCreate] = None

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: CreateUserRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user (admin or agent)."""
    try:
        user = await user_crud.create_user(db, current_user, request.user_data, request.agent_data)
        return user
    except HTTPException as e:
        raise e
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve a specific user by ID."""
    user = await user_crud.get_user(db, user_id, current_user)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    agent_data: Optional[AgentUpdate] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a user."""
    try:
        user = await user_crud.update_user(db, user_id, user_data, agent_data, current_user)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user
    except HTTPException as e:
        raise e
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a user."""
    try:
        await user_crud.delete_user(db, user_id, current_user)
    except HTTPException as e:
        raise e
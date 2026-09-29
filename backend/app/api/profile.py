from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.profile import UserProfile
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse, ProfileStatus
from app.core.security import get_current_user

router = APIRouter(prefix="/profile", tags=["User Profile"])


@router.post("", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_profile(
    profile_in: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create or update the biometric and lifestyle profile for the authenticated user.
    Extracts user_id from JWT token so users can only modify their own profile.
    """
    existing_profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )

    if existing_profile:
        # Update existing profile fields
        for field, value in profile_in.model_dump(exclude_unset=True).items():
            setattr(existing_profile, field, value)
        
        # Also sync goal to user table if provided
        if profile_in.primary_goal:
            current_user.goal = profile_in.primary_goal
            
        db.commit()
        db.refresh(existing_profile)
        return existing_profile

    # Create new profile
    new_profile = UserProfile(
        user_id=current_user.id,
        **profile_in.model_dump()
    )
    
    # Sync goal to user table
    if profile_in.primary_goal:
        current_user.goal = profile_in.primary_goal

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return new_profile


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the profile of the currently authenticated user.
    """
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile has not been created yet.",
        )
    return profile


@router.get("/status", response_model=ProfileStatus)
def check_profile_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check if the authenticated user has completed onboarding / profile setup.
    Used for frontend route guarding.
    """
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )
    return ProfileStatus(
        has_profile=profile is not None,
        profile=profile
    )


@router.put("", response_model=ProfileResponse)
@router.put("/", response_model=ProfileResponse)
@router.patch("", response_model=ProfileResponse)
def update_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Partially update user goals, target weight, activity tier, or dietary preferences.
    """
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Complete onboarding first.",
        )

    for field, val in profile_update.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(profile, field, val)

    if profile_update.primary_goal:
        current_user.goal = profile_update.primary_goal

    db.commit()
    db.refresh(profile)
    return profile


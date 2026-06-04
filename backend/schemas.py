from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "user"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ServiceBase(BaseModel):
    title: str
    description: str
    price: float
    category: str

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None

class ServiceStatusUpdate(BaseModel):
    status: str

class ServiceResponse(ServiceBase):
    id: int
    status: str
    provider_id: int
    provider_name: str
    rating: Optional[float] = 0
    request_count: Optional[int] = 0
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class MarketplaceServiceResponse(ServiceResponse):
    pass

class ServiceRequestCreate(BaseModel):
    service_id: int
    message: str
    requested_date: Optional[str] = None
    address: Optional[str] = None
    contact_phone: Optional[str] = None

class ServiceRequestStatusUpdate(BaseModel):
    status: str

class ServiceRequestResponse(BaseModel):
    id: int
    service_id: int
    requester_id: int
    provider_id: int
    message: str
    requested_date: Optional[str] = None
    address: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str
    service_title: str
    requester_name: str
    provider_name: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

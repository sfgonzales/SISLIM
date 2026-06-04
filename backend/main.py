from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from datetime import timedelta
from typing import List, Optional

import schemas, auth
from database import get_supabase_client

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

supabase = get_supabase_client()

app = FastAPI(title="SISLIM Users API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with actual frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = fetch_user_by_email(form_data.username)
    if not user or not auth.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate):
    existing = fetch_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth.get_password_hash(user.password)
    payload = {
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": hashed_password,
        "role": user.role,
        "is_active": user.is_active,
    }
    response = supabase.post(
        "users",
        json=payload,
        headers={"Prefer": "return=representation"}
    )
    if response.status_code not in (201, 200):
        raise HTTPException(status_code=500, detail="Unable to create user")
    created = response.json()
    return created[0] if isinstance(created, list) and created else created


@app.get("/users/", response_model=List[schemas.UserResponse])
def read_users(skip: int = 0, limit: int = 100, current_user: dict = Depends(auth.get_current_user)):
    response = supabase.get(
        "users",
        params={"select": "*", "offset": str(skip), "limit": str(limit)},
    )
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Unable to load users")
    return response.json() or []


@app.get("/users/me/", response_model=schemas.UserResponse)
def read_users_me(current_user: dict = Depends(auth.get_current_user)):
    return current_user


@app.get("/users/{user_id}", response_model=schemas.UserResponse)
def read_user(user_id: int, current_user: dict = Depends(auth.get_current_user)):
    user = fetch_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserUpdate, current_user: dict = Depends(auth.get_current_user)):
    existing = fetch_user_by_id(user_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = auth.get_password_hash(update_data.pop("password"))

    response = supabase.patch(
        "users",
        params={"id": f"eq.{user_id}"},
        json=update_data,
        headers={"Prefer": "return=representation"}
    )
    if response.status_code not in (200, 204):
        raise HTTPException(status_code=500, detail="Unable to update user")
    updated = response.json()
    return updated[0] if isinstance(updated, list) and updated else updated


@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, current_user: dict = Depends(auth.get_current_user)):
    existing = fetch_user_by_id(user_id)
    if existing is None:
        raise HTTPException(status_code=404, detail="User not found")
    response = supabase.delete("users", params={"id": f"eq.{user_id}"})
    if response.status_code not in (200, 204):
        raise HTTPException(status_code=500, detail="Unable to delete user")
    return


# --- Services Endpoints ---


def fetch_user_by_email(email: str) -> Optional[dict]:
    response = supabase.get(
        "users",
        params={"select": "*", "email": f"eq.{email}", "limit": "1"},
    )
    if response.status_code != 200:
        return None
    data = response.json()
    return data[0] if data else None


def fetch_user_by_id(user_id: int) -> Optional[dict]:
    response = supabase.get(
        "users",
        params={"select": "*", "id": f"eq.{user_id}", "limit": "1"},
    )
    if response.status_code != 200:
        return None
    data = response.json()
    return data[0] if data else None


def fetch_service_by_id(service_id: int) -> Optional[dict]:
    response = supabase.get(
        "services",
        params={"select": "*", "id": f"eq.{service_id}", "limit": "1"},
    )
    if response.status_code != 200:
        return None
    data = response.json()
    return data[0] if data else None


def fetch_request_by_id(request_id: int) -> Optional[dict]:
    response = supabase.get(
        "service_requests",
        params={"select": "*", "id": f"eq.{request_id}", "limit": "1"},
    )
    if response.status_code != 200:
        return None
    data = response.json()
    return data[0] if data else None


def attach_provider_name(service: dict) -> dict:
    provider_id = service.get("provider_id")
    if provider_id is None:
        service["provider_name"] = "Desconocido"
        return service

    provider = fetch_user_by_id(provider_id)
    service["provider_name"] = provider["full_name"] if provider else "Desconocido"
    return service


def count_requests_for_service(service_id: int) -> int:
    response = supabase.get(
        "service_requests",
        params={"select": "id", "service_id": f"eq.{service_id}"},
    )
    if response.status_code != 200:
        return 0
    return len(response.json() or [])


def attach_service_stats(service: dict) -> dict:
    service = attach_provider_name(service)
    service["rating"] = float(service.get("rating") or 0)
    service["request_count"] = count_requests_for_service(service["id"])
    return service


def attach_request_context(request_data: dict) -> dict:
    service = fetch_service_by_id(request_data["service_id"])
    requester = fetch_user_by_id(request_data["requester_id"])
    provider = fetch_user_by_id(request_data["provider_id"])

    request_data["service_title"] = service["title"] if service else "Servicio no disponible"
    request_data["requester_name"] = requester["full_name"] if requester else "Demandante no disponible"
    request_data["provider_name"] = provider["full_name"] if provider else "Ofertante no disponible"
    return request_data


@app.post("/services/", response_model=schemas.ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(service: schemas.ServiceCreate, current_user: dict = Depends(auth.get_current_user)):
    service_data = service.model_dump()
    service_data["provider_id"] = current_user["id"]
    service_data["status"] = "Pendiente"

    response = supabase.post(
        "services",
        json=service_data,
        headers={"Prefer": "return=representation"}
    )
    if response.status_code not in (201, 200):
        raise HTTPException(status_code=500, detail="Unable to create service")
    created = response.json()
    return attach_provider_name(created[0] if isinstance(created, list) and created else created)


@app.get("/services/", response_model=List[schemas.ServiceResponse])
def read_services(skip: int = 0, limit: int = 100, current_user: dict = Depends(auth.get_current_user)):
    params = {"select": "*", "offset": str(skip), "limit": str(limit)}
    if current_user["role"] != "admin":
        params["provider_id"] = f"eq.{current_user['id']}"

    response = supabase.get(
        "services",
        params=params,
    )
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Unable to load services")
    services = response.json() or []
    return [attach_provider_name(service) for service in services]


@app.get("/services/{service_id}", response_model=schemas.ServiceResponse)
def read_service(service_id: int, current_user: dict = Depends(auth.get_current_user)):
    service = fetch_service_by_id(service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")
    if service["provider_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this service")
    return attach_provider_name(service)


@app.put("/services/{service_id}", response_model=schemas.ServiceResponse)
def update_service(service_id: int, service: schemas.ServiceUpdate, current_user: dict = Depends(auth.get_current_user)):
    db_service = fetch_service_by_id(service_id)
    if db_service is None:
        raise HTTPException(status_code=404, detail="Service not found")

    if db_service["provider_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this service")

    update_data = service.model_dump(exclude_unset=True)
    if any(k in update_data for k in ["title", "description", "price"]):
        update_data["status"] = "Pendiente"

    response = supabase.patch(
        "services",
        params={"id": f"eq.{service_id}"},
        json=update_data,
        headers={"Prefer": "return=representation"}
    )
    if response.status_code not in (200, 204):
        raise HTTPException(status_code=500, detail="Unable to update service")
    updated = response.json()
    return attach_provider_name(updated[0] if isinstance(updated, list) and updated else updated)


@app.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int, current_user: dict = Depends(auth.get_current_user)):
    db_service = fetch_service_by_id(service_id)
    if db_service is None:
        raise HTTPException(status_code=404, detail="Service not found")

    if db_service["provider_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this service")

    response = supabase.delete("services", params={"id": f"eq.{service_id}"})
    if response.status_code not in (200, 204):
        raise HTTPException(status_code=500, detail="Unable to delete service")
    return


@app.patch("/services/{service_id}/status", response_model=schemas.ServiceResponse)
def update_service_status(service_id: int, status_update: schemas.ServiceStatusUpdate, current_user: dict = Depends(auth.get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update status")

    response = supabase.patch(
        "services",
        params={"id": f"eq.{service_id}"},
        json={"status": status_update.status},
        headers={"Prefer": "return=representation"}
    )
    if response.status_code not in (200, 204):
        raise HTTPException(status_code=404, detail="Service not found")
    updated = response.json()
    return attach_provider_name(updated[0] if isinstance(updated, list) and updated else updated)


# --- Sprint 3: Search and Requests Endpoints ---


@app.get("/public/services/", response_model=List[schemas.MarketplaceServiceResponse])
def read_public_services(limit: int = 6):
    response = supabase.get(
        "services",
        params={"select": "*", "status": "eq.Aprobado", "limit": str(limit), "order": "created_at.desc"},
    )
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Unable to load public services")
    return [attach_service_stats(service) for service in (response.json() or [])]


@app.get("/marketplace/services/", response_model=List[schemas.MarketplaceServiceResponse])
def search_marketplace_services(
    q: str = "",
    category: str = "all",
    sort: str = "recent",
    current_user: dict = Depends(auth.get_current_user),
):
    response = supabase.get(
        "services",
        params={"select": "*", "status": "eq.Aprobado", "limit": "200"},
    )
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Unable to search services")

    services = [attach_service_stats(service) for service in (response.json() or [])]

    if current_user["role"] != "admin":
        services = [service for service in services if service["provider_id"] != current_user["id"]]

    if category != "all":
        services = [service for service in services if service["category"] == category]

    query = q.strip().lower()
    if query:
        services = [
            service for service in services
            if query in " ".join([
                service.get("title", ""),
                service.get("description", ""),
                service.get("category", ""),
                service.get("provider_name", ""),
            ]).lower()
        ]

    if sort == "most_requested":
        services.sort(key=lambda service: service.get("request_count", 0), reverse=True)
    elif sort == "best_rated":
        services.sort(key=lambda service: (service.get("rating", 0), service.get("request_count", 0)), reverse=True)
    else:
        services.sort(key=lambda service: service.get("created_at") or "", reverse=True)

    return services


@app.post("/service-requests/", response_model=schemas.ServiceRequestResponse, status_code=status.HTTP_201_CREATED)
def create_service_request(request_data: schemas.ServiceRequestCreate, current_user: dict = Depends(auth.get_current_user)):
    service = fetch_service_by_id(request_data.service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Service not found")
    if service["status"] != "Aprobado":
        raise HTTPException(status_code=400, detail="Only approved services can be requested")
    if service["provider_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot request your own service")

    payload = request_data.model_dump()
    payload["requester_id"] = current_user["id"]
    payload["provider_id"] = service["provider_id"]
    payload["status"] = "Pendiente"

    response = supabase.post(
        "service_requests",
        json=payload,
        headers={"Prefer": "return=representation"}
    )
    if response.status_code not in (201, 200):
        raise HTTPException(status_code=500, detail="Unable to create request")
    created = response.json()
    return attach_request_context(created[0] if isinstance(created, list) and created else created)


@app.get("/service-requests/mine/", response_model=List[schemas.ServiceRequestResponse])
def read_my_service_requests(current_user: dict = Depends(auth.get_current_user)):
    response = supabase.get(
        "service_requests",
        params={"select": "*", "requester_id": f"eq.{current_user['id']}", "order": "created_at.desc"},
    )
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Unable to load requests")
    return [attach_request_context(request_data) for request_data in (response.json() or [])]


@app.get("/service-requests/incoming/", response_model=List[schemas.ServiceRequestResponse])
def read_incoming_service_requests(current_user: dict = Depends(auth.get_current_user)):
    params = {"select": "*", "order": "created_at.desc"}
    if current_user["role"] != "admin":
        params["provider_id"] = f"eq.{current_user['id']}"

    response = supabase.get("service_requests", params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Unable to load incoming requests")
    return [attach_request_context(request_data) for request_data in (response.json() or [])]


@app.patch("/service-requests/{request_id}/status", response_model=schemas.ServiceRequestResponse)
def update_service_request_status(
    request_id: int,
    status_update: schemas.ServiceRequestStatusUpdate,
    current_user: dict = Depends(auth.get_current_user),
):
    if status_update.status not in ("Aceptada", "Rechazada"):
        raise HTTPException(status_code=400, detail="Invalid request status")

    request_data = fetch_request_by_id(request_id)
    if request_data is None:
        raise HTTPException(status_code=404, detail="Request not found")
    if request_data["provider_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this request")

    response = supabase.patch(
        "service_requests",
        params={"id": f"eq.{request_id}"},
        json={"status": status_update.status},
        headers={"Prefer": "return=representation"}
    )
    if response.status_code not in (200, 204):
        raise HTTPException(status_code=500, detail="Unable to update request")
    updated = response.json()
    return attach_request_context(updated[0] if isinstance(updated, list) and updated else updated)


if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    def serve_frontend():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend_routes(full_path: str):
        requested_path = FRONTEND_DIST / full_path
        if requested_path.is_file():
            return FileResponse(requested_path)
        return FileResponse(FRONTEND_DIST / "index.html")


from fastapi import Header, HTTPException, Depends
from firebase_admin import auth as fb_auth
from sqlalchemy.orm import Session
from db.database import get_db
import crud

def extract_token(authorization: str) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=400, detail="Invalid Authorization header format")
    return authorization.split(" ", 1)[1]

def verify_token_and_get_payload(id_token: str):
    try:
        decoded = fb_auth.verify_id_token(id_token)
        return decoded
    except fb_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired")
    except fb_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

def get_current_user_db(authorization: str = Header(...), db: Session = Depends(get_db)):
    id_token = extract_token(authorization)
    payload = verify_token_and_get_payload(id_token)
    uid = payload.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token payload: uid missing")

    user = crud.get_user_by_firebase_uid(db, uid)
    if not user:
        email = payload.get("email") or f"user_{uid}@noemail.local"
        name = payload.get("name") or payload.get("displayName") or "Unnamed User"
        picture = payload.get("picture")
        user = crud.create_user(db, firebase_uid=uid, email=email, name=name, profile_image=picture)
    return user

# firebase_admin_init.py
import firebase_admin
from firebase_admin import credentials
import os

# Tên file key bạn đã tải về (để cùng thư mục với main.py)
SERVICE_ACCOUNT_PATH = "serviceAccountKey.json"  # Local file path.

if not firebase_admin._apps:  # Singleton check tốt.
    try:
        if os.path.exists(SERVICE_ACCOUNT_PATH):  # Local file priority.
            # ✅ Ưu tiên 1: Đọc từ file JSON (Chạy Local)
            cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
            print(f"✅ [FIREBASE] Initialized using file: {SERVICE_ACCOUNT_PATH}")
        else:
            # ⚠️ Ưu tiên 2: Đọc từ biến môi trường (Khi Deploy)
            print(f"⚠️ [FIREBASE] File '{SERVICE_ACCOUNT_PATH}' not found. Checking ENV...")
            service_account_info = os.getenv("FIREBASE_SERVICE_ACCOUNT")  # ENV string.
            if service_account_info:
                import json
                cred_dict = json.loads(service_account_info)  # Parse JSON.
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("✅ [FIREBASE] Initialized using ENV variable.")
            else:
                print("❌ [FIREBASE] No credentials found! Admin features will fail.")  # Warning tốt.
    except Exception as e:
        print(f"❌ [FIREBASE] Initialization Error: {e}")  # Error handling.
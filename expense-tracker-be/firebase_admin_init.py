import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv

load_dotenv()

# Lấy chuỗi JSON từ biến môi trường
service_account_info = os.getenv("FIREBASE_SERVICE_ACCOUNT")

if not service_account_info:
    raise ValueError("⚠️ Missing FIREBASE_SERVICE_ACCOUNT in .env")

# Chuyển từ chuỗi sang dict
service_account_dict = json.loads(service_account_info)

# Tạo credentials trực tiếp từ dict (không cần file .json)
cred = credentials.Certificate(service_account_dict)

# Khởi tạo Firebase nếu chưa khởi tạo
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

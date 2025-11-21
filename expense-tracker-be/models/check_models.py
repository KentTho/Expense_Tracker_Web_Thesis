# check_models.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load API Key từ file .env
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Lỗi: Không tìm thấy GOOGLE_API_KEY trong file .env")
else:
    print(f"✅ Đang kiểm tra với Key: {api_key[:10]}...")
    try:
        genai.configure(api_key=api_key)

        print("\n📋 DANH SÁCH MODEL KHẢ DỤNG CHO BẠN:")
        print("-" * 40)

        valid_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                # In ra tên model
                print(f"👉 {m.name}")
                valid_models.append(m.name)

        print("-" * 40)

        if valid_models:
            # Lấy tên model bỏ chữ 'models/' đi để dùng trong code
            suggestion = valid_models[0].replace("models/", "")
            print(f"\n💡 GỢI Ý: Hãy sửa file services/chat_service.py thành:")
            print(f'    model="{suggestion}"')
        else:
            print("⚠️ Không tìm thấy model nào! Hãy kiểm tra lại API Key của bạn.")

    except Exception as e:
        print(f"\n❌ Lỗi kết nối: {e}")
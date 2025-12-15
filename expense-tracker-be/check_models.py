import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load API Key từ file .env
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ LỖI: Không tìm thấy GOOGLE_API_KEY trong file .env")
else:
    print(f"✅ Đã tìm thấy Key: {api_key[:5]}...{api_key[-3:]}")

    # Cấu hình
    genai.configure(api_key=api_key)

    print("\n🔍 ĐANG TRA CỨU DANH SÁCH MODEL KHẢ DỤNG CHO KEY NÀY...")
    try:
        count = 0
        for m in genai.list_models():
            # Chỉ lấy các model hỗ trợ chat/tạo nội dung
            if 'generateContent' in m.supported_generation_methods:
                print(f"   👉 {m.name}")
                count += 1

        if count == 0:
            print("⚠️ Key này hợp lệ nhưng KHÔNG CÓ QUYỀN truy cập model nào cả.")
            print("👉 Hãy vào aistudio.google.com tạo Project mới!")
        else:
            print(f"\n✅ Tìm thấy {count} model có thể dùng được.")

    except Exception as e:
        print(f"\n❌ LỖI KẾT NỐI: {e}")
        print("👉 Có thể do mạng, hoặc Key này là Key của Vertex AI (Cloud) chứ không phải AI Studio.")
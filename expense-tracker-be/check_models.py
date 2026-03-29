import os
from dotenv import load_dotenv
import google.generativeai as genai  # Từ reqs – tốt.

# Load API Key từ file .env
load_dotenv()  # Load ENV.
api_key = os.getenv("GOOGLE_API_KEY")  # Từ .env.

if not api_key:
    print("❌ LỖI: Không tìm thấy GOOGLE_API_KEY trong file .env")  # Error handling tốt.
else:
    print(f"✅ Đã tìm thấy Key: {api_key[:5]}...{api_key[-3:]}")  # Mask key tốt (security).

    # Cấu hình
    genai.configure(api_key=api_key)  # Config global.

    print("\n🔍 ĐANG TRA CỨU DANH SÁCH MODEL KHẢ DỤNG CHO KEY NÀY...")
    try:
        count = 0
        for m in genai.list_models():  # List models.
            # Chỉ lấy các model hỗ trợ chat/tạo nội dung
            if 'generateContent' in m.supported_generation_methods:  # Filter tốt.
                print(f"   👉 {m.name}")
                count += 1

        if count == 0:
            print("⚠️ Key này hợp lệ nhưng KHÔNG CÓ QUYỀN truy cập model nào cả.")
            print("👉 Hãy vào aistudio.google.com tạo Project mới!")
        else:
            print(f"\n✅ Tìm thấy {count} model có thể dùng được.")  # Summary tốt.

    except Exception as e:
        print(f"\n❌ LỖI KẾT NỐI: {e}")
        print("👉 Có thể do mạng, hoặc Key này là Key của Vertex AI (Cloud) chứ không phải AI Studio.")  # Debug hint tốt.
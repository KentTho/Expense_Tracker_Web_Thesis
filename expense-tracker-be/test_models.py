import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load API Key
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Lỗi: Không tìm thấy GOOGLE_API_KEY trong file .env")
    exit()

print(f"🔑 Đang kiểm tra Key: {api_key[:10]}...")
genai.configure(api_key=api_key)

print("\n📋 Danh sách Model khả dụng cho Key của bạn:")
print("-" * 40)

available_models = []
try:
    for m in genai.list_models():
        # Chỉ lấy các model hỗ trợ tạo nội dung (generateContent)
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ {m.name}")
            available_models.append(m.name)
except Exception as e:
    print(f"❌ Lỗi kết nối Google: {e}")
    exit()

print("-" * 40)

if not available_models:
    print(
        "⚠️ CẢNH BÁO: Không tìm thấy model nào! Vui lòng kiểm tra lại API Key hoặc tạo Key mới tại https://aistudio.google.com/")
    exit()

# Thử test model đầu tiên tìm thấy
test_model = available_models[0]
print(f"\n🧪 Đang test thử model: '{test_model}'...")

try:
    model = genai.GenerativeModel(test_model)
    response = model.generate_content("Chào bạn, bạn có khỏe không?")
    print(f"🎉 THÀNH CÔNG! Model '{test_model}' hoạt động tốt.")
    print(f"🤖 Phản hồi: {response.text}")

    # Quan trọng: In ra tên model cần dùng
    clean_name = test_model.replace("models/", "")
    print(f"\n👉 Hãy sửa file services/chat_service.py thành: model='{clean_name}'")

except Exception as e:
    print(f"❌ Test thất bại với model {test_model}: {e}")
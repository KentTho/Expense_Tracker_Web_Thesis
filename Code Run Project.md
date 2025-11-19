📝 Ghi chú dự án: Flutter + FastAPI + PostgreSQL





C:\\Program Files\\Java\\jdk-21



&nbsp;SHA1: 4D:BB:7F:73:CF:7A:D7:8C:1A:C3:B6:A4:51:A2:CF:D2:1B:70:DC:D3

SHA256: 4E:B6:57:F2:66:89:D5:66:91:C7:2B:79:C5:B7:36:CE:FF:F1:BD:EE:C2:EC:E4:85:15:DD:90:C8:13:28:E7:75





&nbsp;⚙️ Frontend (Flutter)

✅ Các lệnh cơ bản



&nbsp;Khởi chạy dự án:



&nbsp; bash

&nbsp; flutter run

&nbsp; 



&nbsp;Chạy trên thiết bị cụ thể (VD: Emulator):



&nbsp; bash

&nbsp; flutter run -d emulator-5554

&nbsp; 



&nbsp;Mở trình giả lập cụ thể (VD: Pixel 6 Pro):



&nbsp; bash

&nbsp; flutter emulators --launch Pixel\_6\_Pro

&nbsp; 



&nbsp;Chạy lại code sau khi cập nhật (trong terminal Flutter):



&nbsp;  Nhấn r: Hot reload (reset nhanh không mất trạng thái).

&nbsp;  Nhấn R: Hot restart (khởi động lại toàn bộ app).



---



&nbsp;🖥 Backend (FastAPI + Python)



&nbsp;✅ Thiết lập môi trường ảo Python



&nbsp;Kích hoạt môi trường ảo:



&nbsp; bash

&nbsp; .\\venv-ai\\Scripts\\activate

&nbsp; 



&nbsp;Thoát khỏi môi trường ảo:



&nbsp; bash

&nbsp; deactivate

&nbsp; 



✅ Chạy server FastAPI với Uvicorn



bash



uvicorn main:app --reload --port 8000



python -m uvicorn src.main:app --reload   => C:\\Users\\Tho\\.cache\\huggingface\\hub



Cập nhật vào requirements.txt để lưu lại



pip freeze > requirements.txt



Cài lại các thư viện cần thiết



pip install -r requirements.txt











> 🔗 Giao diện tài liệu API (Swagger UI):

> \[http://127.0.0.1:8000/docs/](http://127.0.0.1:8000/docs/)



---



&nbsp;🗃️ Database (PostgreSQL)



&nbsp;✅ Kết nối tới PostgreSQL bằng CMD



bash

psql -U admin -h localhost -d postgres





&nbsp;Chuyển sang database chính:



&nbsp; sql

&nbsp; \\c mental\_health\_app

&nbsp; 



&nbsp;Xem danh sách bảng:



&nbsp; sql

&nbsp; \\dt

&nbsp; 



&nbsp;Xem cấu trúc bảng cụ thể (VD: users):



&nbsp; sql

&nbsp; \\d users

&nbsp; 



---



&nbsp;✅ Truy vấn dữ liệu



&nbsp;Xác nhận dữ liệu trong bảng:



&nbsp; sql

&nbsp; SELECT COUNT() FROM user\_profiles;

&nbsp; 



&nbsp;Hiển thị thông tin ngắn gọn:



&nbsp; sql

&nbsp; SELECT id, full\_name, user\_id FROM user\_profiles;

&nbsp; 



---



&nbsp;🔐 Xử lý lỗi mã hóa ký tự (Unicode/UTF8)



&nbsp;✳️ Cách 1: Cấu hình sau khi đăng nhập vào psql



sql

SET client\_encoding = 'UTF8';





Rồi chạy lại câu lệnh:



sql

SELECT  FROM users WHERE firebase\_uid = 'Ct9lxHivV9eOTwyza6ZrkReNH7v2';





---



&nbsp;✳️ Cách 2: Thiết lập biến môi trường trước khi vào psql



bash

set PGCLIENTENCODING=utf8

psql -U admin -d mental\_health\_app



**CHATBOT - WEB EXPENSE - TRACKER - APP**

. 







https://www.tiktok.com/@dunglailaptrinh/video/7541776567509257492?\_t=ZS-90oOhKsl7Ny\&\_r=1






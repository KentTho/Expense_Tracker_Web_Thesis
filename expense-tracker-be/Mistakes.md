





Lỗi bảo mật (Security Risk): Nếu file_url là một đường dẫn công khai (Public URL), bất kỳ ai có link đều tải được bảng chi tiêu của người dùng.

Ghi chú: "Cần đảm bảo file_url trả về phải là Signed URL (Link có chữ ký bảo mật, chỉ tồn tại trong thời gian ngắn) hoặc API tải file phải yêu cầu Token."

Lỗi bảo mật (Access Control): Schema này chứa thông tin nhạy cảm (Email admin, IP, Action nội bộ).

Ghi chú: "Tuyệt đối không dùng Schema này cho bất kỳ Route nào của User thường. Chỉ dùng trong các Router được bảo vệ bởi Depends(get_current_active_admin)."
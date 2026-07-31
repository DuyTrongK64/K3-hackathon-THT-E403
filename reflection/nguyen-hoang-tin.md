# Reflection - Nguyễn Hoàng Tín (2A202601603)

## Phần tôi chịu trách nhiệm

React UI/UX; luồng Company/CV/Top phù hợp/Chat; demo script và slide.

## Tôi đã trực tiếp làm gì?

Xây dựng giao diện React cho luồng Company, tải CV, Top công ty phù hợp và AI Chat;
kết nối frontend với Backend API qua `src/services/apiClient.js`.

## Quyết định khó nhất và trade-off

Tôi chọn bỏ phần trăm và thứ hạng matching để tránh tạo cảm giác chính xác giả.
Trade-off là kết quả khó so sánh nhanh hơn, nhưng người dùng thấy được lý do phù
hợp và tự đưa ra quyết định.

## Một lỗi hoặc giả định sai tôi đã phát hiện

Tôi nhận ra việc gọi kết quả là “bảng xếp hạng” có thể khiến người dùng hiểu sai
rằng hệ thống dự đoán khả năng trúng tuyển. UI đã được đổi sang hiển thị các công
ty phù hợp, không dùng lương, slot hoặc mức cạnh tranh.

## Nếu có thêm một tuần

Tôi sẽ kiểm thử giao diện với người dùng thật, bổ sung test cho các trạng thái
loading/error và hoàn thiện trải nghiệm trên thiết bị di động.

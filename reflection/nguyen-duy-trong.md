# Reflection - Nguyễn Duy Trọng (2A202601333)

## Phần tôi chịu trách nhiệm

FastAPI/PostgreSQL; Agent và Tools; guardrail; golden set và eval runner.

## Tôi đã trực tiếp làm gì?

- Xây dựng Backend FastAPI và PostgreSQL cho các model `Users`, `Companies`,
  `EvaluationCriteria`, `Portfolios` và `CompanyInterest`; triển khai JWT/RBAC
  để tách quyền User/Admin.
- Di chuyển Agent và ba Tool xuống Backend:
  - Tool 1 đọc dữ liệu công ty/JD từ PostgreSQL và chỉ tổng hợp thông tin có
    nguồn cho popup công ty.
  - Tool 2 đọc CV PDF/DOCX hoặc text, chuẩn hóa kỹ năng, kinh nghiệm và mong
    muốn rồi lưu Portfolio theo tài khoản.
  - Tool 3 đối chiếu mong muốn + kỹ năng ứng viên với yêu cầu JD; không dùng
    lương, slot hoặc tỷ lệ offer.
- Cài đặt Agent Router cho các luồng tra cứu công ty, cập nhật dữ liệu, câu hỏi
  theo CV và Top N Matching; thêm guardrail câu hỏi ngôi thứ nhất khi chưa có CV:
  `Không biết bạn là ai, hãy thêm CV`.
- Nâng cấp Matching từ exact keyword sang Hybrid Semantic Matching: tạo vector
  cho CV/JD, tính cosine similarity và dùng semantic score quyết định thứ tự;
  keyword chỉ dùng để kiểm tra độ phủ.
- Viết và chạy eval runner trên 30 case trong `eval/`, gồm grounding, input mơ
  hồ, CV lỗi, prompt injection và câu hỏi ngoài phạm vi. Lượt chạy hiện tại đạt
  30/30, 0 hallucination và 4/4 security case.
- Viết test cho security, giới hạn tối đa ba công ty quan tâm, Matching Engine,
  quy tắc Agent và semantic equivalence như `ReactJS` ↔
  `front-end framework`, `Leadership` ↔ `Quản lý nhóm`.

## Quyết định khó nhất và trade-off

Tôi chọn mức tự động hóa **Conditional** thay vì để Agent luôn tạo câu trả lời.
Khi có CV và JD đủ căn cứ, hệ thống tự phân tích và xếp hạng; khi thiếu CV,
thiếu nguồn hoặc semantic score quá thấp, hệ thống dừng hoặc trả empty state.
Trade-off là flow có thể yêu cầu người dùng bổ sung dữ liệu và không phải lúc
nào cũng trả đủ gợi ý, nhưng giảm nguy cơ gợi ý sai công ty hoặc bịa dữ liệu cá
nhân.

Với Semantic Matching, tôi giữ trọng số cao cho kỹ năng bắt buộc và mong muốn
ứng viên, đồng thời dành một phần nhỏ cho ngữ cảnh toàn hồ sơ. Exact keyword
được giữ trong log để debug nhưng không được thay đổi ranking, tránh trường hợp
“chữ giống chữ” thắng một JD tương đồng về nghĩa.

## Một lỗi hoặc giả định sai tôi đã phát hiện

Trong lượt eval đầu sau khi thêm vector matching, CV kế toán vẫn nhận Top 3 công
ty công nghệ vì nhiễu cosine 1-2%. Việc chỉ kiểm tra `score > 0` là giả định
sai: vector của hai nội dung không liên quan vẫn có thể có độ tương đồng dương.
Tôi bổ sung ngưỡng semantic tối thiểu cho kết quả tốt nhất; nếu không công ty
nào vượt ngưỡng, Matching trả empty state. Sau sửa, bộ eval trở lại 30/30 và
không phát sinh hallucination.

## Nếu có thêm một tuần

1. Chạy validation với tối thiểu năm học viên thật, lưu quan sát và quote nguyên
   văn để kiểm chứng pain point và mức tin tưởng vào lý do matching.
2. Hiệu chỉnh ngưỡng semantic bằng dữ liệu CV/JD đã được phép sử dụng, thay vì
   chỉ dựa trên golden set giả lập; theo dõi precision/recall riêng cho từng
   nhóm kỹ năng.
3. Thay CSV seed bằng pipeline JD được phê duyệt, có thời điểm cập nhật và cơ
   chế truy vết nguồn; triển khai backend công khai để kiểm thử end-to-end trên
   môi trường production.

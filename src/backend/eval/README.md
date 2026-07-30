# VinCareer Agent Evaluation

Thư mục `eval/` ở root repo là nơi duy nhất lưu golden set, runner và kết quả
kiểm thử Agent. Không dùng dữ liệu VLearn/Discord, nhân sự hoặc chấm công.

## Phạm vi

- `quest.csv`: 20 case chức năng, grounding, file CV và security.
- `life_quest.csv`: 10 case ngôn ngữ đời thường, input mơ hồ và case hiếm.
- `run_eval.py`: gọi trực tiếp Agent Router và Matching production.
- Groq transport được mock có kiểm soát để chạy local không tốn API; dữ liệu trả
  lời mock chỉ lấy từ `app/data/companies.csv` và `careerPages.csv`.
- Không tuyên bố các case giả lập là chatlog người dùng thật.

## Quality bar đã chốt

Đạt khi đồng thời:

1. Pass rate toàn bộ golden set **≥80%**.
2. **0 hallucination** về công ty, JD, lương, slot/applicant hoặc nhân sự.
3. **100% security/scope cases** đạt.

Expected cũ mâu thuẫn yêu cầu VinCareer hiện tại không bị sửa âm thầm. Runner
giữ nguyên CSV nguồn, khai báo override trong `EFFECTIVE_EXPECTED` và ghi lại
toàn bộ ở `report.json`.

## Chạy

Từ thư mục root repo:

```bash
codebase/backend/.venv/bin/python eval/run_eval.py
```

Runner luôn chạy đủ 30 case và sinh:

- `result.csv`: từng input, expected hiệu lực, actual, tools, PASS/FAIL, lý do,
  hallucination và gợi ý sửa.
- `report.json`: tổng pass rate, quality bar, risk coverage và scope notes.
- `run.log`: console report gọn theo định dạng file/case/PASS-FAIL.
- `groq_smoke.json`: bằng chứng healthcheck Structured Output bằng một lời gọi
  Groq thật; không lưu API key hoặc nội dung nhạy cảm.

Nếu không đạt bar, process trả exit code `1`; không được chỉnh tay PASS hoặc xóa
case fail khỏi kết quả.

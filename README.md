# VinCareer Insight AI

VinCareer Insight AI hỗ trợ học viên sau khóa học tra cứu công ty/nhóm dự án,
số hóa CV và đối chiếu **mong muốn + kỹ năng ứng viên** với **yêu cầu tuyển
dụng**. Hệ thống không dùng lương, số slot, tỷ lệ cạnh tranh hoặc tỷ lệ offer
để xếp hạng.

## Thành viên và phân công

| Mã học viên | Thành viên | Phần phụ trách có tên |
|---|---|---|
| 2A202601881 | Bùi Thế Huy | Product discovery; evidence/mining; AI Spec §1-§4; điều phối validation |
| 2A202601333 | Nguyễn Duy Trọng | FastAPI/PostgreSQL; Agent và 3 Tools; prompt/guardrail; golden set và eval runner |
| 2A202601603 | Nguyễn Hoàng Tín | React UI/UX; luồng Company/CV/Top phù hợp/Chat; demo script và slide |

Mỗi thành viên vẫn phải hiểu và giải thích được flow end-to-end khi demo.

## Cấu trúc nộp bài

```text
.
├── README.md
├── spec.md
├── demo-slides.pdf
├── codebase/
│   ├── frontend/
│   ├── backend/
│   └── docker-compose.yml
├── eval/
├── validation/
└── reflection/
```

Tài liệu đề bài, guide, template và rubric gốc được bảo toàn trong
`hackathon-kit/` để truy vết yêu cầu.

## Trạng thái bằng chứng

- Prototype có **6 công ty**, **8 JD/nhóm dự án** và luồng chính chạy
  end-to-end.
- Golden set có **30 case**; lượt chạy hiện tại đạt **30/30**, không phát hiện
  hallucination và vượt quality bar đã chốt là **≥80%**.
- Validation với người dùng thật chưa hoàn tất. `validation/feedback-log.md`
  chỉ là biểu mẫu, không chứa quote hoặc kết quả giả.
- Số học viên tham gia thực tập và tỷ lệ tiếp tục được offer là dữ liệu private,
  nên repo không công bố hoặc suy đoán.

## Phần thật và phần mock

**Chạy thật:** React UI, FastAPI, PostgreSQL, JWT/RBAC, upload/parse PDF-DOCX,
Portfolio, hybrid Semantic Matching bằng vector/cosine, Agent qua Groq, CRUD
Admin và chức năng Quan tâm.

**Mock/seed:** danh sách công ty và JD được seed từ CSV mẫu; Crawler chưa truy
cập website tuyển dụng thật; eval mock transport Groq để chạy lặp lại mà không
tốn API. `eval/groq_smoke.json` chỉ xác nhận một healthcheck Structured Output
thật và không lưu API key.

## Chạy local

Yêu cầu Docker, Python 3.11+ và Node.js 20+.

```bash
cd codebase
docker compose up -d

cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Mở terminal khác:

```bash
cd codebase/frontend
cp .env.example .env.local
npm install
npm run dev
```

Truy cập `http://localhost:3000`. Groq API key chỉ đặt trong
`codebase/backend/.env`:

```dotenv
GROQ_API_KEY=gsk_your_key
JWT_SECRET_KEY=replace-with-at-least-32-random-characters
```

Không commit `.env`, `.env.local` hoặc API key.

## Kiểm thử

```bash
cd codebase/backend
.venv/bin/pytest

cd ../frontend
npm test
npm run lint
npm run build

cd ../..
codebase/backend/.venv/bin/python eval/run_eval.py
```

Runner luôn ghi đầy đủ từng case vào `eval/result.csv`, báo cáo tổng hợp vào
`eval/report.json` và console log vào `eval/run.log`.

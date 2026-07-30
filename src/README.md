# VinCareer Insight AI — Full-stack

VinCareer đã được tách thành React Frontend, FastAPI Backend và PostgreSQL.
UI cũ được giữ lại qua cùng design tokens, CSS classes, responsive layout và Motion.

## Cấu trúc

```text
.
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── api/routes/       # Companies, Criteria, Portfolio, Agent, Users
│   │   ├── core/             # Settings, database, admin security
│   │   ├── data/             # CSV seed cho 6 công ty và JD
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic request/response
│   │   ├── services/         # Agent + Crawler + Scanner + Matching
│   │   └── main.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── app/
    ├── src/
    │   ├── components/FloatingAIChat.jsx
    │   ├── layouts/GlobalLayout.jsx
    │   ├── views/            # Home, Comparison, Portfolio SPA views
    │   └── services/apiClient.js
    └── package.json
```

## 1. Khởi động PostgreSQL

```bash
docker compose up -d
docker compose ps
```

Database local dùng `vincareer/vincareer`, database name `vincareer`, cổng `5432`.
Volume Docker giữ dữ liệu qua các lần restart.

## 2. Cấu hình và chạy Backend

```bash
cd backend
cp .env.example .env
```

Sửa `backend/.env`, đặc biệt:

```dotenv
GROQ_API_KEY=gsk_your_real_key
ADMIN_API_KEY=your_long_random_admin_key
```

Sau đó:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend tự tạo bảng và seed 6 công ty cùng tiêu chí mặc định khi database trống.
Swagger UI: `http://localhost:8000/docs`.

## 3. Cấu hình và chạy Frontend

Mở terminal khác:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Mở `http://localhost:3000`. Frontend chỉ chứa
`NEXT_PUBLIC_API_BASE_URL`; không đưa Groq key vào Frontend.

## API cốt lõi

- `GET /api/v1/companies`
- `POST/PATCH/DELETE /api/v1/companies` — cần header `X-Admin-Key`
- `GET /api/v1/criteria`
- `POST/PATCH/DELETE /api/v1/criteria` — cần header `X-Admin-Key`
- `POST /api/v1/portfolios/scan` — multipart PDF/DOCX
- `POST /api/v1/portfolios/scan-text`
- `GET /api/v1/portfolios/{id}`
- `POST /api/v1/agent/chat`

Ví dụ cập nhật trọng số:

```bash
curl -X PATCH http://localhost:8000/api/v1/criteria/CRITERION_UUID \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your_long_random_admin_key" \
  -d '{"weight": 0.55}'
```

Matching chỉ dùng mong muốn, kỹ năng ứng viên và yêu cầu nhà tuyển dụng; không
dùng lương. Nếu Admin thêm một criterion key mới chưa được Matching hỗ trợ, hệ
thống chấm phần đó bằng 0 thay vì phát sinh lỗi hoặc suy đoán dữ liệu.

## Kiểm thử

```bash
cd backend && .venv/bin/pytest
cd ../frontend && npm test && npm run lint && npm run build
```

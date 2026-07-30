# VinCareer Insight AI — Full-stack

VinCareer đã được tách thành React Frontend, FastAPI Backend và PostgreSQL.
UI cũ được giữ lại qua cùng design tokens, CSS classes, responsive layout và Motion.

## Cấu trúc

```text
.
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── api/routes/       # Auth, Companies, Criteria, Portfolio, Match, Agent
│   │   ├── core/             # Settings, database, JWT & RBAC
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
    │   ├── components/       # FloatingAIChat, CompanyDetail, TopMatches
    │   ├── layouts/GlobalLayout.jsx
    │   ├── views/            # Login, Home, Companies, Comparison, Portfolio, Admin
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
JWT_SECRET_KEY=replace-with-at-least-32-random-characters
SEED_ADMIN_EMAIL=admin@vincareer.vn
SEED_ADMIN_PASSWORD=ChangeThisBeforeFirstStart123!
```

Sau đó:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend tự tạo bảng, seed 6 công ty, JD, tiêu chí mặc định và tài khoản Admin
khi database trống. Hãy đổi thông tin Admin trước lần chạy đầu tiên; thay
`SEED_ADMIN_PASSWORD` rồi restart Backend cũng sẽ xoay mật khẩu của tài khoản
Admin seed.
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

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/companies`
- `GET /api/v1/companies/{id}` — chi tiết JD, team và phỏng vấn
- `POST/PATCH/DELETE /api/v1/companies` — JWT role `admin`
- `GET /api/v1/criteria`
- `POST/PATCH/DELETE /api/v1/criteria` — JWT role `admin`
- `POST /api/v1/portfolios/scan` — multipart PDF/DOCX
- `POST /api/v1/portfolios/scan-text`
- `GET /api/v1/portfolios/me/latest`
- `GET /api/v1/matches/top3/{portfolio_id}`
- `POST /api/v1/agent/chat`

Trừ đăng ký/đăng nhập/health, các API nghiệp vụ cần:

```bash
Authorization: Bearer YOUR_JWT
```

Matching chỉ dùng mong muốn, kỹ năng ứng viên và yêu cầu nhà tuyển dụng; không
dùng lương. Nếu Admin thêm một criterion key mới chưa được Matching hỗ trợ, hệ
thống chấm phần đó bằng 0 thay vì phát sinh lỗi hoặc suy đoán dữ liệu.

## Phân quyền

- `user`: xem/tìm công ty, Company Detail, so sánh, tải CV, Portfolio, Top 3
  Matching và Floating AI Chat.
- `admin`: có toàn bộ quyền User và trang Quản trị để CRUD Companies và
  EvaluationCriteria.

Portfolio luôn được gắn với `user_id` lấy từ JWT; Frontend không được tự truyền
ID người dùng để đọc hoặc ghi hồ sơ của tài khoản khác.

## Kiểm thử

```bash
cd backend && .venv/bin/pytest
cd ../frontend && npm test && npm run lint && npm run build
```

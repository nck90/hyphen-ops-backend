# Hyphen Ops Backend

NestJS + Prisma(SQLite) 백엔드 레포입니다.

## 실행

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

- API: `http://localhost:8787`
- Health: `GET /health`

## 환경 변수

- `PORT` (기본 8787)
- `CORS_ORIGIN` (쉼표로 다중 지정 가능)
- `DATABASE_URL` (Prisma)
  - SQLite 로컬 개발 권장값: `file:../prisma/dev.db`

## 배포

```bash
npm run build
npm run start
```

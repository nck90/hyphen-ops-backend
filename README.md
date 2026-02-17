# Hyphen Ops Backend

NestJS + Prisma(PostgreSQL) 백엔드 레포입니다.

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
  - 예시: `postgresql://postgres:postgres@localhost:5432/hyphen_ops?schema=public`

## 배포

```bash
npm run build
npm run start
```

PostgreSQL에 스키마 반영:

```bash
npm run prisma:migrate
```

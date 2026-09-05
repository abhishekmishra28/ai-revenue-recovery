# Deployment Guide

> This document covers everything needed to deploy RevivePay AI to production using **Neon DB** (managed serverless Postgres) as the database and **Docker** for containerization.

---

## Prerequisites

| Tool        | Version   | Purpose                          |
|-------------|-----------|----------------------------------|
| Docker      | `>= 24`   | Build and run containers         |
| Docker Compose | `>= 2.20` | Orchestrate multi-container setup |
| Neon Account | Free tier | Managed serverless PostgreSQL    |
| Gemini API Key | —       | AI strategy generation           |

---

## Step 1: Set Up Neon DB

1. Go to **[console.neon.tech](https://console.neon.tech)** and create a free account.
2. Create a new **Project** (e.g., `revenue-recovery-prod`).
3. Create a **Database** named `revenue_recovery`.
4. Copy the **Connection String** from the dashboard. It looks like:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/revenue_recovery?sslmode=require
   ```
5. **Important**: Neon requires `?sslmode=require` at the end of the connection string.

---

## Step 2: Configure Environment Variables

Create a `.env` file in the **project root** (same directory as `docker-compose.yml`):

```bash
# ── Database (Neon DB) ─────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/revenue_recovery?sslmode=require

# ── AI ─────────────────────────────────────────────────────────────────────
GEMINI_API_KEY=AIza...your_key_here

# ── Client ─────────────────────────────────────────────────────────────────
# Set this to where users will access the API (e.g., public domain or IP)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> **Security**: Never commit `.env` to Git. It is listed in `.gitignore`.

---

## Step 3: Run Database Migrations

Before starting the containers, apply Prisma migrations to your Neon database. Run this **once** from your local machine (with the `.env` file configured):

```bash
cd server
npx prisma migrate deploy
```

This applies all pending SQL migrations from `server/prisma/migrations/` to the Neon database.

To also seed demo data (merchants, customers, transactions):

```bash
cd server
npx tsx prisma/seed.ts
```

> **Note**: The seed script creates deterministic UUIDs so it is idempotent — safe to run multiple times.

---

## Step 4: Build and Start with Docker Compose

From the project root:

```bash
docker compose up -d --build
```

This will:
1. Build the **server** Docker image (Express + Prisma, multi-stage, ~180MB)
2. Build the **client** Docker image (Next.js standalone, ~120MB)
3. Start both containers in detached mode

Monitor startup:

```bash
docker compose logs -f
```

Check container health:

```bash
docker compose ps
```

Expected output once healthy:
```
NAME                         STATUS
revenue-recovery-server      running (healthy)
revenue-recovery-client      running
```

---

## Step 5: Verify Deployment

| Check                        | URL                                  | Expected                       |
|------------------------------|--------------------------------------|--------------------------------|
| Server health                | `http://localhost:4000/health`       | `{ "status": "ok" }`           |
| API documentation (Swagger)  | `http://localhost:4000/api-docs`     | Swagger UI loads               |
| Dashboard                    | `http://localhost:3000`              | Dashboard loads with data      |
| Simulator                    | `http://localhost:3000/simulate`     | Scenario form renders          |

Run a quick end-to-end test:

```bash
# Get a merchant ID
$mid = (Invoke-RestMethod http://localhost:4000/merchants).data[0].id

# Run a simulation
$body = @{
  merchantId = $mid
  eventType  = "PAYMENT_FAILED"
  amount     = 2499
  currency   = "INR"
  paymentMethod = "CARD"
  failureCode   = "BANK_TIMEOUT"
} | ConvertTo-Json

Invoke-RestMethod http://localhost:4000/simulate/scenario -Method POST -Body $body -ContentType "application/json"
```

Expected: `status: "RECOVERY_SUCCEEDED"` with a full pipeline result.

---

## Switching from Local Postgres to Neon DB

If you were previously running a local Postgres container, follow these steps to migrate:

1. **Export local data** (optional — if you want to preserve test data):
   ```bash
   docker exec revenue-recovery-postgres pg_dump -U revenue_admin revenue_recovery > local_backup.sql
   ```

2. **Update your `.env`** with the Neon connection string (see Step 2 above).

3. **Run migrations** against Neon (Step 3 above).

4. **Import local data** into Neon (optional):
   ```bash
   psql "your_neon_connection_string" < local_backup.sql
   ```

5. The `docker-compose.yml` no longer includes a `postgres` service — Neon handles the DB entirely in the cloud.

---

## Production Deployment (Cloud VPS / VM)

To deploy on a cloud VM (DigitalOcean, AWS EC2, Google Cloud Compute, etc.):

### 1. Provision a VM

Recommended minimum:
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 2GB
- **CPU**: 2 vCPUs
- **Open ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (client), 4000 (server)

### 2. Install Docker on the VM

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Clone and Configure

```bash
git clone https://github.com/your-org/ai-revenue-recovery.git
cd ai-revenue-recovery
cp .env.example .env
nano .env   # Fill in DATABASE_URL and GEMINI_API_KEY
```

### 4. Run Migrations and Start

```bash
# Run migrations (requires Node.js on VM, or run from local with remote DATABASE_URL)
cd server && npm ci && npx prisma migrate deploy && cd ..

# Start the stack
docker compose up -d --build
```

### 5. Set Up a Reverse Proxy (Nginx)

Use Nginx to serve both services on standard ports:

```nginx
# /etc/nginx/sites-available/revenue-recovery
server {
    listen 80;
    server_name yourdomain.com;

    # API Server
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js Dashboard
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/revenue-recovery /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6. Enable HTTPS with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Environment Variables Reference

### Server (`server/.env`)

| Variable          | Required | Description                                        |
|-------------------|----------|----------------------------------------------------|
| `DATABASE_URL`    | ✅ Yes   | Neon PostgreSQL connection string (with sslmode)   |
| `GEMINI_API_KEY`  | ✅ Yes   | Google Gemini API key                              |
| `PORT`            | No       | Server port (default: `4000`)                      |
| `NODE_ENV`        | No       | `production` or `development` (default: `development`) |

### Client (`client/.env.local`)

| Variable               | Required | Description                                   |
|------------------------|----------|-----------------------------------------------|
| `NEXT_PUBLIC_API_URL`  | ✅ Yes   | Full URL of the backend API (e.g., `http://your-server:4000`) |

---

## Troubleshooting

### Server fails to start: `Can't reach database server`
- Verify `DATABASE_URL` is correct and includes `?sslmode=require` for Neon.
- Test connectivity: `psql "$DATABASE_URL" -c "SELECT 1;"`

### Client shows "Failed to connect to backend"
- Ensure `NEXT_PUBLIC_API_URL` is set correctly and the server is reachable from the client's network.
- Check `docker compose logs server` for errors.

### Prisma migration fails: `relation already exists`
- This means the migration was already applied. Run `npx prisma migrate status` to check.

### Gemini API errors: `The model API is currently overloaded`
- This is a transient Google AI rate limiting issue. The pipeline will retry on the next simulation run.
- Consider implementing exponential backoff in `ai-strategy-engine.service.ts` for production.

### Docker build fails: `npm run build` exits with code 1
- Check the build logs for the specific error.
- For type errors: the build is configured with `ignoreBuildErrors: true` to prevent type mismatches from blocking deployment.
- For compilation errors: ensure the source code compiles locally with `npm run build` first.

---

## Useful Commands

```bash
# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f server
docker compose logs -f client

# Restart a specific service
docker compose restart server

# Stop all services
docker compose down

# Stop and remove volumes (wipe local data)
docker compose down -v

# Rebuild and restart
docker compose up -d --build

# Check Prisma migration status
cd server && npx prisma migrate status

# Open Prisma Studio (visual DB browser)
cd server && npx prisma studio
```

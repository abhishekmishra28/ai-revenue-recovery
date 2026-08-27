# RevivePay AI — Revenue Recovery Agent

![RevivePay AI Header](https://via.placeholder.com/1200x400/0d0f1a/ffffff?text=RevivePay+AI+-+Revenue+Recovery+Agent)

**RevivePay AI** is a production-grade, autonomous AI agent designed to recover lost revenue from failed payments, abandoned checkouts, and failed subscriptions.

It detects revenue-at-risk events in real-time, uses **Gemini 3.6 Flash** to deduce the best recovery strategy, strictly validates that strategy against merchant-defined deterministic policies, executes the action, and attributes the recovered revenue back to the agent — all with a 100% transparent audit trail.

---

## 🏆 Hackathon Winning Features

1. **Closed-Loop Autonomy:** Not just a chatbot. It detects, decides, acts, and measures entirely autonomously.
2. **Safe & Auditable AI:** The AI *recommends*, but a deterministic Policy Engine *executes*. 100% safe for financial operations.
3. **End-to-End Attribution:** Every rupee recovered is attributed exactly to the AI strategy that caused it.
4. **Premium Fintech Dashboard:** A stunning dark-mode Next.js UI for merchants to monitor the AI's performance in real time.

---

## 🏗️ Architecture

RevivePay AI is built using the **Advanced MVC (Modular Domain-Driven)** pattern, ensuring strict separation of concerns.

```mermaid
graph TD
    A[Payment Gateway] -->|Webhook| B(Event Processing Service)
    B -->|Creates| C{Recovery Case}
    
    C -->|Context| D[🧠 AI Strategy Engine]
    D -->|Recommends Action| E[🛡️ Policy Validator]
    
    E -->|Approved| F[Action Execution Engine]
    E -->|Rejected| G[Audit Store]
    
    F -->|Outcome| H[Revenue Attribution]
    
    H --> G
    F --> G
```

### Tech Stack
- **Frontend:** Next.js 16 (Turbopack), React 19, Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **AI Model:** Google Gemini 3.6 Flash
- **Architecture:** Domain-Driven Design (DDD) with isolated modules

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- PostgreSQL
- A Gemini API Key

### Installation

1. **Clone & Install Dependencies**
```bash
git clone https://github.com/your-username/ai-revenue-recovery.git
cd ai-revenue-recovery

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

2. **Environment Variables**
Create a `.env` file in the `server/` directory:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/revivepay"
GEMINI_API_KEY="your-gemini-key"
PORT=4000
```
Create a `.env.local` file in the `client/` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

3. **Database Setup**
```bash
cd server
npx prisma migrate dev --name init
```

4. **Run the Apps**
```bash
# In terminal 1 (Backend)
cd server
npm run dev

# In terminal 2 (Frontend)
cd client
npm run dev
```
Visit `http://localhost:3000` to see the dashboard.

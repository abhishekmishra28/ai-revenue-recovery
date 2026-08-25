import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import healthRoutes from "./modules/health/health.routes";
import merchantRoutes from "./modules/merchants/merchant.routes";
import customerRoutes from "./modules/customers/customer.routes";
import recoveryCaseRoutes from "./modules/recovery-cases/recovery-case.routes";
import transactionRoutes from "./modules/transactions/transaction.routes";
import revenueEventRoutes from "./modules/revenue-events/revenue-event.routes";
import aiDecisionRoutes from "./modules/ai-decisions/ai-decision.routes";
import recoveryActionRoutes from "./modules/recovery-actions/recovery-action.routes";
import outcomeRoutes from "./modules/outcomes/outcome.routes";
import auditEventRoutes from "./modules/audit-events/audit-event.routes";
import recoveryEngineRoutes from "./modules/recovery-engine/recovery-engine.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/merchants", merchantRoutes);
app.use("/customers", customerRoutes);
app.use("/recovery-cases", recoveryCaseRoutes);
app.use("/transactions", transactionRoutes);
app.use("/revenue-events", revenueEventRoutes);
app.use("/ai-decisions", aiDecisionRoutes);
app.use("/recovery-actions", recoveryActionRoutes);
app.use("/outcomes", outcomeRoutes);
app.use("/audit-events", auditEventRoutes);
app.use("/recovery-engine", recoveryEngineRoutes);

export default app;
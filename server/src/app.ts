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
import eventProcessorRoutes from "./modules/event-processing/event-processor.routes";
import aiStrategyEngineRoutes from "./modules/ai-strategy-engine/ai-strategy-engine.routes";
import recoveryActionEngineRoutes from "./modules/recovery-action-engine/recovery-action-engine.routes";
import actionExecutionRoutes from "./modules/action-execution/action-execution.routes";
import revenueAttributionRoutes from "./modules/revenue-attribution/revenue-attribution.routes";
import policyEngineRoutes from "./modules/policy-engine/policy-engine.routes";
import auditRoutes from "./modules/audit/audit.routes";

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
app.use("/event-processing", eventProcessorRoutes);
app.use("/ai-strategy-engine", aiStrategyEngineRoutes);
app.use("/recovery-action-engine", recoveryActionEngineRoutes);
app.use("/action-execution", actionExecutionRoutes);
app.use("/revenue-attribution", revenueAttributionRoutes);
app.use("/policy-engine", policyEngineRoutes);
app.use("/audit", auditRoutes);

export default app;
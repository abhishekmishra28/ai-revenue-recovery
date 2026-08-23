import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import healthRoutes from "./modules/health/health.routes";
import merchantRoutes from "./modules/merchants/merchant.routes";
import customerRoutes from "./modules/customers/customer.routes";
import recoveryCaseRoutes from "./modules/recovery-cases/recovery-case.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/merchants", merchantRoutes);
app.use("/customers", customerRoutes);
app.use("/recovery-cases", recoveryCaseRoutes);

export default app;
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import healthRoutes from "./modules/health/health.routes";
import merchantRoutes from "./modules/merchants/merchant.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use("/health", healthRoutes);

app.use("/merchants", merchantRoutes);

export default app;
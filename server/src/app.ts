import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import healthRoutes from "./modules/health/health.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use("/health", healthRoutes);
export default app;
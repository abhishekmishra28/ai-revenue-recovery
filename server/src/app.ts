import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.get('/health', (_req, res) => {
    res.status(200).json({
        status : "ok",
        service: "ai-revenue-recovery",
    });
});

export default app;
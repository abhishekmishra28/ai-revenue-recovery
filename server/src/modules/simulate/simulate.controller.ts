import type { Request, Response } from "express";
import { simulateScenario } from "./simulate.service";

export const simulateScenarioController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await simulateScenario(req.body);
    res.json({ data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Simulation failed";
    res.status(400).json({ error: message });
  }
};

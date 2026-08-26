import { Request, Response } from "express";

import {
  AttributionType,
  Prisma,
} from "@prisma/client";

import {
  getRevenueAttributions,
  getRevenueAttribution,
  getRevenueAttributionsForRecoveryCase,
  getRevenueAttributionsForOutcome,
  createRevenueAttribution,
} from "./revenue-attribution.service";

type IdParams = {
  id: string;
};

type RecoveryCaseParams = {
  recoveryCaseId: string;
};

type OutcomeParams = {
  outcomeId: string;
};

type CreateRevenueAttributionBody = {
  outcomeId: string;
  amount: string;
  currency: string;
  attributionType: AttributionType;
};

export const getRevenueAttributionsController =
  async (
    _req: Request,
    res: Response,
  ) => {
    try {
      const data =
        await getRevenueAttributions();

      res.status(200).json({
        data,
      });
    } catch (error) {
      console.error(
        "Failed to fetch revenue attributions:",
        error,
      );

      res.status(500).json({
        error:
          "Failed to fetch revenue attributions",
      });
    }
  };

export const getRevenueAttributionByIdController =
  async (
    req: Request<IdParams>,
    res: Response,
  ) => {
    try {
      const { id } = req.params;

      const data =
        await getRevenueAttribution(id);

      if (!data) {
        res.status(404).json({
          error:
            "Revenue attribution not found",
        });

        return;
      }

      res.status(200).json({
        data,
      });
    } catch (error) {
      console.error(
        "Failed to fetch revenue attribution:",
        error,
      );

      res.status(500).json({
        error:
          "Failed to fetch revenue attribution",
      });
    }
  };

export const getRevenueAttributionsForRecoveryCaseController =
  async (
    req: Request<RecoveryCaseParams>,
    res: Response,
  ) => {
    try {
      const { recoveryCaseId } =
        req.params;

      const data =
        await getRevenueAttributionsForRecoveryCase(
          recoveryCaseId,
        );

      res.status(200).json({
        data,
      });
    } catch (error) {
      console.error(
        "Failed to fetch attributions for recovery case:",
        error,
      );

      res.status(500).json({
        error:
          "Failed to fetch revenue attributions",
      });
    }
  };

export const getRevenueAttributionsForOutcomeController =
  async (
    req: Request<OutcomeParams>,
    res: Response,
  ) => {
    try {
      const { outcomeId } =
        req.params;

      const data =
        await getRevenueAttributionsForOutcome(
          outcomeId,
        );

      res.status(200).json({
        data,
      });
    } catch (error) {
      console.error(
        "Failed to fetch attributions for outcome:",
        error,
      );

      res.status(500).json({
        error:
          "Failed to fetch revenue attributions",
      });
    }
  };

export const createRevenueAttributionController =
  async (
    req: Request<
      {},
      {},
      CreateRevenueAttributionBody
    >,
    res: Response,
  ) => {
    try {
      const {
        outcomeId,
        amount,
        currency,
        attributionType,
      } = req.body;

      if (!outcomeId) {
        res.status(400).json({
          error: "outcomeId is required",
        });

        return;
      }

      if (!amount) {
        res.status(400).json({
          error: "amount is required",
        });

        return;
      }

      if (!currency) {
        res.status(400).json({
          error: "currency is required",
        });

        return;
      }

      if (!attributionType) {
        res.status(400).json({
          error:
            "attributionType is required",
        });

        return;
      }

      const decimalAmount =
        new Prisma.Decimal(amount);

      if (
        decimalAmount.lessThanOrEqualTo(0)
      ) {
        res.status(400).json({
          error:
            "amount must be greater than zero",
        });

        return;
      }

      const data =
        await createRevenueAttribution({
          outcomeId,

          amount:
            decimalAmount,

          currency:
            currency.toUpperCase(),

          attributionType,
        });

      res.status(201).json({
        data,
      });
    } catch (error) {
      console.error(
        "Failed to create revenue attribution:",
        error,
      );

      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create revenue attribution",
      });
    }
  };
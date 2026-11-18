import type { Request, Response } from 'express';
import {
  calculateValuation,
  type SampleInput,
  type TargetInput,
} from '../src/lib/valuationEngine.ts';

export default function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { target, samples } = (body || {}) as {
      target?: TargetInput;
      samples?: SampleInput[];
    };

    if (!target || !Array.isArray(samples)) {
      res.status(400).json({ error: 'Payload inválido: informe target e samples.' });
      return;
    }

    const result = calculateValuation(target, samples);
    res.status(200).json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Erro interno ao processar homogeneização NBR 14.653.' });
  }
}

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  calculateValuation,
  type SampleInput,
  type TargetInput,
} from './src/lib/valuationEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'valuation-pro' });
  });

  app.post('/api/calculate', (req, res) => {
    try {
      const { target, samples } = req.body as {
        target?: TargetInput;
        samples?: SampleInput[];
      };

      if (!target || !Array.isArray(samples)) {
        res.status(400).json({ error: 'Payload inválido: informe target e samples.' });
        return;
      }

      const result = calculateValuation(target, samples);
      res.json(result);
    } catch (error) {
      console.error('Calculation error:', error);
      res.status(500).json({ error: 'Erro interno ao processar homogeneização NBR 14.653.' });
    }
  });

  app.get('/api/cep/:cep', async (req, res) => {
    const cleanCep = String(req.params.cep || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      res.status(400).json({ error: 'CEP deve conter 8 dígitos.' });
      return;
    }

    const fetchWithTimeout = async (url: string, timeoutMs = 5000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    try {
      const viaCepRes = await fetchWithTimeout(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (viaCepRes.ok) {
        const data = await viaCepRes.json();
        if (data?.erro) {
          res.status(404).json({ error: 'CEP não encontrado na base dos Correios.' });
          return;
        }
        res.json({
          cep: data.cep || cleanCep,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          localidade: data.localidade || '',
          uf: data.uf || '',
        });
        return;
      }
    } catch {
      // Fall through to BrasilAPI
    }

    try {
      const brasilApiRes = await fetchWithTimeout(
        `https://brasilapi.com.br/api/cep/v1/${cleanCep}`
      );
      if (brasilApiRes.ok) {
        const data = await brasilApiRes.json();
        res.json({
          cep: data.cep || cleanCep,
          logradouro: data.street || '',
          bairro: data.neighborhood || '',
          localidade: data.city || '',
          uf: data.state || '',
        });
        return;
      }
      if (brasilApiRes.status === 404) {
        res.status(404).json({ error: 'CEP não encontrado.' });
        return;
      }
    } catch {
      // Both providers failed
    }

    res.status(504).json({ error: 'Serviços de CEP indisponíveis no momento. Tente novamente.' });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Valuation Pro running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

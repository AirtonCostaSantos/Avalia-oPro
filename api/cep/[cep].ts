import type { Request, Response } from 'express';

async function fetchWithTimeout(url: string, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const rawCep = Array.isArray(req.query.cep) ? req.query.cep[0] : req.query.cep;
  const cleanCep = String(rawCep || '').replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    res.status(400).json({ error: 'CEP deve conter 8 dígitos.' });
    return;
  }

  try {
    const viaCepRes = await fetchWithTimeout(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (viaCepRes.ok) {
      const data = await viaCepRes.json();
      if (data?.erro) {
        res.status(404).json({ error: 'CEP não encontrado na base dos Correios.' });
        return;
      }
      res.status(200).json({
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
      res.status(200).json({
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
}

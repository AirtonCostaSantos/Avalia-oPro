export interface CepAddressResult {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

export function extractCepDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8);
}

export async function fetchCepAddress(
  cepInput: string
): Promise<{ data?: CepAddressResult; error?: string }> {
  const cleanCep = extractCepDigits(cepInput);
  if (cleanCep.length !== 8) {
    return { error: 'Informe um CEP válido com 8 dígitos.' };
  }

  // 1. Try local/serverless API proxy first
  try {
    const response = await fetch(`/api/cep/${cleanCep}`);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await response.json();
      if (response.ok && payload && !payload.error) {
        return {
          data: {
            cep: formatCep(payload.cep || cleanCep),
            logradouro: payload.logradouro || '',
            bairro: payload.bairro || '',
            localidade: payload.localidade || '',
            uf: payload.uf || '',
          },
        };
      }
      if (response.status === 404 && payload?.error) {
        return { error: payload.error };
      }
    }
  } catch {
    // Fall through to direct browser API lookup (e.g. static Netlify hosting)
  }

  // 2. Direct ViaCEP fallback
  try {
    const viaResp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (viaResp.ok) {
      const viaData = await viaResp.json();
      if (viaData && !viaData.erro) {
        return {
          data: {
            cep: formatCep(viaData.cep || cleanCep),
            logradouro: viaData.logradouro || '',
            bairro: viaData.bairro || '',
            localidade: viaData.localidade || '',
            uf: viaData.uf || '',
          },
        };
      }
      if (viaData?.erro) {
        return { error: 'CEP não encontrado na base dos Correios.' };
      }
    }
  } catch {
    // Fall through to BrasilAPI
  }

  // 3. Direct BrasilAPI fallback
  try {
    const brResp = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
    if (brResp.ok) {
      const brData = await brResp.json();
      if (brData && brData.cep) {
        return {
          data: {
            cep: formatCep(brData.cep || cleanCep),
            logradouro: brData.street || '',
            bairro: brData.neighborhood || '',
            localidade: brData.city || '',
            uf: brData.state || '',
          },
        };
      }
    }
    if (brResp.status === 404) {
      return { error: 'CEP não encontrado.' };
    }
  } catch {
    // Network failure
  }

  return { error: 'Falha de rede ao consultar CEP.' };
}

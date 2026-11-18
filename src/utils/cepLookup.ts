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

  try {
    const response = await fetch(`/api/cep/${cleanCep}`);
    const payload = await response.json();

    if (!response.ok) {
      return { error: payload?.error || 'Não foi possível localizar o CEP.' };
    }

    return {
      data: {
        cep: formatCep(payload.cep || cleanCep),
        logradouro: payload.logradouro || '',
        bairro: payload.bairro || '',
        localidade: payload.localidade || '',
        uf: payload.uf || '',
      },
    };
  } catch {
    return { error: 'Falha de rede ao consultar CEP.' };
  }
}

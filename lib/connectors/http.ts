import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export const MAX_RETRIES = 3;
export const REQUEST_TIMEOUT_MS = 30000;

export function createHttpClient(baseURL: string, headers: Record<string, string>): AxiosInstance {
  return axios.create({ baseURL, timeout: REQUEST_TIMEOUT_MS, headers });
}

export async function requestWithRetry<T>(
  client: AxiosInstance,
  config: AxiosRequestConfig,
  logPrefix: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.request<T>(config);
      return response.data;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [${logPrefix}] Attempt ${attempt}/${MAX_RETRIES} failed: ${message}`);

      if (attempt < MAX_RETRIES) {
        const backoffMs = 2 ** (attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed after retries');
}

import { afterEach, describe, expect, it, vi } from 'vitest';

type InterceptorHandler<T> = {
  fulfilled: (value: T) => T | Promise<T>;
  rejected?: (error: unknown) => Promise<never>;
};

type RequestConfig = { headers: Record<string, string | undefined> };

const loadClient = async (baseUrl?: string) => {
  vi.resetModules();
  if (baseUrl === undefined) vi.stubEnv('VITE_API_BASE_URL', '');
  else vi.stubEnv('VITE_API_BASE_URL', baseUrl);
  return (await import('../services/api/client')).apiClient;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('API client security and diagnostics', () => {
  it('requires an explicit API origin in production mode', async () => {
    vi.resetModules();
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_API_BASE_URL', '');
    await expect(import('../services/api/client')).rejects.toThrow('VITE_API_BASE_URL is required in production');

    vi.resetModules();
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
    await expect(import('../services/api/client')).resolves.toBeDefined();
  });

  it('normalizes the configured API origin and leaves relative mode empty', async () => {
    let client = await loadClient(' https://api.example.test/api/// ');
    expect(client.defaults.baseURL).toBe('https://api.example.test');
    client = await loadClient('   ');
    expect(client.defaults.baseURL).toBe('');
  });

  it('adds bearer credentials only when a token exists', async () => {
    const client = await loadClient();
    const handler = (client.interceptors.request as unknown as { handlers: Array<InterceptorHandler<RequestConfig>> }).handlers[0];
    const anonymous = await handler.fulfilled({ headers: {} });
    expect(anonymous.headers.Authorization).toBeUndefined();

    localStorage.setItem('eduplan-token', 'safe-token');
    const authenticated = await handler.fulfilled({ headers: {} });
    expect(authenticated.headers.Authorization).toBe('Bearer safe-token');
  });

  it('passes successful responses through unchanged', async () => {
    const client = await loadClient();
    const handler = (client.interceptors.response as unknown as { handlers: Array<InterceptorHandler<Record<string, unknown>>> }).handlers[0];
    const response = { status: 200, data: { ok: true } };
    expect(await handler.fulfilled(response)).toBe(response);
  });

  it('logs bounded Axios diagnostics for backend, network and malformed URLs', async () => {
    const client = await loadClient();
    const handler = (client.interceptors.response as unknown as { handlers: Array<InterceptorHandler<Record<string, unknown>>> }).handlers[0];
    const reject = handler.rejected!;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const longBody = 'x'.repeat(2500);
    const backendError = {
      isAxiosError: true,
      code: 'ERR_BAD_RESPONSE',
      config: { baseURL: 'https://api.example.test', url: '/api/plans', method: 'get' },
      response: { status: 500, data: longBody },
    };
    await expect(reject(backendError)).rejects.toBe(backendError);
    expect(errorSpy).toHaveBeenLastCalledWith('[api] request failed', expect.objectContaining({
      method: 'GET',
      url: 'https://api.example.test/api/plans',
      status: 500,
      responseBody: 'x'.repeat(2000),
    }));

    const networkError = { isAxiosError: true, code: 'ERR_NETWORK', config: undefined, response: undefined };
    await expect(reject(networkError)).rejects.toBe(networkError);
    expect(errorSpy).toHaveBeenLastCalledWith('[api] request failed', expect.objectContaining({
      url: '', status: 'network-error', responseBody: null,
    }));

    const malformed = {
      isAxiosError: true,
      code: 'ERR_BAD_REQUEST',
      config: { baseURL: 'not a base', url: 'also bad', method: undefined },
      response: { status: 400, data: { message: 'bad' } },
    };
    await expect(reject(malformed)).rejects.toBe(malformed);
    expect(errorSpy).toHaveBeenLastCalledWith('[api] request failed', expect.objectContaining({
      url: 'not a basealso bad', responseBody: { message: 'bad' },
    }));

    const relative = { isAxiosError: true, config: { baseURL: '', url: '/relative' }, response: { status: 418, data: null } };
    await expect(reject(relative)).rejects.toBe(relative);
    expect(errorSpy).toHaveBeenLastCalledWith('[api] request failed', expect.objectContaining({
      url: `${window.location.origin}/relative`,
    }));

    const invalidWithoutBase = { isAxiosError: true, config: { url: 'http://[' }, response: { status: 400, data: null } };
    await expect(reject(invalidWithoutBase)).rejects.toBe(invalidWithoutBase);
    expect(errorSpy).toHaveBeenLastCalledWith('[api] request failed', expect.objectContaining({ url: 'http://[' }));
  });

  it('logs unexpected non-Axios failures without exposing extra processing', async () => {
    const client = await loadClient();
    const handler = (client.interceptors.response as unknown as { handlers: Array<InterceptorHandler<Record<string, unknown>>> }).handlers[0];
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('unexpected');
    await expect(handler.rejected!(failure)).rejects.toBe(failure);
    expect(errorSpy).toHaveBeenCalledWith('[api] unexpected request failure', failure);
  });
});

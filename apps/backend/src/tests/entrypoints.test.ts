import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listen: vi.fn(),
  createApp: vi.fn(),
  importFit: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('../config/env', () => ({ env: { PORT: 4321 } }));
vi.mock('../app', () => ({ createApp: mocks.createApp }));
vi.mock('../config/prisma', () => ({ prisma: { $disconnect: mocks.disconnect } }));
vi.mock('../modules/curricula/fit-importer.service', () => ({ importFitCurricula: mocks.importFit }));

describe('executable entrypoints', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.createApp.mockReturnValue({ listen: mocks.listen });
    mocks.listen.mockImplementation((_port: number, callback: () => void) => callback());
    mocks.importFit.mockResolvedValue({ imported: 2 });
    mocks.disconnect.mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.exitCode = undefined;
    vi.restoreAllMocks();
  });

  it('starts the HTTP application on the configured port', async () => {
    await import('../main');

    expect(mocks.listen).toHaveBeenCalledWith(4321, expect.any(Function));
    expect(console.log).toHaveBeenCalledWith('Backend API is running on http://localhost:4321');
    expect(console.log).toHaveBeenCalledWith('Swagger docs: http://localhost:4321/api/docs');
  });

  it('runs the FIT import command and always disconnects Prisma', async () => {
    await import('../scripts/import-fit');
    await vi.waitFor(() => expect(mocks.disconnect).toHaveBeenCalledOnce());

    expect(mocks.importFit).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({ imported: 2 }, null, 2));
    expect(process.exitCode).toBeUndefined();
  });

  it('marks a failed FIT import with a non-zero exit code and disconnects', async () => {
    mocks.importFit.mockRejectedValue(new Error('Import failed'));
    vi.resetModules();

    await import('../scripts/import-fit');
    await vi.waitFor(() => expect(mocks.disconnect).toHaveBeenCalledOnce());

    expect(console.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'Import failed' }));
    expect(process.exitCode).toBe(1);
  });
});

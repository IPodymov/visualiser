import { beforeEach, describe, expect, it, vi } from 'vitest';

const root = vi.hoisted(() => ({ render: vi.fn(), createRoot: vi.fn() }));

vi.mock('react-dom/client', () => ({
  default: { createRoot: root.createRoot },
  createRoot: root.createRoot,
}));
vi.mock('@app/App', () => ({ App: () => null }));

describe('browser entrypoint', () => {
  beforeEach(() => {
    root.render.mockReset();
    root.createRoot.mockReset();
    root.createRoot.mockReturnValue({ render: root.render });
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('mounts the React application into the root element', async () => {
    await import('../main');
    expect(root.createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(root.render).toHaveBeenCalledOnce();
  });
});

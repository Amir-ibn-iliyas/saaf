/**
 * @jest-environment node
 */
import { bundledMaskFiles, bundledMasksConfig } from '../masks';
import { parseMasksBundle } from '../remote';

const bundle = () =>
  JSON.parse(JSON.stringify({ ...bundledMasksConfig, masks: bundledMaskFiles })) as Record<string, any>;

describe('parseMasksBundle', () => {
  it('accepts a full bundle like the server sends', () => {
    const parsed = parseMasksBundle(bundle());
    expect(parsed?.config.version).toBe(bundledMasksConfig.version);
    expect(parsed?.templates.map((t) => t.id)).toEqual(bundledMasksConfig.templates.map((t) => t.id));
  });

  it('picks up a changed threshold and a new template', () => {
    const b = bundle();
    b.version = '2099-01-01';
    b.threshold = 0.5;
    b.templates.push({ id: 'new-48', size: 48, marginRight: 40, marginBottom: 40, file: 'alpha-48' });
    const parsed = parseMasksBundle(b);
    expect(parsed?.config.threshold).toBe(0.5);
    expect(parsed?.templates.at(-1)?.id).toBe('new-48');
  });

  it.each([
    ['nothing', null],
    ['not an object', 'masks'],
    ['no masks data', (() => { const b = bundle(); delete b.masks; return b; })()],
    ['missing mask file', (() => { const b = bundle(); delete b.masks['alpha-48']; return b; })()],
    ['wrong mask size', (() => { const b = bundle(); b.templates[0].size = 50; return b; })()],
    ['broken mask data', (() => { const b = bundle(); b.masks['alpha-48'].data = 'AAAA'; return b; })()],
    ['threshold out of range', (() => { const b = bundle(); b.threshold = 3; return b; })()],
    ['no templates', (() => { const b = bundle(); b.templates = []; return b; })()],
  ])('rejects %s', (_name, value) => {
    expect(parseMasksBundle(value)).toBeNull();
  });
});

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  BRAND_COLORS,
  BRAND_CSS_VARS,
  DARK_THEME,
  LIGHT_THEME,
  THEME_TOKEN_NAMES,
  type ThemeTokenName,
  type ThemeTokens,
} from '../branding';

const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');

function blockVariables(selector: ':root' | '.dark'): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`);
  const end = css.indexOf('\n}', start);
  const body = css.slice(start, end);
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim().toLowerCase()])
  );
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const AA_TEXT = 4.5;

// [foreground token, background token] — every text-on-surface pairing the UI relies on.
const TEXT_PAIRS: [ThemeTokenName, ThemeTokenName][] = [
  ['foreground', 'background'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'muted'],
  ['accent-foreground', 'accent'],
  ['primary', 'background'],
  ['primary', 'card'],
  ['accent', 'card'],
  ['destructive', 'card'],
  ['sidebar-foreground', 'sidebar'],
  ['sidebar-primary-foreground', 'sidebar-primary'],
];

const themes: [string, ThemeTokens, ':root' | '.dark'][] = [
  ['light', LIGHT_THEME, ':root'],
  ['dark', DARK_THEME, '.dark'],
];

describe.each(themes)('%s theme', (_name, theme, selector) => {
  const variables = blockVariables(selector);

  it('defines every token in globals.css with the same value as branding.ts', () => {
    for (const token of THEME_TOKEN_NAMES) {
      expect({ token, value: variables[token] }).toEqual({ token, value: theme[token].toLowerCase() });
    }
  });

  it.each(TEXT_PAIRS)('%s on %s meets WCAG AA (4.5:1)', (foreground, background) => {
    expect(contrast(theme[foreground], theme[background])).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('brand variables', () => {
  it('exposes the brand blues and cyan on :root', () => {
    const variables = blockVariables(':root');
    for (const [name, value] of Object.entries(BRAND_CSS_VARS)) {
      expect(variables[name]).toBe(value.toLowerCase());
    }
  });

  it('keeps white text readable on both ends of the hero gradient', () => {
    expect(contrast(BRAND_COLORS.textLight, BRAND_COLORS.primaryBlue)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(BRAND_COLORS.textLight, BRAND_COLORS.darkBlue)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('role badges', () => {
  const badges = [...css.matchAll(/(\.dark )?\.role-badge-([\w-]+) \{ --badge-bg: (#\w+); --badge-fg: (#\w+); \}/g)].map(
    ([, dark, role, bg, fg]) => ({ label: `${dark ? 'dark' : 'light'} ${role}`, bg, fg })
  );

  it('defines a light and a dark badge for each of the 5 roles', () => {
    expect(badges).toHaveLength(10);
  });

  it.each(badges.map((badge) => [badge.label, badge.bg, badge.fg]))('%s badge meets WCAG AA', (_label, bg, fg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

/**
 * Lesaffre branding — single place to customise the portal's identity.
 *
 * The colours below are mirrored as CSS variables in app/globals.css (that
 * file is what Tailwind actually reads). lib/config/__tests__/branding.test.ts
 * fails if the two drift apart, and also checks WCAG AA contrast for the
 * text/background pairs — so change a value here, copy it to globals.css, and
 * run `npm test -- branding`.
 */

/** Raw brand palette, mode-independent. */
export const BRAND_COLORS = {
  primaryBlue: '#0066CC',
  darkBlue: '#00366B',
  accent: '#00B4D8',
  neutral: '#F5F5F5',
  textDark: '#1A1A1A',
  textLight: '#FFFFFF',
} as const;

/** Names of the CSS variables (without the leading `--`) that make up a theme. */
export const THEME_TOKEN_NAMES = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const;

export type ThemeTokenName = (typeof THEME_TOKEN_NAMES)[number];
export type ThemeTokens = Record<ThemeTokenName, string>;

// `accent` is deliberately darker than BRAND_COLORS.accent in light mode:
// #00B4D8 is only 2.4:1 on white, and the app uses `text-accent` for links
// and icons. The pure brand cyan is kept as --lesaffre-cyan for decoration.
export const LIGHT_THEME: ThemeTokens = {
  background: BRAND_COLORS.neutral,
  foreground: BRAND_COLORS.textDark,
  card: '#FFFFFF',
  'card-foreground': BRAND_COLORS.textDark,
  popover: '#FFFFFF',
  'popover-foreground': BRAND_COLORS.textDark,
  primary: BRAND_COLORS.primaryBlue,
  'primary-foreground': BRAND_COLORS.textLight,
  secondary: '#E6F0FA',
  'secondary-foreground': BRAND_COLORS.darkBlue,
  muted: '#EBEFF4',
  'muted-foreground': '#566170',
  accent: '#006E9C',
  'accent-foreground': BRAND_COLORS.textLight,
  destructive: '#C93A32',
  border: '#D9E0E8',
  input: '#D9E0E8',
  ring: BRAND_COLORS.primaryBlue,
  'chart-1': BRAND_COLORS.primaryBlue,
  'chart-2': BRAND_COLORS.accent,
  'chart-3': BRAND_COLORS.darkBlue,
  'chart-4': '#E3A23C',
  'chart-5': '#8B5FBF',
  sidebar: '#FFFFFF',
  'sidebar-foreground': BRAND_COLORS.textDark,
  'sidebar-primary': BRAND_COLORS.primaryBlue,
  'sidebar-primary-foreground': BRAND_COLORS.textLight,
  'sidebar-accent': '#E6F0FA',
  'sidebar-accent-foreground': BRAND_COLORS.darkBlue,
  'sidebar-border': '#D9E0E8',
  'sidebar-ring': BRAND_COLORS.primaryBlue,
};

// One consistent dark-blue-black family, four elevation steps getting lighter
// (surfaces are lighter than the page, same convention as light mode — see
// LIGHT_THEME, where card/sidebar are also lighter than the page background):
//   background < card/popover < muted/secondary (hover) < border
// Previously the sidebar used a separate navy (BRAND_COLORS.darkBlue) and its
// active item used the cyan accent while every other primary action used a
// different light blue — two clashing "primary" colours. Both now resolve to
// the single DARK_PRIMARY below, everywhere (buttons, focus rings, chart-1,
// sidebar active item). #0066CC itself is only ~3.3:1 on a near-black
// background (fails WCAG AA at 4.5:1 for text/icons), so DARK_PRIMARY is the
// same hue lightened until it clears AA — still unmistakably "the Lesaffre
// blue", not a second colour. `accent` (cyan) stays a deliberately distinct
// colour, as it already is in light mode: used only for links/decoration,
// never for chrome, so it doesn't reintroduce a second "primary".
const DARK_SURFACE_0 = '#0F1419'; // page background
const DARK_SURFACE_1 = '#1A202C'; // card / popover / sidebar
const DARK_SURFACE_2 = '#232B3D'; // muted / secondary / hover feedback
const DARK_BORDER = '#2D3748';
const DARK_TEXT = '#E2E8F0';
const DARK_PRIMARY = '#3D8BFF';
const DARK_PRIMARY_FOREGROUND = '#00182F';

export const DARK_THEME: ThemeTokens = {
  background: DARK_SURFACE_0,
  foreground: DARK_TEXT,
  card: DARK_SURFACE_1,
  'card-foreground': DARK_TEXT,
  popover: DARK_SURFACE_1,
  'popover-foreground': DARK_TEXT,
  primary: DARK_PRIMARY,
  'primary-foreground': DARK_PRIMARY_FOREGROUND,
  secondary: DARK_SURFACE_2,
  'secondary-foreground': DARK_TEXT,
  // Not DARK_SURFACE_1 (=card): `hover:bg-muted` is applied inside cards in
  // several places (row actions, links), and a hover fill identical to the
  // card behind it would be invisible.
  muted: DARK_SURFACE_2,
  'muted-foreground': '#A9BCD6',
  accent: BRAND_COLORS.accent,
  'accent-foreground': '#00243F',
  destructive: '#FF7B72',
  border: DARK_BORDER,
  input: DARK_BORDER,
  ring: DARK_PRIMARY,
  'chart-1': DARK_PRIMARY,
  'chart-2': BRAND_COLORS.accent,
  'chart-3': '#8CC4FF',
  'chart-4': '#F0B955',
  'chart-5': '#B490E0',
  sidebar: DARK_SURFACE_1,
  'sidebar-foreground': DARK_TEXT,
  'sidebar-primary': DARK_PRIMARY,
  'sidebar-primary-foreground': DARK_PRIMARY_FOREGROUND,
  // A translucent overlay rather than a fixed colour: sidebar is now the same
  // colour as `card`, so a flat hover fill would need to differ from both —
  // simpler to lighten whatever's underneath by a fixed amount.
  'sidebar-accent': 'rgba(255, 255, 255, 0.08)',
  'sidebar-accent-foreground': DARK_TEXT,
  'sidebar-border': DARK_BORDER,
  'sidebar-ring': DARK_PRIMARY,
};

/** Decorative brand variables exposed on :root (Tailwind: bg-lesaffre-blue, …). */
export const BRAND_CSS_VARS = {
  'lesaffre-blue': BRAND_COLORS.primaryBlue,
  'lesaffre-dark-blue': BRAND_COLORS.darkBlue,
  'lesaffre-cyan': BRAND_COLORS.accent,
} as const;

export const LESAFFRE_THEME = {
  name: 'Lesaffre',
  portalName: 'Portail RH Lesaffre',
  productName: 'HR Tools Intelligence',
  tagline: 'Tous vos outils RH, au même endroit.',
  logo: {
    src: '/lesaffre-logo.png',
    alt: 'Lesaffre',
    width: 320,
    height: 320,
  },
  fonts: { heading: 'Poppins', body: 'Inter' },
  colors: { brand: BRAND_COLORS, light: LIGHT_THEME, dark: DARK_THEME },
} as const;

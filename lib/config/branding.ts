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

// On dark surfaces the primary blue lightens (#0066CC is only ~3:1 on the dark
// background); the deep brand blue becomes the sidebar surface instead.
export const DARK_THEME: ThemeTokens = {
  background: '#03172C',
  foreground: BRAND_COLORS.textLight,
  card: '#072844',
  'card-foreground': BRAND_COLORS.textLight,
  popover: '#072844',
  'popover-foreground': BRAND_COLORS.textLight,
  primary: '#4DA3FF',
  'primary-foreground': '#00182F',
  secondary: '#0B3560',
  'secondary-foreground': BRAND_COLORS.textLight,
  muted: '#0B3560',
  'muted-foreground': '#A9BCD6',
  accent: BRAND_COLORS.accent,
  'accent-foreground': '#00243F',
  destructive: '#FF7B72',
  border: '#134272',
  input: '#134272',
  ring: '#4DA3FF',
  'chart-1': '#4DA3FF',
  'chart-2': BRAND_COLORS.accent,
  'chart-3': '#8CC4FF',
  'chart-4': '#F0B955',
  'chart-5': '#B490E0',
  sidebar: BRAND_COLORS.darkBlue,
  'sidebar-foreground': BRAND_COLORS.textLight,
  'sidebar-primary': BRAND_COLORS.accent,
  'sidebar-primary-foreground': '#00243F',
  'sidebar-accent': 'rgba(255, 255, 255, 0.08)',
  'sidebar-accent-foreground': BRAND_COLORS.textLight,
  'sidebar-border': 'rgba(255, 255, 255, 0.14)',
  'sidebar-ring': BRAND_COLORS.accent,
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

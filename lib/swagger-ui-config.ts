/**
 * Config for the Swagger UI widget loaded via the swagger-ui-dist CDN bundle
 * (no swagger-ui-react npm dependency — see app/api-docs/page.tsx).
 */

const SWAGGER_UI_VERSION = '5.17.14';

export const SWAGGER_UI_CDN = {
  css: `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css`,
  bundleJs: `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`,
  presetJs: `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-standalone-preset.js`,
};

interface SwaggerUIBundleGlobal {
  (options: Record<string, unknown>): unknown;
  presets: { apis: unknown };
  plugins: { DownloadUrl: unknown };
}

interface SwaggerUIWindow extends Window {
  SwaggerUIBundle?: SwaggerUIBundleGlobal;
  SwaggerUIStandalonePreset?: unknown;
}

/**
 * Builds the SwaggerUIBundle() init options: spec loaded from /api/swagger,
 * "Try it out" enabled, and the multi-server dropdown driven by the spec's
 * own `servers` array (info.servers already lists localhost + production).
 */
function buildSwaggerUIOptions(w: SwaggerUIWindow): Record<string, unknown> {
  if (!w.SwaggerUIBundle) {
    throw new Error('SwaggerUIBundle is not loaded yet.');
  }

  return {
    url: '/api/swagger',
    dom_id: '#swagger-ui',
    deepLinking: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
    filter: true,
    tryItOutEnabled: true,
    persistAuthorization: true,
    presets: [w.SwaggerUIBundle.presets.apis, w.SwaggerUIStandalonePreset].filter(Boolean),
    plugins: [w.SwaggerUIBundle.plugins.DownloadUrl],
    layout: 'StandaloneLayout',
  };
}

/** Initializes the Swagger UI widget once both CDN scripts have loaded. */
export function initSwaggerUI(win: Window): void {
  const w = win as SwaggerUIWindow;
  if (!w.SwaggerUIBundle) {
    throw new Error('SwaggerUIBundle is not loaded yet.');
  }
  w.SwaggerUIBundle(buildSwaggerUIOptions(w));
}

const DARK_THEME_STYLE_ID = 'swagger-ui-dark-theme';

/**
 * Swagger UI ships no dark mode. Rather than hand-maintaining a full
 * stylesheet override, we invert the widget's own colors — a common,
 * lightweight retrofit that keeps contrast/legibility without depending
 * on a fork or extra package.
 */
const DARK_THEME_CSS = `
  [data-swagger-theme="dark"] { background: #0a1f44; }
  [data-swagger-theme="dark"] #swagger-ui .swagger-ui { filter: invert(0.92) hue-rotate(180deg); }
  [data-swagger-theme="dark"] #swagger-ui .swagger-ui img,
  [data-swagger-theme="dark"] #swagger-ui .swagger-ui .microlight,
  [data-swagger-theme="dark"] #swagger-ui .swagger-ui .highlight-code {
    filter: invert(1) hue-rotate(180deg);
  }
`;

export function applySwaggerDarkTheme(): void {
  document.documentElement.setAttribute('data-swagger-theme', 'dark');
  if (!document.getElementById(DARK_THEME_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = DARK_THEME_STYLE_ID;
    style.textContent = DARK_THEME_CSS;
    document.head.appendChild(style);
  }
}

export function removeSwaggerDarkTheme(): void {
  document.documentElement.removeAttribute('data-swagger-theme');
}

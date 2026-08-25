/**
 * OpenAPI 3.0 specification for the Lesaffre HR Backend API.
 *
 * This is a hand-written spec that documents the API as it actually behaves —
 * see docs/API.md for the authentication/rate-limit caveats it references.
 * Served as JSON by app/api/swagger/route.ts and mirrored (as a static
 * snapshot) at public/openapi.json for Postman/Insomnia import.
 */

const successMeta = {
  type: 'object',
  properties: {
    timestamp: { type: 'string', format: 'date-time' },
    requestId: { type: 'string', format: 'uuid' },
    took_ms: { type: 'integer' },
  },
};

const errorEnvelope = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'BAD_REQUEST' },
        message: { type: 'string' },
        details: { nullable: true },
      },
    },
    meta: successMeta,
  },
};

const tool = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    slug: { type: 'string' },
    description: { type: 'string', nullable: true },
    category: { type: 'string' },
    country: { type: 'string', nullable: true },
    official_url: { type: 'string', nullable: true },
    api_endpoint: { type: 'string', nullable: true },
    integration_type: { type: 'string', nullable: true },
    auth_method: { type: 'string', nullable: true },
    is_active: { type: 'boolean' },
    last_sync: { type: 'string', format: 'date-time', nullable: true },
    sync_status: { type: 'string', nullable: true },
    estimated_record_count: { type: 'integer', nullable: true },
    data_owner: { type: 'string', nullable: true },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const toolHealth = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    status: { type: 'string', enum: ['healthy', 'degraded', 'failed'] },
    lastSync: { type: 'string', format: 'date-time', nullable: true },
    qualityScore: { type: 'number', nullable: true },
    successfulSyncs7d: { type: 'integer' },
    failedSyncs7d: { type: 'integer' },
  },
};

const alert = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    rule: {
      type: 'string',
      enum: ['QUALITY_DEGRADATION', 'SYNC_FAILURE_STREAK', 'NO_SYNC_24H', 'HIGH_ISSUE_RATE', 'API_TIMEOUT'],
    },
    tool: { type: 'string', nullable: true, description: 'Tool slug, null for global rules (e.g. HIGH_ISSUE_RATE).' },
    severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
    message: { type: 'string' },
    status: { type: 'string', enum: ['open', 'acknowledged', 'resolved'] },
    created_at: { type: 'string', format: 'date-time' },
    acknowledged_at: { type: 'string', format: 'date-time', nullable: true },
    acknowledged_by: { type: 'string', nullable: true },
  },
};

const alertRule = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', example: 'QUALITY_DEGRADATION' },
    condition: { type: 'string', example: 'quality_score_below_percent' },
    threshold: { type: 'number' },
    severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
    enabled: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const webhookSubscription = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', nullable: true },
    url: { type: 'string', format: 'uri' },
    events: { type: 'array', items: { type: 'string' } },
    is_active: { type: 'boolean' },
    created_at: { type: 'string', format: 'date-time' },
  },
};

const scheduledExport = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    type: { type: 'string', enum: ['tools', 'employees', 'alerts', 'health', 'summary'] },
    format: { type: 'string', enum: ['csv', 'pdf'] },
    frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
    recipients: { type: 'array', items: { type: 'string', format: 'email' } },
    enabled: { type: 'boolean' },
    last_run: { type: 'string', format: 'date-time', nullable: true },
    next_run: { type: 'string', format: 'date-time', nullable: true },
    created_at: { type: 'string', format: 'date-time' },
  },
};

function paginatedResponse(itemsSchema: Record<string, unknown>) {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: { type: 'array', items: itemsSchema },
          total: { type: 'integer' },
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          hasMore: { type: 'boolean' },
        },
      },
      meta: successMeta,
    },
  };
}

function successOf(dataSchema: Record<string, unknown>, statusExample = true) {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: statusExample },
      data: dataSchema,
      meta: successMeta,
    },
  };
}

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Lesaffre HR Backend API',
    version: '1.0.0',
    description:
      'BI & operations layer over the Lesaffre HR toolset: tool sync connectors, ' +
      'analytics, alerting, webhooks, and CSV/PDF exports. See docs/API.md for ' +
      'authentication status, error codes, and webhook payload formats.',
    contact: { name: 'Anas Mehri' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local development' },
    { url: 'https://api.lesaffre.com', description: 'Production' },
  ],
  tags: [
    { name: 'Health', description: 'Service and database health checks.' },
    { name: 'Tools', description: 'The HR tools catalog stored in PostgreSQL.' },
    { name: 'Sync', description: 'Triggering connector syncs (Cornerstone, ADP, Kelio).' },
    { name: 'Analytics', description: 'Tool health, data quality, and AI-generated insights.' },
    { name: 'Webhooks', description: 'Outbound webhook subscriptions and delivery testing.' },
    { name: 'Alerts', description: 'Alert rules, active alerts, history, and the rule engine.' },
    { name: 'Export', description: 'CSV/PDF report exports and scheduled exports.' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Defined for forward compatibility — see docs/API.md: no route currently ' +
          'validates this token (lib/auth.ts is an unused stub).',
      },
    },
    schemas: {
      Tool: tool,
      ToolHealth: toolHealth,
      Alert: alert,
      AlertRule: alertRule,
      WebhookSubscription: webhookSubscription,
      ScheduledExport: scheduledExport,
      ErrorEnvelope: errorEnvelope,
    },
    responses: {
      BadRequest: {
        description: 'The request was invalid.',
        content: { 'application/json': { schema: errorEnvelope } },
      },
      NotFound: {
        description: 'The resource was not found.',
        content: { 'application/json': { schema: errorEnvelope } },
      },
      Conflict: {
        description: 'The resource already exists.',
        content: { 'application/json': { schema: errorEnvelope } },
      },
      InternalError: {
        description: 'Unexpected server error.',
        content: { 'application/json': { schema: errorEnvelope } },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Checks the API process and a live PostgreSQL round-trip.',
        responses: {
          '200': {
            description: 'Service is healthy.',
            content: {
              'application/json': {
                schema: successOf({
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    version: { type: 'string', example: '1.0.0' },
                    uptime: { type: 'number', description: 'Process uptime in seconds.' },
                    database: {
                      type: 'object',
                      properties: {
                        connected: { type: 'boolean' },
                        responseTime_ms: { type: 'integer' },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                }),
              },
            },
          },
          '503': {
            description: 'Database unreachable.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'unhealthy' },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/tools': {
      get: {
        tags: ['Tools'],
        summary: 'List all tools',
        description: 'Paginated list of tools from PostgreSQL, with optional name/category search.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          {
            name: 'orderBy',
            in: 'query',
            schema: {
              type: 'string',
              default: 'created_at',
              enum: ['created_at', 'updated_at', 'id', 'name', 'email', 'status', 'quality_score'],
            },
          },
          { name: 'orderDirection', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' } },
          {
            name: 'search',
            in: 'query',
            description: 'Case-insensitive match against name or category.',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated tools list.',
            content: { 'application/json': { schema: paginatedResponse(tool) } },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Tools'],
        summary: 'Create tool',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug', 'category'],
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  country: { type: 'string' },
                },
              },
              example: {
                name: 'Workday',
                slug: 'workday',
                description: 'Global HCM suite',
                category: 'Core HR',
                country: 'Global',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Tool created.',
            content: { 'application/json': { schema: successOf(tool) } },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/sync/{tool}': {
      post: {
        tags: ['Sync'],
        summary: 'Trigger sync for a tool',
        description:
          'Runs the connector for the given tool and logs the run in sync_logs. ' +
          'The success-field names differ per connector (userssynced for Cornerstone, ' +
          'employeesSynced for ADP, timesheetsSynced for Kelio) — see docs/API.md.',
        parameters: [
          {
            name: 'tool',
            in: 'path',
            required: true,
            schema: { type: 'string', enum: ['cornerstone', 'adp', 'kelio'] },
          },
        ],
        responses: {
          '200': { description: 'Sync completed with no failed records.' },
          '207': {
            description: 'Sync completed with some failed records (multi-status).',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'object',
                      title: 'CornerstoneSyncResult',
                      properties: {
                        success: { type: 'boolean' },
                        userssynced: { type: 'integer' },
                        usersFailed: { type: 'integer' },
                        errors: { type: 'array', items: { type: 'string' } },
                      },
                    },
                    {
                      type: 'object',
                      title: 'ADPSyncResult',
                      properties: {
                        success: { type: 'boolean' },
                        employeesSynced: { type: 'integer' },
                        employeesFailed: { type: 'integer' },
                        errors: { type: 'array', items: { type: 'string' } },
                      },
                    },
                    {
                      type: 'object',
                      title: 'KelioSyncResult',
                      properties: {
                        success: { type: 'boolean' },
                        timesheetsSynced: { type: 'integer' },
                        timeSheetsFailed: { type: 'integer' },
                        errors: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  ],
                },
                examples: {
                  cornerstone: { value: { success: false, userssynced: 0, usersFailed: 0, errors: ['getaddrinfo ENOTFOUND api.cornerstone.com'] } },
                },
              },
            },
          },
          '400': {
            description: 'Unknown tool path param.',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, error: { type: 'string' } } } } },
          },
          '404': { description: 'Tool slug not found in the tools table.' },
          '500': { description: 'Connector threw, or an unexpected error occurred.' },
        },
      },
    },

    '/api/analytics/tool-health': {
      get: {
        tags: ['Analytics'],
        summary: 'Get tool health status',
        description: 'Computed status (healthy/degraded/failed) per active tool, quality score, and 7-day sync counts.',
        responses: {
          '200': {
            description: 'Tool health snapshot.',
            content: {
              'application/json': {
                schema: successOf({
                  type: 'object',
                  properties: {
                    tools: { type: 'array', items: toolHealth },
                    lastUpdated: { type: 'string', format: 'date-time' },
                  },
                }),
              },
            },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/analytics/data-quality': {
      get: {
        tags: ['Analytics'],
        summary: 'Get data quality metrics',
        responses: {
          '200': {
            description: 'Global employee data quality summary.',
            content: {
              'application/json': {
                schema: successOf({
                  type: 'object',
                  properties: {
                    totalEmployees: { type: 'integer' },
                    validEmployees: { type: 'integer' },
                    employeesWithIssues: { type: 'integer' },
                    percentageValid: { type: 'number' },
                    topIssues: {
                      type: 'array',
                      items: { type: 'object', properties: { issue: { type: 'string' }, count: { type: 'integer' } } },
                    },
                  },
                }),
              },
            },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/insights': {
      post: {
        tags: ['Analytics'],
        summary: 'Generate an AI-written BI analysis of the tools portfolio',
        description: 'Calls Claude (requires ANTHROPIC_API_KEY) over the static tools catalog. Not part of the original spec list but documented here for completeness.',
        responses: {
          '200': {
            description: 'Markdown analysis.',
            content: { 'application/json': { schema: { type: 'object', properties: { analysis: { type: 'string' } } } } },
          },
          '500': {
            description: 'Generation failed.',
            content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' } } } } },
          },
        },
      },
    },

    '/api/webhooks/subscribe': {
      get: {
        tags: ['Webhooks'],
        summary: 'List webhook subscriptions',
        responses: {
          '200': {
            description: 'All webhook subscriptions.',
            content: {
              'application/json': {
                schema: successOf({ type: 'object', properties: { subscriptions: { type: 'array', items: webhookSubscription } } }),
              },
            },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Create webhook subscription',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url', 'events'],
                properties: {
                  url: { type: 'string', format: 'uri', description: 'Must be HTTPS, or http://localhost / http://127.0.0.1 for local testing.' },
                  events: {
                    type: 'array',
                    items: { type: 'string', enum: ['sync.completed', 'sync.failed', 'data.quality.alert', 'alert.triggered'] },
                  },
                  name: { type: 'string' },
                },
              },
              example: { url: 'https://example.com/webhook', events: ['sync.completed', 'sync.failed'], name: 'Ops Slack relay' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Subscription created.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean' }, subscriptionId: { type: 'string', format: 'uuid' }, webhook_url: { type: 'string' } },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/webhooks/test': {
      post: {
        tags: ['Webhooks'],
        summary: 'Test a webhook subscription',
        description: 'Sends a single webhook.test event (no retry) to the subscription URL, or to an arbitrary url.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { subscriptionId: { type: 'string', format: 'uuid' }, url: { type: 'string', format: 'uri' } } },
              example: { subscriptionId: '09d108c6-5718-4650-82ef-17fe968f5394' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Delivery attempted (success or failure both return 200; check the success field).',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    statusCode: { type: 'integer', nullable: true },
                    responseTime: { type: 'integer', description: 'Milliseconds.' },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/api/alerts/rules': {
      get: {
        tags: ['Alerts'],
        summary: 'List alert rules',
        responses: {
          '200': {
            description: 'Built-in and custom alert rules.',
            content: { 'application/json': { schema: successOf({ type: 'object', properties: { rules: { type: 'array', items: alertRule } } }) } },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Alerts'],
        summary: 'Create custom alert rule',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'condition', 'threshold', 'severity'],
                properties: {
                  name: { type: 'string' },
                  condition: { type: 'string' },
                  threshold: { type: 'number' },
                  severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
                  enabled: { type: 'boolean', default: true },
                },
              },
              example: { name: 'CUSTOM_RULE', condition: 'custom_check', threshold: 42, severity: 'info' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Rule created.',
            content: { 'application/json': { schema: successOf({ type: 'object', properties: { rule: alertRule } }) } },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/alerts/active': {
      get: {
        tags: ['Alerts'],
        summary: 'Get active alerts',
        description: 'Alerts with status = "open", most severe/recent first.',
        responses: {
          '200': {
            description: 'Open alerts.',
            content: {
              'application/json': {
                schema: successOf({ type: 'object', properties: { alerts: { type: 'array', items: alert }, count: { type: 'integer' } } }),
              },
            },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/alerts/acknowledge': {
      put: {
        tags: ['Alerts'],
        summary: 'Acknowledge an alert',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['alertId', 'acknowledgedBy'],
                properties: {
                  alertId: { type: 'string', format: 'uuid' },
                  acknowledgedBy: { type: 'string', description: 'Required — not optional despite some client docs.' },
                },
              },
              example: { alertId: '2b372b32-8f89-4079-a87a-e2a9b42200dc', acknowledgedBy: 'anas@lesaffre.com' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Alert acknowledged.',
            content: { 'application/json': { schema: successOf({ type: 'object', properties: { alert } }) } },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { description: 'No open alert with that id.', content: { 'application/json': { schema: errorEnvelope } } },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/alerts/history': {
      get: {
        tags: ['Alerts'],
        summary: 'Get alert history',
        description: 'Defaults to the last 30 days; paginated and filterable.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'severity', in: 'query', schema: { type: 'string', enum: ['critical', 'warning', 'info'] } },
          { name: 'tool', in: 'query', description: 'Tool slug.', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          '200': {
            description: 'Paginated alert history.',
            content: { 'application/json': { schema: paginatedResponse(alert) } },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/alerts/check': {
      post: {
        tags: ['Alerts'],
        summary: 'Run the alert rule engine',
        description:
          'Evaluates all enabled rules and creates alerts for newly-triggered conditions. ' +
          'Deduplicates against already-open alerts for the same rule+tool. Fires an ' +
          'alert.triggered webhook per newly-created alert (non-blocking).',
        responses: {
          '200': {
            description: 'Evaluation result.',
            content: {
              'application/json': {
                schema: successOf({
                  type: 'object',
                  properties: {
                    evaluated: { type: 'integer' },
                    triggered: { type: 'integer' },
                    created: { type: 'integer' },
                    skipped: { type: 'integer', description: 'Triggered rules that already had an open alert.' },
                    alerts: { type: 'array', items: alert },
                  },
                }),
              },
            },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },

    '/api/export/csv': {
      get: {
        tags: ['Export'],
        summary: 'Export data to CSV',
        description: 'UTF-8 BOM, quoted fields. Zipped automatically if the output exceeds 10MB.',
        parameters: [
          { name: 'type', in: 'query', required: true, schema: { type: 'string', enum: ['tools', 'employees', 'alerts'] } },
          { name: 'dateFrom', in: 'query', description: 'Only applied when type=alerts.', schema: { type: 'string', format: 'date-time' } },
          { name: 'dateTo', in: 'query', description: 'Only applied when type=alerts.', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          '200': {
            description: 'CSV (or ZIP, if >10MB) file. Filename: lesaffre_{type}_{date}.csv',
            headers: { 'Content-Disposition': { schema: { type: 'string', example: 'attachment; filename="lesaffre_tools_2026-08-24.csv"' } } },
            content: { 'text/csv': { schema: { type: 'string', format: 'binary' } }, 'application/zip': { schema: { type: 'string', format: 'binary' } } },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/export/pdf': {
      get: {
        tags: ['Export'],
        summary: 'Export report to PDF',
        description: 'Both type values currently render the same executive health report (only one generator method exists). Zipped if >10MB.',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['health', 'summary'], default: 'health' } },
          { name: 'dateFrom', in: 'query', description: 'Accepted but currently unused (snapshot report).', schema: { type: 'string', format: 'date-time' } },
          { name: 'dateTo', in: 'query', description: 'Accepted but currently unused (snapshot report).', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          '200': {
            description: 'PDF (or ZIP, if >10MB) file. Filename: lesaffre_report_{date}.pdf',
            headers: { 'Content-Disposition': { schema: { type: 'string', example: 'attachment; filename="lesaffre_report_2026-08-24.pdf"' } } },
            content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } }, 'application/zip': { schema: { type: 'string', format: 'binary' } } },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/export/schedule': {
      get: {
        tags: ['Export'],
        summary: 'List scheduled exports',
        responses: {
          '200': {
            description: 'All scheduled exports.',
            content: { 'application/json': { schema: successOf({ type: 'object', properties: { scheduledExports: { type: 'array', items: scheduledExport } } }) } },
          },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      post: {
        tags: ['Export'],
        summary: 'Schedule an export',
        description:
          'Stores the schedule config only — no cron runner or email/webhook delivery is wired up yet ' +
          '(see docs/API.md and docs/DEPLOY.md). format is inferred from type.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'frequency'],
                properties: {
                  type: { type: 'string', enum: ['tools', 'employees', 'alerts', 'health', 'summary'] },
                  frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
                  recipients: { type: 'array', items: { type: 'string', format: 'email' } },
                  enabled: { type: 'boolean', default: true },
                },
              },
              example: { type: 'tools', frequency: 'daily', recipients: ['ops@lesaffre.com'], enabled: true },
            },
          },
        },
        responses: {
          '201': {
            description: 'Schedule created.',
            content: { 'application/json': { schema: successOf({ type: 'object', properties: { scheduledExport } }) } },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        tags: ['Export'],
        summary: 'Delete a scheduled export',
        description: 'Deviates from a /{id} path — this API takes the id as a query param.',
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Deleted.',
            content: {
              'application/json': {
                schema: successOf({ type: 'object', properties: { deleted: { type: 'boolean' }, id: { type: 'string', format: 'uuid' } } }),
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
  },
};

export type OpenApiSpec = typeof openApiSpec;

/** @jest-environment node */
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { POST as demoLogin } from '@/app/api/auth/demo-login/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { POST as checkPermissionRoute } from '@/app/api/auth/check-permission/route';
import { GET as getPayroll } from '@/app/api/payroll/route';
import { GET as getTeam } from '@/app/api/team/route';
import { GET as getRecruitment } from '@/app/api/recruitment/route';
import { GET as getAccessLog } from '@/app/api/audit/access-log/route';
import { signJwt } from '@/middleware/auth';
import { DEMO_USERS, getDemoUserByRole } from '../demo-users';
import { checkPermission, clearAccessEvents, getRecentAccessEvents } from '../middleware';
import { decidePageAccess, normalizePath } from '../page-gate';
import { PERMISSIONS, canAccess, getAccessiblePages, getPermissionLevel } from '../roles';
import { SESSION_COOKIE, resolveSessionUser, signSession, verifySession } from '../session';
import { PAGE_KEYS, USER_ROLES, type PageKey, type UserRole } from '../types';

const EXPECTED_PAGES: Record<UserRole, PageKey[]> = {
  ADMIN: ['DASHBOARD', 'RECRUITMENT', 'POLICIES', 'TEAM', 'PAYROLL', 'SETTINGS', 'API_KEYS', 'AUDIT_LOGS'],
  RH_MANAGER: ['DASHBOARD', 'RECRUITMENT', 'POLICIES', 'TEAM', 'PAYROLL'],
  RECRUITER: ['DASHBOARD', 'RECRUITMENT', 'POLICIES'],
  MANAGER: ['DASHBOARD', 'RECRUITMENT', 'POLICIES', 'TEAM', 'PAYROLL'],
  EMPLOYEE: ['DASHBOARD', 'POLICIES', 'TEAM', 'PAYROLL'],
};

async function cookieFor(role: UserRole): Promise<string> {
  return `${SESSION_COOKIE}=${await signSession(getDemoUserByRole(role))}`;
}

async function request(url: string, role?: UserRole, init: NonNullable<ConstructorParameters<typeof NextRequest>[1]> = {}): Promise<NextRequest> {
  const headers = new Headers(init.headers);
  if (role) headers.set('cookie', await cookieFor(role));
  return new NextRequest(`http://localhost${url}`, { ...init, headers });
}

beforeEach(() => {
  clearAccessEvents();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('permission matrix', () => {
  it('defines every role on every page', () => {
    for (const page of PAGE_KEYS) for (const role of USER_ROLES) expect(PERMISSIONS[page][role]).toBeDefined();
  });

  it('has exactly one demo user per role', () => {
    expect(DEMO_USERS.map((user) => user.role).sort()).toEqual([...USER_ROLES].sort());
  });

  it.each(USER_ROLES)('%s sees exactly its own pages, in navigation order', (role) => {
    expect(getAccessiblePages(role)).toEqual(EXPECTED_PAGES[role]);
  });

  it('gives each role the specified capabilities', () => {
    expect(canAccess('RECRUITER', 'RECRUITMENT', 'approve')).toBe(true);
    expect(canAccess('MANAGER', 'RECRUITMENT', 'view')).toBe(true);
    expect(canAccess('MANAGER', 'RECRUITMENT', 'edit')).toBe(false);
    expect(canAccess('EMPLOYEE', 'RECRUITMENT', 'view')).toBe(false);
    expect(canAccess('RH_MANAGER', 'POLICIES', 'edit')).toBe(true);
    expect(canAccess('RH_MANAGER', 'POLICIES', 'delete')).toBe(false);
    expect(canAccess('RH_MANAGER', 'PAYROLL', 'approve')).toBe(true);
    expect(canAccess('RH_MANAGER', 'PAYROLL', 'edit')).toBe(false);
    expect(canAccess('MANAGER', 'TEAM', 'edit')).toBe(true);
    expect(canAccess('MANAGER', 'PAYROLL', 'viewOwnTeamOnly')).toBe(true);
    expect(canAccess('EMPLOYEE', 'PAYROLL', 'viewOwnOnly')).toBe(true);
    expect(canAccess('RECRUITER', 'TEAM', 'view')).toBe(false);
  });

  it('denies unknown roles, pages and actions', () => {
    // @ts-expect-error — deliberately invalid input
    expect(canAccess('HACKER', 'PAYROLL', 'view')).toBe(false);
    // @ts-expect-error — deliberately invalid input
    expect(canAccess('ADMIN', 'NOPE', 'view')).toBe(false);
    // @ts-expect-error — deliberately invalid input
    expect(canAccess('ADMIN', 'PAYROLL', 'teleport')).toBe(false);
  });

  it('summarises access as a permission level', () => {
    expect(getPermissionLevel('ADMIN', 'RECRUITMENT')).toBe('full');
    expect(getPermissionLevel('MANAGER', 'RECRUITMENT')).toBe('read');
    expect(getPermissionLevel('MANAGER', 'TEAM')).toBe('edit');
    expect(getPermissionLevel('EMPLOYEE', 'PAYROLL')).toBe('read');
    expect(getPermissionLevel('EMPLOYEE', 'SETTINGS')).toBe('none');
  });
});

describe('checkPermission audit trail', () => {
  it('records denials only, with role, page, action and time', async () => {
    expect(await checkPermission('RECRUITER', 'RECRUITMENT', 'create')).toBe(true);
    expect(await checkPermission('RECRUITER', 'PAYROLL', 'view', { userId: 'user-recruiter' })).toBe(false);

    const events = getRecentAccessEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ userRole: 'RECRUITER', attemptedPage: 'PAYROLL', attemptedAction: 'view', result: 'denied', userId: 'user-recruiter' });
    expect(Number.isNaN(Date.parse(events[0].timestamp))).toBe(false);
  });

  it('keeps a bounded buffer, newest first', async () => {
    for (let i = 0; i < 250; i++) await checkPermission('EMPLOYEE', 'SETTINGS', 'view', { userId: `u${i}` });
    const events = getRecentAccessEvents();
    expect(events).toHaveLength(200);
    expect(events[0].userId).toBe('u249');
  });
});

describe('session token', () => {
  it('round-trips a signed session', async () => {
    const token = await signSession(getDemoUserByRole('MANAGER'));
    const claims = await verifySession(token);
    expect(claims).toEqual({ userId: 'user-manager', role: 'MANAGER' });
    expect(resolveSessionUser(claims)?.name).toBe('Sophie Manager');
  });

  it('rejects tampered, foreign and empty tokens', async () => {
    const token = await signSession(getDemoUserByRole('EMPLOYEE'));
    const [header, payload, signature] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: 'user-admin', role: 'ADMIN', aud: 'hr-session', exp: 9999999999 })).toString('base64url');

    expect(await verifySession(`${header}.${forgedPayload}.${signature}`)).toBeNull();
    expect(await verifySession(`${header}.${payload}.x${signature}`)).toBeNull();
    expect(await verifySession('garbage')).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });

  it('does not accept an API bearer token as a session (separate signing key)', async () => {
    const apiToken = await signJwt({ userId: 'user-admin', role: 'ADMIN' });
    expect(await verifySession(apiToken)).toBeNull();
  });

  it('ignores a session whose role does not match the account', () => {
    expect(resolveSessionUser({ userId: 'user-employee', role: 'ADMIN' })).toBeNull();
    expect(resolveSessionUser({ userId: 'nobody', role: 'ADMIN' })).toBeNull();
  });
});

describe('page gate decisions', () => {
  it.each([
    ['/payroll', 'RECRUITER', 'unauthorized'],
    ['/payroll/', 'RECRUITER', 'unauthorized'],
    ['//payroll', 'RECRUITER', 'unauthorized'],
    ['/PAYROLL', 'RECRUITER', 'unauthorized'],
    ['/%70ayroll', 'RECRUITER', 'unauthorized'],
    ['/payroll/anything', 'RECRUITER', 'unauthorized'],
    ['/team', 'RECRUITER', 'unauthorized'],
    ['/recruitment', 'EMPLOYEE', 'unauthorized'],
    ['/settings', 'RH_MANAGER', 'unauthorized'],
    ['/api-keys', 'MANAGER', 'unauthorized'],
    ['/audit-logs', 'EMPLOYEE', 'unauthorized'],
    ['/payroll', 'EMPLOYEE', 'allow'],
    ['/recruitment', 'MANAGER', 'allow'],
    ['/audit-logs', 'ADMIN', 'allow'],
    ['/dashboard', 'RECRUITER', 'allow'],
    ['/dashboard/alerts', 'EMPLOYEE', 'allow'],
    ['/error/unauthorized', 'RECRUITER', 'allow'],
    ['/', 'EMPLOYEE', 'allow'],
    ['/payroll', null, 'login'],
    ['/', null, 'login'],
    ['/login', null, 'allow'],
    ['/%E0%A4%A', 'EMPLOYEE', 'unauthorized'],
  ] as const)('%s as %s -> %s', (path, role, expected) => {
    expect(decidePageAccess(path, role).decision).toBe(expected);
  });

  it('normalises paths', () => {
    expect(normalizePath('/%70ayroll//')).toBe('/payroll');
    expect(normalizePath('/%E0%A4%A')).toBeNull();
  });
});

describe('proxy page gate', () => {
  const location = (response: Response) => new URL(response.headers.get('location') ?? '', 'http://localhost').pathname;

  it('sends a signed-out visitor to /login', async () => {
    const response = await proxy(await request('/payroll'));
    expect(response.status).toBe(307);
    expect(location(response)).toBe('/login');
  });

  it('sends a Recruiter opening /payroll to /error/unauthorized and audits it', async () => {
    const response = await proxy(await request('/payroll', 'RECRUITER'));
    expect(response.status).toBe(307);
    expect(location(response)).toBe('/error/unauthorized');
    expect(getRecentAccessEvents()[0]).toMatchObject({ userRole: 'RECRUITER', attemptedPage: 'PAYROLL' });
  });

  it('cannot be bypassed with an encoded path', async () => {
    const response = await proxy(await request('/%70ayroll', 'RECRUITER'));
    expect(location(response)).toBe('/error/unauthorized');
  });

  it('accepts a session bearer token as well as the cookie', async () => {
    const token = await signSession(getDemoUserByRole('RECRUITER'));
    const response = await proxy(await request('/payroll', undefined, { headers: { authorization: `Bearer ${token}` } }));
    expect(location(response)).toBe('/error/unauthorized');
  });

  it('lets an authorised role through', async () => {
    const response = await proxy(await request('/payroll', 'EMPLOYEE'));
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('rejects a forged cookie', async () => {
    const response = await proxy(await request('/payroll', undefined, { headers: { cookie: `${SESSION_COOKIE}=forged` } }));
    expect(location(response)).toBe('/login');
  });
});

describe('session-protected API routes', () => {
  it('GET /api/payroll: 401 without session, 403 for Recruiter, never trusts the client', async () => {
    expect((await getPayroll(await request('/api/payroll'))).status).toBe(401);
    expect((await getPayroll(await request('/api/payroll', 'RECRUITER'))).status).toBe(403);
    // a role header/query the client controls has no effect
    const spoofed = await request('/api/payroll?role=ADMIN', 'RECRUITER', { headers: { 'x-user-role': 'ADMIN' } });
    expect((await getPayroll(spoofed)).status).toBe(403);
    expect(getRecentAccessEvents().some((e) => e.userRole === 'RECRUITER' && e.attemptedPage === 'PAYROLL')).toBe(true);
  });

  it('GET /api/payroll: scope follows the role', async () => {
    const own = (await (await getPayroll(await request('/api/payroll', 'EMPLOYEE'))).json()).data;
    expect(own.scope).toBe('own');
    expect(own.rows).toEqual([]);
    expect(own.payslips).toHaveLength(6);
    expect(own.payslips.every((p: { employeeId: string }) => p.employeeId === 'user-employee')).toBe(true);

    const team = (await (await getPayroll(await request('/api/payroll', 'MANAGER'))).json()).data;
    expect(team.scope).toBe('team');
    expect(team.rows.map((r: { id: string }) => r.id).sort()).toEqual(['emp-karim', 'emp-lea', 'user-employee']);

    const all = (await (await getPayroll(await request('/api/payroll', 'RH_MANAGER'))).json()).data;
    expect(all.scope).toBe('all');
    expect(all.rows).toHaveLength(8);
  });

  it('GET /api/team: employees only get themselves, managers their team, HR everyone; recruiters are refused', async () => {
    const members = async (role: UserRole) => (await (await getTeam(await request('/api/team', role))).json()).data.members.map((m: { id: string }) => m.id);
    expect(await members('EMPLOYEE')).toEqual(['user-employee']);
    expect((await members('MANAGER')).sort()).toEqual(['emp-karim', 'emp-lea', 'user-employee', 'user-manager']);
    expect(await members('RH_MANAGER')).toHaveLength(8);
    expect((await getTeam(await request('/api/team', 'RECRUITER'))).status).toBe(403);
  });

  it('never exposes salaries through the team directory', async () => {
    const body = await (await getTeam(await request('/api/team', 'ADMIN'))).text();
    expect(body).not.toContain('annualGross');
  });

  it('GET /api/recruitment: refused for Employee, allowed for Manager', async () => {
    expect((await getRecruitment(await request('/api/recruitment', 'EMPLOYEE'))).status).toBe(403);
    expect((await getRecruitment(await request('/api/recruitment', 'MANAGER'))).status).toBe(200);
  });

  it('GET /api/audit/access-log: Admin only', async () => {
    expect((await getAccessLog(await request('/api/audit/access-log', 'RH_MANAGER'))).status).toBe(403);
    const response = await getAccessLog(await request('/api/audit/access-log', 'ADMIN'));
    expect(response.status).toBe(200);
    expect((await response.json()).data.events.some((e: { userRole: string }) => e.userRole === 'RH_MANAGER')).toBe(true);
  });

  it('POST /api/auth/check-permission answers for the session role, not the body', async () => {
    const post = async (role: UserRole | undefined, body: unknown) =>
      checkPermissionRoute(await request('/api/auth/check-permission', role, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));

    expect((await post(undefined, { page: 'PAYROLL', action: 'view' })).status).toBe(401);
    expect(await (await post('RECRUITER', { page: 'PAYROLL', action: 'view', userRole: 'ADMIN' })).json()).toMatchObject({ allowed: false });
    expect(await (await post('ADMIN', { page: 'SETTINGS', action: 'edit' })).json()).toEqual({ allowed: true });
    expect((await post('ADMIN', { page: 'NOPE', action: 'view' })).status).toBe(400);
    expect((await post('ADMIN', { page: 'PAYROLL', action: 'view\nFAKE' })).status).toBe(400);
  });
});

describe('demo login / logout', () => {
  const login = (userId: unknown) =>
    demoLogin(new NextRequest('http://localhost/api/auth/demo-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) }));

  it('sets an httpOnly, SameSite session cookie that verifies to the chosen account', async () => {
    const response = await login('user-recruiter');
    expect(response.status).toBe(200);
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain(`${SESSION_COOKIE}=`);
    expect(setCookie.toLowerCase()).toContain('httponly');
    expect(setCookie.toLowerCase()).toContain('samesite=lax');

    const token = /hr_session=([^;]+)/.exec(setCookie)?.[1];
    expect(await verifySession(token)).toEqual({ userId: 'user-recruiter', role: 'RECRUITER' });
  });

  it('rejects unknown accounts and can be disabled', async () => {
    expect((await login('user-root')).status).toBe(400);
    expect((await login(42)).status).toBe(400);

    process.env.DEMO_AUTH_ENABLED = 'false';
    try {
      expect((await login('user-admin')).status).toBe(404);
    } finally {
      delete process.env.DEMO_AUTH_ENABLED;
    }
  });

  it('logout clears the cookie', async () => {
    const setCookie = (await logout()).headers.get('set-cookie') ?? '';
    expect(setCookie).toContain(`${SESSION_COOKIE}=;`);
    expect(setCookie.toLowerCase()).toMatch(/max-age=0|expires=/);
  });
});

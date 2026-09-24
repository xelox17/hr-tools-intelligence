import type { User, UserRole } from './types';

/** One demo account per role. There are no passwords: this is a demo. */
export const DEMO_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Admin Lesaffre',
    email: 'admin@lesaffre.com',
    role: 'ADMIN',
    country: 'France',
    department: 'IT',
  },
  {
    id: 'user-rh-manager',
    name: 'Marie DuPont',
    email: 'marie@lesaffre.com',
    role: 'RH_MANAGER',
    country: 'France',
    department: 'HR',
  },
  {
    id: 'user-recruiter',
    name: 'Jean Recruiter',
    email: 'jean.recruiter@lesaffre.com',
    role: 'RECRUITER',
    country: 'France',
    department: 'Recruitment',
  },
  {
    id: 'user-manager',
    name: 'Sophie Manager',
    email: 'sophie@lesaffre.com',
    role: 'MANAGER',
    country: 'France',
    department: 'IT',
    teamId: 'team-it-1',
  },
  {
    id: 'user-employee',
    name: 'Thomas Employee',
    email: 'thomas@lesaffre.com',
    role: 'EMPLOYEE',
    country: 'France',
    department: 'IT',
    managerId: 'user-manager',
    teamId: 'team-it-1',
  },
];

export function getDemoUserById(id: string): User | undefined {
  return DEMO_USERS.find((user) => user.id === id);
}

export function getDemoUserByRole(role: UserRole): User {
  // Every role has exactly one demo account (enforced by the tests).
  return DEMO_USERS.find((user) => user.role === role) as User;
}

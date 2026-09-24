// Lesaffre HR Tools Portal — Human Resources applications only.
//
// A wider "Complete Applications Portal" (95+ apps across all 10 business
// categories — Collaboration, Finance, Sales, R&D, etc.) was built at one
// point, then reverted: this portal is meant for the whole ~6,000-employee
// workforce, and per the original documentation only HR tools belong here
// — Finance/Sales/GRC/etc. are internal tools for those specific teams, not
// something every employee needs surfaced.

export interface Application {
  id: string;
  title: string;
  category: string; // Always "Human Resources" here.
  subcategory?: string; // Recruitment, Learning, Corporate, Payroll
  scope?: "Corporate" | "Local" | "Both";
  country?: string;
  description: string;
  url: string;
  vendor?: string;
  implementationDate?: string;
  targetAudience?: string;
  status?: "Active" | "Planned" | "Deprecated";
}

export const applications: Application[] = [
  // RECRUITMENT (5)
  {
    id: "hr-rec-001",
    title: "Smart Recruiters",
    category: "Human Resources",
    subcategory: "Recruitment",
    scope: "Corporate",
    description: "ATS (Applicant Tracking System) - Manage entire recruitment process from sourcing to hiring",
    url: "https://www.smartrecruiters.com/account/sign-in",
    vendor: "SmartRecruiters",
    implementationDate: "2018",
    targetAudience: "Recruiters, Managers",
    status: "Active"
  },
  {
    id: "hr-rec-002",
    title: "WOO",
    category: "Human Resources",
    subcategory: "Recruitment",
    scope: "Corporate",
    description: "World Of Opportunities - Internal mobility platform for job postings and applications",
    url: "https://woo.lesaffre.com/coopters/sign_in",
    vendor: "Lesaffre Homemade",
    implementationDate: "2021",
    targetAudience: "Employees",
    status: "Active"
  },
  {
    id: "hr-rec-003",
    title: "NEST",
    category: "Human Resources",
    subcategory: "Recruitment",
    scope: "Corporate",
    description: "Onboarding platform - Provide newcomers with essential information and workflows",
    url: "https://lesaffre.apps.talmundo.com/",
    vendor: "Talmundo",
    implementationDate: "2022",
    targetAudience: "New Employees, HR",
    status: "Active"
  },
  {
    id: "hr-rec-004",
    title: "TAO",
    category: "Human Resources",
    subcategory: "Recruitment",
    scope: "Corporate",
    description: "Career Management - Annual reviews, skills management, and career path planning",
    url: "https://tao.lesaffre.com/",
    vendor: "NEOBRAIN",
    implementationDate: "2023",
    targetAudience: "White Collars, Managers",
    status: "Active"
  },
  {
    id: "hr-rec-005",
    title: "Travel Requests",
    category: "Human Resources",
    subcategory: "Recruitment",
    scope: "Corporate",
    description: "Travel request and approval management system",
    url: "https://apps.hirondelle.com/travel_requests",
    vendor: "Lesaffre Homemade",
    targetAudience: "Employees, Managers",
    status: "Active"
  },

  // LEARNING (4)
  {
    id: "hr-learn-001",
    title: "LEA",
    category: "Human Resources",
    subcategory: "Learning",
    scope: "Corporate",
    description: "Learning Management System (LMS) - E-learning platform for training content and courses",
    url: "https://lesaffre.eu.crossknowledge.com/interfaces/login.php",
    vendor: "CrossKnowledge",
    implementationDate: "2022",
    targetAudience: "Employees, Trainers",
    status: "Active"
  },
  {
    id: "hr-learn-002",
    title: "TIPI Group",
    category: "Human Resources",
    subcategory: "Learning",
    scope: "Corporate",
    description: "Training Portal - Centralize and standardize training management across the group",
    url: "https://tipi.lesaffre.app/",
    vendor: "Lesaffre Homemade",
    implementationDate: "2021",
    targetAudience: "All Employees, HR",
    status: "Active"
  },
  {
    id: "hr-learn-003",
    title: "TIPI L.int",
    category: "Human Resources",
    subcategory: "Learning",
    scope: "Local",
    description: "Local Training Portal - Training management for local sites",
    url: "https://apps.powerapps.com/play/e/default-4a949dba-72f4-4fa8-a3eb-6cce3fab9022/a/6fc59930-9165-47e7-bc1f-af1e28422b3a",
    vendor: "Power Apps",
    targetAudience: "All Employees",
    status: "Active"
  },
  {
    id: "hr-learn-004",
    title: "CTR",
    category: "Human Resources",
    subcategory: "Learning",
    scope: "Corporate",
    description: "Corporate Training Registration - Register for Institut Léon Lesaffre training sessions",
    url: "https://corporate-training-registration.lesaffre.com/",
    vendor: "Lesaffre Homemade",
    implementationDate: "2020",
    targetAudience: "All Employees, HR",
    status: "Active"
  },

  // CORPORATE (7)
  {
    id: "hr-corp-001",
    title: "LINK",
    category: "Human Resources",
    subcategory: "Corporate",
    scope: "Corporate",
    description: "Core HR Data Model - Central repository for all employee and organizational data",
    url: "https://link.lesaffre.com/",
    vendor: "Lesaffre HRIS",
    targetAudience: "HR Teams, Managers, Analytics",
    status: "Active"
  },
  {
    id: "hr-corp-002",
    title: "User Management Tool - HR",
    category: "Human Resources",
    subcategory: "Corporate",
    scope: "Corporate",
    description: "Access and Identity Management - Manage digital identities and access throughout employee lifecycle",
    url: "https://apps.powerapps.com/play/f9b107b8-46b1-403d-b33b-333aabdd9fdb",
    vendor: "Power Apps",
    implementationDate: "2019",
    targetAudience: "HR Teams",
    status: "Active"
  },
  {
    id: "hr-corp-003",
    title: "User Management Tool - Managers",
    category: "Human Resources",
    subcategory: "Corporate",
    scope: "Corporate",
    description: "Manager Access Control - Manage team member access and user provisioning",
    url: "https://apps.powerapps.com/play/7a59b748-91a8-4c9e-a968-f382a0cf4cd4",
    vendor: "Power Apps",
    implementationDate: "2019",
    targetAudience: "Managers",
    status: "Active"
  },
  {
    id: "hr-corp-004",
    title: "CSE",
    category: "Human Resources",
    subcategory: "Corporate",
    scope: "Corporate",
    description: "Employee Benefits Portal - Manage and consult employee benefits",
    url: "https://cselect.club-employes.com/login",
    vendor: "Club Employes",
    targetAudience: "All Employees",
    status: "Active"
  },
  {
    id: "hr-corp-005",
    title: "Bloomflow",
    category: "Human Resources",
    subcategory: "Corporate",
    scope: "Corporate",
    description: "Project Management Platform - Collaborate on HR projects and initiatives",
    url: "https://lesaffre.bloomflow.com/login",
    vendor: "Bloomflow",
    targetAudience: "HR Teams",
    status: "Active"
  },
  {
    id: "hr-corp-006",
    title: "Office 365",
    category: "Human Resources",
    subcategory: "Corporate",
    scope: "Corporate",
    description: "Microsoft Office Suite - Email, collaboration, and productivity tools",
    url: "https://www.office.com/",
    vendor: "Microsoft",
    targetAudience: "All Employees",
    status: "Active"
  },
  {
    id: "hr-corp-007",
    title: "Knowledge Center",
    category: "Human Resources",
    subcategory: "Corporate",
    scope: "Corporate",
    description: "Centralized Documentation - Access HR policies, procedures, and documentation",
    url: "https://knowledge-center.hirondelle.com/",
    vendor: "Lesaffre Homemade",
    targetAudience: "All Employees, HR",
    status: "Active"
  },

  // PAYROLL (7)
  {
    id: "hr-payroll-001",
    title: "Bonus",
    category: "Human Resources",
    subcategory: "Payroll",
    scope: "Corporate",
    description: "Bonus Management - Support annual bonus campaigns and approvals",
    url: "https://bonus.lesaffre.com/",
    vendor: "LINK Module",
    targetAudience: "HR, Managers",
    status: "Active"
  },
  {
    id: "hr-payroll-002",
    title: "MyBonus",
    category: "Human Resources",
    subcategory: "Payroll",
    scope: "Corporate",
    description: "Employee Bonus Portal - Participate in bonus campaigns and track results",
    url: "https://mybonus.lesaffre.com/users/sign_in",
    vendor: "LINK Module",
    targetAudience: "All Employees",
    status: "Active"
  },
  {
    id: "hr-payroll-003",
    title: "ADP",
    category: "Human Resources",
    subcategory: "Payroll",
    scope: "Corporate",
    description: "Payroll System - Process payroll and manage compensation",
    url: "https://mon.adp.com/redbox/",
    vendor: "ADP",
    targetAudience: "HR, Finance",
    status: "Active"
  },
  {
    id: "hr-payroll-004",
    title: "CONCUR",
    category: "Human Resources",
    subcategory: "Payroll",
    scope: "Corporate",
    description: "Expense Management - Submit and approve expense reports",
    url: "https://www.concursolutions.com/",
    vendor: "Concur",
    targetAudience: "All Employees",
    status: "Active"
  },
  {
    id: "hr-payroll-005",
    title: "Horoquartz",
    category: "Human Resources",
    subcategory: "Payroll",
    scope: "Corporate",
    description: "Time Tracking System - Log and track work hours",
    url: "https://lesaffre.cloud-horoquartz.fr/webquartz/ux/home",
    vendor: "Horoquartz",
    targetAudience: "All Employees",
    status: "Active"
  },
  {
    id: "hr-payroll-006",
    title: "Time Tracking System",
    category: "Human Resources",
    subcategory: "Payroll",
    scope: "Corporate",
    description: "Time Registration - Track employee time entries and attendance",
    url: "https://apps.hirondelle.com/tempspasse",
    vendor: "Lesaffre Homemade",
    targetAudience: "All Employees",
    status: "Active"
  },
  {
    id: "hr-payroll-007",
    title: "OODrive - CSP Paie",
    category: "Human Resources",
    subcategory: "Payroll",
    scope: "Corporate",
    description: "Payroll Documents Storage - Secure storage and access to payroll documents",
    url: "https://sharing.oodrive.com/auth/ws/lesaffre-csppaie",
    vendor: "OODrive",
    targetAudience: "HR, Finance",
    status: "Active"
  }
];

// HR sub-categories, in the order the filter buttons should appear.
export const hrSubcategories = ["Recruitment", "Learning", "Corporate", "Payroll"];

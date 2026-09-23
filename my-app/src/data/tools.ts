/**
 * Static tool catalog — mirrors the PDD's Data Model (section 6): Title,
 * Category, Scope, Country, Description, URL. In the target architecture
 * this is the SharePoint List "HR_Tools_Data_v1"; here it's just a static
 * array, per the PDD's MVP scope (no live data source yet).
 *
 * Category is the PDD's own Choice enum (section 6): Recruitment / Learning
 * / Corporate / Payroll / Local — this is deliberately not the old app's
 * richer taxonomy (HRIS, Onboarding, Time & Attendance, …), since the filter
 * buttons in section 4.1 are exactly these five plus "All".
 */

export type ToolCategory = "Recruitment" | "Learning" | "Corporate" | "Payroll" | "Local";
export type ToolScope = "Global" | "Local";

export interface CatalogTool {
  title: string;
  category: ToolCategory;
  scope: ToolScope;
  country: string;
  description: string;
  url: string;
}

export const CATEGORIES: readonly ToolCategory[] = ["Recruitment", "Learning", "Corporate", "Payroll", "Local"];

export const TOOLS: CatalogTool[] = [
  {
    title: "SuccessFactors",
    category: "Corporate",
    scope: "Global",
    country: "Global",
    description: "Talent management platform",
    url: "https://www.sap.com/products/hcm.html",
  },
  {
    title: "Workday",
    category: "Corporate",
    scope: "Global",
    country: "Global",
    description: "Cloud HR platform for workforce planning, compensation and analytics",
    url: "https://www.workday.com",
  },
  {
    title: "LinkedIn Recruiter",
    category: "Recruitment",
    scope: "Global",
    country: "Global",
    description: "Sourcing and outreach platform",
    url: "https://business.linkedin.com/talent-solutions/recruiter",
  },
  {
    title: "Cornerstone LMS",
    category: "Learning",
    scope: "Global",
    country: "Global",
    description: "Learning management system for training and compliance",
    url: "https://www.cornerstoneondemand.com",
  },
  {
    title: "ADP France",
    category: "Payroll",
    scope: "Local",
    country: "France",
    description: "Payroll processing and legal compliance for France",
    url: "https://www.adp.fr",
  },
  {
    title: "Microsoft Teams",
    category: "Corporate",
    scope: "Global",
    country: "Global",
    description: "Collaboration hub for HR announcements and meetings",
    url: "https://www.microsoft.com/microsoft-teams",
  },
  {
    title: "Kelio",
    category: "Local",
    scope: "Local",
    country: "France",
    description: "Time tracking and scheduling for French sites",
    url: "https://www.kelio.com",
  },
  {
    title: "Glassdoor",
    category: "Recruitment",
    scope: "Global",
    country: "Global",
    description: "Employer branding and review monitoring",
    url: "https://www.glassdoor.com/employers",
  },
  {
    title: "SAP SF Onboarding",
    category: "Corporate",
    scope: "Global",
    country: "Global",
    description: "Structured onboarding journeys for new joiners",
    url: "https://www.sap.com/products/hcm/onboarding-software.html",
  },
  {
    title: "PayFit",
    category: "Payroll",
    scope: "Local",
    country: "France",
    description: "Simplified payroll and leave management",
    url: "https://payfit.com",
  },
];

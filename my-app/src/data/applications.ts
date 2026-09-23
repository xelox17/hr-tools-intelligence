// Complete Lesaffre Applications Inventory - All 95+ Applications
// Categories: HR (21), Collaboration (9), Communication (5), Digital (16), Finance (8), GRC (10), Production (5), R&D (11), Sales (9), Workplace (1)

export interface Application {
  id: string;
  title: string;
  category: string; // Parent category
  subcategory?: string; // HR-specific: Recruitment, Learning, Corporate, Payroll
  scope?: "Corporate" | "Local" | "Both"; // HR-specific
  country?: string;
  description: string;
  url: string;
  vendor?: string;
  implementationDate?: string;
  targetAudience?: string;
  status?: "Active" | "Planned" | "Deprecated";
}

export const applications: Application[] = [
  // ============================================
  // HUMAN RESOURCES (21 applications)
  // ============================================

  // HR - RECRUITMENT (5)
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

  // HR - LEARNING (4)
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

  // HR - CORPORATE (7)
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

  // HR - PAYROLL (7)
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
  },

  // ============================================
  // COLLABORATION (9 applications)
  // ============================================
  {
    id: "collab-001",
    title: "Bloomflow",
    category: "Collaboration",
    description: "Project Management and collaboration platform",
    url: "https://lesaffre.bloomflow.com/login",
    vendor: "Bloomflow",
    status: "Active"
  },
  {
    id: "collab-002",
    title: "Covoiturage",
    category: "Collaboration",
    description: "Carpooling Platform - Find colleagues for carpooling",
    url: "https://lesaffregroup.sharepoint.com/sites/pulse-CampusLesaffre/SitePages/Car-pooling.aspx",
    vendor: "SharePoint",
    status: "Active"
  },
  {
    id: "collab-003",
    title: "FromSmash",
    category: "Collaboration",
    description: "Large File Sharing - Share and transfer large files securely",
    url: "https://lesaffre.fromsmash.com/",
    vendor: "FromSmash",
    status: "Active"
  },
  {
    id: "collab-004",
    title: "Gate",
    category: "Collaboration",
    description: "Employee Portal Gateway - Central access point for applications",
    url: "https://gate.hirondelle.com/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "collab-005",
    title: "Kaltura",
    category: "Collaboration",
    description: "Video Platform - Record, share, and manage video content",
    url: "https://video.lesaffre.com/",
    vendor: "Kaltura",
    status: "Active"
  },
  {
    id: "collab-006",
    title: "Klaxoon",
    category: "Collaboration",
    description: "Training and Survey Platform - Create interactive training and polls",
    url: "https://lesaffregroup.sharepoint.com/:l:/s/KlaxoonBestpractices/FIJVt4bdS2VGiD6WO1qEJxABF83AgDDd3LWGgSjkV3UFRQ",
    vendor: "Klaxoon",
    status: "Active"
  },
  {
    id: "collab-007",
    title: "Knowledge Center",
    category: "Collaboration",
    description: "Documentation and Knowledge Base",
    url: "https://knowledge-center.hirondelle.com/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "collab-008",
    title: "Office 365",
    category: "Collaboration",
    description: "Microsoft Collaboration Suite - Teams, SharePoint, Outlook",
    url: "https://www.office.com/",
    vendor: "Microsoft",
    status: "Active"
  },
  {
    id: "collab-009",
    title: "Projection",
    category: "Collaboration",
    description: "Strategic Planning and Roadmap Management",
    url: "https://lesaffregroup.sharepoint.com/sites/Projection2.0/SitePages/Home.aspx",
    vendor: "SharePoint",
    status: "Active"
  },

  // ============================================
  // COMMUNICATION (5 applications)
  // ============================================
  {
    id: "comm-001",
    title: "Amazing Content",
    category: "Communication",
    description: "Content Management - Create and manage content",
    url: "https://app.amazingcontent.io/",
    vendor: "Amazing Content",
    status: "Active"
  },
  {
    id: "comm-002",
    title: "Keepeek",
    category: "Communication",
    description: "Media Library - Centralized asset and media management",
    url: "https://medialibrary.lesaffre.com/lesaffre",
    vendor: "Keepeek",
    status: "Active"
  },
  {
    id: "comm-003",
    title: "Mailjet",
    category: "Communication",
    description: "Email Marketing - Send email campaigns and newsletters",
    url: "https://app.mailjet.com/saml/signin_with_sso",
    vendor: "Mailjet",
    status: "Active"
  },
  {
    id: "comm-004",
    title: "NameShield",
    category: "Communication",
    description: "Brand Protection - Monitor and protect brand reputation online",
    url: "https://lesaffre.secure.nameshield.net/",
    vendor: "NameShield",
    status: "Active"
  },
  {
    id: "comm-005",
    title: "Radarly",
    category: "Communication",
    description: "Social Listening - Monitor brand mentions and sentiment",
    url: "https://radarly.linkfluence.com/",
    vendor: "Linkfluence",
    status: "Active"
  },

  // ============================================
  // DIGITAL & TECHNOLOGY (16 applications)
  // ============================================
  {
    id: "digital-001",
    title: "LesaffreGPT",
    category: "Digital & Technology",
    description: "AI Assistant - Internal AI-powered assistance for employees",
    url: "https://gpt.lesaffre.app/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "digital-002",
    title: "Akeneo",
    category: "Digital & Technology",
    description: "Product Information Management - Manage product data and catalogs",
    url: "https://lesaffre-prod.cloud.akeneo.com/",
    vendor: "Akeneo",
    status: "Active"
  },
  {
    id: "digital-003",
    title: "Beamy",
    category: "Digital & Technology",
    description: "Analytics Platform - Data analysis and visualization",
    url: "https://app.beamy.io/",
    vendor: "Beamy",
    status: "Active"
  },
  {
    id: "digital-004",
    title: "Ciso Assistant",
    category: "Digital & Technology",
    description: "Security Governance - Manage security policies and compliance",
    url: "https://lesaffre.ciso-assistant.com/",
    vendor: "CISO Assistant",
    status: "Active"
  },
  {
    id: "digital-005",
    title: "EBX",
    category: "Digital & Technology",
    description: "Master Data Management - Manage reference data and entities",
    url: "https://polaris.hirondelle.com/lesaffreReferencesModule/saml/dologin.jsp",
    vendor: "Orchestra Networks",
    status: "Active"
  },
  {
    id: "digital-006",
    title: "Email Quarantine",
    category: "Digital & Technology",
    description: "Email Security - Manage quarantined and suspected emails",
    url: "https://dh897-euq1.c3s2.iphmx.com/login",
    vendor: "IPHMX",
    status: "Active"
  },
  {
    id: "digital-007",
    title: "Excalidraw",
    category: "Digital & Technology",
    description: "Diagramming Tool - Create diagrams and sketches",
    url: "https://excalidraw.lesaffre.com/",
    vendor: "Excalidraw",
    status: "Active"
  },
  {
    id: "digital-008",
    title: "MetaCompliance",
    category: "Digital & Technology",
    description: "Compliance Management - Track regulatory compliance",
    url: "https://lesaffre.metacompliance.com/",
    vendor: "MetaCompliance",
    status: "Active"
  },
  {
    id: "digital-009",
    title: "SAP Analytics Cloud",
    category: "Digital & Technology",
    description: "Business Intelligence - Create dashboards and analytics",
    url: "https://lesaffre-1.eu10.hcs.cloud.sap/",
    vendor: "SAP",
    status: "Active"
  },
  {
    id: "digital-010",
    title: "SAP Business Objects",
    category: "Digital & Technology",
    description: "Reporting Tool - Create business reports and analytics",
    url: "https://sapboprd.lesaffre.fr:8443/BOE/BI",
    vendor: "SAP",
    status: "Active"
  },
  {
    id: "digital-011",
    title: "SAP Support Management",
    category: "Digital & Technology",
    description: "IT Ticketing System - Manage IT support requests",
    url: "https://flpnwc-j9e4tzvu7t.dispatcher.hana.ondemand.com/",
    vendor: "SAP",
    status: "Active"
  },
  {
    id: "digital-012",
    title: "Semarchy",
    category: "Digital & Technology",
    description: "Master Data Management - Unified data governance",
    url: "https://prod.mdm.lesaffre.app/login.do",
    vendor: "Semarchy",
    status: "Active"
  },
  {
    id: "digital-013",
    title: "Smoteo",
    category: "Digital & Technology",
    description: "System Monitoring - Monitor infrastructure and applications",
    url: "https://lesaffre.smoteo.com/",
    vendor: "Smoteo",
    status: "Active"
  },
  {
    id: "digital-014",
    title: "UiPATH",
    category: "Digital & Technology",
    description: "Robotic Process Automation - Automate business processes",
    url: "https://cloud.uipath.com/lesaffregroup/portal_/home",
    vendor: "UiPath",
    status: "Active"
  },
  {
    id: "digital-015",
    title: "WebSesame",
    category: "Digital & Technology",
    description: "Access Control - Physical and logical access management",
    url: "https://websesame.lesaffre.fr:444/login",
    vendor: "Sesame Software",
    status: "Active"
  },
  {
    id: "digital-016",
    title: "WhiteBoard",
    category: "Digital & Technology",
    description: "Collaborative Whiteboarding - Digital whiteboard for team collaboration",
    url: "https://whiteboard.cloud.microsoft/",
    vendor: "Microsoft",
    status: "Active"
  },

  // ============================================
  // FINANCE (8 applications)
  // ============================================
  {
    id: "finance-001",
    title: "Cegid",
    category: "Finance",
    description: "Tax Management - Manage tax compliance and reporting",
    url: "https://tax.cegid.com/TaxWeb/#/",
    vendor: "Cegid",
    status: "Active"
  },
  {
    id: "finance-002",
    title: "Diapason",
    category: "Finance",
    description: "Treasury Management - Manage cash and liquidity",
    url: "https://mytcloud.diapason-treasury.com/rhapsodymytcloudprod/index.html#/main",
    vendor: "Diapason Treasury",
    status: "Active"
  },
  {
    id: "finance-003",
    title: "Horizon",
    category: "Finance",
    description: "Financial Planning - Budget and financial forecasting",
    url: "https://horizon.hirondelle.com/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "finance-004",
    title: "IFRS16",
    category: "Finance",
    description: "Accounting Standards - IFRS16 lease accounting compliance",
    url: "https://us1a.app.anaplan.com/frontdoor/saml/LesaffreAzureAD",
    vendor: "Anaplan",
    status: "Active"
  },
  {
    id: "finance-005",
    title: "P2P",
    category: "Finance",
    description: "Procure-to-Pay - Procurement and invoice processing",
    url: "https://flpnwc-j9e4tzvu7t.dispatcher.hana.ondemand.com/sites#Shell-home",
    vendor: "SAP",
    status: "Active"
  },
  {
    id: "finance-006",
    title: "Pigment",
    category: "Finance",
    description: "Financial Planning & Analysis - FP&A platform",
    url: "https://pigment.app/login",
    vendor: "Pigment",
    status: "Active"
  },
  {
    id: "finance-007",
    title: "SIS-DIS",
    category: "Finance",
    description: "Financial Reporting - Automated reporting and consolidation",
    url: "https://auth.sis-id.com/auth/realms/my-sis-id/protocol/openid-connect/auth",
    vendor: "SIS",
    status: "Active"
  },
  {
    id: "finance-008",
    title: "Titan",
    category: "Finance",
    description: "Finance Management - Comprehensive financial management",
    url: "https://lesaffre.3vfinance.com/",
    vendor: "3V Finance",
    status: "Active"
  },

  // ============================================
  // GRC + LEGAL + INTERNAL AUDIT (10)
  // ============================================
  {
    id: "grc-001",
    title: "Adequacy",
    category: "GRC + Legal",
    description: "GDPR Management - Data privacy and GDPR compliance",
    url: "https://lesaffredataprivacy.adequacy-corporate.com/dashboard/",
    vendor: "Adequacy",
    status: "Active"
  },
  {
    id: "grc-002",
    title: "Alissia",
    category: "GRC + Legal",
    description: "Trademark Management - Manage intellectual property and trademarks",
    url: "https://lesaffre.alissia.software/",
    vendor: "Alissia",
    status: "Active"
  },
  {
    id: "grc-003",
    title: "Datalizr",
    category: "GRC + Legal",
    description: "Risk Management - Identify and manage enterprise risks",
    url: "https://lesaffre.datalizr.cloud/",
    vendor: "Datalizr",
    status: "Active"
  },
  {
    id: "grc-004",
    title: "Docusign",
    category: "GRC + Legal",
    description: "Electronic Signatures - Legally binding e-signatures",
    url: "https://www.docusign.com/",
    vendor: "Docusign",
    status: "Active"
  },
  {
    id: "grc-005",
    title: "EQS Integrity Hub",
    category: "GRC + Legal",
    description: "Policy Management - Centralized policy and compliance tracking",
    url: "https://lesaffre.integrityhub.app/",
    vendor: "EQS Group",
    status: "Active"
  },
  {
    id: "grc-006",
    title: "EQS Integrity Line",
    category: "GRC + Legal",
    description: "Whistleblowing Platform - Anonymous reporting and investigations",
    url: "https://lesaffre.integrityline.app/",
    vendor: "EQS Group",
    status: "Active"
  },
  {
    id: "grc-007",
    title: "GAN Integrity",
    category: "GRC + Legal",
    description: "Third-Party Due Diligence - Vendor and supplier compliance checks",
    url: "https://lesaffre.gan-compliance.com/",
    vendor: "GAN",
    status: "Active"
  },
  {
    id: "grc-008",
    title: "KLEA",
    category: "GRC + Legal",
    description: "Entity Management - Corporate structure and governance",
    url: "https://login.legalstudio.be/",
    vendor: "Legal Studio",
    status: "Active"
  },
  {
    id: "grc-009",
    title: "Legisway",
    category: "GRC + Legal",
    description: "Contract Management - CLM and contract lifecycle management",
    url: "https://clm.enterprise.legisway.com/",
    vendor: "Legisway",
    status: "Active"
  },
  {
    id: "grc-010",
    title: "OneData",
    category: "GRC + Legal",
    description: "Data Management - CSA and data governance platform",
    url: "https://onedata.lesaffre.com/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },

  // ============================================
  // PRODUCTION & OPERATIONS (5)
  // ============================================
  {
    id: "prod-001",
    title: "Ariba",
    category: "Production & Operations",
    description: "Procurement Platform - Supplier management and purchasing",
    url: "https://lesaffre.sourcing-eu.ariba.com/",
    vendor: "SAP Ariba",
    status: "Active"
  },
  {
    id: "prod-002",
    title: "Golden Recipe",
    category: "Production & Operations",
    description: "Recipe Management - Formula and recipe management system",
    url: "https://golden-recipe.lesaffre.app/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "prod-003",
    title: "Icare",
    category: "Production & Operations",
    description: "Quality Assurance - Quality management and testing system",
    url: "https://icare.lesaffre.app/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "prod-004",
    title: "OT Systems Monitoring",
    category: "Production & Operations",
    description: "Infrastructure Monitoring - Operational technology monitoring",
    url: "https://lesaffre-group.customers.eu1.vantage.nozominetworks.io/",
    vendor: "Nozomi Networks",
    status: "Active"
  },
  {
    id: "prod-005",
    title: "QAD Dynasys",
    category: "Production & Operations",
    description: "ERP System - Enterprise resource planning for manufacturing",
    url: "https://lesaffre.qad.com/DSCP/login",
    vendor: "QAD",
    status: "Active"
  },

  // ============================================
  // R&D & INNOVATION (11)
  // ============================================
  {
    id: "rnd-001",
    title: "AskGed",
    category: "R&D & Innovation",
    description: "Knowledge Base - Scientific and technical documentation",
    url: "https://knowledge-center.hirondelle.com/default/askged.aspx",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "rnd-002",
    title: "Benchling",
    category: "R&D & Innovation",
    description: "Lab Notebook - Digital lab notebook for research",
    url: "https://benchling.com/signin/welcome",
    vendor: "Benchling",
    status: "Active"
  },
  {
    id: "rnd-003",
    title: "Cassidy",
    category: "R&D & Innovation",
    description: "Project Management - R&D project tracking",
    url: "https://cassidy.lesaffre.app/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "rnd-004",
    title: "Interlabo",
    category: "R&D & Innovation",
    description: "Lab Management - Laboratory information management system",
    url: "https://interlabo-app.lesaffre.app/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "rnd-005",
    title: "LIP",
    category: "R&D & Innovation",
    description: "Project Management - R&D project and portfolio management",
    url: "https://lip.hirondelle.com/OpcenterRDnL",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "rnd-006",
    title: "MawgiMix",
    category: "R&D & Innovation",
    description: "Formula Management - Recipe and formula development",
    url: "https://mawgi-mix.lesaffre.app/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "rnd-007",
    title: "Mummi",
    category: "R&D & Innovation",
    description: "Data Management - Research data management",
    url: "https://mummi-front.lesaffre.app/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "rnd-008",
    title: "Predict",
    category: "R&D & Innovation",
    description: "Predictive Analytics - Machine learning and predictions",
    url: "https://predict.lesaffre.app/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "rnd-009",
    title: "SmartCat",
    category: "R&D & Innovation",
    description: "Translation Platform - Professional translation management",
    url: "https://smartcat.com/sign-in?land=eu_20523808",
    vendor: "SmartCat",
    status: "Active"
  },
  {
    id: "rnd-010",
    title: "ThermoResistanceSpores",
    category: "R&D & Innovation",
    description: "Testing System - Spore resistance testing and data",
    url: "https://thermoresistance-spores-bscu1.lesaffre.app/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "rnd-011",
    title: "Uncountable",
    category: "R&D & Innovation",
    description: "Lab Notebook - Research data and experiment management",
    url: "https://appovhfr.uncountable.com/signin",
    vendor: "Uncountable",
    status: "Active"
  },

  // ============================================
  // SALES & BUSINESS DEVELOPMENT (9)
  // ============================================
  {
    id: "sales-001",
    title: "Ariane",
    category: "Sales & Business Development",
    description: "CRM System - Phileo customer relationship management",
    url: "https://ariane.phileo-lesaffre.com/login",
    vendor: "Lesaffre Phileo",
    status: "Active"
  },
  {
    id: "sales-002",
    title: "BAMARETO",
    category: "Sales & Business Development",
    description: "Marketing Platform - Campaign and marketing management",
    url: "https://bamareto.lesaffre.com/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "sales-003",
    title: "Brandfolder",
    category: "Sales & Business Development",
    description: "Asset Management - Brand asset and marketing material library",
    url: "https://brandfolder.com/signin/",
    vendor: "Brandfolder",
    status: "Active"
  },
  {
    id: "sales-004",
    title: "C4C",
    category: "Sales & Business Development",
    description: "CRM System - Customer relationship management",
    url: "https://my317549-sso.crm.ondemand.com/",
    vendor: "SAP C4C",
    status: "Active"
  },
  {
    id: "sales-005",
    title: "MarketInsights",
    category: "Sales & Business Development",
    description: "Market Analytics - Market data and insights",
    url: "https://apps.hirondelle.com/market_insight",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "sales-006",
    title: "Polynom",
    category: "Sales & Business Development",
    description: "CPQ System - Configure, Price, Quote system",
    url: "https://pr0c3lys-cpq.pripolis.polynom.io/cpq",
    vendor: "Polynom",
    status: "Active"
  },
  {
    id: "sales-007",
    title: "SAF-Force",
    category: "Sales & Business Development",
    description: "CRM System - Salesforce for sales management",
    url: "https://lesaffregroup.my.salesforce.com/",
    vendor: "Salesforce",
    status: "Active"
  },
  {
    id: "sales-008",
    title: "Soco",
    category: "Sales & Business Development",
    description: "Order Management - Sales order and fulfillment",
    url: "https://soco.lesaffre.com/",
    vendor: "Lesaffre Homemade",
    status: "Active"
  },
  {
    id: "sales-009",
    title: "Star",
    category: "Sales & Business Development",
    description: "Analytics Platform - Sales analytics and reporting",
    url: "https://bi.lesaffre.fr/BOE/BI",
    vendor: "SAP Business Objects",
    status: "Active"
  },

  // ============================================
  // WORKPLACE & SUPPORT (1)
  // ============================================
  {
    id: "workplace-001",
    title: "Workplace Help Center",
    category: "Workplace & Support",
    description: "IT Help Desk - Technical support and assistance",
    url: "https://lesaffregroup.sharepoint.com/sites/pulse-helpcenter",
    vendor: "SharePoint",
    status: "Active"
  }
];

// Category metadata for filtering
export const categories = [
  "Human Resources",
  "Collaboration",
  "Communication",
  "Digital & Technology",
  "Finance",
  "GRC + Legal",
  "Production & Operations",
  "R&D & Innovation",
  "Sales & Business Development",
  "Workplace & Support"
];

// HR Sub-categories (for HR applications only)
export const hrSubcategories = [
  "Recruitment",
  "Learning",
  "Corporate",
  "Payroll"
];

import type { LanguageCode } from "@/lib/i18n/translations";

/**
 * `Application.description` in data/applications.ts is English-only (the
 * PDD's source data). Titles and vendors are proper nouns and stay as-is
 * across languages; only the description is translated here, keyed by
 * `Application.id` so the 3 country-specific TIPI L.int rows (same text,
 * different `id`) each get an entry.
 */
export const APPLICATION_DESCRIPTIONS: Record<string, Record<LanguageCode, string>> = {
  "hr-rec-001": {
    en: "ATS (Applicant Tracking System) - Manage entire recruitment process from sourcing to hiring",
    fr: "ATS (système de suivi des candidatures) - Gère tout le processus de recrutement, du sourcing à l'embauche",
    es: "ATS (sistema de seguimiento de candidatos) - Gestiona todo el proceso de contratación, desde la búsqueda hasta la contratación",
  },
  "hr-rec-002": {
    en: "World Of Opportunities - Internal mobility platform for job postings and applications",
    fr: "World Of Opportunities - Plateforme de mobilité interne pour les offres d'emploi et candidatures",
    es: "World Of Opportunities - Plataforma de movilidad interna para ofertas de empleo y candidaturas",
  },
  "hr-rec-003": {
    en: "Onboarding platform - Provide newcomers with essential information and workflows",
    fr: "Plateforme d'intégration - Fournit aux nouveaux arrivants les informations et processus essentiels",
    es: "Plataforma de incorporación - Proporciona a los nuevos empleados la información y los procesos esenciales",
  },
  "hr-rec-004": {
    en: "Career Management - Annual reviews, skills management, and career path planning",
    fr: "Gestion de carrière - Entretiens annuels, gestion des compétences et plans de carrière",
    es: "Gestión de carrera - Evaluaciones anuales, gestión de competencias y planes de carrera",
  },
  "hr-rec-005": {
    en: "Travel request and approval management system",
    fr: "Système de gestion des demandes et approbations de déplacement",
    es: "Sistema de gestión de solicitudes y aprobaciones de viaje",
  },
  "hr-learn-001": {
    en: "Learning Management System (LMS) - E-learning platform for training content and courses",
    fr: "Système de gestion de l'apprentissage (LMS) - Plateforme e-learning pour les contenus et cours de formation",
    es: "Sistema de gestión del aprendizaje (LMS) - Plataforma de e-learning para contenidos y cursos de formación",
  },
  "hr-learn-002": {
    en: "Training Portal - Centralize and standardize training management across the group",
    fr: "Portail de formation - Centralise et standardise la gestion de la formation dans tout le groupe",
    es: "Portal de formación - Centraliza y estandariza la gestión de la formación en todo el grupo",
  },
  "hr-learn-003": {
    en: "Local Training Portal - Training management for local sites",
    fr: "Portail de formation local - Gestion de la formation pour les sites locaux",
    es: "Portal de formación local - Gestión de la formación para los sitios locales",
  },
  "hr-learn-004": {
    en: "Corporate Training Registration - Register for Institut Léon Lesaffre training sessions",
    fr: "Inscription aux formations groupe - S'inscrire aux sessions de formation de l'Institut Léon Lesaffre",
    es: "Registro de formación corporativa - Inscribirse en las sesiones de formación del Instituto Léon Lesaffre",
  },
  "hr-learn-005": {
    en: "Local Training Portal - Training management for local sites",
    fr: "Portail de formation local - Gestion de la formation pour les sites locaux",
    es: "Portal de formación local - Gestión de la formación para los sitios locales",
  },
  "hr-learn-006": {
    en: "Local Training Portal - Training management for local sites",
    fr: "Portail de formation local - Gestion de la formation pour les sites locaux",
    es: "Portal de formación local - Gestión de la formación para los sitios locales",
  },
  "hr-learn-007": {
    en: "Local Training Portal - Training management for local sites",
    fr: "Portail de formation local - Gestion de la formation pour les sites locaux",
    es: "Portal de formación local - Gestión de la formación para los sitios locales",
  },
  "hr-corp-001": {
    en: "Core HR Data Model - Central repository for all employee and organizational data",
    fr: "Modèle central des données RH - Référentiel central de toutes les données employés et organisationnelles",
    es: "Modelo central de datos de RR. HH. - Repositorio central de todos los datos de empleados y organizativos",
  },
  "hr-corp-002": {
    en: "Access and Identity Management - Manage digital identities and access throughout employee lifecycle",
    fr: "Gestion des accès et des identités - Gère les identités numériques et les accès tout au long du cycle de vie de l'employé",
    es: "Gestión de accesos e identidades - Gestiona las identidades digitales y los accesos durante todo el ciclo de vida del empleado",
  },
  "hr-corp-003": {
    en: "Manager Access Control - Manage team member access and user provisioning",
    fr: "Contrôle d'accès managers - Gère les accès des membres de l'équipe et le provisionnement des utilisateurs",
    es: "Control de acceso de gerentes - Gestiona los accesos de los miembros del equipo y el aprovisionamiento de usuarios",
  },
  "hr-corp-004": {
    en: "Employee Benefits Portal - Manage and consult employee benefits",
    fr: "Portail des avantages salariés - Gère et consulte les avantages des employés",
    es: "Portal de beneficios para empleados - Gestiona y consulta los beneficios de los empleados",
  },
  "hr-corp-005": {
    en: "Project Management Platform - Collaborate on HR projects and initiatives",
    fr: "Plateforme de gestion de projets - Collaborez sur les projets et initiatives RH",
    es: "Plataforma de gestión de proyectos - Colabore en proyectos e iniciativas de RR. HH.",
  },
  "hr-corp-006": {
    en: "Microsoft Office Suite - Email, collaboration, and productivity tools",
    fr: "Suite Microsoft Office - Email, collaboration et outils de productivité",
    es: "Suite de Microsoft Office - Correo electrónico, colaboración y herramientas de productividad",
  },
  "hr-corp-007": {
    en: "Centralized Documentation - Access HR policies, procedures, and documentation",
    fr: "Documentation centralisée - Accédez aux politiques, procédures et documentation RH",
    es: "Documentación centralizada - Acceda a las políticas, procedimientos y documentación de RR. HH.",
  },
  "hr-payroll-001": {
    en: "Bonus Management - Support annual bonus campaigns and approvals",
    fr: "Gestion des bonus - Soutient les campagnes annuelles de bonus et leurs approbations",
    es: "Gestión de bonificaciones - Apoya las campañas anuales de bonificaciones y sus aprobaciones",
  },
  "hr-payroll-002": {
    en: "Employee Bonus Portal - Participate in bonus campaigns and track results",
    fr: "Portail de bonus employé - Participez aux campagnes de bonus et suivez les résultats",
    es: "Portal de bonificaciones para empleados - Participe en las campañas de bonificaciones y siga los resultados",
  },
  "hr-payroll-003": {
    en: "Payroll System - Process payroll and manage compensation",
    fr: "Système de paie - Traite la paie et gère la rémunération",
    es: "Sistema de nómina - Procesa la nómina y gestiona la remuneración",
  },
  "hr-payroll-004": {
    en: "Expense Management - Submit and approve expense reports",
    fr: "Gestion des notes de frais - Soumettez et approuvez les notes de frais",
    es: "Gestión de gastos - Envíe y apruebe informes de gastos",
  },
  "hr-payroll-005": {
    en: "Time Tracking System - Log and track work hours",
    fr: "Système de suivi du temps - Enregistre et suit les heures de travail",
    es: "Sistema de control de horario - Registra y realiza el seguimiento de las horas de trabajo",
  },
  "hr-payroll-006": {
    en: "Time Registration - Track employee time entries and attendance",
    fr: "Enregistrement du temps de travail - Suit les entrées de temps et la présence des employés",
    es: "Registro de tiempo - Realiza el seguimiento de las entradas de tiempo y la asistencia de los empleados",
  },
  "hr-payroll-007": {
    en: "Payroll Documents Storage - Secure storage and access to payroll documents",
    fr: "Stockage des documents de paie - Stockage sécurisé et accès aux documents de paie",
    es: "Almacenamiento de documentos de nómina - Almacenamiento seguro y acceso a los documentos de nómina",
  },
};

/** Falls back to the raw (English) `Application.description` for any id/tool the dictionary above doesn't cover (e.g. an Admin-added custom tool). */
export function translateAppDescription(id: string, fallback: string, language: LanguageCode): string {
  return APPLICATION_DESCRIPTIONS[id]?.[language] ?? fallback;
}

export type LanguageCode = "fr" | "en" | "es";

export const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "FR" },
  { code: "en", label: "English", flag: "EN" },
  { code: "es", label: "Español", flag: "ES" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "fr";

// Flat key → { fr, en, es } dictionary. Covers the highest-traffic, most
// visible strings (nav, home, catalog, chat, login) rather than every string
// in the app — the Admin screen (ADMIN-only, low traffic) stays French-only
// for now; see the UX doc's "Feuille de route immédiate" section for scope.
export const translations: Record<string, Record<LanguageCode, string>> = {
  // Navigation
  "nav.home": { fr: "Accueil", en: "Home", es: "Inicio" },
  "nav.catalog": { fr: "Catalogue", en: "Catalog", es: "Catálogo" },
  "nav.aiAssistant": { fr: "Assistant IA", en: "AI Assistant", es: "Asistente IA" },
  "nav.admin": { fr: "Admin", en: "Admin", es: "Admin" },

  // Login
  "login.title": { fr: "Connexion au portail RH", en: "Sign in to the HR portal", es: "Acceder al portal de RR. HH." },
  "login.subtitle": {
    fr: "Mode démo : choisissez un compte pour explorer le catalogue d'outils. Aucun mot de passe requis ici ; en production, la connexion passera par le SSO de l'entreprise.",
    en: "Demo mode: pick an account to explore the tool catalog. No password is needed here; in production, sign-in goes through the company SSO.",
    es: "Modo demo: elija una cuenta para explorar el catálogo de herramientas. No se necesita contraseña aquí; en producción, el acceso pasará por el SSO de la empresa.",
  },
  "login.currentlySignedIn": { fr: "Actuellement connecté en tant que", en: "Currently signed in as", es: "Actualmente conectado como" },
  "login.signInAs": { fr: "Se connecter en tant que", en: "Sign in as", es: "Acceder como" },
  "login.signingIn": { fr: "Connexion…", en: "Signing in…", es: "Accediendo…" },
  "login.signInFailed": { fr: "Échec de la connexion :", en: "Sign-in failed:", es: "Error al acceder:" },
  "login.signInUnavailable": {
    fr: "La connexion est momentanément indisponible. Réessayez plus tard.",
    en: "Sign-in is unavailable right now. Please try again later.",
    es: "El acceso no está disponible en este momento. Inténtelo más tarde.",
  },

  // Home
  "home.hero.welcome": { fr: "Bienvenue, {{name}} !", en: "Welcome, {{name}}!", es: "¡Bienvenido/a, {{name}}!" },
  "home.hero.welcomeGeneric": { fr: "Bienvenue au portail RH Lesaffre", en: "Welcome to the Lesaffre HR portal", es: "Bienvenido/a al portal de RR. HH. de Lesaffre" },
  "home.hero.openAssistant": { fr: "Ouvrir l'assistant RH", en: "Open the HR assistant", es: "Abrir el asistente de RR. HH." },
  "home.hero.viewCatalog": { fr: "Voir le catalogue", en: "View the catalog", es: "Ver el catálogo" },
  "home.quickAccess.heading": { fr: "Accès rapide", en: "Quick access", es: "Acceso rápido" },
  "home.quickAccess.aiTitle": { fr: "Assistant RH IA", en: "AI HR Assistant", es: "Asistente de RR. HH. con IA" },
  "home.quickAccess.aiDesc": { fr: "Posez vos questions RH à tout moment (mode démo).", en: "Ask your HR questions anytime (demo mode).", es: "Haga sus preguntas de RR. HH. en cualquier momento (modo demo)." },
  "home.quickAccess.catalogTitle": { fr: "Catalogue des outils", en: "Tool catalog", es: "Catálogo de herramientas" },
  "home.quickAccess.catalogDesc": { fr: "Parcourez et recherchez les outils RH du groupe.", en: "Browse and search the group's HR tools.", es: "Explore y busque las herramientas de RR. HH. del grupo." },
  "home.portfolio.heading": { fr: "Portefeuille d'outils RH", en: "HR tools portfolio", es: "Cartera de herramientas de RR. HH." },
  "home.portfolio.subtitle": { fr: "Vue d'ensemble des outils RH disponibles pour vous.", en: "Overview of the HR tools portfolio available to you.", es: "Resumen de las herramientas de RR. HH. disponibles para usted." },
  "home.portfolio.browseCatalog": { fr: "Parcourir le catalogue →", en: "Browse the catalog →", es: "Explorar el catálogo →" },
  "home.kpi.totalTools": { fr: "Total des outils", en: "Total tools", es: "Total de herramientas" },
  "home.kpi.categories": { fr: "Catégories", en: "Categories", es: "Categorías" },
  "home.kpi.active": { fr: "Actifs", en: "Active", es: "Activas" },
  "home.kpi.corporateScope": { fr: "Portée groupe", en: "Corporate scope", es: "Alcance corporativo" },
  "home.analytics.heading": { fr: "Outils les plus consultés", en: "Most viewed tools", es: "Herramientas más consultadas" },
  "home.analytics.empty": {
    fr: "Aucun clic enregistré pour l'instant — ouvrez un outil depuis le catalogue pour commencer à voir des statistiques.",
    en: "No clicks recorded yet — open a tool from the catalog to start seeing statistics.",
    es: "Aún no hay clics registrados — abra una herramienta desde el catálogo para empezar a ver estadísticas.",
  },
  "home.analytics.clicks": { fr: "{{count}} clic(s)", en: "{{count}} click(s)", es: "{{count}} clic(s)" },
  "home.analytics.footer": {
    fr: "{{count}} ouverture(s) enregistrée(s) dans ce navigateur (démo — un vrai tableau de bord Power BI nécessiterait Dataverse/une base de données partagée).",
    en: "{{count}} open(s) recorded in this browser (demo — a real Power BI dashboard would need Dataverse/a shared database).",
    es: "{{count}} apertura(s) registrada(s) en este navegador (demo — un panel real de Power BI necesitaría Dataverse/una base de datos compartida).",
  },

  // Catalog
  "catalog.title": { fr: "Portail des outils RH", en: "HR Tools Portal", es: "Portal de herramientas de RR. HH." },
  "catalog.subtitle": { fr: "Découvrez et accédez à toutes les applications RH qui vous sont ouvertes.", en: "Discover and access every HR application available to you.", es: "Descubra y acceda a todas las aplicaciones de RR. HH. disponibles para usted." },
  "catalog.searchPlaceholder": { fr: "Rechercher un titre, une description, un fournisseur…", en: "Search title, description, vendor, audience...", es: "Buscar título, descripción, proveedor…" },
  "catalog.filterCategory": { fr: "Catégorie", en: "Category", es: "Categoría" },
  "catalog.filterScope": { fr: "Portée", en: "Scope", es: "Alcance" },
  "catalog.clearFilters": { fr: "Effacer tous les filtres", en: "Clear all filters", es: "Borrar todos los filtros" },
  "catalog.showing": { fr: "Affichage de {{count}} sur {{total}} outils RH", en: "Showing {{count}} of {{total}} HR tools", es: "Mostrando {{count}} de {{total}} herramientas de RR. HH." },
  "catalog.hiddenCount": { fr: "{{count}} non affiché(s) (restriction pays/rôle)", en: "{{count}} not shown (country/role restricted)", es: "{{count}} no mostrada(s) (restricción de país/rol)" },
  "catalog.noResults.title": { fr: "Aucun outil trouvé", en: "No tools found", es: "No se encontraron herramientas" },
  "catalog.noResults.subtitle": { fr: "Essayez d'ajuster vos filtres.", en: "Try adjusting your filters.", es: "Intente ajustar sus filtros." },

  // Chat
  "chat.demoMode": { fr: "Mode démo", en: "Demo mode", es: "Modo demo" },
  "chat.assistantName": { fr: "Assistant RH Lesaffre", en: "Lesaffre HR Assistant", es: "Asistente de RR. HH. Lesaffre" },
  "chat.newConversation": { fr: "Nouvelle conversation", en: "New conversation", es: "Nueva conversación" },
  "chat.history": { fr: "Historique", en: "History", es: "Historial" },
  "chat.noConversations": { fr: "Aucune conversation pour l'instant.", en: "No conversations yet.", es: "Aún no hay conversaciones." },
  "chat.deleteConversation": { fr: "Supprimer la conversation", en: "Delete conversation", es: "Eliminar conversación" },
  "chat.clearConversation": { fr: "Effacer cette conversation", en: "Clear this conversation", es: "Borrar esta conversación" },
  "chat.emptyGreeting": { fr: "Bonjour ! Posez une question RH ou choisissez une suggestion.", en: "Hello! Ask an HR question or pick a suggestion.", es: "¡Hola! Haga una pregunta de RR. HH. o elija una sugerencia." },
  "chat.placeholder": {
    fr: "Votre question… (Entrée pour envoyer, Maj+Entrée pour un retour à la ligne)",
    en: "Your question… (Enter to send, Shift+Enter for a new line)",
    es: "Su pregunta… (Intro para enviar, Mayús+Intro para salto de línea)",
  },
  "chat.send": { fr: "Envoyer", en: "Send", es: "Enviar" },
  "chat.stop": { fr: "Arrêter", en: "Stop", es: "Detener" },
  "chat.escalated": { fr: "Contactez l'équipe RH", en: "Contact the HR team", es: "Contacte al equipo de RR. HH." },
  "chat.thinking": { fr: "Réflexion en cours…", en: "Thinking…", es: "Pensando…" },
  "chat.suggestion.recruitment.label": { fr: "Recrutement", en: "Recruitment", es: "Contratación" },
  "chat.suggestion.recruitment.prompt": {
    fr: "Quel outil dois-je utiliser pour postuler à une offre en mobilité interne ?",
    en: "Which tool should I use to apply for an internal mobility position?",
    es: "¿Qué herramienta debo usar para postular a una oferta de movilidad interna?",
  },
  "chat.suggestion.training.label": { fr: "Formation", en: "Training", es: "Formación" },
  "chat.suggestion.training.prompt": {
    fr: "Où puis-je trouver le catalogue de formations disponibles ?",
    en: "Where can I find the catalog of available training courses?",
    es: "¿Dónde puedo encontrar el catálogo de formaciones disponibles?",
  },
  "chat.suggestion.myHr.label": { fr: "Mon dossier RH", en: "My HR file", es: "Mi expediente de RR. HH." },
  "chat.suggestion.myHr.prompt": {
    fr: "Quel outil me permet d'accéder à mon dossier employé et à l'organigramme ?",
    en: "Which tool lets me access my employee file and the org chart?",
    es: "¿Qué herramienta me permite acceder a mi expediente de empleado y al organigrama?",
  },
  "chat.suggestion.payroll.label": { fr: "Paie", en: "Payroll", es: "Nómina" },
  "chat.suggestion.payroll.prompt": {
    fr: "Quel outil dois-je utiliser pour consulter mes bulletins de paie ?",
    en: "Which tool should I use to view my payslips?",
    es: "¿Qué herramienta debo usar para consultar mis recibos de nómina?",
  },

  "chat.deleteMessage": { fr: "Supprimer le message", en: "Delete message", es: "Eliminar mensaje" },
  "chat.conversationLog": { fr: "Conversation", en: "Conversation", es: "Conversación" },
  "chat.yourMessage": { fr: "Votre message", en: "Your message", es: "Su mensaje" },
  "chat.deleteConversationNamed": { fr: "Supprimer la conversation « {{title}} »", en: "Delete conversation \"{{title}}\"", es: "Eliminar la conversación «{{title}}»" },
  "chat.relative.now": { fr: "à l'instant", en: "just now", es: "ahora mismo" },
  "chat.relative.minutes": { fr: "il y a {{n}} min", en: "{{n}} min ago", es: "hace {{n}} min" },
  "chat.relative.hours": { fr: "il y a {{n}} h", en: "{{n}} h ago", es: "hace {{n}} h" },
  "chat.relative.days": { fr: "il y a {{n}} j", en: "{{n}} d ago", es: "hace {{n}} d" },

  // Floating chat widget
  "widget.title": { fr: "Assistant RH", en: "HR Assistant", es: "Asistente de RR. HH." },
  "widget.expand": { fr: "Agrandir la fenêtre", en: "Expand window", es: "Ampliar ventana" },
  "widget.collapse": { fr: "Réduire la fenêtre", en: "Collapse window", es: "Reducir ventana" },
  "widget.close": { fr: "Fermer l'assistant", en: "Close assistant", es: "Cerrar asistente" },
  "widget.open": { fr: "Ouvrir l'assistant RH", en: "Open HR assistant", es: "Abrir asistente de RR. HH." },
  "widget.closeNamed": { fr: "Fermer l'assistant RH", en: "Close HR assistant", es: "Cerrar asistente de RR. HH." },

  // Language switcher
  "language.switcher.label": { fr: "Changer de langue", en: "Change language", es: "Cambiar idioma" },
};

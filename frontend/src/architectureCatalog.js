export const CATEGORIES = [
  { id: "client", label: "Client", color: "#64748b" },
  { id: "edge", label: "Edge & Network", color: "#0ea5e9" },
  { id: "compute", label: "Compute", color: "#4f46e5" },
  { id: "data", label: "Data & Storage", color: "#d97706" },
  { id: "messaging", label: "Messaging & Events", color: "#7c3aed" },
  { id: "security", label: "Security & Identity", color: "#dc2626" },
  { id: "observability", label: "Observability", color: "#16a34a" },
  { id: "external", label: "External Services", color: "#db2777" },
  { id: "devops", label: "DevOps & Delivery", color: "#0d9488" },
  { id: "ml", label: "ML / AI", color: "#9333ea" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function categoryColor(categoryId) {
  return CATEGORY_MAP[categoryId]?.color || "#64748b";
}

export const INFRAKIT_DISPLAY = {
  "rate-limiter": { icon: "Gauge", category: "edge" },
  shield: { icon: "ShieldCheck", category: "edge" },
  logger: { icon: "FileText", category: "observability" },
  health: { icon: "HeartPulse", category: "observability" },
  queue: { icon: "ListOrdered", category: "messaging" },
  cache: { icon: "Database", category: "data" },
  breaker: { icon: "GitBranch", category: "compute" },
  fn: { icon: "Zap", category: "compute" },
  loadbalancer: { icon: "Network", category: "edge" },
};

export const DISABLED_INFRAKIT_PACKAGES = [
  { id: "cache", label: "Cache", icon: "Database", category: "data" },
  { id: "fn", label: "Fn", icon: "Zap", category: "compute" },
  { id: "health", label: "Health", icon: "HeartPulse", category: "observability" },
  { id: "logger", label: "Logger", icon: "FileText", category: "observability" },
];

export const ARCH_COMPONENTS = [
  // ---- Client ----
  { id: "web_client", label: "Web Browser", icon: "Monitor", category: "client" },
  { id: "mobile_client", label: "Mobile App", icon: "Smartphone", category: "client" },
  { id: "desktop_client", label: "Desktop App", icon: "MonitorSmartphone", category: "client" },
  { id: "iot_device", label: "IoT Device", icon: "Radio", category: "client" },

  // ---- Edge & Network ----
  { id: "dns", label: "DNS", icon: "Router", category: "edge" },
  { id: "cdn", label: "CDN", icon: "Globe", category: "edge" },
  { id: "api_gateway", label: "API Gateway", icon: "DoorOpen", category: "edge" },
  { id: "reverse_proxy", label: "Reverse Proxy", icon: "Repeat", category: "edge" },
  { id: "vpn_gateway", label: "VPN Gateway", icon: "Lock", category: "edge" },

  // ---- Compute ----
  { id: "service", label: "Service / App Server", icon: "Server", category: "compute" },
  { id: "monolith", label: "Monolith App", icon: "Package", category: "compute" },
  { id: "container", label: "Container", icon: "Layers", category: "compute" },
  { id: "worker", label: "Background Worker", icon: "Cog", category: "compute" },
  { id: "scheduler", label: "Scheduler / Cron", icon: "Clock", category: "compute" },
  { id: "vm", label: "Virtual Machine", icon: "Cpu", category: "compute" },

  // ---- Data & Storage ----
  { id: "sql_db", label: "SQL Database", icon: "Database", category: "data" },
  { id: "nosql_db", label: "NoSQL Database", icon: "Layers", category: "data" },
  { id: "object_storage", label: "Object Storage", icon: "HardDrive", category: "data" },
  { id: "file_storage", label: "File Storage", icon: "Folder", category: "data" },
  { id: "data_warehouse", label: "Data Warehouse", icon: "Landmark", category: "data" },
  { id: "data_lake", label: "Data Lake", icon: "Droplet", category: "data" },
  { id: "search_engine", label: "Search Engine", icon: "Search", category: "data" },
  { id: "graph_db", label: "Graph Database", icon: "Share2", category: "data" },
  { id: "timeseries_db", label: "Time-Series DB", icon: "TrendingUp", category: "data" },

  // ---- Messaging & Events ----
  { id: "pubsub", label: "Pub/Sub", icon: "Share2", category: "messaging" },
  { id: "event_bus", label: "Event Bus", icon: "Workflow", category: "messaging" },
  { id: "stream_processor", label: "Stream Processor", icon: "Waves", category: "messaging" },
  { id: "notification_service", label: "Notification Service", icon: "Bell", category: "messaging" },
  { id: "webhook", label: "Webhook", icon: "Webhook", category: "messaging" },

  // ---- Security & Identity ----
  { id: "auth_service", label: "Auth Service", icon: "KeyRound", category: "security" },
  { id: "identity_provider", label: "Identity Provider / SSO", icon: "Fingerprint", category: "security" },
  { id: "secrets_manager", label: "Secrets Manager", icon: "Key", category: "security" },
  { id: "encryption_kms", label: "Encryption / KMS", icon: "ShieldCheck", category: "security" },

  // ---- Observability ----
  { id: "monitoring", label: "Monitoring", icon: "Activity", category: "observability" },
  { id: "tracing", label: "Distributed Tracing", icon: "Route", category: "observability" },
  { id: "alerting", label: "Alerting", icon: "BellRing", category: "observability" },

  // ---- External Services ----
  { id: "external_api", label: "Third-Party API", icon: "Globe", category: "external" },
  { id: "payment_gateway", label: "Payment Gateway", icon: "CreditCard", category: "external" },
  { id: "email_provider", label: "Email Provider", icon: "Mail", category: "external" },
  { id: "sms_provider", label: "SMS Provider", icon: "MessageSquare", category: "external" },
  { id: "social_login", label: "Social Login Provider", icon: "Users", category: "external" },

  // ---- DevOps & Delivery ----
  { id: "ci_cd", label: "CI/CD Pipeline", icon: "GitMerge", category: "devops" },
  { id: "container_registry", label: "Container Registry", icon: "Package", category: "devops" },
  { id: "config_service", label: "Config Service", icon: "Settings", category: "devops" },
  { id: "feature_flags", label: "Feature Flags", icon: "ToggleLeft", category: "devops" },

  // ---- ML / AI ----
  { id: "ml_model", label: "ML Model Serving", icon: "Brain", category: "ml" },
  { id: "ml_pipeline", label: "ML Training Pipeline", icon: "Workflow", category: "ml" },
  { id: "vector_db", label: "Vector Database", icon: "Database", category: "ml" },
];

export const ARCH_COMPONENT_MAP = Object.fromEntries(ARCH_COMPONENTS.map((c) => [c.id, c]));

/** Category-level directed adjacency — kept for backward-compat edges only; see file header. */
const CATEGORY_RULES = {
  client: ["edge", "security"],
  edge: ["compute", "security", "data"],
  compute: ["data", "messaging", "external", "security", "compute", "ml", "devops"],
  security: ["data", "external"],
  messaging: ["compute", "external", "messaging"],
  devops: ["compute", "data", "devops"],
  ml: ["data", "compute", "ml"],
  data: [],
  external: [],
  observability: ["external"],
};

const SELF_CONNECT_CATEGORIES = new Set(["compute", "messaging"]);

export function isValidArchConnection(sourceType, targetType) {
  const source = ARCH_COMPONENT_MAP[sourceType];
  const target = ARCH_COMPONENT_MAP[targetType];
  if (!source || !target) return false;

  if (sourceType === targetType && !SELF_CONNECT_CATEGORIES.has(source.category)) return false;
  if (target.category === "observability" && sourceType !== targetType) return true;

  return (CATEGORY_RULES[source.category] || []).includes(target.category);
}


// export const CATEGORIES = [
//   { id: "client", label: "Client", color: "#64748b" },
//   { id: "edge", label: "Edge & Network", color: "#0ea5e9" },
//   { id: "compute", label: "Compute", color: "#4f46e5" },
//   { id: "data", label: "Data & Storage", color: "#d97706" },
//   { id: "messaging", label: "Messaging & Events", color: "#7c3aed" },
//   { id: "security", label: "Security & Identity", color: "#dc2626" },
//   { id: "observability", label: "Observability", color: "#16a34a" },
//   { id: "external", label: "External Services", color: "#db2777" },
//   { id: "devops", label: "DevOps & Delivery", color: "#0d9488" },
//   { id: "ml", label: "ML / AI", color: "#9333ea" },
// ];

// export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// export function categoryColor(categoryId) {
//   return CATEGORY_MAP[categoryId]?.color || "#64748b";
// }

// /**
//  * category + icon for each real InfraKit package type (keyed by the same
//  * type string the backend's PACKAGE_CATALOG uses). Config fields/defaults
//  * still come from the backend — this is display-only.
//  */
// export const INFRAKIT_DISPLAY = {
//   "rate-limiter": { icon: "Gauge", category: "edge" },
//   shield: { icon: "ShieldCheck", category: "edge" },
//   logger: { icon: "FileText", category: "observability" },
//   health: { icon: "HeartPulse", category: "observability" },
//   queue: { icon: "ListOrdered", category: "messaging" },
//   cache: { icon: "Database", category: "data" },
//   breaker: { icon: "GitBranch", category: "compute" },
//   fn: { icon: "Zap", category: "compute" },
//   loadbalancer: { icon: "Network", category: "edge" },
// };

// export const ARCH_COMPONENTS = [
//   // ---- Client ----
//   { id: "web_client", label: "Web Browser", icon: "Monitor", category: "client" },
//   { id: "mobile_client", label: "Mobile App", icon: "Smartphone", category: "client" },
//   { id: "desktop_client", label: "Desktop App", icon: "MonitorSmartphone", category: "client" },
//   { id: "iot_device", label: "IoT Device", icon: "Radio", category: "client" },

//   // ---- Edge & Network ----
//   { id: "dns", label: "DNS", icon: "Router", category: "edge" },
//   { id: "cdn", label: "CDN", icon: "Globe", category: "edge" },
//   { id: "api_gateway", label: "API Gateway", icon: "DoorOpen", category: "edge" },
//   { id: "reverse_proxy", label: "Reverse Proxy", icon: "Repeat", category: "edge" },
//   { id: "vpn_gateway", label: "VPN Gateway", icon: "Lock", category: "edge" },

//   // ---- Compute ----
//   { id: "service", label: "Service / App Server", icon: "Server", category: "compute" },
//   { id: "monolith", label: "Monolith App", icon: "Package", category: "compute" },
//   { id: "container", label: "Container", icon: "Layers", category: "compute" },
//   { id: "worker", label: "Background Worker", icon: "Cog", category: "compute" },
//   { id: "scheduler", label: "Scheduler / Cron", icon: "Clock", category: "compute" },
//   { id: "vm", label: "Virtual Machine", icon: "Cpu", category: "compute" },

//   // ---- Data & Storage ----
//   { id: "sql_db", label: "SQL Database", icon: "Database", category: "data" },
//   { id: "nosql_db", label: "NoSQL Database", icon: "Layers", category: "data" },
//   { id: "object_storage", label: "Object Storage", icon: "HardDrive", category: "data" },
//   { id: "file_storage", label: "File Storage", icon: "Folder", category: "data" },
//   { id: "data_warehouse", label: "Data Warehouse", icon: "Landmark", category: "data" },
//   { id: "data_lake", label: "Data Lake", icon: "Droplet", category: "data" },
//   { id: "search_engine", label: "Search Engine", icon: "Search", category: "data" },
//   { id: "graph_db", label: "Graph Database", icon: "Share2", category: "data" },
//   { id: "timeseries_db", label: "Time-Series DB", icon: "TrendingUp", category: "data" },

//   // ---- Messaging & Events ----
//   { id: "pubsub", label: "Pub/Sub", icon: "Share2", category: "messaging" },
//   { id: "event_bus", label: "Event Bus", icon: "Workflow", category: "messaging" },
//   { id: "stream_processor", label: "Stream Processor", icon: "Waves", category: "messaging" },
//   { id: "notification_service", label: "Notification Service", icon: "Bell", category: "messaging" },
//   { id: "webhook", label: "Webhook", icon: "Webhook", category: "messaging" },

//   // ---- Security & Identity ----
//   { id: "auth_service", label: "Auth Service", icon: "KeyRound", category: "security" },
//   { id: "identity_provider", label: "Identity Provider / SSO", icon: "Fingerprint", category: "security" },
//   { id: "secrets_manager", label: "Secrets Manager", icon: "Key", category: "security" },
//   { id: "encryption_kms", label: "Encryption / KMS", icon: "ShieldCheck", category: "security" },

//   // ---- Observability ----
//   { id: "monitoring", label: "Monitoring", icon: "Activity", category: "observability" },
//   { id: "tracing", label: "Distributed Tracing", icon: "Route", category: "observability" },
//   { id: "alerting", label: "Alerting", icon: "BellRing", category: "observability" },

//   // ---- External Services ----
//   { id: "external_api", label: "Third-Party API", icon: "Globe", category: "external" },
//   { id: "payment_gateway", label: "Payment Gateway", icon: "CreditCard", category: "external" },
//   { id: "email_provider", label: "Email Provider", icon: "Mail", category: "external" },
//   { id: "sms_provider", label: "SMS Provider", icon: "MessageSquare", category: "external" },
//   { id: "social_login", label: "Social Login Provider", icon: "Users", category: "external" },

//   // ---- DevOps & Delivery ----
//   { id: "ci_cd", label: "CI/CD Pipeline", icon: "GitMerge", category: "devops" },
//   { id: "container_registry", label: "Container Registry", icon: "Package", category: "devops" },
//   { id: "config_service", label: "Config Service", icon: "Settings", category: "devops" },
//   { id: "feature_flags", label: "Feature Flags", icon: "ToggleLeft", category: "devops" },

//   // ---- ML / AI ----
//   { id: "ml_model", label: "ML Model Serving", icon: "Brain", category: "ml" },
//   { id: "ml_pipeline", label: "ML Training Pipeline", icon: "Workflow", category: "ml" },
//   { id: "vector_db", label: "Vector Database", icon: "Database", category: "ml" },
// ];

// export const ARCH_COMPONENT_MAP = Object.fromEntries(ARCH_COMPONENTS.map((c) => [c.id, c]));

// /** Category-level directed adjacency — kept for backward-compat edges only; see file header. */
// const CATEGORY_RULES = {
//   client: ["edge", "security"],
//   edge: ["compute", "security", "data"],
//   compute: ["data", "messaging", "external", "security", "compute", "ml", "devops"],
//   security: ["data", "external"],
//   messaging: ["compute", "external", "messaging"],
//   devops: ["compute", "data", "devops"],
//   ml: ["data", "compute", "ml"],
//   data: [],
//   external: [],
//   observability: ["external"],
// };

// const SELF_CONNECT_CATEGORIES = new Set(["compute", "messaging"]);

// export function isValidArchConnection(sourceType, targetType) {
//   const source = ARCH_COMPONENT_MAP[sourceType];
//   const target = ARCH_COMPONENT_MAP[targetType];
//   if (!source || !target) return false;

//   if (sourceType === targetType && !SELF_CONNECT_CATEGORIES.has(source.category)) return false;
//   if (target.category === "observability" && sourceType !== targetType) return true;

//   return (CATEGORY_RULES[source.category] || []).includes(target.category);
// }

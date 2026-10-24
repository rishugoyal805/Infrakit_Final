/**
 * Maps each InfraKit package type to a provider-flavored label + icon +
 * accent color, so the canvas can "look like" AWS/GCP/Azure without using
 * any of their actual (trademarked) service icons — every icon here is a
 * generic Lucide icon, just relabeled and recolored per provider. The
 * service-name mapping is a reasonable analogy, not an exact 1:1 (a few
 * packages — breaker, in particular — don't have a clean managed-service
 * equivalent on every provider; labeled accordingly).
 */
export const PROVIDERS = [
  { id: "generic", label: "Generic", color: "#6b7280" },
  { id: "aws", label: "AWS", color: "#FF9900" },
  { id: "gcp", label: "Google Cloud", color: "#4285F4" },
  { id: "azure", label: "Azure", color: "#0078D4" },
];

export const PROVIDER_SKINS = {
  core: {
    generic: { label: "Core", icon: "Boxes" },
    aws: { label: "Core Runtime", icon: "Boxes" },
    gcp: { label: "Core Runtime", icon: "Boxes" },
    azure: { label: "Core Runtime", icon: "Boxes" },
  },
  "rate-limiter": {
    generic: { label: "Rate Limiter", icon: "Gauge" },
    aws: { label: "API Gateway", icon: "Gauge" },
    gcp: { label: "Apigee Gateway", icon: "Gauge" },
    azure: { label: "API Management", icon: "Gauge" },
  },
  shield: {
    generic: { label: "Shield", icon: "ShieldCheck" },
    aws: { label: "WAF", icon: "ShieldCheck" },
    gcp: { label: "Cloud Armor", icon: "ShieldCheck" },
    azure: { label: "Azure WAF", icon: "ShieldCheck" },
  },
  logger: {
    generic: { label: "Logger", icon: "FileText" },
    aws: { label: "CloudWatch Logs", icon: "FileText" },
    gcp: { label: "Cloud Logging", icon: "FileText" },
    azure: { label: "Monitor Logs", icon: "FileText" },
  },
  health: {
    generic: { label: "Health", icon: "HeartPulse" },
    aws: { label: "Route 53 Health Checks", icon: "HeartPulse" },
    gcp: { label: "Health Checks", icon: "HeartPulse" },
    azure: { label: "Health Probes", icon: "HeartPulse" },
  },
  queue: {
    generic: { label: "Queue", icon: "ListOrdered" },
    aws: { label: "SQS", icon: "ListOrdered" },
    gcp: { label: "Pub/Sub", icon: "ListOrdered" },
    azure: { label: "Service Bus", icon: "ListOrdered" },
  },
  cache: {
    generic: { label: "Cache", icon: "Database" },
    aws: { label: "ElastiCache", icon: "Database" },
    gcp: { label: "Memorystore", icon: "Database" },
    azure: { label: "Cache for Redis", icon: "Database" },
  },
  breaker: {
    // No provider has a standalone managed "circuit breaker" service — this
    // is usually a library concern (e.g. inside a service mesh). Labeled
    // honestly rather than inventing a service that doesn't exist.
    generic: { label: "Breaker", icon: "GitBranch" },
    aws: { label: "Circuit Breaker (App Mesh)", icon: "GitBranch" },
    gcp: { label: "Circuit Breaker (Traffic Director)", icon: "GitBranch" },
    azure: { label: "Circuit Breaker (Service Fabric)", icon: "GitBranch" },
  },
  fn: {
    generic: { label: "Fn", icon: "Zap" },
    aws: { label: "Lambda", icon: "Zap" },
    gcp: { label: "Cloud Functions", icon: "Zap" },
    azure: { label: "Azure Functions", icon: "Zap" },
  },
  loadbalancer: {
    generic: { label: "Load Balancer", icon: "Network" },
    aws: { label: "Elastic Load Balancing", icon: "Network" },
    gcp: { label: "Cloud Load Balancing", icon: "Network" },
    azure: { label: "Azure Load Balancer", icon: "Network" },
  },
  dashboard: {
    generic: { label: "Dashboard", icon: "LayoutDashboard" },
    aws: { label: "CloudWatch Dashboard", icon: "LayoutDashboard" },
    gcp: { label: "Cloud Monitoring", icon: "LayoutDashboard" },
    azure: { label: "Monitor Dashboard", icon: "LayoutDashboard" },
  },
};

export function skinFor(pkgType, provider) {
  const entry = PROVIDER_SKINS[pkgType];
  if (!entry) return { label: pkgType, icon: "Box" };
  return entry[provider] || entry.generic;
}

export function providerColor(provider) {
  return PROVIDERS.find((p) => p.id === provider)?.color || PROVIDERS[0].color;
}

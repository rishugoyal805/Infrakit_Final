const SQLI_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\bUNION\b.+\bSELECT\b/i,
  /\bSELECT\b.+\bFROM\b/i,
  /\bDROP\b\s+\bTABLE\b/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e%2f/i,
  /%2e%2e\//i,
  /\.\.%2f/i,
  /%2e%2e\\/i,
];

const MAX_PAYLOAD_BYTES = 1024 * 1024;

function checkSqlInjection(input) {
  if (!input) return false;
  return SQLI_PATTERNS.some((p) => p.test(input));
}

function checkPathTraversal(input) {
  if (!input) return false;
  if (PATH_TRAVERSAL_PATTERNS.some((p) => p.test(input))) return true;

  try {
    const decoded = decodeURIComponent(input);
    if (decoded.includes("../") || decoded.includes("..\\")) return true;
  } catch (e) {
    // malformed encoding, ignore
  }

  return false;
}

function checkOversizedPayload(contentLength) {
  return contentLength > MAX_PAYLOAD_BYTES;
}

function inspectRequest(req) {
  const url = req.originalUrl || req.url || "";
  const bodyStr = req.body ? JSON.stringify(req.body) : "";
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);

  if (checkSqlInjection(url) || checkSqlInjection(bodyStr)) {
    return { flagged: true, reason: "sql_injection_pattern" };
  }
  if (checkPathTraversal(url)) {
    return { flagged: true, reason: "path_traversal_pattern" };
  }
  if (checkOversizedPayload(contentLength)) {
    return { flagged: true, reason: "oversized_payload" };
  }
  return { flagged: false, reason: null };
}

module.exports = { inspectRequest, checkSqlInjection, checkPathTraversal, checkOversizedPayload };
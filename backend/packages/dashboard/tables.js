// Only these tables are ever browsable — the :name URL param is matched
// against this list, never interpolated into SQL directly. This is the
// entire injection defense for table names.
const TABLE_REGISTRY = [
  { name: "ik_logs", label: "Request Logs", icon: "📄", defaultSort: "id" },
  { name: "ik_queue_jobs", label: "Queue Jobs", icon: "📦", defaultSort: "id" },
  { name: "ik_queue_attempts", label: "Queue Attempts", icon: "🔁", defaultSort: "id" },
  { name: "ik_fn_executions", label: "Function Executions", icon: "⚡", defaultSort: "id" },
  { name: "ik_security_events", label: "Security Events", icon: "🛡️", defaultSort: "id" },
  { name: "ik_circuit_breakers", label: "Circuit Breakers", icon: "🔌", defaultSort: "name" },
  { name: "ik_blocked_ips", label: "Blocked IPs", icon: "🚫", defaultSort: "blocked_at" },
  { name: "ik_configs", label: "Config Store", icon: "⚙️", defaultSort: "key" }
];

const PAGE_SIZE = 25;

function getColumns(db, tableName) {
  // tableName here is only ever a value already matched against
  // TABLE_REGISTRY by the caller — never the raw request param.
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map((c) => c.name);
}

function tableExists(db, tableName) {
  try {
    db.prepare(`SELECT 1 FROM ${tableName} LIMIT 1`).get();
    return true;
  } catch (e) {
    return false; // that package's table hasn't been created in this app yet
  }
}

function queryTable(db, tableConfig, { page, sortColumn, sortDir, filters }) {
  const columns = getColumns(db, tableConfig.name);

  // Only accept a sort column that's a real column on this table —
  // anything else silently falls back to the table's default sort,
  // rather than erroring or, worse, being interpolated unchecked.
  const safeSortColumn = columns.includes(sortColumn) ? sortColumn : tableConfig.defaultSort;
  const safeSortDir = sortDir === "ASC" ? "ASC" : "DESC";

  const whereClauses = [];
  const params = [];
  for (const [key, value] of Object.entries(filters)) {
    if (!columns.includes(key) || value === "" || value == null) continue; // silently drop unknown/empty filters
    whereClauses.push(`${key} LIKE ?`);
    params.push(`%${value}%`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const totalRow = db.prepare(`SELECT COUNT(*) as cnt FROM ${tableConfig.name} ${whereSql}`).get(...params);
  const total = totalRow.cnt;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;

  const rows = db
    .prepare(`SELECT * FROM ${tableConfig.name} ${whereSql} ORDER BY ${safeSortColumn} ${safeSortDir} LIMIT ? OFFSET ?`)
    .all(...params, PAGE_SIZE, offset);

  return { rows, columns, total, totalPages, page: safePage, sortColumn: safeSortColumn, sortDir: safeSortDir };
}

module.exports = { TABLE_REGISTRY, tableExists, queryTable, PAGE_SIZE };
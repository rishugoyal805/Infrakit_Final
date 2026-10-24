/**
 * Topologically sorts nodes by edge direction (edge = request-flow order).
 * Nodes with no incoming edge go first. Cycles and disconnected nodes are
 * never blocked on — disconnected/cyclic leftovers are appended at the end
 * in their original placement order, per spec ("don't overbuild this").
 */
export function topoSort(nodes, edges) {
  const ids = nodes.map((n) => n.id);
  const inDegree = new Map(ids.map((id) => [id, 0]));
  const adj = new Map(ids.map((id) => [id, []]));

  for (const e of edges) {
    if (!adj.has(e.source) || !inDegree.has(e.target)) continue; // ignore dangling edges
    adj.get(e.source).push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  }

  const queue = ids.filter((id) => inDegree.get(id) === 0);
  const visited = new Set();
  const ordered = [];

  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    ordered.push(id);
    for (const next of adj.get(id) || []) {
      inDegree.set(next, inDegree.get(next) - 1);
      if (inDegree.get(next) === 0) queue.push(next);
    }
  }

  // Anything left (cycles, or nodes whose in-degree never hit 0) is appended
  // at the end, in original placement order — never blocks export.
  const leftover = ids.filter((id) => !visited.has(id));
  return [...ordered, ...leftover];
}

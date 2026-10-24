function createBruteForceTracker(options = {}) {
  const threshold = options.threshold || 5;
  const windowMs = options.windowMs || 60 * 1000;

  // ip -> Map<route, timestamps[]>
  const attempts = new Map();

  function getRouteMap(ip) {
    let routeMap = attempts.get(ip);
    if (!routeMap) {
      routeMap = new Map();
      attempts.set(ip, routeMap);
    }
    return routeMap;
  }

  function recordFailure(ip, route) {
    const routeMap = getRouteMap(ip);
    const now = Date.now();
    let list = routeMap.get(route) || [];
    list = list.filter((t) => now - t < windowMs);
    list.push(now);
    routeMap.set(route, list);
    return list.length;
  }

  function isOverThreshold(ip, route) {
    const routeMap = attempts.get(ip);
    if (!routeMap) return false;
    const list = routeMap.get(route) || [];
    return list.length >= threshold;
  }

  function isHittingMultipleRoutes(ip, minRoutes = 2) {
    const routeMap = attempts.get(ip);
    if (!routeMap) return false;

    const now = Date.now();
    let activeRoutes = 0;
    for (const [, list] of routeMap) {
      const recent = list.filter((t) => now - t < windowMs);
      if (recent.length > 0) activeRoutes++;
    }
    return activeRoutes >= minRoutes;
  }

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, routeMap] of attempts) {
      for (const [route, list] of routeMap) {
        const filtered = list.filter((t) => now - t < windowMs);
        if (filtered.length === 0) routeMap.delete(route);
        else routeMap.set(route, filtered);
      }
      if (routeMap.size === 0) attempts.delete(ip);
    }
  }, windowMs);
  if (typeof cleanup.unref === "function") cleanup.unref();

  return { recordFailure, isOverThreshold, isHittingMultipleRoutes };
}

module.exports = { createBruteForceTracker };
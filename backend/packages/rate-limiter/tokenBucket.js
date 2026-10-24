
// function tokenBucketLimiter(options = {}) {
//     const {
//         capacity,
//         refillRate,
//         keyGenerator = (req) => req.ip,
//         bucketTTL = 10 * 60 * 1000,      // 10 minutes
//         cleanupInterval = 5 * 60 * 1000  // 5 minutes
//     } = options;
//     // Validate configuration
//     if (!Number.isFinite(capacity) || capacity <= 0) {
//         throw new Error("capacity must be a positive number");
//     }
//     if (!Number.isFinite(refillRate) || refillRate <= 0) {
//         throw new Error("refillRate must be a positive number");
//     }
//     const buckets = new Map();
//     function now() {
//         return Date.now() / 1000;
//     }
//     function refill(bucket) {
//         const current = now();
//         const elapsed = current - bucket.lastRefill;
//         bucket.tokens = Math.min(
//             capacity,
//             bucket.tokens + elapsed * refillRate
//         );
//         bucket.lastRefill = current;
//     }
//     // Periodic cleanup
//     const interval = setInterval(() => {
//         const current = now();
//         for (const [key, bucket] of buckets) {
//             if ((current - bucket.lastRefill) * 1000 > bucketTTL) {
//                 buckets.delete(key);
//             }
//         }
//     }, cleanupInterval);
//     // Prevent timer from keeping Node alive
//     if (typeof interval.unref === "function") {
//         interval.unref();
//     }
//     return function (req, res, next) {
//         const key = keyGenerator(req);
//         let bucket = buckets.get(key);
//         if (!bucket) {
//             bucket = {
//                 tokens: capacity,
//                 lastRefill: now()
//             };
//             buckets.set(key, bucket);
//         }
//         refill(bucket);
//         if (bucket.tokens >= 1) {
//             bucket.tokens -= 1;
//             return next();
//         }
//         const retryAfter = Math.ceil((1 - bucket.tokens) / refillRate);
//         res.set("Retry-After", String(retryAfter));
//         return res.status(429).send("Too Many Requests");
//     };
// }


function tokenBucketLimiter(options = {}) {
    const {
        capacity,
        refillRate,
        keyGenerator = (req) => req.ip,
        bucketTTL = 10 * 60 * 1000,
        cleanupInterval = 5 * 60 * 1000
    } = options;

    if (!Number.isFinite(capacity) || capacity <= 0) {
        throw new Error("capacity must be a positive number");
    }
    if (!Number.isFinite(refillRate) || refillRate <= 0) {
        throw new Error("refillRate must be a positive number");
    }

    const buckets = new Map();

    function now() {
        return Date.now() / 1000;
    }

    function refill(bucket) {
        const current = now();
        const elapsed = current - bucket.lastRefill;
        bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillRate);
        bucket.lastRefill = current;
    }

    const interval = setInterval(() => {
        const current = now();
        for (const [key, bucket] of buckets) {
            if ((current - bucket.lastRefill) * 1000 > bucketTTL) {
                buckets.delete(key);
            }
        }
    }, cleanupInterval);
    if (typeof interval.unref === "function") {
        interval.unref();
    }

    return function (req, res, next) {
        const key = keyGenerator(req);
        let bucket = buckets.get(key);
        if (!bucket) {
            bucket = { tokens: capacity, lastRefill: now() };
            buckets.set(key, bucket);
        }
        refill(bucket);

        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            return next();
        }

        const retryAfter = Math.ceil((1 - bucket.tokens) / refillRate);
        res.set("Retry-After", String(retryAfter));

        // Runtime core detection — checked per rejection, not cached at
        // module load. If core wasn't installed when the server started
        // but is installed now, this still finds it.
        try {
            const core = require("@infrakit/core");
            core.bus.emit("rate_limit_exceeded", {
                ip: req.ip,
                route: req.originalUrl,
                count: capacity,
                key
            });
        } catch (e) {
             console.log("[rate-limiter] core not available, skipping event emit:", e.message);
        }

        return res.status(429).send("Too Many Requests");
    };
}

module.exports = tokenBucketLimiter;
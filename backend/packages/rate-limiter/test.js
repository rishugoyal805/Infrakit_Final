function createReq(ip) {
    return { ip };
}
function createRes() {
    return {
        statusCode: null,
        body: null,
        headers: {},
        set(key, value) {
            this.headers[key] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        send(message) {
            this.body = message;
            return this;
        }
    };
}


test("allows burst up to capacity then returns 429", () => {
    const limiter = tokenBucketLimiter({
        capacity: 5,
        refillRate: 1
    });
    const req = createReq("1.1.1.1");
    for (let i = 0; i < 5; i++) {
        const res = createRes();
        const next = jest.fn();
        limiter(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.statusCode).toBeNull();
    }
    const res = createRes();
    const next = jest.fn();
    limiter(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
    expect(res.headers["Retry-After"]).toBeDefined();
});


test("refills tokens after waiting", async () => {
    const limiter = tokenBucketLimiter({
        capacity: 2,
        refillRate: 1
    });
    const req = createReq("2.2.2.2");
    limiter(req, createRes(), jest.fn());
    limiter(req, createRes(), jest.fn());
    let res = createRes();
    let next = jest.fn();
    limiter(req, res, next);
    expect(res.statusCode).toBe(429);
    await new Promise(resolve => setTimeout(resolve, 1100));
    res = createRes();
    next = jest.fn();
    limiter(req, res, next);
    expect(next).toHaveBeenCalled();
});



test("different keys have independent buckets", () => {
    const limiter = tokenBucketLimiter({
        capacity: 2,
        refillRate: 1
    });
    const reqA = createReq("1.1.1.1");
    const reqB = createReq("2.2.2.2");
    limiter(reqA, createRes(), jest.fn());
    limiter(reqA, createRes(), jest.fn());
    let resA = createRes();
    let nextA = jest.fn();
    limiter(reqA, resA, nextA);
    expect(resA.statusCode).toBe(429);
    let resB = createRes();
    let nextB = jest.fn();
    limiter(reqB, resB, nextB);
    expect(nextB).toHaveBeenCalled();
    expect(resB.statusCode).toBeNull();
});
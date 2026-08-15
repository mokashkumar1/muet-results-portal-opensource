const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = "test-only-secret-at-least-32-characters";
const { createToken, verifyAuth } = require("../lib/auth");
const { saveSchema, validateBody } = require("../lib/validate");

test("authentication helper accepts a generated bearer token", () => {
  const token = createToken({ sub: "coordinator-1", role: "coordinator" });
  const payload = verifyAuth({ headers: { authorization: `Bearer ${token}` } });
  assert.equal(payload.sub, "coordinator-1");
});

test("authentication helper rejects missing tokens", () => {
  assert.throws(() => verifyAuth({ headers: {} }), /No authentication token/);
});

test("result validation accepts valid records and rejects GPA overflow", () => {
  const valid = validateBody(saveSchema, { department: "cs", data: [{ id: "24CS001", s1: 3.8 }] });
  assert.equal(valid.success, true);
  const invalid = validateBody(saveSchema, { department: "cs", data: [{ id: "24CS001", s1: 4.1 }] });
  assert.equal(invalid.success, false);
});

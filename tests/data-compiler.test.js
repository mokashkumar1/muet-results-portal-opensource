const test = require("node:test");
const assert = require("node:assert/strict");
const { compileCsv } = require("../lib/data-compiler");

const header = "Student_ID,Batch,Dept,GPA_S1,GPA_S2";

test("compiles valid rows into sorted batch semester maps", () => {
  const result = compileCsv(`${header}\n24CS002,24,CS,3.5,3.7\n24CS001,24,CS,4.0,`);
  assert.deepEqual(result["24CS"].semesters, [
    { "24CS002": 3.5, "24CS001": 4 },
    { "24CS002": 3.7 },
  ]);
});

test("skips incomplete rows", () => {
  const result = compileCsv(`${header}\n,24,CS,3.5,3.7\n24CS001,24,CS,4.0,`);
  assert.deepEqual(Object.keys(result["24CS"].semesters[0]), ["24CS001"]);
});

test("rejects invalid GPA values", () => {
  assert.throws(() => compileCsv(`${header}\n24CS001,24,CS,4.5,`), /Invalid GPA/);
});

test("rejects duplicate student records within a batch", () => {
  assert.throws(
    () => compileCsv(`${header}\n24CS001,24,CS,3.5,\n24cs001,24,CS,3.6,`),
    /Duplicate student record/
  );
});

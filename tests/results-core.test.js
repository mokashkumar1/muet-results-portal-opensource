const test = require("node:test");
const assert = require("node:assert/strict");
const { buildBatchStudents, getBatchStats, gradeFromCgpa } = require("../lib/results-core");

test("grade boundaries match the displayed grading bands", () => {
  assert.equal(gradeFromCgpa(3.8), "A+");
  assert.equal(gradeFromCgpa(3.5), "A");
  assert.equal(gradeFromCgpa(3.0), "B");
  assert.equal(gradeFromCgpa(2.99), "C");
});

test("batch students use published semesters and dense ranking", () => {
  const students = buildBatchStudents([
    { "24CS001": 4, "24CS002": 3.8, "24CS003": 3.8 },
    { "24CS001": 3.6, "24CS002": 3.8, "24CS003": 3.8 },
  ]);
  assert.deepEqual(students.map(({ id, cgpa, rank }) => ({ id, cgpa, rank })), [
    { id: "24CS001", cgpa: 3.8, rank: 1 },
    { id: "24CS002", cgpa: 3.8, rank: 1 },
    { id: "24CS003", cgpa: 3.8, rank: 1 },
  ]);
});

test("missing semester entries preserve the established zero-value behavior", () => {
  const [student] = buildBatchStudents([{ "24CS001": 4 }, {}]);
  assert.equal(student.cgpa, 2);
  assert.deepEqual(student.semesters, [4, 0]);
});

test("batch statistics handle empty and populated batches", () => {
  assert.deepEqual(getBatchStats({ students: [] }), { total: 0, avgCgpa: 0, highest: 0, highPerformers: 0 });
  const students = buildBatchStudents([{ A1: 4, A2: 3 }]);
  assert.deepEqual(getBatchStats({ students }), { total: 2, avgCgpa: 3.5, highest: 4, highPerformers: 1 });
});

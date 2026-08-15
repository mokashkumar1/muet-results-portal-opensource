(function exposeResultsCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ResultsCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createResultsCore() {
  function gradeFromCgpa(cgpa) {
    if (cgpa >= 3.8) return "A+";
    if (cgpa >= 3.5) return "A";
    if (cgpa >= 3.0) return "B";
    return "C";
  }

  function buildBatchStudents(semesterMaps) {
    const allIds = new Set();
    semesterMaps.forEach((map) => Object.keys(map).forEach((id) => allIds.add(id)));
    const publishedSemestersCount = semesterMaps.length;
    const students = [];

    allIds.forEach((id) => {
      const semesters = semesterMaps.map((map) => map[id] || 0);
      const cgpa = publishedSemestersCount > 0
        ? semesters.reduce((sum, gpa) => sum + gpa, 0) / publishedSemestersCount
        : 0;
      students.push({ id, semesters, cgpa, grade: gradeFromCgpa(cgpa) });
    });

    students.sort((a, b) => b.cgpa - a.cgpa || a.id.localeCompare(b.id));

    let rank = 0;
    let previousCgpa = null;
    students.forEach((student) => {
      const roundedCgpa = Math.round(student.cgpa * 100) / 100;
      if (previousCgpa === null || roundedCgpa !== previousCgpa) {
        rank += 1;
        previousCgpa = roundedCgpa;
      }
      student.rank = rank;
    });

    return students;
  }

  function getBatchStats(batch) {
    const { students } = batch;
    const total = students.length;
    const avgCgpa = total ? students.reduce((sum, student) => sum + student.cgpa, 0) / total : 0;
    const highest = total ? students[0].cgpa : 0;
    const highPerformers = students.filter((student) => student.cgpa >= 3.5).length;
    return { total, avgCgpa, highest, highPerformers };
  }

  return { gradeFromCgpa, buildBatchStudents, getBatchStats };
});

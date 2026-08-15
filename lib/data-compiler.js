function compileCsv(csvContent) {
  const lines = csvContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV is empty or missing data lines.");

  const headers = lines[0].split(",").map((header) => header.trim());
  const requiredHeaders = ["Student_ID", "Batch", "Dept"];
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) throw new Error(`CSV is missing required header: ${header}`);
  }

  const batchGroups = {};
  const seenStudents = new Set();

  for (let index = 1; index < lines.length; index += 1) {
    const columns = lines[index].split(",").map((column) => column.trim());
    const studentId = columns[headers.indexOf("Student_ID")];
    const batch = columns[headers.indexOf("Batch")];
    const department = columns[headers.indexOf("Dept")];
    if (!studentId || !batch || !department) continue;

    const batchId = `${batch}${department}`;
    const uniqueKey = `${batchId}:${studentId.toLowerCase()}`;
    if (seenStudents.has(uniqueKey)) {
      throw new Error(`Duplicate student record: ${studentId} in ${batchId}`);
    }
    seenStudents.add(uniqueKey);

    const gpas = {};
    for (let semester = 1; semester <= 8; semester += 1) {
      const columnIndex = headers.indexOf(`GPA_S${semester}`);
      const rawValue = columnIndex === -1 ? "" : columns[columnIndex];
      if (!rawValue) continue;
      const gpa = Number(rawValue);
      if (!Number.isFinite(gpa) || gpa < 0 || gpa > 4) {
        throw new Error(`Invalid GPA for ${studentId} in semester ${semester}: ${rawValue}`);
      }
      gpas[semester] = gpa;
    }

    if (!batchGroups[batchId]) batchGroups[batchId] = [];
    batchGroups[batchId].push({ id: studentId, gpas });
  }

  const compiledBatches = {};
  Object.keys(batchGroups).sort().forEach((batchId) => {
    const students = batchGroups[batchId];
    const maxSemester = students.reduce((currentMax, student) => {
      const semesters = Object.keys(student.gpas).map(Number);
      return Math.max(currentMax, ...semesters, 0);
    }, 0);
    const semesterMaps = Array.from({ length: maxSemester }, () => ({}));
    students.forEach((student) => {
      Object.entries(student.gpas).forEach(([semester, gpa]) => {
        semesterMaps[Number(semester) - 1][student.id] = gpa;
      });
    });
    compiledBatches[batchId] = { label: batchId, semesters: semesterMaps, students: null };
  });

  return compiledBatches;
}

module.exports = { compileCsv };

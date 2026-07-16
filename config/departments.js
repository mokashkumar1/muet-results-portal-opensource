// config/departments.js

window.DEPARTMENTS = [
  { code: "cs",          label: "Computer Science",                    prefixes: ["BSCS"], slug: "computer-science" },
  { code: "cse",         label: "Computer Systems Engineering",         prefixes: ["CS"],   slug: "computer-systems-engineering" },
  { code: "ar",          label: "Architecture",                        prefixes: ["AR"],   slug: "architecture" },
  { code: "ai",          label: "Artificial Intelligence",             prefixes: ["BSAI"], slug: "artificial-intelligence" },
  { code: "bm",          label: "Biomedical Engineering",              prefixes: ["BM"],   slug: "biomedical-engineering" },
  { code: "bba",         label: "Business Administration",             prefixes: ["BBA"],  slug: "business-administration" },
  { code: "crp",         label: "City & Regional Planning",            prefixes: ["CRP"],  slug: "city-regional-planning" },
  { code: "ce",          label: "Civil Engineering",                   prefixes: ["CE"],   slug: "civil-engineering" },
  { code: "cys",         label: "Cyber Security",                      prefixes: ["BSCYS"],slug: "cyber-security" },
  { code: "ee",          label: "Environmental Engineering",           prefixes: ["EE"],   slug: "environmental-engineering" },
  { code: "eet",         label: "Electrical Engineering Technology",   prefixes: ["BSEET"],slug: "electrical-engineering-technology" },
  { code: "el",          label: "Electrical Engineering",              prefixes: ["EL"],   slug: "electrical-engineering" },
  { code: "es-eng",      label: "Electronics Engineering",             prefixes: ["ES"],   slug: "electronics-engineering" },
  { code: "es-sci",      label: "Environmental Sciences",              prefixes: ["BSES"], slug: "environmental-sciences" },
  { code: "in",          label: "Industrial & Management Engineering", prefixes: ["IN"],   slug: "industrial-management-engineering" },
  { code: "bsm",         label: "Mathematics",                         prefixes: ["BSM"],  slug: "mathematics" },
  { code: "me",          label: "Mechanical Engineering",              prefixes: ["ME"],   slug: "mechanical-engineering" },
  { code: "mte",         label: "Mechatronics Engineering",            prefixes: ["MTE"],  slug: "mechatronics-engineering" },
  { code: "mt",          label: "Metallurgy & Materials Engineering",  prefixes: ["MT"],   slug: "metallurgy-materials-engineering" },
  { code: "mn",          label: "Mining Engineering",                  prefixes: ["MN"],   slug: "mining-engineering" },
  { code: "pg",          label: "Petroleum & Natural Gas Engineering", prefixes: ["PG"],   slug: "petroleum-natural-gas-engineering" },
  { code: "sw",          label: "Software Engineering",                prefixes: ["BSE", "SW"], slug: "software-engineering" },
  { code: "tl",          label: "Telecommunication Engineering",       prefixes: ["TL"],   slug: "telecommunication-engineering" },
  { code: "te",          label: "Textile Engineering",                 prefixes: ["TE"],   slug: "textile-engineering" },
  { code: "ch",          label: "Chemical Engineering",                prefixes: ["CH"],   slug: "chemical-engineering" },
];

// Auto-detect available departments based on loaded data
window.AVAILABLE_DEPARTMENTS = [];
window.DEPARTMENT_DATA_PRIORITY = {};
if (typeof generatedBatches !== 'undefined') {
  const availableCodes = new Set();
  const batchNames = Object.keys(generatedBatches);
  
  // Sort departments by prefix length to ensure exact matches (e.g. BSCS before CS)
  const sortedDepts = [...window.DEPARTMENTS].sort((a, b) => {
    const maxA = Math.max(...a.prefixes.map(p => p.length));
    const maxB = Math.max(...b.prefixes.map(p => p.length));
    return maxB - maxA; 
  });

  batchNames.forEach(batch => {
    const withoutYear = batch.replace(/^\d+-?\d*/, "").toUpperCase();
    const yearMatch = batch.match(/^(\d{2})/);
    const batchYear = yearMatch ? parseInt(yearMatch[1], 10) : 0;

    for (const dept of sortedDepts) {
      if (dept.prefixes.some(prefix => withoutYear.startsWith(prefix))) {
        availableCodes.add(dept.code);
        window.DEPARTMENT_DATA_PRIORITY[dept.code] = Math.max(
          window.DEPARTMENT_DATA_PRIORITY[dept.code] || 0,
          batchYear
        );
        break;
      }
    }
  });
  
  window.AVAILABLE_DEPARTMENTS = Array.from(availableCodes);
} else {
  // Fallback if data.js isn't loaded yet
  window.AVAILABLE_DEPARTMENTS = ["cs", "cse"];
}

// Sort DEPARTMENTS to put available ones at the top
window.DEPARTMENTS.sort((a, b) => {
  const aAvail = window.AVAILABLE_DEPARTMENTS.includes(a.code);
  const bAvail = window.AVAILABLE_DEPARTMENTS.includes(b.code);
  if (aAvail && !bAvail) return -1;
  if (!aAvail && bAvail) return 1;
  if (aAvail && bAvail) {
    const yearDiff = (window.DEPARTMENT_DATA_PRIORITY[b.code] || 0) - (window.DEPARTMENT_DATA_PRIORITY[a.code] || 0);
    if (yearDiff !== 0) return yearDiff;
  }
  return a.label.localeCompare(b.label);
});
window.isAvailable = function(code) {
  return window.AVAILABLE_DEPARTMENTS.includes(code);
};

window.getDepartmentBySlug = function(slug) {
  if (!slug) return null;
  return window.DEPARTMENTS.find(d => d.slug === slug.toLowerCase()) || null;
};

window.getDepartmentByCode = function(code) {
  if (!code) return null;
  return window.DEPARTMENTS.find(d => d.code === code.toLowerCase()) || null;
};

window.detectDepartmentFromRoll = function(rollNumber) {
  if (!rollNumber) return null;
  const cleaned = rollNumber.trim().toUpperCase();
  const withoutYear = cleaned.replace(/^\d+-?\d*/, "");

  const sorted = [...window.DEPARTMENTS].sort((a, b) => {
    const maxA = Math.max(...a.prefixes.map(p => p.length));
    const maxB = Math.max(...b.prefixes.map(p => p.length));
    return maxB - maxA; 
  });

  for (const dept of sorted) {
    for (const prefix of dept.prefixes) {
      if (withoutYear.startsWith(prefix)) {
        return dept;
      }
    }
  }
  return null;
};

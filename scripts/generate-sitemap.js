const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'university.json'), 'utf8'));
const SITE_URL = process.env.SITE_URL || config.SITE_URL;
const lastmod = new Date().toISOString().slice(0, 10);

// Read CSV file directly
const csvPath = path.join(__dirname, '..', 'data', 'dummy_dataset.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

// Read departments.js to get department definitions (no duplicate code!)
const deptFileContent = fs.readFileSync(path.join(__dirname, '..', 'config', 'departments.js'), 'utf8');
const deptsMatch = deptFileContent.match(/window\.DEPARTMENTS\s*=\s*(\[[\s\S]*?\]);/);
let departments = [];
if (deptsMatch) {
    departments = eval(deptsMatch[1]);
}

const studentIds = new Set();
const batches = new Set();
const availableDepts = new Set();

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const studentId = cols[0];
    const batchVal = cols[1];
    const deptVal = cols[2];
    
    if (studentId && batchVal && deptVal) {
        studentIds.add(studentId);
        
        const batchId = `${batchVal}${deptVal}`;
        batches.add(batchId);
        
        // Find matching department by prefix
        const withoutYear = batchId.replace(/^\d+/, "").toUpperCase();
        const matchedDept = departments.find(d => d.prefixes.some(p => withoutYear.startsWith(p)));
        if (matchedDept) {
            availableDepts.add(matchedDept.slug);
        }
    }
}

const sortedStudentIds = Array.from(studentIds).sort();
const sortedBatches = Array.from(batches).sort();
const sortedDepts = Array.from(availableDepts).sort();

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core pages -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/departments</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/gpa-calculator</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/cgpa-calculator</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/grade-system</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/privacy-policy</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/academic-calendar</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/faq</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;

// Add dynamic department landing pages
sortedDepts.forEach(slug => {
  xml += `  <url>
    <loc>${SITE_URL}/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
});

// Add dynamic batch ranking pages
sortedBatches.forEach(batch => {
  xml += `  <url>
    <loc>${SITE_URL}/ranking/${batch}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
});

xml += `</urlset>
`;

fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml updated: successfully generated ${sortedDepts.length} department paths, ${sortedBatches.length} batch ranking paths, and core pages.`);

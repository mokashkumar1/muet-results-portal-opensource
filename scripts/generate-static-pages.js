const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'university.json'), 'utf8'));
const SITE_URL = process.env.SITE_URL || config.SITE_URL;
const lastmod = new Date().toISOString().slice(0, 10);

console.log('=== Starting Static Page Pre-rendering ===');

// 1. Read index.html as a template
const templatePath = path.join(__dirname, '..', 'index.html');
if (!fs.existsSync(templatePath)) {
    console.error('❌ Error: index.html template not found.');
    process.exit(1);
}
const template = fs.readFileSync(templatePath, 'utf8');

// 2. Read CSV and department list to resolve available batches and departments
const csvPath = path.join(__dirname, '..', 'data', 'dummy_dataset.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
const headers = lines[0].split(',').map(h => h.trim());

const deptFileContent = fs.readFileSync(path.join(__dirname, '..', 'config', 'departments.js'), 'utf8');
const deptsMatch = deptFileContent.match(/window\.DEPARTMENTS\s*=\s*(\[[\s\S]*?\]);/);
let departments = [];
if (deptsMatch) {
    // Safely evaluate departments list
    departments = eval(deptsMatch[1]);
}

const batchGroups = {};
const availableDepts = new Set();

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const studentId = cols[0];
    const batchVal = cols[1];
    const deptVal = cols[2];
    
    if (studentId && batchVal && deptVal) {
        const batchId = `${batchVal}${deptVal}`;
        if (!batchGroups[batchId]) {
            batchGroups[batchId] = [];
        }
        
        const gpas = {};
        for (let sem = 1; sem <= 8; sem++) {
            const headerName = `GPA_S${sem}`;
            const headerIndex = headers.indexOf(headerName);
            if (headerIndex !== -1 && cols[headerIndex]) {
                const gpaVal = parseFloat(cols[headerIndex]);
                if (!isNaN(gpaVal)) {
                    gpas[sem] = gpaVal;
                }
            }
        }
        
        batchGroups[batchId].push({
            id: studentId,
            gpas: gpas
        });
        
        const withoutYear = batchId.replace(/^\d+/, "").toUpperCase();
        const matchedDept = departments.find(d => d.prefixes.some(p => withoutYear.startsWith(p)));
        if (matchedDept) {
            availableDepts.add(matchedDept);
        }
    }
}

// 3. Helper function to replace title, meta description, canonical, and dynamic script in head
function buildHtmlForRoute(pageConfig, activeViewId, bodyModification = null) {
    let html = template;
    const title = pageConfig.title;
    const description = pageConfig.description;
    const pathUrl = SITE_URL + (pageConfig.path === '/' ? '' : pageConfig.path);

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);

    // Replace Meta Description
    html = html.replace(/<meta name="description"\s+content=".*?">/, `<meta name="description" content="${description}">`);

    // Replace Open Graph / Twitter Tags
    html = html.replace(/<meta property="og:title"\s+content=".*?">/, `<meta property="og:title" content="${title}">`);
    html = html.replace(/<meta property="og:description"\s+content=".*?">/, `<meta property="og:description" content="${description}">`);
    html = html.replace(/<meta property="og:url"\s+content=".*?">/, `<meta property="og:url" content="${pathUrl}">`);
    html = html.replace(/<meta name="twitter:title"\s+content=".*?">/, `<meta name="twitter:title" content="${title}">`);
    html = html.replace(/<meta name="twitter:description"\s+content=".*?">/, `<meta name="twitter:description" content="${description}">`);

    // Replace Canonical Link
    html = html.replace(/<link rel="canonical"\s+href=".*?">/, `<link rel="canonical" href="${pathUrl}">`);

    // Replace JSON-LD Schema
    const schemaHtml = `<script type="application/ld+json">\n${JSON.stringify({
        "@context": "https://schema.org",
        "@graph": pageConfig.schemaGraph
    }, null, 2)}\n</script>`;
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, schemaHtml);

    // Toggle active classes on view sections
    // Default main page has searchView as active. We need to set it to hidden and activate activeViewId if it's different.
    if (activeViewId !== 'searchView') {
        html = html.replace('id="searchView" class="view active"', 'id="searchView" class="view hidden"');
        html = html.replace(`id="${activeViewId}" class="view hidden`, `id="${activeViewId}" class="view active`);
    }

    if (bodyModification) {
        html = bodyModification(html);
    }

    return html;
}

// 4. Core Pages List
const corePages = [
    {
        route: '/academic-calendar',
        viewId: 'academicCalendarView',
        config: {
            title: 'MUET Academic Calendar 2026-27 | MUET Results Portal',
            description: 'Check Mehran University\'s official academic calendar for the 2026–27 academic year. Find class start dates, exam schedules, vacations, and FAQs.',
            path: '/academic-calendar',
            schemaGraph: [
                {
                    "@type": "Organization",
                    "@id": `${SITE_URL}/#organization`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`
                },
                {
                    "@type": "WebSite",
                    "@id": `${SITE_URL}/#website`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`
                },
                {
                    "@type": "WebPage",
                    "@id": `${SITE_URL}/academic-calendar#webpage`,
                    "url": `${SITE_URL}/academic-calendar`,
                    "name": "MUET Academic Calendar 2026-27 | MUET Results Portal",
                    "description": "Check Mehran University's official academic calendar for the 2026–27 academic year. Find class start dates, exam schedules, vacations, and FAQs.",
                    "isPartOf": { "@id": `${SITE_URL}/#website` }
                },
                {
                    "@type": "BreadcrumbList",
                    "@id": `${SITE_URL}/#breadcrumb`,
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                        { "@type": "ListItem", "position": 2, "name": "Academic Calendar 2026-27", "item": `${SITE_URL}/academic-calendar` }
                    ]
                },
                {
                    "@type": "FAQPage",
                    "@id": `${SITE_URL}/academic-calendar#faq`,
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": "When do Fall 2026 classes begin?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "According to the official MUET Academic Calendar 2026–27, classes for the Fall 2026 semester will start on July 20, 2026."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "When are Mid Semester Exams for Fall 2026?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Mid Semester examinations for the Fall 2026 term are scheduled to begin on September 14, 2026."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "When are Final Exams scheduled?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Final Semester examinations for Fall 2026 will start on November 16, 2026. For Spring 2027, the Final examinations will commence on April 26, 2027."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "When will results be announced?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Provisional results are scheduled to be announced on December 8, 2026 for Fall 2026, and on May 19, 2027 for Spring 2027."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "When does Spring 2027 start?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Classes for the Spring 2027 semester will start immediately after results, on December 9, 2026."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "When is the Summer Semester 2027?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "The Summer Semester 2027 (remedial/improvement session) is scheduled to run from May 24, 2027 to July 16, 2027."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "Where can I find official academic calendar updates?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "You can find official notifications, changes, or revisions on the Mehran University Examination Department notices or by visiting the official university portal at muet.edu.pk."
                            }
                        }
                    ]
                },
                {
                    "@type": "ImageObject",
                    "@id": `${SITE_URL}/academic-calendar#image`,
                    "url": `${SITE_URL}/Academic%20Calendar%202026-27.jpeg`,
                    "contentUrl": `${SITE_URL}/Academic%20Calendar%202026-27.jpeg`,
                    "caption": "Official MUET Academic Calendar 2026-27 for Bachelor Degree Programs",
                    "description": "Scanned copy of Mehran University's official academic calendar timeline for Bachelor batches."
                }
            ]
        }
    },
    {
        route: '/privacy-policy',
        viewId: 'privacyPolicyView',
        config: {
            title: 'Privacy Policy | MUET Results Portal',
            description: 'Learn about our data parsing, non-storage policies, and privacy-first results checking.',
            path: '/privacy-policy',
            schemaGraph: [
                {
                    "@type": "Organization",
                    "@id": `${SITE_URL}/#organization`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`
                },
                {
                    "@type": "WebSite",
                    "@id": `${SITE_URL}/#website`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`
                },
                {
                    "@type": "WebPage",
                    "@id": `${SITE_URL}/privacy-policy#webpage`,
                    "url": `${SITE_URL}/privacy-policy`,
                    "name": "Privacy Policy | MUET Results Portal",
                    "description": "Learn about our data parsing, non-storage policies, and privacy-first results checking.",
                    "isPartOf": { "@id": `${SITE_URL}/#website` }
                },
                {
                    "@type": "BreadcrumbList",
                    "@id": `${SITE_URL}/#breadcrumb`,
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                        { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": `${SITE_URL}/privacy-policy` }
                    ]
                }
            ]
        }
    },
    {
        route: '/about',
        viewId: 'aboutView',
        config: {
            title: 'About | MUET Results Portal',
            description: 'Learn more about the MUET Results Portal, supported departments, and academic rankings calculations.',
            path: '/about',
            schemaGraph: [
                {
                    "@type": "Organization",
                    "@id": `${SITE_URL}/#organization`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`,
                    "description": "Student result lookup and batch ranking portal for Mehran University of Engineering and Technology (MUET) programmes."
                },
                {
                    "@type": "WebSite",
                    "@id": `${SITE_URL}/#website`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`,
                    "publisher": { "@id": `${SITE_URL}/#organization` }
                },
                {
                    "@type": "WebPage",
                    "@id": `${SITE_URL}/about#webpage`,
                    "url": `${SITE_URL}/about`,
                    "name": "About | MUET Results Portal",
                    "description": "Learn more about the MUET Results Portal, supported departments, and academic rankings calculations.",
                    "isPartOf": { "@id": `${SITE_URL}/#website` }
                },
                {
                    "@type": "BreadcrumbList",
                    "@id": `${SITE_URL}/#breadcrumb`,
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                        { "@type": "ListItem", "position": 2, "name": "About", "item": `${SITE_URL}/about` }
                    ]
                }
            ]
        }
    },
    {
        route: '/faq',
        viewId: 'faqView',
        config: {
            title: 'FAQs | MUET Results Portal',
            description: 'Frequently Asked Questions about MUET Results Portal, GPA checking, leaderboards, and data sources.',
            path: '/faq',
            schemaGraph: [
                {
                    "@type": "Organization",
                    "@id": `${SITE_URL}/#organization`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`
                },
                {
                    "@type": "WebSite",
                    "@id": `${SITE_URL}/#website`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`
                },
                {
                    "@type": "WebPage",
                    "@id": `${SITE_URL}/faq#webpage`,
                    "url": `${SITE_URL}/faq`,
                    "name": "FAQs | MUET Results Portal",
                    "isPartOf": { "@id": `${SITE_URL}/#website` }
                },
                {
                    "@type": "FAQPage",
                    "@id": `${SITE_URL}/faq#faq`,
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": "How can I use this MUET Result Checker online?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "Simply select your batch (e.g. 23CS or 24BSCS), input your official roll number, and click Lookup Record."
                            }
                        },
                        {
                            "@type": "Question",
                            "name": "Are these official Mehran University results?",
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": "This is an independent informational student utility. Sourced from officially published examination announcements."
                            }
                        }
                    ]
                },
                {
                    "@type": "BreadcrumbList",
                    "@id": `${SITE_URL}/#breadcrumb`,
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                        { "@type": "ListItem", "position": 2, "name": "FAQs", "item": `${SITE_URL}/faq` }
                    ]
                }
            ]
        }
    },
    {
        route: '/gpa-calculator',
        viewId: 'gpaCalculatorView',
        config: {
            title: 'MUET GPA Calculator | MUET Results Portal',
            description: 'Calculate your semester GPA using Mehran University\'s official grading system. Fast and accurate GPA tool.',
            path: '/gpa-calculator',
            schemaGraph: [
                {
                    "@type": "Organization",
                    "@id": `${SITE_URL}/#organization`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`
                },
                {
                    "@type": "WebSite",
                    "@id": `${SITE_URL}/#website`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`
                },
                {
                    "@type": "WebPage",
                    "@id": `${SITE_URL}/gpa-calculator#webpage`,
                    "url": `${SITE_URL}/gpa-calculator`,
                    "name": "MUET GPA Calculator | MUET Results Portal",
                    "isPartOf": { "@id": `${SITE_URL}/#website` }
                },
                {
                    "@type": "BreadcrumbList",
                    "@id": `${SITE_URL}/#breadcrumb`,
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                        { "@type": "ListItem", "position": 2, "name": "GPA Calculator", "item": `${SITE_URL}/gpa-calculator` }
                    ]
                }
            ]
        }
    },
    {
        route: '/departments',
        viewId: 'departmentsView',
        config: {
            title: 'Academic Departments | MUET Results Portal',
            description: 'Browse supported academic departments at Mehran University of Engineering and Technology, Jamshoro. View batch results and GPAs.',
            path: '/departments',
            schemaGraph: [
                {
                    "@type": "Organization",
                    "@id": `${SITE_URL}/#organization`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`
                },
                {
                    "@type": "WebSite",
                    "@id": `${SITE_URL}/#website`,
                    "name": "MUET Results Portal",
                    "url": `${SITE_URL}/`
                },
                {
                    "@type": "CollectionPage",
                    "@id": `${SITE_URL}/departments#webpage`,
                    "url": `${SITE_URL}/departments`,
                    "name": "Academic Departments | MUET Results Portal",
                    "isPartOf": { "@id": `${SITE_URL}/#website` }
                },
                {
                    "@type": "BreadcrumbList",
                    "@id": `${SITE_URL}/#breadcrumb`,
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                        { "@type": "ListItem", "position": 2, "name": "Departments", "item": `${SITE_URL}/departments` }
                    ]
                }
            ]
        }
    }
];

// Write Core Pages
corePages.forEach(page => {
    const dir = path.join(__dirname, '..', page.route.replace(/^\//, ''));
    fs.mkdirSync(dir, { recursive: true });
    
    // Custom body modifier to make sure active lists load statically (like on /departments)
    let modifier = null;
    if (page.route === '/departments') {
        modifier = (html) => {
            // Pre-inject some active departments so the page has list content statically
            let activeItemsHtml = '';
            let inactiveItemsHtml = '';
            
            departments.forEach(dept => {
                const deptBatches = Object.keys(batchGroups).filter(key => {
                    const prefix = key.replace(/^\d+/, "");
                    return dept.prefixes.includes(prefix);
                }).sort();
                
                const isAvail = deptBatches.length > 0;
                
                if (isAvail) {
                    activeItemsHtml += `
                        <li class="gpa-card" style="margin: 0; border: 1px solid var(--border-light); padding: 20px; display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; align-items: flex-start; gap: 12px;">
                                <i class="ri-bank-line" style="color: var(--accent); font-size: 24px;"></i>
                                <div>
                                    <h4 style="font-size: 16px; font-weight: 700; margin: 0; color: var(--text-primary);">${dept.label}</h4>
                                    <span style="font-size: 12px; color: var(--text-secondary);">Prefixes: ${dept.prefixes.join(", ")}</span>
                                </div>
                            </div>
                            <div style="font-size: 13px; color: var(--text-secondary);">
                                Active Batches: <strong>${deptBatches.join(" · ")}</strong>
                            </div>
                            <div style="margin-top: auto; padding-top: 8px;">
                                <a href="/${dept.slug}" class="primary-btn" style="text-decoration: none; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; width: 100%;">
                                    Check Results <i class="ri-arrow-right-line"></i>
                                </a>
                            </div>
                        </li>
                    `;
                } else {
                    inactiveItemsHtml += `
                        <li style="background: var(--control-muted-bg); border: 1px dashed var(--border-light); border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; gap: 12px;">
                            <i class="ri-bank-line" style="color: var(--text-secondary); font-size: 20px;"></i>
                            <div style="flex: 1;">
                                <h4 style="font-size: 14px; font-weight: 600; margin: 0; color: var(--text-primary);">${dept.label}</h4>
                                <span style="font-size: 11px; color: var(--text-secondary);">Prefix: ${dept.prefixes.join(", ")}</span>
                            </div>
                            <span class="dept-status-pill coming" style="font-size: 10px; padding: 2px 6px;">Coming Soon</span>
                        </li>
                    `;
                }
            });
            
            html = html.replace(/<ul id="departmentsActiveList"[^>]*>([\s\S]*?)<\/ul>/, `<ul id="departmentsActiveList" style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">${activeItemsHtml}</ul>`);
            html = html.replace(/<ul id="departmentsInactiveList"[^>]*>([\s\S]*?)<\/ul>/, `<ul id="departmentsInactiveList" style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">${inactiveItemsHtml}</ul>`);
            return html;
        };
    }
    
    const renderedHtml = buildHtmlForRoute(page.config, page.viewId, modifier);
    fs.writeFileSync(path.join(dir, 'index.html'), renderedHtml, 'utf8');
    console.log(`✅ Pre-rendered core page: ${page.route}`);
});

// 5. Pre-render Dynamic Department Landing Pages
departments.forEach(dept => {
    const deptBatches = Object.keys(batchGroups).filter(key => {
        const prefix = key.replace(/^\d+/, "");
        return dept.prefixes.includes(prefix);
    }).sort();
    
    // Only pre-render active ones!
    if (deptBatches.length === 0) return;

    const dir = path.join(__dirname, '..', dept.slug);
    fs.mkdirSync(dir, { recursive: true });

    const pageConfig = {
        title: `MUET ${dept.label} Results & Rankings | MUET Results Portal`,
        description: `Check Mehran University semester results, batch rankings, and student list for the ${dept.label} program at MUET Jamshoro.`,
        path: `/${dept.slug}`,
        schemaGraph: [
            {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                "name": "MUET Results Portal",
                "url": `${SITE_URL}/`
            },
            {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                "name": "MUET Results Portal",
                "url": `${SITE_URL}/`
            },
            {
                "@type": "WebPage",
                "@id": `${SITE_URL}/${dept.slug}#webpage`,
                "url": `${SITE_URL}/${dept.slug}`,
                "name": `MUET ${dept.label} Results & Rankings | MUET Results Portal`,
                "description": `Check Mehran University semester results, batch rankings, and student list for the ${dept.label} program at MUET Jamshoro.`,
                "isPartOf": { "@id": `${SITE_URL}/#website` }
            },
            {
                "@type": "FAQPage",
                "@id": `${SITE_URL}/${dept.slug}#faq`,
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": `How can I check MUET ${dept.label} semester results?`,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `Choose your batch under the ${dept.label} department, input your roll number, and click Lookup Record.`
                        }
                    }
                ]
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${SITE_URL}/#breadcrumb`,
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                    { "@type": "ListItem", "position": 2, "name": dept.label, "item": `${SITE_URL}/${dept.slug}` }
                ]
            }
        ]
    };

    const modifier = (html) => {
        // Change the current department label on search form statically
        html = html.replace(/<span id="currentDeptLabel">.*?<\/span>/, `<span id="currentDeptLabel">${dept.label}</span>`);
        
        // Populate specific batches options statically
        let batchOptions = '';
        deptBatches.forEach(b => {
            batchOptions += `<option value="${b}">${b}</option>`;
        });
        html = html.replace(/<select id="batchSelect">[\s\S]*?<\/select>/, `<select id="batchSelect">${batchOptions}</select>`);
        return html;
    };

    const renderedHtml = buildHtmlForRoute(pageConfig, 'searchView', modifier);
    fs.writeFileSync(path.join(dir, 'index.html'), renderedHtml, 'utf8');
    console.log(`✅ Pre-rendered department page: /${dept.slug}`);
});

// 6. Pre-render Dynamic Batch Rankings Pages
Object.entries(batchGroups).forEach(([batchKey, students]) => {
    // Process ranking lists for static HTML
    const processed = [];
    students.forEach(s => {
        const semesterGpas = Object.values(s.gpas);
        const cgpa = semesterGpas.length > 0 ? semesterGpas.reduce((sum, g) => sum + g, 0) / semesterGpas.length : 0;
        processed.push({
            id: s.id,
            cgpa: cgpa,
            semesters: s.gpas
        });
    });

    processed.sort((a, b) => b.cgpa - a.cgpa);

    let rank = 0;
    let prevCgpa = null;
    let matrixRowsHtml = '';

    // Calculate maximum semester number to render headers correctly
    let maxSems = 0;
    processed.forEach(s => {
        const semKeys = Object.keys(s.semesters).map(Number);
        if (semKeys.length > 0) {
            maxSems = Math.max(maxSems, ...semKeys);
        }
    });

    processed.forEach(s => {
        const cgpaRounded = Math.round(s.cgpa * 100) / 100;
        if (prevCgpa === null || cgpaRounded !== prevCgpa) {
            rank++;
            prevCgpa = cgpaRounded;
        }

        let rankBadge = '';
        let tierClass = '';
        if (rank === 1) { rankBadge = '<span class="rank-badge gold"><i class="ri-medal-fill"></i> 1st</span>'; tierClass = 'top-1'; }
        else if (rank === 2) { rankBadge = '<span class="rank-badge silver"><i class="ri-medal-fill"></i> 2nd</span>'; tierClass = 'top-2'; }
        else if (rank === 3) { rankBadge = '<span class="rank-badge bronze"><i class="ri-medal-fill"></i> 3rd</span>'; tierClass = 'top-3'; }
        else if (rank <= 10) { rankBadge = '<span class="rank-badge top10">Top 10</span>'; tierClass = 'top-10'; }

        let semCells = '';
        for (let i = 1; i <= maxSems; i++) {
            const gpa = s.semesters[i];
            semCells += `<td>${gpa > 0 ? gpa.toFixed(2) : '—'}</td>`;
        }

        let grade = 'C';
        if (s.cgpa >= 3.8) grade = 'A+';
        else if (s.cgpa >= 3.5) grade = 'A';
        else if (s.cgpa >= 3.0) grade = 'B';

        matrixRowsHtml += `<tr class="rank-row ${tierClass}" data-id="${s.id}">
            <td class="col-rank">#${rank} ${rankBadge}</td>
            <td class="col-id">${s.id}</td>
            ${semCells}
            <td class="col-cgpa">${s.cgpa.toFixed(2)}</td>
            <td>${grade}</td>
        </tr>`;
    });

    // Build headers
    let matrixHeadHtml = '<tr><th class="col-rank">Rank</th><th class="col-id">ID.No</th>';
    for (let i = 1; i <= maxSems; i++) {
        matrixHeadHtml += `<th>Sem ${i}</th>`;
    }
    matrixHeadHtml += '<th class="sort-active">CGPA</th><th>Grade</th></tr>';

    const dir = path.join(__dirname, '..', 'ranking', batchKey);
    fs.mkdirSync(dir, { recursive: true });

    const pageConfig = {
        title: `MUET ${batchKey} Batch Rankings & Leaderboard | MUET Results`,
        description: `MUET ${batchKey} batch rankings and semester result matrix for Mehran University students. Check rankings online.`,
        path: `/ranking/${batchKey}`,
        schemaGraph: [
            {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                "name": "MUET Results Portal",
                "url": `${SITE_URL}/`
            },
            {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                "name": "MUET Results Portal",
                "url": `${SITE_URL}/`
            },
            {
                "@type": "CollectionPage",
                "@id": `${SITE_URL}/ranking/${batchKey}#webpage`,
                "url": `${SITE_URL}/ranking/${batchKey}`,
                "name": `MUET ${batchKey} Batch Rankings & Leaderboard | MUET Results`,
                "isPartOf": { "@id": `${SITE_URL}/#website` }
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${SITE_URL}/#breadcrumb`,
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
                    { "@type": "ListItem", "position": 2, "name": `${batchKey} Rankings`, "item": `${SITE_URL}/ranking/${batchKey}` }
                ]
            }
        ]
    };

    const modifier = (html) => {
        // Render headers and rows statically
        html = html.replace('<thead id="matrixHead"></thead>', `<thead id="matrixHead">${matrixHeadHtml}</thead>`);
        html = html.replace('<tbody id="matrixBody"></tbody>', `<tbody id="matrixBody">${matrixRowsHtml}</tbody>`);
        
        // Show count
        const countText = `${students.length} students · sorted by <span class="rank-mode-pill"><i class="ri-sort-desc" style="font-size:11px"></i> Overall CGPA</span>`;
        html = html.replace('<span id="matrixCount" class="matrix-count"></span>', `<span id="matrixCount" class="matrix-count">${countText}</span>`);
        
        // Set dynamic links in ranking-links-row
        const withoutYear = batchKey.replace(/^\d+/, "").toUpperCase();
        const dept = departments.find(d => d.prefixes.some(p => withoutYear.startsWith(p)));
        if (dept) {
            html = html.replace('href="#" id="rankingDeptLink"', `href="/${dept.slug}" id="rankingDeptLink"`);
            html = html.replace('Department Search</a>', `Check ${dept.label} Results</a>`);
        }
        
        return html;
    };

    const renderedHtml = buildHtmlForRoute(pageConfig, 'rankingView', modifier);
    fs.writeFileSync(path.join(dir, 'index.html'), renderedHtml, 'utf8');
    console.log(`✅ Pre-rendered ranking page: /ranking/${batchKey}`);
});

console.log('=== Pre-rendering Completed Successfully ===');
process.exit(0);

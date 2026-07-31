(function () {
    const config = window.UNIVERSITY_CONFIG || {
        UNIVERSITY_NAME: "Demo University of Engineering & Technology",
        UNIVERSITY_SHORT_NAME: "DEMO-UNIV",
        SITE_TITLE: "Demo University Results Portal",
        SITE_URL: "https://demo-university-results.vercel.app",
        DEVELOPER_NAME: "Open Source Developer"
    };

    const SITE_URL = config.SITE_URL;

    const pages = {
        home: {
            title: `${config.SITE_TITLE} | ${config.UNIVERSITY_NAME}`,
            description: `Check semester results, batch rankings, and CGPA at ${config.UNIVERSITY_NAME}. Fast student result lookup portal.`,
            path: '/'
        },
        ranking: {
            title: `${config.UNIVERSITY_SHORT_NAME} Batch Rankings | ${config.SITE_TITLE}`,
            description: `View batch rankings, semester GPAs, and full academic matrix for ${config.UNIVERSITY_NAME} students.`,
            path: '/ranking'
        },
        result: {
            title: `${config.UNIVERSITY_SHORT_NAME} Student Result | Semester CGPA Lookup`,
            description: `Individual student result with semester breakdown, CGPA, grade, and batch rank for ${config.UNIVERSITY_NAME} students.`,
            path: '/result'
        },
        about: {
            title: `About | ${config.SITE_TITLE}`,
            description: `Learn more about the ${config.SITE_TITLE}, supported departments, and academic rankings calculations.`,
            path: '/about'
        },
        faq: {
            title: `FAQs | ${config.SITE_TITLE}`,
            description: `Frequently Asked Questions about ${config.SITE_TITLE}, GPA checking, leaderboards, and data sources.`,
            path: '/faq'
        },
        privacyPolicy: {
            title: `Privacy Policy | ${config.SITE_TITLE}`,
            description: `Learn about our commitment to privacy. ${config.SITE_TITLE} compiles academic results from public announcements and does not collect personal data.`,
            path: '/privacy-policy'
        },
        academicCalendar: {
            title: `${config.UNIVERSITY_SHORT_NAME} Academic Calendar | ${config.SITE_TITLE}`,
            description: `Check the official academic calendar for ${config.UNIVERSITY_NAME}. Find class start dates, exam schedules, vacations, and FAQs.`,
            path: '/academic-calendar'
        },
        gpaCalculator: {
            title: `${config.UNIVERSITY_SHORT_NAME} GPA Calculator | ${config.SITE_TITLE}`,
            description: `Calculate your semester GPA and CGPA using the official grading system. Fast and accurate GPA tool.`,
            path: '/gpa-calculator'
        },
        departmentsHub: {
            title: `Academic Departments | ${config.SITE_TITLE}`,
            description: `Browse supported academic departments at ${config.UNIVERSITY_NAME}. View batch results and GPAs.`,
            path: '/departments'
        }
    };

    function setMeta(name, content, isProperty) {
        const attr = isProperty ? 'property' : 'name';
        let el = document.querySelector(`meta[${attr}="${name}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    }

    function setCanonical(href) {
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'canonical';
            document.head.appendChild(link);
        }
        link.href = href;
    }

    function updateJsonLd(view, extra) {
        let el = document.getElementById('dynamic-jsonld');
        if (!el) {
            el = document.createElement('script');
            el.id = 'dynamic-jsonld';
            el.type = 'application/ld+json';
            document.head.appendChild(el);
        }

        const baseGraph = [
            {
                "@type": "Organization",
                "@id": SITE_URL + "/#organization",
                "name": "MUET Results Portal",
                "url": SITE_URL + "/",
                "description": "Student result lookup and batch ranking portal for Mehran University of Engineering and Technology (MUET) programmes.",
                "areaServed": "PK",
                "knowsAbout": ["Mehran University of Engineering and Technology", "MUET Semester Results"]
            },
            {
                "@type": "WebSite",
                "@id": SITE_URL + "/#website",
                "name": "MUET Results Portal",
                "url": SITE_URL + "/",
                "description": "MUET Semester Results, GPA, and batch rankings for Mehran University students.",
                "inLanguage": "en",
                "publisher": { "@id": SITE_URL + "/#organization" }
            }
        ];

        let breadcrumbs = [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/" }
        ];

        if (view === 'about') {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": "About",
                "item": `${SITE_URL}/about`
            });

            baseGraph.push({
                "@type": "WebPage",
                "@id": `${SITE_URL}/about#webpage`,
                "url": `${SITE_URL}/about`,
                "name": "About | MUET Results Portal",
                "description": "Learn more about the MUET Results Portal, supported departments, and academic rankings calculations.",
                "isPartOf": { "@id": SITE_URL + "/#website" }
            });
        } else if (view === 'faq') {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": "FAQ",
                "item": `${SITE_URL}/faq`
            });

            baseGraph.push({
                "@type": "WebPage",
                "@id": `${SITE_URL}/faq#webpage`,
                "url": `${SITE_URL}/faq`,
                "name": "FAQs | MUET Results Portal",
                "description": "Frequently Asked Questions about MUET Results Portal, GPA checking, leaderboards, and data sources.",
                "isPartOf": { "@id": SITE_URL + "/#website" }
            });
        } else if (view === 'privacyPolicy') {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": "Privacy Policy",
                "item": `${SITE_URL}/privacy-policy`
            });

            baseGraph.push({
                "@type": "WebPage",
                "@id": `${SITE_URL}/privacy-policy#webpage`,
                "url": `${SITE_URL}/privacy-policy`,
                "name": "Privacy Policy | MUET Results Portal",
                "description": "Learn about our data parsing, non-storage policies, and privacy-first results checking.",
                "isPartOf": { "@id": SITE_URL + "/#website" }
            });
        } else if (view === 'academicCalendar') {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": "Academic Calendar 2026-27",
                "item": `${SITE_URL}/academic-calendar`
            });

            baseGraph.push({
                "@type": "WebPage",
                "@id": `${SITE_URL}/academic-calendar#webpage`,
                "url": `${SITE_URL}/academic-calendar`,
                "name": "MUET Academic Calendar 2026-27 | MUET Results Portal",
                "description": "Check Mehran University's official academic calendar for the 2026–27 academic year. Find class start dates, exam schedules, vacations, and FAQs.",
                "isPartOf": { "@id": SITE_URL + "/#website" }
            });

            // FAQPage Schema
            baseGraph.push({
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
            });

            // ImageObject Schema
            baseGraph.push({
                "@type": "ImageObject",
                "@id": `${SITE_URL}/academic-calendar#image`,
                "url": `${SITE_URL}/Academic%20Calendar%202026-27.jpeg`,
                "contentUrl": `${SITE_URL}/Academic%20Calendar%202026-27.jpeg`,
                "caption": "Official MUET Academic Calendar 2026-27 for Bachelor Degree Programs",
                "description": "Scanned copy of Mehran University's official academic calendar timeline for Bachelor batches."
            });
        } else if (view === 'gpaCalculator') {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": "GPA Calculator",
                "item": `${SITE_URL}/gpa-calculator`
            });

            baseGraph.push({
                "@type": "WebPage",
                "@id": `${SITE_URL}/gpa-calculator#webpage`,
                "url": `${SITE_URL}/gpa-calculator`,
                "name": "MUET GPA Calculator | MUET Results Portal",
                "description": "Calculate your semester GPA and CGPA using Mehran University's official grading system.",
                "isPartOf": { "@id": SITE_URL + "/#website" }
            });

            // HowTo Schema for GPA calculation
            baseGraph.push({
                "@type": "HowTo",
                "@id": `${SITE_URL}/gpa-calculator#howto`,
                "name": "How to Calculate MUET GPA and CGPA",
                "description": "Step-by-step guide explaining how to calculate semester GPA and Cumulative CGPA using the official Mehran University grading system rules.",
                "totalTime": "PT5M",
                "step": [
                    {
                        "@type": "HowToStep",
                        "position": 1,
                        "name": "Identify Course Credit Hours and Grade Points",
                        "text": "For each semester course, find the course credit hours (e.g. 3 CH or 2 CH) and the corresponding grade points from your marks (e.g. A = 4.0, B = 3.0, C = 2.0).",
                        "url": `${SITE_URL}/gpa-calculator#step1`
                    },
                    {
                        "@type": "HowToStep",
                        "position": 2,
                        "name": "Calculate Course Quality Points",
                        "text": "Multiply the credit hours of each course by the grade points earned in that course. For example, a 3 CH course with an A grade (4.0 GP) yields 12 quality points.",
                        "url": `${SITE_URL}/gpa-calculator#step2`
                    },
                    {
                        "@type": "HowToStep",
                        "position": 3,
                        "name": "Sum Quality Points and Credit Hours",
                        "text": "Add all course quality points together. Independently, add the credit hours of all courses to find the total semester credit hours.",
                        "url": `${SITE_URL}/gpa-calculator#step3`
                    },
                    {
                        "@type": "HowToStep",
                        "position": 4,
                        "name": "Divide Total Quality Points by Total Credit Hours",
                        "text": "Divide the sum of your quality points by the sum of your total credit hours. The resulting number is your semester GPA.",
                        "url": `${SITE_URL}/gpa-calculator#step4`
                    }
                ]
            });
        } else if (view === 'departmentsHub') {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": "Departments",
                "item": `${SITE_URL}/departments`
            });

            baseGraph.push({
                "@type": "CollectionPage",
                "@id": `${SITE_URL}/departments#webpage`,
                "url": `${SITE_URL}/departments`,
                "name": "Academic Departments | MUET Results Portal",
                "description": "Browse supported academic departments at Mehran University of Engineering and Technology, Jamshoro. View batch results and GPAs.",
                "isPartOf": { "@id": SITE_URL + "/#website" },
                "about": {
                    "@type": "ItemList",
                    "numberOfItems": 25,
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Computer Science", "url": `${SITE_URL}/computer-science` },
                        { "@type": "ListItem", "position": 2, "name": "Computer Systems Engineering", "url": `${SITE_URL}/computer-systems-engineering` }
                    ]
                }
            });
        } else if (view === 'ranking' && extra) {
            const batchKey = extra.key || extra;
            const batchLabel = extra.label || `${batchKey} Batch`;
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": `${batchLabel} Rankings`,
                "item": `${SITE_URL}/ranking/${batchKey}`
            });

            baseGraph.push({
                "@type": "CollectionPage",
                "@id": `${SITE_URL}/ranking/${batchKey}#webpage`,
                "url": `${SITE_URL}/ranking/${batchKey}`,
                "name": `${config.UNIVERSITY_SHORT_NAME} ${batchLabel} Rankings & Leaderboard | ${config.SITE_TITLE}`,
                "description": `${config.UNIVERSITY_SHORT_NAME} ${batchLabel} batch rankings and semester result matrix for ${config.UNIVERSITY_NAME} students.`,
                "isPartOf": { "@id": SITE_URL + "/#website" }
            });

            // Dataset Schema for the ranking batch standing matrix
            baseGraph.push({
                "@type": "Dataset",
                "@id": `${SITE_URL}/ranking/${batchKey}#dataset`,
                "name": `${config.UNIVERSITY_SHORT_NAME} ${batchLabel} Standings and CGPA Dataset`,
                "description": `Academic standing, dense ranks, and cumulative GPA dataset of students enrolled in the ${config.UNIVERSITY_NAME} ${batchLabel} program.`,
                "license": "https://creativecommons.org/publicdomain/zero/1.0/",
                "creator": {
                    "@type": "Person",
                    "name": config.DEVELOPER_NAME
                },
                "distribution": [
                    {
                        "@type": "DataDownload",
                        "encodingFormat": "text/html",
                        "contentUrl": `${SITE_URL}/ranking/${batchKey}`
                    }
                ]
            });
        } else if (view === 'result' && extra && extra.id) {
            const batchKey = extra.batchKey || '23CS';
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": `${extra.batch || 'CS'} Batch`,
                "item": `${SITE_URL}/ranking/${batchKey}`
            });
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 3,
                "name": `${extra.id} Result`,
                "item": `${SITE_URL}/result/${extra.id}`
            });

            baseGraph.push({
                "@type": "WebPage",
                "@id": `${SITE_URL}/result/${extra.id}#webpage`,
                "url": `${SITE_URL}/result/${extra.id}`,
                "name": `${extra.id} MUET Result | ${extra.batch || 'CS'} CGPA & Rank`,
                "description": `MUET ${extra.batch || 'CS'} result for ${extra.id}: CGPA ${extra.cgpa}, batch rank #${extra.rank}. Mehran University semester results.`,
                "isPartOf": { "@id": SITE_URL + "/#website" }
            });
        } else if (view === 'department' && extra && extra.label) {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": `${extra.label} Results`,
                "item": `${SITE_URL}/${extra.slug}`
            });

            baseGraph.push({
                "@type": "WebPage",
                "@id": `${SITE_URL}/${extra.slug}#webpage`,
                "url": `${SITE_URL}/${extra.slug}`,
                "name": `MUET ${extra.label} Results & Rankings | MUET Results Portal`,
                "description": `Check Mehran University semester results, batch rankings, and student list for the ${extra.label} program at MUET Jamshoro.`,
                "isPartOf": { "@id": SITE_URL + "/#website" }
            });
        } else {
            breadcrumbs.push({
                "@type": "ListItem",
                "position": 2,
                "name": "Batch Lookup",
                "item": SITE_URL + "/"
            });
        }

        baseGraph.push({
            "@type": "BreadcrumbList",
            "@id": SITE_URL + "/#breadcrumb",
            "itemListElement": breadcrumbs
        });

        // Add the Static FAQ Schema to home/faq graph if relevant
        if (view === 'home' || view === 'faq') {
            baseGraph.push({
                "@type": "FAQPage",
                "@id": SITE_URL + (view === 'faq' ? "/faq" : "") + "#faq",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "How can I use this MUET Result Checker online?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Simply select your batch (e.g. 23CS or 24BSCS), input your official roll number (such as 23CS003 or 24BSCS015), and click Lookup Record. Your term GPA breakdown, overall CGPA, and batch standing will display instantly."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Are these official Mehran University results?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "This is an independent informational student utility. All academic performance data is securely parsed and compiled from officially published Mehran University of Engineering and Technology (MUET) Jamshoro Examination Department result announcements."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Can I view the entire batch result lists?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes! By clicking View Batch Rankings, you can access the full interactive academic matrix for your batch, search for peers, and sort rankings by CGPA or specific semesters."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Are supplementary and improvement exams included?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Data reflects standard semester examination announcements. Supplementary, reassessment, or improvement results might experience slight delays or omissions on this interface."
                        }
                    }
                ]
            });
        }

        if (view === 'department' && extra && extra.label) {
            baseGraph.push({
                "@type": "FAQPage",
                "@id": `${SITE_URL}/${extra.slug}#faq`,
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": `How can I check MUET ${extra.label} semester results?`,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `Choose your batch under the ${extra.label} department, input your roll number, and click Lookup Record to see your GPA and ranking instantly.`
                        }
                    },
                    {
                        "@type": "Question",
                        "name": `Where can I view the ${extra.label} batch ranking list?`,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `Click the View Overall Rankings button to access the full leaderboard and student result matrix sorted by CGPA.`
                        }
                    }
                ]
            });
        }

        el.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@graph": baseGraph
        }, null, 2);
    }

    window.updateSeoForView = function (view, extra) {
        const page = pages[view] || pages.home;
        let title = page.title;
        let description = page.description;
        let path = page.path;

        if (view === 'result' && extra && extra.id) {
            title = `${extra.id} MUET Result | ${extra.batch || 'CS'} CGPA & Rank`;
            description = `MUET ${extra.batch || 'CS'} result for ${extra.id}: CGPA ${extra.cgpa}, batch rank #${extra.rank}. Mehran University semester results.`;
            path = `/result/${extra.id}`;
        }
        if (view === 'ranking' && extra) {
            const batchKey = extra.key || extra;
            const batchLabel = extra.label || `${batchKey} Batch`;
            title = `MUET ${batchLabel} Rankings & Leaderboard | MUET Results`;
            description = `MUET ${batchLabel} batch rankings and semester result matrix for Mehran University students.`;
            path = `/ranking/${batchKey}`;
        }
        if (view === 'department' && extra && extra.label) {
            title = `MUET ${extra.label} Results & Rankings | MUET Results Portal`;
            description = `Check Mehran University semester results, batch rankings, and student list for the ${extra.label} program at MUET Jamshoro.`;
            path = `/${extra.slug}`;
        }

        document.title = title;
        setMeta('description', description);
        setMeta('og:title', title, true);
        setMeta('og:description', description, true);
        setMeta('og:url', SITE_URL + (path === '/' ? '' : path), true);
        setMeta('twitter:title', title);
        setMeta('twitter:description', description);
        setCanonical(SITE_URL + (path === '/' ? '' : path));

        // Dynamically inject schema
        updateJsonLd(view, extra);
    };

    // Initialize with home
    window.updateSeoForView('home');
})();

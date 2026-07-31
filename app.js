function gradeFromCgpa(cgpa) {
    if (cgpa >= 3.8) return "A+";
    if (cgpa >= 3.5) return "A";
    if (cgpa >= 3.0) return "B";
    return "C";
}

function buildBatchStudents(semesterMaps) {
    const allIds = new Set();
    semesterMaps.forEach(map => Object.keys(map).forEach(id => allIds.add(id)));

    const publishedSemestersCount = semesterMaps.length;

    const students = [];
    allIds.forEach(id => {
        const semesters = semesterMaps.map(map => map[id] || 0);
        const cgpa = publishedSemestersCount > 0
            ? semesters.reduce((sum, g) => sum + g, 0) / publishedSemestersCount
            : 0;

        students.push({
            id,
            semesters,
            cgpa,
            grade: gradeFromCgpa(cgpa)
        });
    });

    students.sort((a, b) => b.cgpa - a.cgpa);

    let rank = 0;
    let prevCgpa = null;

    students.forEach(s => {
        const cgpaRounded = Math.round(s.cgpa * 100) / 100;
        if (prevCgpa === null || cgpaRounded !== prevCgpa) {
            rank++;
            prevCgpa = cgpaRounded;
        }
        s.rank = rank;
    });

    return students;
}

const batches = generatedBatches;

Object.values(batches).forEach(batch => {
    batch.students = buildBatchStudents(batch.semesters);
    batch.semesterCount = batch.semesters.length;
});

function getBatchStats(batch) {
    const { students } = batch;
    const total = students.length;
    const avgCgpa = total
        ? students.reduce((sum, s) => sum + s.cgpa, 0) / total
        : 0;
    const highest = total ? students[0].cgpa : 0;
    const highPerformers = students.filter(s => s.cgpa >= 3.5).length;

    return { total, avgCgpa, highest, highPerformers };
}

function getRankBadge(rank) {
    if (rank === 1) return '<span class="rank-badge gold"><i class="ri-medal-fill"></i> 1st</span>';
    if (rank === 2) return '<span class="rank-badge silver"><i class="ri-medal-fill"></i> 2nd</span>';
    if (rank === 3) return '<span class="rank-badge bronze"><i class="ri-medal-fill"></i> 3rd</span>';
    if (rank <= 10) return '<span class="rank-badge top10">Top 10</span>';
    return '';
}

function getRowTierClass(rank) {
    if (rank === 1) return 'top-1';
    if (rank === 2) return 'top-2';
    if (rank === 3) return 'top-3';
    if (rank <= 10) return 'top-10';
    return '';
}

// Map Department Code to Icons
const DEPT_ICONS = {
    cs: "ri-computer-line",
    cse: "ri-cpu-line",
    ar: "ri-pencil-ruler-line",
    ai: "ri-brain-line",
    bm: "ri-heart-pulse-line",
    bba: "ri-briefcase-line",
    crp: "ri-map-2-line",
    ce: "ri-building-line",
    cys: "ri-shield-keyhole-line",
    ee: "ri-flashlight-line",
    eet: "ri-tools-line",
    el: "ri-cpu-fill",
    "es-eng": "ri-leaf-line",
    "es-sci": "ri-globe-line",
    in: "ri-settings-4-line",
    bsm: "ri-functions",
    me: "ri-settings-3-line",
    mte: "ri-robot-line",
    mt: "ri-contrast-drop-2-line",
    mn: "ri-hammer-line",
    pg: "ri-drop-line",
    sw: "ri-code-s-slash-line",
    tl: "ri-signal-tower-line",
    te: "ri-brush-line",
    ch: "ri-flask-line"
};

// UI Elements
const searchView = document.getElementById('searchView');
const resultView = document.getElementById('resultView');
const rankingView = document.getElementById('rankingView');
const aboutView = document.getElementById('aboutView');
const faqView = document.getElementById('faqView');
const gpaCalculatorView = document.getElementById('gpaCalculatorView');
const rollInput = document.getElementById('rollInput');
const batchSelect = document.getElementById('batchSelect');
const rankBatchSelect = document.getElementById('rankBatchSelect');
const rankBySelect = document.getElementById('rankBySelect');
const matrixSearchInput = document.getElementById('matrixSearchInput');
const searchBtn = document.getElementById('searchBtn');
const openRankingsBtn = document.getElementById('openRankingsBtn');
const backBtn = document.getElementById('backBtn');
const rankingBackBtn = document.getElementById('rankingBackBtn');
const aboutBackBtn = document.getElementById('aboutBackBtn');
const faqBackBtn = document.getElementById('faqBackBtn');
const departmentsView = document.getElementById('departmentsView');
const departmentsBackBtn = document.getElementById('departmentsBackBtn');
const privacyPolicyView = document.getElementById('privacyPolicyView');
const privacyPolicyBackBtn = document.getElementById('privacyPolicyBackBtn');
const academicCalendarView = document.getElementById('academicCalendarView');
const calendarBackBtn = document.getElementById('calendarBackBtn');
const viewInLeaderboardBtn = document.getElementById('viewInLeaderboardBtn');
const errorMsg = document.getElementById('errorMsg');

// GPA Calculator UI Elements
const navGpaLink = document.getElementById('navGpaLink');
const mobGpaLink = document.getElementById('mobGpaLink');
const addCourseBtn = document.getElementById('addCourseBtn');
const gpaCoursesBody = document.getElementById('gpaCoursesBody');
const gpaTotalCredits = document.getElementById('gpaTotalCredits');
const gpaTotalPoints = document.getElementById('gpaTotalPoints');
const gpaSemesterGpa = document.getElementById('gpaSemesterGpa');
const scrollToScaleBtn = document.getElementById('scrollToScaleBtn');

// Mobile GPA UI Elements
const gpaTheoryList = document.getElementById('gpaTheoryList');
const gpaPracticalList = document.getElementById('gpaPracticalList');
const addTheorySubjectBtn = document.getElementById('addTheorySubjectBtn');
const addPracticalSubjectBtn = document.getElementById('addPracticalSubjectBtn');

// Theme, mobile nav, and layout elements
const themeToggleBtn = document.getElementById("themeToggleBtn");
const hamburgerBtn = document.getElementById("hamburgerBtn");
const mobileNavMenu = document.getElementById("mobileNavMenu");

// Navigation Links
const navRankingsLink = document.getElementById("navRankingsLink");
const mobRankingsLink = document.getElementById("mobRankingsLink");
const navAboutLink = document.getElementById("navAboutLink");
const mobAboutLink = document.getElementById("mobAboutLink");
const navFaqLink = document.getElementById("navFaqLink");
const mobFaqLink = document.getElementById("mobFaqLink");
const navDeptsLink = document.getElementById("navDeptsLink");
const mobDeptsLink = document.getElementById("mobDeptsLink");

// Department Modals & Selection Drawer
const deptModal = document.getElementById("comingSoonModal");
const comingSoonText = document.getElementById("comingSoonText");
const closeModalBtn = document.getElementById("closeModal");
const mobileDeptBtn = document.getElementById("mobileDeptBtn");
const mobileDeptOverlay = document.getElementById("mobileDeptOverlay");
const closeOptionBtn = document.getElementById("closeOptionBtn");
const mobileDeptList = document.getElementById("mobileDeptList");

// Global active department
let currentDept = "cs";

// Dynamically populate batch selects from the compiled data.js keys on startup
function updateBatchSelectsForDept(code) {
    if (!window.DEPARTMENTS) return;
    const dept = window.DEPARTMENTS.find(d => d.code === code);
    if (!dept) return;

    const filteredKeys = Object.keys(batches).filter(key => {
        const prefix = key.replace(/^\d+/, "");
        return dept.prefixes.includes(prefix);
    }).sort();

    let displayKeys = filteredKeys;
    if (displayKeys.length === 0) {
        displayKeys = dept.prefixes.flatMap(pref => [`23${pref}`, `24${pref}`, `25${pref}`]);
    }

    if (batchSelect) {
        batchSelect.innerHTML = '';
        displayKeys.forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = key;
            batchSelect.appendChild(opt);
        });
    }

    if (rankBatchSelect) {
        rankBatchSelect.innerHTML = '';
        displayKeys.forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = key;
            rankBatchSelect.appendChild(opt);
        });
    }

    syncBatchSelects(false);
}

function hydrateInitialState() {
    let initialDeptCode = "cs";
    const path = window.location.pathname;
    const cleanPath = path.replace(/^\//, '');

    if (window.getDepartmentBySlug) {
        const dept = window.getDepartmentBySlug(cleanPath);
        if (dept && window.isAvailable(dept.code)) {
            initialDeptCode = dept.code;
        }
    }

    currentDept = initialDeptCode;
    const currentDeptLabel = document.getElementById("currentDeptLabel");
    if (currentDeptLabel && window.getDepartmentByCode) {
        const d = window.getDepartmentByCode(initialDeptCode);
        if (d) currentDeptLabel.textContent = d.label;
    }

    updateBatchSelectsForDept(initialDeptCode);
}
hydrateInitialState();

function renderSupportedDepartments() {
    if (!window.DEPARTMENTS || !window.AVAILABLE_DEPARTMENTS) return;

    const aboutContainer = document.getElementById("aboutSupportList");

    if (aboutContainer) aboutContainer.innerHTML = "";

    window.AVAILABLE_DEPARTMENTS.forEach(code => {
        const dept = window.DEPARTMENTS.find(d => d.code === code);
        if (!dept) return;

        // Render on About page supported list
        if (aboutContainer) {
            // Detect batches for this department
            const deptBatches = Object.keys(batches).filter(key => {
                const prefix = key.replace(/^\d+/, "");
                return dept.prefixes.includes(prefix);
            }).sort();

            // Only display departments that have actual batch data in our data.js
            if (deptBatches.length > 0) {
                const iconClass = DEPT_ICONS[code] || "ri-bank-line";
                const li = document.createElement("li");
                li.style.display = "flex";
                li.style.alignItems = "flex-start";
                li.style.gap = "10px";
                li.innerHTML = `
                    <i class="${iconClass}" style="color: var(--accent); font-size: 18px; margin-top: 2px;"></i>
                    <div>
                        <a href="/${dept.slug}" style="font-weight: 700; color: var(--accent-text); text-decoration: none;" class="dept-link">${dept.label} (${dept.prefixes.join(" / ")})</a>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Batches: ${deptBatches.join(" · ")}</div>
                    </div>
                `;
                aboutContainer.appendChild(li);
            }
        }
    });
}
renderSupportedDepartments();

let currentResultStudent = null;
let currentResultBatchKey = null;

function hideAllViews() {
    searchView.classList.remove('active');
    resultView.classList.remove('active');
    rankingView.classList.remove('active');
    if (aboutView) aboutView.classList.remove('active');
    if (faqView) faqView.classList.remove('active');
    if (gpaCalculatorView) gpaCalculatorView.classList.remove('active');
    if (departmentsView) departmentsView.classList.remove('active');
    if (privacyPolicyView) privacyPolicyView.classList.remove('active');
    if (academicCalendarView) academicCalendarView.classList.remove('active');

    // Reset active nav link highlighting
    document.querySelectorAll('.header-nav a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-menu a').forEach(a => a.classList.remove('active'));
}

function getSelectedBatch() {
    return batches[batchSelect.value];
}

function syncBatchSelects(fromRanking) {
    if (fromRanking) {
        batchSelect.value = rankBatchSelect.value;
    } else {
        rankBatchSelect.value = batchSelect.value;
    }
    updateRollPlaceholder();
}

function updateRollPlaceholder() {
    rollInput.placeholder = `e.g. ${batchSelect.value}001`;
    matrixSearchInput.placeholder = `Find roll in ${rankBatchSelect.value}...`;
}

function populateRankByOptions(batchKey) {
    const batch = batches[batchKey];
    const semCount = batch.semesterCount;
    rankBySelect.innerHTML = '';

    // Overall CGPA option
    const cgpaOpt = document.createElement('option');
    cgpaOpt.value = 'cgpa';
    cgpaOpt.textContent = 'Overall CGPA';
    rankBySelect.appendChild(cgpaOpt);

    // Semester-wise options
    for (let i = 1; i <= semCount; i++) {
        const opt = document.createElement('option');
        opt.value = `sem${i}`;
        opt.textContent = `Semester ${i} GPA`;
        rankBySelect.appendChild(opt);
    }

    // Year-wise options (cumulative: 1st Year = Sem 1-2, 2nd Year = Sem 1-4, 3rd Year = Sem 1-6)
    const totalYears = Math.floor(semCount / 2);
    for (let y = 1; y <= totalYears; y++) {
        const lastSem = y * 2;
        const ordinal = y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : `${y}th`;
        const opt = document.createElement('option');
        opt.value = `year${y}`;
        opt.textContent = `${ordinal} Year CGPA (Sem 1–${lastSem})`;
        rankBySelect.appendChild(opt);
    }
}

function getSortValue(student, rankMode, semCount) {
    if (rankMode === 'cgpa') {
        return student.cgpa;
    }

    if (rankMode.startsWith('sem')) {
        const semIndex = parseInt(rankMode.replace('sem', '')) - 1;
        return student.semesters[semIndex] || 0;
    }

    if (rankMode.startsWith('year')) {
        const yearNum = parseInt(rankMode.replace('year', ''));
        const lastSemIndex = yearNum * 2; // e.g. 2nd year => semesters 0,1,2,3
        let sum = 0;
        let count = 0;
        for (let i = 0; i < lastSemIndex && i < semCount; i++) {
            sum += student.semesters[i] || 0;
            count++;
        }
        return count > 0 ? sum / count : 0;
    }

    return student.cgpa;
}

function getRankModeLabel(rankMode) {
    if (rankMode === 'cgpa') return 'CGPA';
    if (rankMode.startsWith('sem')) return `Sem ${rankMode.replace('sem', '')} GPA`;
    if (rankMode.startsWith('year')) {
        const y = parseInt(rankMode.replace('year', ''));
        const ordinal = y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : `${y}th`;
        return `${ordinal} Year`;
    }
    return 'CGPA';
}

function renderAnalytics(batch) {
    const stats = getBatchStats(batch);
    document.getElementById('analyticsPanel').innerHTML = `
        <div class="analytics-card">
            <span class="analytics-value">${stats.total}</span>
            <span class="analytics-label">Total Students</span>
        </div>
        <div class="analytics-card">
            <span class="analytics-value">${stats.avgCgpa.toFixed(2)}</span>
            <span class="analytics-label">Batch Avg CGPA</span>
        </div>
        <div class="analytics-card">
            <span class="analytics-value">${stats.highest.toFixed(2)}</span>
            <span class="analytics-label">Highest CGPA</span>
        </div>
        <div class="analytics-card">
            <span class="analytics-value">${stats.highPerformers}</span>
            <span class="analytics-label">CGPA ≥ 3.5</span>
        </div>
    `;
}

function renderMatrix(batch, highlightId = null) {
    const semCount = batch.semesterCount;
    const rankMode = rankBySelect.value || 'cgpa';
    const head = document.getElementById('matrixHead');
    const body = document.getElementById('matrixBody');

    // Compute sort values and re-rank students for this mode
    const sorted = batch.students.map(student => {
        const sortVal = getSortValue(student, rankMode, semCount);
        return { ...student, _sortVal: sortVal };
    });
    sorted.sort((a, b) => b._sortVal - a._sortVal);

    // Assign ranks with dense ranking
    let rank = 0;
    let prevVal = null;
    sorted.forEach(s => {
        const rounded = Math.round(s._sortVal * 100) / 100;
        if (prevVal === null || rounded !== prevVal) {
            rank++;
            prevVal = rounded;
        }
        s._displayRank = rank;
    });

    // Determine which column index is the active sort column
    // Columns: Rank(0), ID(1), Sem1(2)..SemN(1+semCount), CGPA(2+semCount), Year/SortVal, Grade
    let activeSemColIndex = -1; // 0-based index among sem columns
    let isCgpaActive = false;
    let yearSemIndices = []; // which sem columns belong to active year

    if (rankMode === 'cgpa') {
        isCgpaActive = true;
    } else if (rankMode.startsWith('sem')) {
        activeSemColIndex = parseInt(rankMode.replace('sem', '')) - 1;
    } else if (rankMode.startsWith('year')) {
        const yearNum = parseInt(rankMode.replace('year', ''));
        const lastSemIndex = yearNum * 2;
        yearSemIndices = [];
        for (let i = 0; i < lastSemIndex && i < semCount; i++) {
            yearSemIndices.push(i);
        }
    }

    // Build header
    let headerHtml = '<tr><th class="col-rank">Rank</th><th class="col-id">ID.No</th>';
    for (let i = 1; i <= semCount; i++) {
        const isActive = (activeSemColIndex === i - 1) || yearSemIndices.includes(i - 1);
        headerHtml += `<th${isActive ? ' class="sort-active"' : ''}>Sem ${i}</th>`;
    }

    // Add Year CGPA column if ranking by year
    if (rankMode.startsWith('year')) {
        headerHtml += `<th class="sort-active">${getRankModeLabel(rankMode)} CGPA</th>`;
    }

    headerHtml += `<th${isCgpaActive ? ' class="sort-active"' : ''}>CGPA</th><th>Grade</th></tr>`;
    head.innerHTML = headerHtml;

    // Build rows
    body.innerHTML = sorted.map(student => {
        const tier = getRowTierClass(student._displayRank);
        const highlighted = highlightId && student.id.toUpperCase() === highlightId.toUpperCase();

        const semCells = student.semesters.slice(0, semCount).map((gpa, idx) => {
            const isActive = (activeSemColIndex === idx) || yearSemIndices.includes(idx);
            return `<td${isActive ? ' class="sort-active-cell"' : ''}>${gpa > 0 ? gpa.toFixed(2) : '—'}</td>`;
        }).join('');

        // Year CGPA cell
        let yearCell = '';
        if (rankMode.startsWith('year')) {
            yearCell = `<td class="sort-active-cell" style="font-weight:700">${student._sortVal > 0 ? student._sortVal.toFixed(2) : '—'}</td>`;
        }

        const youBadge = highlighted ? '<span class="rank-badge you">You</span>' : '';

        return `<tr class="rank-row ${tier}${highlighted ? ' highlighted' : ''}" data-id="${student.id}">
            <td class="col-rank">#${student._displayRank} ${getRankBadge(student._displayRank)}</td>
            <td class="col-id">${student.id}${youBadge}</td>
            ${semCells}
            ${yearCell}
            <td class="col-cgpa${isCgpaActive ? ' sort-active-cell' : ''}">${student.cgpa.toFixed(2)}</td>
            <td>${student.grade}</td>
        </tr>`;
    }).join('');

    const modeLabel = getRankModeLabel(rankMode);
    document.getElementById('matrixCount').innerHTML =
        `${batch.students.length} students · sorted by <span class="rank-mode-pill"><i class="ri-sort-desc" style="font-size:11px"></i> ${modeLabel}</span>`;

    applyMatrixFilter(matrixSearchInput.value.trim());
    if (highlightId) {
        const row = body.querySelector('.highlighted');
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function applyMatrixFilter(query) {
    const q = query.toUpperCase();
    document.querySelectorAll('#matrixBody .rank-row').forEach(row => {
        const id = row.dataset.id.toUpperCase();
        if (!q || id.includes(q)) {
            row.classList.remove('filtered-out');
        } else {
            row.classList.add('filtered-out');
        }
    });
}

let ignoreRouteChange = false;

function navigateTo(urlPath) {
    if (window.location.pathname === urlPath) return;
    ignoreRouteChange = true;
    history.pushState(null, '', urlPath);
    setTimeout(() => {
        ignoreRouteChange = false;
    }, 50);
}

function handleRouting() {
    if (ignoreRouteChange) return;

    const path = window.location.pathname;
    const hash = window.location.hash;

    if (path === '/departments') {
        showDepartmentsView();
        return;
    }

    if (path === '/about' || hash === '#about') {
        showAboutView();
        return;
    }

    if (path === '/faq' || hash === '#faq') {
        showFaqView();
        return;
    }

    if (path === '/privacy-policy' || hash === '#privacy-policy') {
        showPrivacyPolicyView();
        return;
    }

    if (path === '/academic-calendar' || hash === '#academic-calendar' || hash === '#calendar') {
        showAcademicCalendarView();
        return;
    }

    if (path === '/gpa-calculator' || hash === '#gpa-calculator' || hash === '#gpaCalculator') {
        showGpaCalculatorView();
        return;
    }

    if (path.startsWith('/ranking/')) {
        const batchKey = path.split('/')[2];
        if (batches[batchKey]) {
            showRankingView(batchKey);
            return;
        }
    } else if (path.startsWith('/result/')) {
        const studentId = path.split('/')[2];
        let found = false;
        for (const [batchKey, batch] of Object.entries(batches)) {
            const student = batch.students.find(s => s.id.toUpperCase() === studentId.toUpperCase());
            if (student) {
                batchSelect.value = batchKey;
                rankBatchSelect.value = batchKey;
                showResult(student, batch);
                found = true;
                break;
            }
        }
        if (found) return;
    }

    // Check if path is a department slug
    const cleanPath = path.replace(/^\//, ''); // e.g. "software-engineering"
    if (window.getDepartmentBySlug) {
        const dept = window.getDepartmentBySlug(cleanPath);
        if (dept) {
            showSearchView(dept);
            return;
        }
    }

    // Hash Fallbacks
    if (hash.startsWith('#ranking/')) {
        const batchKey = hash.split('/')[1];
        if (batches[batchKey]) {
            showRankingView(batchKey);
            return;
        }
    } else if (hash.startsWith('#result/')) {
        const studentId = hash.split('/')[1];
        let found = false;
        for (const [batchKey, batch] of Object.entries(batches)) {
            const student = batch.students.find(s => s.id.toUpperCase() === studentId.toUpperCase());
            if (student) {
                batchSelect.value = batchKey;
                rankBatchSelect.value = batchKey;
                showResult(student, batch);
                found = true;
                break;
            }
        }
        if (found) return;
    } else if (hash === '#rankings' || hash === '#ranking') {
        showRankingView(batchSelect.value);
        return;
    }

    // Default or home
    showSearchView();
}

window.addEventListener('popstate', handleRouting);
window.addEventListener('hashchange', handleRouting);

function showRankingView(batchKey, highlightId = null) {
    hideAllViews();
    rankingView.classList.add('active');

    const container = document.querySelector('.container');
    if (container) container.classList.add('wide-container');

    if (navRankingsLink) navRankingsLink.classList.add('active');
    if (mobRankingsLink) mobRankingsLink.classList.add('active');

    rankBatchSelect.value = batchKey;
    batchSelect.value = batchKey;
    updateRollPlaceholder();
    populateRankByOptions(batchKey);

    const batch = batches[batchKey];
    renderAnalytics(batch);
    renderMatrix(batch, highlightId);

    matrixSearchInput.value = '';

    if (typeof updateSeoForView === 'function') {
        updateSeoForView('ranking', { key: batchKey, label: batch.label });
    }

    // Update dynamic ranking page links
    const rankingDeptLink = document.getElementById('rankingDeptLink');
    if (rankingDeptLink && window.detectDepartmentFromRoll) {
        const dept = window.detectDepartmentFromRoll(`${batchKey}001`);
        if (dept) {
            rankingDeptLink.href = `/${dept.slug}`;
            rankingDeptLink.innerHTML = `<i class="ri-search-eye-line"></i> Check ${dept.label} Results`;
            rankingDeptLink.style.display = 'inline-flex';
        } else {
            rankingDeptLink.style.display = 'none';
        }
    }

    navigateTo(`/ranking/${batchKey}`);
}

function showSearchView(deptObj = null) {
    hideAllViews();
    searchView.classList.add('active');

    const container = document.querySelector('.container');
    if (container) container.classList.remove('wide-container');

    document.getElementById('resProgressBar').style.width = '0%';

    if (deptObj) {
        if (typeof updateSeoForView === 'function') {
            updateSeoForView('department', deptObj);
        }
        navigateTo(`/${deptObj.slug}`);
    } else {
        if (typeof updateSeoForView === 'function') {
            updateSeoForView('home');
        }
        navigateTo('/');
    }
}

function showAboutView() {
    hideAllViews();
    if (aboutView) aboutView.classList.add('active');

    const container = document.querySelector('.container');
    if (container) container.classList.remove('wide-container');

    if (navAboutLink) navAboutLink.classList.add('active');
    if (mobAboutLink) mobAboutLink.classList.add('active');

    if (typeof updateSeoForView === 'function') {
        updateSeoForView('about');
    }

    navigateTo('/about');
}

function showFaqView() {
    hideAllViews();
    if (faqView) faqView.classList.add('active');

    const container = document.querySelector('.container');
    if (container) container.classList.remove('wide-container');

    if (navFaqLink) navFaqLink.classList.add('active');
    if (mobFaqLink) mobFaqLink.classList.add('active');

    if (typeof updateSeoForView === 'function') {
        updateSeoForView('faq');
    }

    navigateTo('/faq');
}

function showPrivacyPolicyView() {
    hideAllViews();
    if (privacyPolicyView) privacyPolicyView.classList.add('active');

    const container = document.querySelector('.container');
    if (container) container.classList.remove('wide-container');

    if (typeof updateSeoForView === 'function') {
        updateSeoForView('privacyPolicy');
    }

    navigateTo('/privacy-policy');
}

function showAcademicCalendarView() {
    hideAllViews();
    if (academicCalendarView) academicCalendarView.classList.add('active');

    const container = document.querySelector('.container');
    if (container) container.classList.add('wide-container');

    const navCalendarLink = document.getElementById('navCalendarLink');
    const mobCalendarLink = document.getElementById('mobCalendarLink');
    if (navCalendarLink) navCalendarLink.classList.add('active');
    if (mobCalendarLink) mobCalendarLink.classList.add('active');

    if (typeof updateSeoForView === 'function') {
        updateSeoForView('academicCalendar');
    }

    navigateTo('/academic-calendar');
}

function showGpaCalculatorView() {
    hideAllViews();
    if (gpaCalculatorView) gpaCalculatorView.classList.add('active');

    const container = document.querySelector('.container');
    if (container) container.classList.add('wide-container');

    if (navGpaLink) navGpaLink.classList.add('active');
    if (mobGpaLink) mobGpaLink.classList.add('active');

    if (typeof updateSeoForView === 'function') {
        updateSeoForView('gpaCalculator');
    }

    navigateTo('/gpa-calculator');
}

function showDepartmentsView() {
    hideAllViews();
    if (departmentsView) departmentsView.classList.add('active');
    
    const container = document.querySelector('.container');
    if (container) container.classList.add('wide-container');

    if (navDeptsLink) navDeptsLink.classList.add('active');
    if (mobDeptsLink) mobDeptsLink.classList.add('active');

    renderDepartmentsHub();

    if (typeof updateSeoForView === 'function') {
        updateSeoForView('departmentsHub');
    }

    navigateTo('/departments');
}

function renderDepartmentsHub() {
    const activeList = document.getElementById('departmentsActiveList');
    const inactiveList = document.getElementById('departmentsInactiveList');
    if (!activeList || !inactiveList || !window.DEPARTMENTS) return;

    activeList.innerHTML = '';
    inactiveList.innerHTML = '';

    window.DEPARTMENTS.forEach(dept => {
        const isAvail = window.isAvailable(dept.code);
        const deptBatches = Object.keys(batches).filter(key => {
            const prefix = key.replace(/^\d+/, "");
            return dept.prefixes.includes(prefix);
        }).sort();

        const iconClass = DEPT_ICONS[dept.code] || "ri-bank-line";

        if (isAvail && deptBatches.length > 0) {
            const li = document.createElement('li');
            li.className = 'gpa-card';
            li.style.margin = '0';
            li.style.border = '1px solid var(--border-light)';
            li.style.padding = '20px';
            li.style.display = 'flex';
            li.style.flexDirection = 'column';
            li.style.gap = '12px';
            li.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <i class="${iconClass}" style="color: var(--accent); font-size: 24px;"></i>
                    <div style="flex: 1;">
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
            `;
            activeList.appendChild(li);
        } else {
            const li = document.createElement('li');
            li.style.background = 'var(--control-muted-bg)';
            li.style.border = '1px dashed var(--border-light)';
            li.style.borderRadius = 'var(--radius-md)';
            li.style.padding = '16px';
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.gap = '12px';
            li.innerHTML = `
                <i class="${iconClass}" style="color: var(--text-secondary); font-size: 20px;"></i>
                <div style="flex: 1;">
                    <h4 style="font-size: 14px; font-weight: 600; margin: 0; color: var(--text-primary);">${dept.label}</h4>
                    <span style="font-size: 11px; color: var(--text-secondary);">Prefix: ${dept.prefixes.join(", ")}</span>
                </div>
                <span class="dept-status-pill coming" style="font-size: 10px; padding: 2px 6px;">Coming Soon</span>
            `;
            inactiveList.appendChild(li);
        }
    });
}

function showResult(student, batch) {
    currentResultStudent = student;
    currentResultBatchKey = batchSelect.value;
    hideAllViews();
    resultView.classList.add('active');

    const container = document.querySelector('.container');
    if (container) container.classList.remove('wide-container');

    document.getElementById('resId').innerText = student.id;
    document.getElementById('resAvatar').innerText = student.id.slice(-2);
    document.getElementById('resRankLabel').innerText = `${batch.label} Rank`;
    document.getElementById('resRank').innerText = `#${student.rank} / ${batch.students.length}`;
    document.getElementById('resCgpa').innerText = student.cgpa.toFixed(2);
    document.getElementById('resGrade').innerText = student.grade;

    const statusEl = document.getElementById('resStatus');
    let status = "Average";
    statusEl.className = 'status-badge';

    if (student.cgpa >= 3.8) {
        status = "Excellent";
        statusEl.classList.add('excellent');
    } else if (student.cgpa >= 3.0) {
        status = "Good";
        statusEl.classList.add('good');
    } else {
        statusEl.classList.add('average');
    }
    statusEl.innerText = status;

    document.getElementById('resCgpaText').innerText = `${student.cgpa.toFixed(2)} / 4.00`;

    setTimeout(() => {
        const percent = (student.cgpa / 4.0) * 100;
        document.getElementById('resProgressBar').style.width = `${percent}%`;
    }, 100);

    const tbody = document.getElementById('semTableBody');
    tbody.innerHTML = '';

    student.semesters.forEach((gpa, i) => {
        if (gpa > 0) {
            tbody.innerHTML += `<tr><td>Semester ${i + 1}</td><td>${gpa.toFixed(2)}</td></tr>`;
        }
    });

    if (typeof updateSeoForView === 'function') {
        updateSeoForView('result', {
            id: student.id,
            batch: batch.label,
            batchKey: currentResultBatchKey,
            cgpa: student.cgpa.toFixed(2),
            rank: student.rank
        });
    }

    navigateTo(`/result/${student.id}`);
}

batchSelect.addEventListener('change', () => {
    syncBatchSelects(false);
    errorMsg.classList.add('hidden');
});

rankBatchSelect.addEventListener('change', () => {
    syncBatchSelects(true);
    showRankingView(rankBatchSelect.value);
});

rankBySelect.addEventListener('change', () => {
    const batchKey = rankBatchSelect.value;
    const batch = batches[batchKey];
    renderMatrix(batch);
});

matrixSearchInput.addEventListener('input', () => {
    applyMatrixFilter(matrixSearchInput.value.trim());
    const q = matrixSearchInput.value.trim().toUpperCase();
    if (!q) {
        document.querySelectorAll('#matrixBody .rank-row').forEach(r => r.classList.remove('highlighted'));
        return;
    }
    document.querySelectorAll('#matrixBody .rank-row').forEach(row => {
        row.classList.toggle('highlighted', row.dataset.id.toUpperCase() === q);
    });
});

openRankingsBtn.addEventListener('click', () => {
    showRankingView(batchSelect.value);
});

rankingBackBtn.addEventListener('click', () => {
    showSearchView();
    rollInput.focus();
});

viewInLeaderboardBtn.addEventListener('click', () => {
    if (currentResultStudent && currentResultBatchKey) {
        showRankingView(currentResultBatchKey, currentResultStudent.id);
    }
});

updateRollPlaceholder();

searchBtn.addEventListener('click', () => {
    const val = rollInput.value.trim().toUpperCase();
    if (!val) return;

    const batch = getSelectedBatch();
    const student = batch.students.find(s => s.id.toUpperCase() === val);
    if (student) {
        errorMsg.classList.add('hidden');
        searchBtn.innerText = "Searching...";
        searchBtn.style.opacity = "0.8";

        setTimeout(() => {
            searchBtn.innerText = "Lookup Record";
            searchBtn.style.opacity = "1";
            showResult(student, batch);
        }, 500);
    } else {
        errorMsg.classList.remove('hidden');
        errorMsg.innerText = `Roll number not found in ${batch.label}. Please try again.`;
    }
});

rollInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

backBtn.addEventListener('click', () => {
    showSearchView();
    rollInput.value = '';
    errorMsg.classList.add('hidden');
    currentResultStudent = null;
    currentResultBatchKey = null;
    rollInput.focus();
});

if (aboutBackBtn) {
    aboutBackBtn.addEventListener('click', () => {
        showSearchView();
    });
}

if (faqBackBtn) {
    faqBackBtn.addEventListener('click', () => {
        showSearchView();
    });
}

if (departmentsBackBtn) {
    departmentsBackBtn.addEventListener('click', () => {
        showSearchView();
    });
}

if (privacyPolicyBackBtn) {
    privacyPolicyBackBtn.addEventListener('click', () => {
        showSearchView();
    });
}

if (calendarBackBtn) {
    calendarBackBtn.addEventListener('click', () => {
        showSearchView();
    });
}

// Intercept internal link clicks for smooth SPA navigation
document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('/') && !a.getAttribute('href').includes('.')) {
        const href = a.getAttribute('href');
        e.preventDefault();
        navigateTo(href);
        ignoreRouteChange = false; // Reset to allow handleRouting to run synchronously
        handleRouting();
    }
});

// Run router on load
handleRouting();

// =========================================================================
// Results Portal — Switcher, Grid, Mobile Drawer, Modals, Theme Toggle
// =========================================================================

// Theme Toggle Action (Sleek Dark Mode)
// Body already carries the correct "dark-mode" class pre-paint (see inline
// script in <head>/<body>); here we just keep the icon + storage in sync.
if (themeToggleBtn) {
    const syncThemeIcon = () => {
        const isDark = document.body.classList.contains("dark-mode");
        themeToggleBtn.innerHTML = isDark ? `<i class="ri-sun-line" id="themeToggleIcon"></i>` : `<i class="ri-moon-line" id="themeToggleIcon"></i>`;
    };
    syncThemeIcon();

    themeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        syncThemeIcon();
        themeToggleBtn.classList.remove("spin");
        // Force reflow so the animation can retrigger on rapid re-clicks
        void themeToggleBtn.offsetWidth;
        themeToggleBtn.classList.add("spin");
        try {
            localStorage.setItem("theme", isDark ? "dark" : "light");
        } catch (e) { /* localStorage unavailable (private browsing, etc.) */ }
    });

    // Follow the OS-level theme only if the user hasn't made an explicit choice
    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
            let explicitChoice = null;
            try { explicitChoice = localStorage.getItem("theme"); } catch (err) { /* ignore */ }
            if (explicitChoice) return;
            document.body.classList.toggle("dark-mode", e.matches);
            syncThemeIcon();
        });
    }
}

// Mobile Nav Menu Drawer Toggle
if (hamburgerBtn && mobileNavMenu) {
    hamburgerBtn.addEventListener("click", () => {
        mobileNavMenu.classList.toggle("open");
        hamburgerBtn.innerHTML = mobileNavMenu.classList.contains("open")
            ? `<i class="ri-close-line"></i>`
            : `<i class="ri-menu-line"></i>`;
    });
}

// Close Mobile Drawer on Navigation Clicks
document.querySelectorAll(".mobile-nav-menu a").forEach(link => {
    link.addEventListener("click", () => {
        if (mobileNavMenu) mobileNavMenu.classList.remove("open");
        if (hamburgerBtn) hamburgerBtn.innerHTML = `<i class="ri-menu-line"></i>`;
    });
});

// Smooth Navigation Intercept for header links
if (navRankingsLink) {
    navRankingsLink.addEventListener("click", (e) => {
        e.preventDefault();
        showRankingView(batchSelect.value);
    });
}
if (mobRankingsLink) {
    mobRankingsLink.addEventListener("click", (e) => {
        e.preventDefault();
        showRankingView(batchSelect.value);
    });
}

// Smooth Navigation Intercept for About & FAQ links
if (navAboutLink) {
    navAboutLink.addEventListener("click", (e) => {
        e.preventDefault();
        showAboutView();
    });
}
if (mobAboutLink) {
    mobAboutLink.addEventListener("click", (e) => {
        e.preventDefault();
        showAboutView();
    });
}
if (navFaqLink) {
    navFaqLink.addEventListener("click", (e) => {
        e.preventDefault();
        showFaqView();
    });
}
if (mobFaqLink) {
    mobFaqLink.addEventListener("click", (e) => {
        e.preventDefault();
        showFaqView();
    });
}
if (navGpaLink) {
    navGpaLink.addEventListener("click", (e) => {
        e.preventDefault();
        showGpaCalculatorView();
    });
}
if (mobGpaLink) {
    mobGpaLink.addEventListener("click", (e) => {
        e.preventDefault();
        showGpaCalculatorView();
    });
}



// Handle department selection
function handleDepartmentSelect(code) {
    if (!window.DEPARTMENTS) return;
    const dept = window.DEPARTMENTS.find(d => d.code === code);
    if (!dept) return;

    if (window.isAvailable(code)) {
        currentDept = code;
        const currentDeptLabel = document.getElementById("currentDeptLabel");
        if (currentDeptLabel) currentDeptLabel.textContent = dept.label;

        // Populate specific batches in the search box
        updateBatchSelectsForDept(code);

        showSearchView(dept);

        // Scroll to search card smoothly
        const searchBox = document.querySelector(".search-box");
        if (searchBox) {
            searchBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        showComingSoon(dept.label);
    }
}

// Wire up navigation links to trigger the department selection menu
function openDeptSelector() {
    const mobileDeptBtn = document.getElementById("mobileDeptBtn");
    if (mobileDeptBtn) mobileDeptBtn.click();
}

if (navDeptsLink) {
    navDeptsLink.addEventListener("click", (e) => {
        e.preventDefault();
        showDepartmentsView();
    });
}
if (mobDeptsLink) {
    mobDeptsLink.addEventListener("click", (e) => {
        e.preventDefault();
        showDepartmentsView();
    });
}

// Auto-detect department from Roll Number on blur
if (rollInput) {
    rollInput.addEventListener("blur", () => {
        const roll = rollInput.value;
        if (!window.detectDepartmentFromRoll) return;
        const dept = window.detectDepartmentFromRoll(roll);

        if (dept) {
            if (!window.isAvailable(dept.code)) {
                showComingSoon(dept.label);
                return;
            }
            if (dept.code !== currentDept) {
                handleDepartmentSelect(dept.code);
            }
        }
    });
}

// Modals Handling
function showComingSoon(label) {
    if (comingSoonText) {
        comingSoonText.textContent = `We're working hard to add results for ${label}. Stay tuned!`;
    }
    const comingSoonTitle = document.getElementById("comingSoonTitle");
    if (comingSoonTitle) {
        comingSoonTitle.textContent = `Results for ${label} are coming soon.`;
    }
    if (deptModal) {
        deptModal.classList.remove("hidden");
    }
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        if (deptModal) deptModal.classList.add("hidden");
    });
}

// Option Drawer/Dialog Selector
if (mobileDeptBtn && mobileDeptOverlay && closeOptionBtn && mobileDeptList) {
    mobileDeptBtn.addEventListener("click", () => {
        mobileDeptList.innerHTML = window.DEPARTMENTS.map(d => {
            const isAvail = window.isAvailable(d.code);
            const isSelected = d.code === currentDept;
            const badge = isAvail
                ? (isSelected ? `<i class="ri-checkbox-circle-fill check"></i>` : `<i class="ri-checkbox-circle-line check" style="color:var(--text-secondary);"></i>`)
                : `<span class="dept-status-pill coming">Coming Soon</span>`;
            return `
                <div class="mobile-option-item ${isSelected ? 'selected' : ''}" data-code="${d.code}">
                    <div class="option-left">
                        <i class="ri-bank-line" style="color: var(--accent);"></i>
                        <span>${d.label}</span>
                    </div>
                    ${badge}
                </div>
            `;
        }).join("");

        mobileDeptList.querySelectorAll(".mobile-option-item").forEach(item => {
            item.addEventListener("click", () => {
                const code = item.dataset.code;
                handleDepartmentSelect(code);
                mobileDeptOverlay.classList.remove("open");
            });
        });

        mobileDeptOverlay.classList.add("open");
    });

    closeOptionBtn.addEventListener("click", () => {
        mobileDeptOverlay.classList.remove("open");
    });

    mobileDeptOverlay.addEventListener("click", (e) => {
        if (e.target === mobileDeptOverlay) {
            mobileDeptOverlay.classList.remove("open");
        }
    });
}

// =========================================================================
// GPA Calculator Feature Logic
// =========================================================================

const GPA_SCALE = {
    "A+": 4.0,
    "A": 3.5,
    "B+": 3.0,
    "B": 2.5,
    "C+": 2.0,
    "C": 1.5,
    "C-": 1.0,
    "F": 0.0,
    "W": null,
    "I": null
};

let gpaCourses = [];

function roundHalfToEven(num, decimals = 2) {
    const m = Math.pow(10, decimals);
    const n = +(num * m).toFixed(8);
    const i = Math.floor(n), f = n - i;
    const e = 1e-9;
    
    if (Math.abs(f - 0.5) < e) {
        return ((i % 2 === 0) ? i : i + 1) / m;
    }
    return Math.round(n) / m;
}

function initializeGpaCalculator() {
    gpaCourses = [];
    
    // Default mock Semester 1 subjects (credits configuration only)
    const defaultCourses = [
        { theoryCredits: 3, theoryGrade: "", practicalCredits: 0, practicalGrade: "" },
        { theoryCredits: 3, theoryGrade: "", practicalCredits: 0, practicalGrade: "" },
        { theoryCredits: 3, theoryGrade: "", practicalCredits: 1, practicalGrade: "" },
        { theoryCredits: 3, theoryGrade: "", practicalCredits: 1, practicalGrade: "" },
        { theoryCredits: 2, theoryGrade: "", practicalCredits: 1, practicalGrade: "" }
    ];

    defaultCourses.forEach(c => {
        const rowId = Date.now() + Math.random().toString(36).substr(2, 9);
        gpaCourses.push({
            id: rowId,
            theoryCredits: c.theoryCredits,
            theoryGrade: c.theoryGrade,
            practicalCredits: c.practicalCredits,
            practicalGrade: c.practicalGrade
        });
    });
    
    renderGpaCourses();
    calculateGpa();
}

function addGpaCourseRow() {
    const rowId = Date.now() + Math.random().toString(36).substr(2, 9);
    gpaCourses.push({
        id: rowId,
        theoryCredits: 3,
        theoryGrade: "",
        practicalCredits: 0,
        practicalGrade: ""
    });
    renderGpaCourses();
    calculateGpa();
}

function deleteGpaCourseRow(rowId) {
    gpaCourses = gpaCourses.filter(c => c.id !== rowId);
    if (gpaCourses.length === 0) {
        addGpaCourseRow();
    } else {
        renderGpaCourses();
        calculateGpa();
    }
}

function updateGpaCourseRow(rowId, field, value) {
    const course = gpaCourses.find(c => c.id === rowId);
    if (course) {
        if (field === 'theoryCredits') {
            course.theoryCredits = parseInt(value, 10);
        } else if (field === 'theoryGrade') {
            course.theoryGrade = value;
        } else if (field === 'practicalCredits') {
            course.practicalCredits = parseInt(value, 10);
        } else if (field === 'practicalGrade') {
            course.practicalGrade = value;
        }
        calculateGpa();
    }
}

function deleteTheoryComponent(rowId) {
    const course = gpaCourses.find(c => c.id === rowId);
    if (course) {
        course.theoryCredits = 0;
        course.theoryGrade = "";
        // If it has no practical either, remove it
        if (course.practicalCredits === 0) {
            gpaCourses = gpaCourses.filter(c => c.id !== rowId);
        }
        renderGpaCourses();
        calculateGpa();
    }
}

function deletePracticalComponent(rowId) {
    const course = gpaCourses.find(c => c.id === rowId);
    if (course) {
        course.practicalCredits = 0;
        course.practicalGrade = "";
        // If it has no theory either, remove it
        if (course.theoryCredits === 0) {
            gpaCourses = gpaCourses.filter(c => c.id !== rowId);
        }
        renderGpaCourses();
        calculateGpa();
    }
}

function addTheorySubject() {
    const rowId = Date.now() + Math.random().toString(36).substr(2, 9);
    gpaCourses.push({
        id: rowId,
        theoryCredits: 3,
        theoryGrade: "",
        practicalCredits: 0,
        practicalGrade: ""
    });
    renderGpaCourses();
    calculateGpa();
}

function addPracticalSubject() {
    const rowId = Date.now() + Math.random().toString(36).substr(2, 9);
    gpaCourses.push({
        id: rowId,
        theoryCredits: 0,
        theoryGrade: "",
        practicalCredits: 1,
        practicalGrade: ""
    });
    renderGpaCourses();
    calculateGpa();
}

function renderGpaCourses() {
    // 1. Render Desktop View
    if (gpaCoursesBody) {
        gpaCoursesBody.innerHTML = '';
        gpaCourses.forEach((course, index) => {
            const row = document.createElement('tr');
            row.className = 'gpa-course-row';
            row.dataset.id = course.id;

            // Theory credits select options
            let theoryCreditOptions = '';
            [0, 1, 2, 3, 4, 5].forEach(cr => {
                theoryCreditOptions += `<option value="${cr}" ${course.theoryCredits === cr ? 'selected' : ''}>${cr === 0 ? '0 (N/A)' : cr}</option>`;
            });

            // Practical credits select options
            let practicalCreditOptions = '';
            [0, 1, 2, 3].forEach(cr => {
                practicalCreditOptions += `<option value="${cr}" ${course.practicalCredits === cr ? 'selected' : ''}>${cr === 0 ? '0 (N/A)' : cr}</option>`;
            });

            // Grade select options
            let theoryGradeOptions = '<option value="">Select Grade</option>';
            let practicalGradeOptions = '<option value="">Select Grade</option>';
            
            Object.keys(GPA_SCALE).forEach(gr => {
                theoryGradeOptions += `<option value="${gr}" ${course.theoryGrade === gr ? 'selected' : ''}>${gr}</option>`;
                practicalGradeOptions += `<option value="${gr}" ${course.practicalGrade === gr ? 'selected' : ''}>${gr}</option>`;
            });

            row.innerHTML = `
                <td class="gpa-col-num">${index + 1}</td>
                <td class="gpa-col-theory-credits">
                    <select class="gpa-row-theory-credits" aria-label="Course ${index + 1} theory credit hours">
                        ${theoryCreditOptions}
                    </select>
                </td>
                <td class="gpa-col-theory-grade">
                    <select class="gpa-row-theory-grade" ${course.theoryCredits === 0 ? 'disabled' : ''} aria-label="Course ${index + 1} theory grade">
                        ${theoryGradeOptions}
                    </select>
                </td>
                <td class="gpa-col-practical-credits">
                    <select class="gpa-row-practical-credits" aria-label="Course ${index + 1} practical credit hours">
                        ${practicalCreditOptions}
                    </select>
                </td>
                <td class="gpa-col-practical-grade">
                    <select class="gpa-row-practical-grade" ${course.practicalCredits === 0 ? 'disabled' : ''} aria-label="Course ${index + 1} practical grade">
                        ${practicalGradeOptions}
                    </select>
                </td>
                <td class="gpa-col-action">
                    <button type="button" class="gpa-delete-btn" aria-label="Delete course row ${index + 1}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </td>
            `;

            // Attach event listeners
            row.querySelector('.gpa-row-theory-credits').addEventListener('change', (e) => {
                const val = parseInt(e.target.value, 10);
                updateGpaCourseRow(course.id, 'theoryCredits', val);
                const selectGrade = row.querySelector('.gpa-row-theory-grade');
                if (selectGrade) {
                    selectGrade.disabled = (val === 0);
                    if (val === 0) {
                        selectGrade.value = "";
                        updateGpaCourseRow(course.id, 'theoryGrade', "");
                    }
                }
            });
            row.querySelector('.gpa-row-theory-grade').addEventListener('change', (e) => {
                updateGpaCourseRow(course.id, 'theoryGrade', e.target.value);
            });
            row.querySelector('.gpa-row-practical-credits').addEventListener('change', (e) => {
                const val = parseInt(e.target.value, 10);
                updateGpaCourseRow(course.id, 'practicalCredits', val);
                const selectGrade = row.querySelector('.gpa-row-practical-grade');
                if (selectGrade) {
                    selectGrade.disabled = (val === 0);
                    if (val === 0) {
                        selectGrade.value = "";
                        updateGpaCourseRow(course.id, 'practicalGrade', "");
                    }
                }
            });
            row.querySelector('.gpa-row-practical-grade').addEventListener('change', (e) => {
                updateGpaCourseRow(course.id, 'practicalGrade', e.target.value);
            });
            row.querySelector('.gpa-delete-btn').addEventListener('click', () => {
                deleteGpaCourseRow(course.id);
            });

            gpaCoursesBody.appendChild(row);
        });
    }

    // 2. Render Theory list on Mobile
    if (gpaTheoryList) {
        gpaTheoryList.innerHTML = '';
        const theoryCourses = gpaCourses.filter(c => c.theoryCredits > 0);
        
        theoryCourses.forEach((course, index) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'gpa-mobile-row';
            rowDiv.dataset.id = course.id;
            
            let gradeOptions = '<option value="">Select Grade</option>';
            Object.keys(GPA_SCALE).forEach(gr => {
                gradeOptions += `<option value="${gr}" ${course.theoryGrade === gr ? 'selected' : ''}>${gr}</option>`;
            });
            
            rowDiv.innerHTML = `
                <span class="gpa-mobile-col-num">${index + 1}.</span>
                <div class="gpa-mobile-col-credits">
                    <input type="number" class="gpa-mobile-input-credits" value="${course.theoryCredits}" min="1" max="6" placeholder="e.g. 3" aria-label="Subject ${index + 1} theory credits">
                </div>
                <div class="gpa-mobile-col-grade">
                    <select class="gpa-mobile-select-grade" aria-label="Subject ${index + 1} theory grade">
                        ${gradeOptions}
                    </select>
                </div>
                <div class="gpa-mobile-col-action">
                    <button type="button" class="gpa-mobile-delete-btn" aria-label="Delete theory subject ${index + 1}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            `;
            
            const creditInput = rowDiv.querySelector('.gpa-mobile-input-credits');
            const gradeSelect = rowDiv.querySelector('.gpa-mobile-select-grade');
            const deleteBtn = rowDiv.querySelector('.gpa-mobile-delete-btn');
            
            creditInput.addEventListener('change', (e) => {
                let val = parseInt(e.target.value, 10);
                if (isNaN(val)) val = 0;
                updateGpaCourseRow(course.id, 'theoryCredits', val);
                if (gradeSelect) {
                    gradeSelect.disabled = (val === 0);
                    if (val === 0) {
                        gradeSelect.value = "";
                        updateGpaCourseRow(course.id, 'theoryGrade', "");
                    }
                }
            });
            
            gradeSelect.addEventListener('change', (e) => {
                updateGpaCourseRow(course.id, 'theoryGrade', e.target.value);
            });
            
            deleteBtn.addEventListener('click', () => {
                deleteTheoryComponent(course.id);
            });
            
            gpaTheoryList.appendChild(rowDiv);
        });
    }
    
    // 3. Render Practical list on Mobile
    if (gpaPracticalList) {
        gpaPracticalList.innerHTML = '';
        const practicalCourses = gpaCourses.filter(c => c.practicalCredits > 0);
        
        practicalCourses.forEach((course, index) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'gpa-mobile-row';
            rowDiv.dataset.id = course.id;
            
            let gradeOptions = '<option value="">Select Grade</option>';
            Object.keys(GPA_SCALE).forEach(gr => {
                gradeOptions += `<option value="${gr}" ${course.practicalGrade === gr ? 'selected' : ''}>${gr}</option>`;
            });
            
            rowDiv.innerHTML = `
                <span class="gpa-mobile-col-num">${index + 1}.</span>
                <div class="gpa-mobile-col-credits">
                    <input type="number" class="gpa-mobile-input-credits" value="${course.practicalCredits}" min="1" max="4" placeholder="e.g. 1" aria-label="Subject ${index + 1} practical credits">
                </div>
                <div class="gpa-mobile-col-grade">
                    <select class="gpa-mobile-select-grade" aria-label="Subject ${index + 1} practical grade">
                        ${gradeOptions}
                    </select>
                </div>
                <div class="gpa-mobile-col-action">
                    <button type="button" class="gpa-mobile-delete-btn" aria-label="Delete practical subject ${index + 1}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            `;
            
            const creditInput = rowDiv.querySelector('.gpa-mobile-input-credits');
            const gradeSelect = rowDiv.querySelector('.gpa-mobile-select-grade');
            const deleteBtn = rowDiv.querySelector('.gpa-mobile-delete-btn');
            
            creditInput.addEventListener('change', (e) => {
                let val = parseInt(e.target.value, 10);
                if (isNaN(val)) val = 0;
                updateGpaCourseRow(course.id, 'practicalCredits', val);
                if (gradeSelect) {
                    gradeSelect.disabled = (val === 0);
                    if (val === 0) {
                        gradeSelect.value = "";
                        updateGpaCourseRow(course.id, 'practicalGrade', "");
                    }
                }
            });
            
            gradeSelect.addEventListener('change', (e) => {
                updateGpaCourseRow(course.id, 'practicalGrade', e.target.value);
            });
            
            deleteBtn.addEventListener('click', () => {
                deletePracticalComponent(course.id);
            });
            
            gpaPracticalList.appendChild(rowDiv);
        });
    }
}

function calculateGpa() {
    let totalCredits = 0;
    let totalPoints = 0;
    let activeCredits = 0;

    gpaCourses.forEach(c => {
        // Theory component
        if (c.theoryCredits > 0 && c.theoryGrade && GPA_SCALE[c.theoryGrade] !== undefined) {
            const gp = GPA_SCALE[c.theoryGrade];
            if (gp !== null) {
                activeCredits += c.theoryCredits;
                totalPoints += gp * c.theoryCredits;
            }
            totalCredits += c.theoryCredits;
        }

        // Practical component
        if (c.practicalCredits > 0 && c.practicalGrade && GPA_SCALE[c.practicalGrade] !== undefined) {
            const gp = GPA_SCALE[c.practicalGrade];
            if (gp !== null) {
                activeCredits += c.practicalCredits;
                totalPoints += gp * c.practicalCredits;
            }
            totalCredits += c.practicalCredits;
        }
    });

    const gpa = activeCredits > 0 ? (totalPoints / activeCredits) : 0.00;

    // Use banker's rounding to match official results portal rounding policy
    const displayGpa = roundHalfToEven(gpa, 2);

    // Update UI elements
    if (gpaTotalCredits) gpaTotalCredits.textContent = totalCredits;
    if (gpaTotalPoints) gpaTotalPoints.textContent = totalPoints.toFixed(2);
    if (gpaSemesterGpa) gpaSemesterGpa.textContent = displayGpa.toFixed(2);
}

// Event Listeners for GPA Calculator
if (addCourseBtn) {
    addCourseBtn.addEventListener('click', () => {
        addGpaCourseRow();
    });
}

if (addTheorySubjectBtn) {
    addTheorySubjectBtn.addEventListener('click', () => {
        addTheorySubject();
    });
}

if (addPracticalSubjectBtn) {
    addPracticalSubjectBtn.addEventListener('click', () => {
        addPracticalSubject();
    });
}

if (scrollToScaleBtn) {
    scrollToScaleBtn.addEventListener('click', () => {
        const scaleSection = document.getElementById('gpaScaleSection');
        if (scaleSection) {
            scaleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

function initializeCalendarChips() {
    const chips = document.querySelectorAll('.calendar-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const targetId = chip.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
}

// Initialize on script load
initializeGpaCalculator();
initializeCalendarChips();

// =========================================================================
// Scroll Reveal — lightweight, opt-out for reduced motion, no-JS safe
// (elements are visible by default in CSS; this only adds the entrance
// animation for capable browsers with motion enabled)
// =========================================================================
(function initScrollReveal() {
    const revealEls = document.querySelectorAll("[data-reveal]");
    if (!revealEls.length) return;

    const prefersReducedMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        // Skip the animation, just show everything immediately.
        revealEls.forEach(el => el.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                obs.unobserve(entry.target); // animate once, then stop observing
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(el => observer.observe(el));
})();

// =========================================================================
// Sticky navbar elevation — adds shadow once scrolled, using a passive
// scroll listener + requestAnimationFrame throttle to avoid layout thrash.
// =========================================================================
(function initNavbarScrollShadow() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    let ticking = false;
    const applyState = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(applyState);
            ticking = true;
        }
    }, { passive: true });

    applyState(); // set initial state (e.g. on reload mid-scroll)
})();

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'dummy_dataset.csv');
const outputPath = path.join(__dirname, '..', 'data.js');

try {
    console.log('Starting data compilation...');
    if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length < 2) {
        throw new Error('CSV is empty or missing data lines.');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    
    // Group records by Batch ID (e.g. 23CS, 23BSCS)
    const batchGroups = {};

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        const studentId = cols[0];
        const batchVal = cols[1];
        const deptVal = cols[2];
        
        if (!studentId || !batchVal || !deptVal) continue;
        
        const batchId = `${batchVal}${deptVal}`;
        if (!batchGroups[batchId]) {
            batchGroups[batchId] = [];
        }
        
        // Extract semester GPAs
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
    }

    const compiledBatches = {};

    // Sort batch keys to keep standard order
    const sortedBatchIds = Object.keys(batchGroups).sort();

    sortedBatchIds.forEach(batchId => {
        const students = batchGroups[batchId];
        
        // Find the maximum semester that has at least one valid GPA for this batch
        let maxSem = 0;
        students.forEach(s => {
            Object.keys(s.gpas).forEach(sem => {
                const semInt = parseInt(sem);
                if (semInt > maxSem) {
                    maxSem = semInt;
                }
            });
        });

        // Initialize semesters maps list
        const semestersList = [];
        for (let sem = 1; sem <= maxSem; sem++) {
            semestersList.push({});
        }

        // Populate semesters maps list
        students.forEach(s => {
            Object.keys(s.gpas).forEach(sem => {
                const semInt = parseInt(sem);
                const semIdx = semInt - 1;
                semestersList[semIdx][s.id] = s.gpas[sem];
            });
        });

        compiledBatches[batchId] = {
            label: batchId,
            semesters: semestersList,
            students: null
        };
    });

    // Generate Javascript file content
    const jsContent = `/* AUTOMATICALLY GENERATED DATA FILE - DO NOT EDIT MANUALLY */
const generatedBatches = ${JSON.stringify(compiledBatches, null, 2)};
`;

    fs.writeFileSync(outputPath, jsContent, 'utf8');
    console.log(`Successfully compiled CSV to data.js! Total batches: ${sortedBatchIds.length}.`);

} catch (error) {
    console.error('Data compilation failed:', error.message);
    process.exit(1);
}

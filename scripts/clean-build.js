const fs = require('fs');
const path = require('path');

const folders = [
    'ranking', 'about', 'academic-calendar', 'architecture', 'artificial-intelligence', 
    'biomedical-engineering', 'business-administration', 'city-regional-planning', 
    'civil-engineering', 'computer-science', 'computer-systems-engineering', 
    'cyber-security', 'departments', 'electrical-engineering', 'environmental-engineering', 
    'environmental-sciences', 'faq', 'gpa-calculator', 'industrial-management-engineering', 
    'mechatronics-engineering', 'metallurgy-materials-engineering', 'petroleum-natural-gas-engineering', 
    'privacy-policy', 'software-engineering', 'telecommunication-engineering', 'textile-engineering'
];

console.log('Cleaning old build artifacts and static pre-rendered routes...');

folders.forEach(folder => {
    const folderPath = path.join(__dirname, '..', folder);
    if (fs.existsSync(folderPath)) {
        try {
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`Cleaned: /${folder}`);
        } catch (e) {
            console.error(`Failed to clean /${folder}:`, e.message);
        }
    }
});

console.log('Clean completed.');

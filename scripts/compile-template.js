const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'university.json');
const universityJsPath = path.join(__dirname, '..', 'config', 'university.js');

try {
    console.log('Starting HTML template and configuration compilation...');

    if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration not found at: ${configPath}`);
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);

    // 1. Generate client-side config/university.js
    const jsContent = `/* AUTOMATICALLY GENERATED CONFIG FILE - DO NOT EDIT MANUALLY */
window.UNIVERSITY_CONFIG = ${JSON.stringify(config, null, 2)};
`;
    fs.writeFileSync(universityJsPath, jsContent, 'utf8');
    console.log('✅ Generated config/university.js');

    // Helper to replace all double brace placeholders
    function replacePlaceholders(templateText, configObj) {
        let text = templateText;
        Object.entries(configObj).forEach(([key, val]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            text = text.replace(regex, val);
        });
        return text;
    }

    // 2. Compile index.template.html -> index.html
    const indexTemplatePath = path.join(__dirname, '..', 'index.template.html');
    if (fs.existsSync(indexTemplatePath)) {
        const indexTemplate = fs.readFileSync(indexTemplatePath, 'utf8');
        const indexHtml = replacePlaceholders(indexTemplate, config);
        fs.writeFileSync(path.join(__dirname, '..', 'index.html'), indexHtml, 'utf8');
        console.log('✅ Compiled index.template.html to index.html');
    } else {
        console.warn('⚠️ index.template.html not found, skipping compile.');
    }

    // 3. Compile admin.template.html -> admin.html
    const adminTemplatePath = path.join(__dirname, '..', 'admin.template.html');
    if (fs.existsSync(adminTemplatePath)) {
        const adminTemplate = fs.readFileSync(adminTemplatePath, 'utf8');
        const adminHtml = replacePlaceholders(adminTemplate, config);
        fs.writeFileSync(path.join(__dirname, '..', 'admin.html'), adminHtml, 'utf8');
        console.log('✅ Compiled admin.template.html to admin.html');
    } else {
        console.warn('⚠️ admin.template.html not found, skipping compile.');
    }

    // 4. Compile robots.template.txt -> robots.txt
    const robotsTemplatePath = path.join(__dirname, '..', 'robots.template.txt');
    if (fs.existsSync(robotsTemplatePath)) {
        const robotsTemplate = fs.readFileSync(robotsTemplatePath, 'utf8');
        const robotsTxt = replacePlaceholders(robotsTemplate, config);
        fs.writeFileSync(path.join(__dirname, '..', 'robots.txt'), robotsTxt, 'utf8');
        console.log('✅ Compiled robots.template.txt to robots.txt');
    } else {
        console.warn('⚠️ robots.template.txt not found, skipping compile.');
    }

    console.log('Template compilation completed successfully.');

} catch (error) {
    console.error('Template compilation failed:', error.message);
    process.exit(1);
}

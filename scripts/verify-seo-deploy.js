const fs = require('fs');
const path = require('path');

console.log('=== Starting SEO Verification ===');

let exitCode = 0;

// 1. Verify robots.txt
const robotsPath = path.join(__dirname, '..', 'robots.txt');
if (!fs.existsSync(robotsPath)) {
    console.error('❌ FAIL: robots.txt does not exist.');
    exitCode = 1;
} else {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    if (!robotsContent.includes('Disallow: /result/')) {
        console.error('❌ FAIL: robots.txt is missing Disallow: /result/');
        exitCode = 1;
    } else {
        console.log('✅ PASS: robots.txt contains Disallow: /result/');
    }
}

// 2. Verify vercel.json headers
const vercelPath = path.join(__dirname, '..', 'vercel.json');
if (!fs.existsSync(vercelPath)) {
    console.error('❌ FAIL: vercel.json does not exist.');
    exitCode = 1;
} else {
    try {
        const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
        const headers = config.headers || [];
        const resultHeader = headers.find(h => h.source === '/result/(.*)' || h.source === '/result/:path*');
        if (!resultHeader) {
            console.error('❌ FAIL: vercel.json lacks header rules for /result/* paths.');
            exitCode = 1;
        } else {
            const hasNoindex = resultHeader.headers.some(headerObj => 
                headerObj.key === 'X-Robots-Tag' && headerObj.value.includes('noindex')
            );
            if (!hasNoindex) {
                console.error('❌ FAIL: vercel.json result headers do not contain X-Robots-Tag: noindex');
                exitCode = 1;
            } else {
                console.log('✅ PASS: vercel.json result headers contain X-Robots-Tag: noindex');
            }
        }
    } catch (e) {
        console.error('❌ FAIL: vercel.json is not valid JSON.', e.message);
        exitCode = 1;
    }
}

// 3. Verify sitemap.xml
const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
    console.error('❌ FAIL: sitemap.xml does not exist. Run build/generate-sitemap first.');
    exitCode = 1;
} else {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const resultCount = (sitemapContent.match(/\/result\//g) || []).length;
    const urlCount = (sitemapContent.match(/<loc>/g) || []).length;
    
    if (resultCount > 0) {
        console.error(`❌ FAIL: sitemap.xml contains ${resultCount} individual result URLs. It should contain 0.`);
        exitCode = 1;
    } else {
        console.log('✅ PASS: sitemap.xml contains 0 individual result URLs.');
    }
    
    console.log(`ℹ️ INFO: sitemap.xml contains a total of ${urlCount} URLs.`);
}

console.log('=== SEO Verification Complete ===');
process.exit(exitCode);

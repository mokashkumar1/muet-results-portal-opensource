const { execSync } = require('child_process');

try {
    // Get list of staged files
    const stdout = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
    if (!stdout) {
        console.log('');
        process.exit(0);
    }

    const files = stdout.split('\n').map(f => f.trim()).filter(Boolean);
    
    // Auto-detect conventional commit prefix
    let prefix = 'chore';
    
    const isOnlyMd = files.every(f => f.endsWith('.md'));
    const isOnlyApiOrLib = files.every(f => f.startsWith('api/') || f.startsWith('lib/'));
    const isOnlyPackage = files.every(f => f === 'package.json' || f === 'package-lock.json');
    
    if (isOnlyMd) {
        prefix = 'docs';
    } else if (isOnlyApiOrLib) {
        // Inspect staged diff text for keywords to distinguish fix vs feat
        const diffContent = execSync('git diff --cached', { encoding: 'utf8' }).toLowerCase();
        if (diffContent.includes('fix') || diffContent.includes('bug') || diffContent.includes('error') || diffContent.includes('resolve') || diffContent.includes('prevent')) {
            prefix = 'fix';
        } else {
            prefix = 'feat';
        }
    } else if (isOnlyPackage) {
        prefix = 'chore';
    } else {
        prefix = 'chore';
    }
    
    // Compile list of modified file names
    let basenames = files.map(f => {
        const parts = f.split('/');
        return parts[parts.length - 1];
    });
    
    // Truncate list if there are too many files to keep commit title short
    if (basenames.length > 4) {
        basenames = [...basenames.slice(0, 3), `and ${basenames.length - 3} other files`];
    }
    
    const summary = `${prefix}: update ${basenames.join(', ')}`;
    console.log(summary);
} catch (err) {
    console.error('Error generating commit message:', err.message);
    process.exit(1);
}

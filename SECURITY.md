# Security Policy

## Reporting Vulnerabilities

If you discover any security-related issues, please do not report them via public issues. Instead, contact the repository maintainers directly or email the developer profile linked in the [README](README.md).

We will investigate and address all valid reports promptly.

## Privacy & Data Policy

This portal is designed to operate on a static-first architecture. It does not collect, track, or store personal user information.
- All dynamic data scans and OCR uploads are processed in memory and merged securely.
- Production deployments must secure their `GITHUB_TOKEN`, `JWT_SECRET`, and `GEMINI_API_KEY` environment variables in serverless dashboards (like Vercel or Netlify) and never check them into public Git histories.

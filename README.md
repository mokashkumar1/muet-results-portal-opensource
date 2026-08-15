# Configurable University Results Portal

A configurable JavaScript results portal for roll-number lookup, semester GPA history, batch statistics, dense rankings, and an authenticated result-ingestion workflow.

The repository contains synthetic demonstration data. It is not an official MUET service and should not be treated as an authoritative academic record.

[Live demo](https://muetresults.vercel.app/) · [Portfolio](https://mokashkumar.vercel.app/)

## Features

- Client-side result lookup and semester history
- Batch statistics and deterministic dense ranking
- Build-generated department, result, ranking, and sitemap pages
- Configurable university and department metadata
- JWT authentication in HTTP-only cookies
- Coordinator-scoped administrative workflow
- Optional Gemini-assisted OCR with a human review step
- GitHub-backed CSV updates for the demonstration deployment

## Stack

- HTML, CSS, and vanilla JavaScript
- Node.js build scripts and Vercel Functions
- Zod, JSON Web Tokens, bcrypt, and cookie helpers
- CSV source data
- Node's built-in test runner

## How the data flow works

1. `data/dummy_dataset.csv` is the source dataset.
2. `scripts/compile-data.js` validates it and generates `data.js`.
3. `lib/results-core.js` calculates grades, averages, and dense rankings in the browser.
4. Build scripts generate static pages and the sitemap.
5. Optional serverless functions authenticate coordinators, extract draft values from an image, validate edits, and update the configured GitHub CSV.

GitHub-backed CSV storage keeps this demonstration simple, but it is not a transactional database. OCR output must always be reviewed before saving.

## Local setup

Requirements: Node.js 18 or newer and npm.

```bash
git clone https://github.com/mokashkumar1/muet-results-portal-opensource.git
cd muet-results-portal-opensource
npm ci
```

Copy `.env.example` to `.env`. The public lookup and build work without production credentials. Administrative and OCR flows require the relevant variables documented in `.env.example`.

```bash
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Configuration

- `config/university.json` - institution name, site URL, dataset, and branding
- `config/departments.json` - department codes and route metadata
- `data/dummy_dataset.csv` - synthetic demonstration records

Student rows use `Student_ID`, `Batch`, `Dept`, and up to eight `GPA_S*` columns. The compiler rejects GPAs outside `0-4` and duplicate student IDs within the same batch.

## Testing and builds

```bash
npm test
npm run build
npm run verify-seo
```

Tests cover grade boundaries, GPA calculation, dense ranking, missing-semester behavior, statistics, CSV compilation, invalid values, duplicate records, request validation, and authentication helpers.

## Security notes

- JWT signing secrets and GitHub/Gemini tokens belong only in deployment environment variables.
- Authentication cookies are HTTP-only, same-site strict, and secure in production.
- API input is validated before result updates.
- Coordinator credentials are hashed; the source repository must never contain plaintext production credentials.

These controls reduce risk but do not constitute a security audit or guarantee. A real institution should use a transactional database, formal role management, audit logs, key rotation, privacy review, and independent testing.

## Limitations

- The CSV parser is intentionally simple and does not support quoted fields containing commas.
- Missing semester entries follow the existing portal rule and contribute `0` when that semester is published for the batch.
- OCR accuracy depends on scan quality and model output.
- GitHub API write access and deployment configuration must be secured by each adopter.

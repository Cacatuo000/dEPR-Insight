# dEPR Insight — EPR Simulation Suite

Free online EPR simulation suite for transition metal complexes. Compute g-factors, hyperfine splitting, zero-field splitting, and powder spectra for d-orbital systems. Axial, rhombic, and isotropic symmetry supported.

**Site:** [https://depr-insight.pages.dev](https://depr-insight.pages.dev)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Build and deploy (Cloudflare Pages)

```bash
npm run build
npx wrangler pages deploy out/ --project-name depr-insight
```

The repository is connected to Cloudflare Pages: pushing to `master` triggers an automatic deployment.

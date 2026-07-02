# HR Tools Intelligence

A BI + AI exploration layer built on top of a global HR tools inventory — dashboards, cross-filtered catalog, and an AI-generated portfolio analysis.

## Context

This project is a personal follow-up to an official case study delivered to **Lesaffre Group** (a biotech/fermentation company operating in 55+ countries): an **HR Tools Portal** built on Microsoft Power Apps Canvas, connected to a SharePoint List of 10 real HR tools used across the group.

`HR Tools Intelligence` reuses the same underlying data (10 real Lesaffre tools + 10 additional fictional tools covering realistic gaps: regional LMS, wellness platforms, mobility management, an internal HR chatbot, etc.) to explore what a BI and AI layer on top of that data could look like using a modern dev stack, as a complement to the no-code deliverable.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **Recharts** for data visualization
- **Lucide React** for icons
- **Anthropic API** (`claude-fable-5`) via a Next.js API route, for the AI Insights page
- Static, versioned data in `data/tools.json` (no backend/database)

## Key features

- **Cross-filtered catalog with CSV export** — filter the 20-tool inventory by category, scope, and country simultaneously (as toggleable chips), search by keyword, and export the currently filtered list to CSV.
- **Tool detail pages with similar tools** — each of the 20 tools has a dedicated, statically generated page (metadata, long description, official link) that surfaces related tools from the same category or scope.
- **AI Insights** — a dedicated page that sends the full tools inventory to Claude and returns a structured BI-style analysis (portfolio overview, strengths, gaps, standardization recommendations), rendered as formatted markdown.

Also included: a BI dashboard (KPI cards, category breakdown, Corporate vs Local split, top countries) and a dashboard search bar that deep-links into the catalog.

## Local installation

```bash
npm install
```

Create a `.env.local` file at the project root (already present with a placeholder) and set your own key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Add the `ANTHROPIC_API_KEY` environment variable in the Vercel project settings (Project → Settings → Environment Variables).
4. Deploy — no additional configuration needed (Next.js is auto-detected).

## About this project

This project is a personal complement to the official Power Apps deliverable, built to explore a BI and AI layer on top of the same HR tools data — showing product thinking, a modern dev stack, and applied AI beyond no-code tooling.

**Author:** Anas Mehri — ESAIP Angers, Cybersecurity & AI/Data

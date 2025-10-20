# AI Agent Instructions for Dzastin's Website

## Project Overview
This is an Astro-based portfolio website that fetches content from a Sanity.io CMS. The site follows a content-first architecture with static generation for optimal performance.

## Key Architecture Patterns

### Content Flow
- Content is managed in Sanity CMS and fetched via `src/lib/sanity.js`
- Work/portfolio items are queried in `src/data/works.js`
- Pages are statically generated at build time using Astro's `getStaticPaths`

### Component Structure
- `src/layouts/Layout.astro` - Base layout with global styles
- `src/components/*.astro` - Reusable components
  - `Post.astro` - Individual post display
  - `PostPreview.astro` - Post preview in lists
  - `Feed.astro` - Container for post lists
  - `Nav.astro` - Navigation component

### Routing
- Dynamic routes use `[slug].astro` for individual work posts
- Static routes in `src/pages` for main sections (work, blog, about)

## Development Workflow

### Essential Commands
```bash
npm install          # Install dependencies
npm run dev         # Start dev server at localhost:4321
npm run build       # Build production site
npm run preview     # Preview production build
```

### Key Integration Points
1. Sanity CMS Connection:
   - Project ID: saq01wqu
   - Dataset: production
   - API Version: 2023-10-01

## Common Patterns
1. Page Structure:
   ```astro
   ---
   import Layout from "../layouts/Layout.astro";
   import Nav from "../components/Nav.astro";
   import Feed from "../components/Feed.astro";
   ---
   <Layout title="Page Title">
     <Nav />
     <Feed>
       {/* Content */}
     </Feed>
   </Layout>
   ```

2. Data Fetching:
   - Always use the `getWorks()` function from `src/data/works.js` for work-related queries
   - Handle potential fetch failures with try/catch blocks

## Style Conventions
- Global styles in `src/styles/global.css`
- Reset CSS in `src/styles/reset.css`
- Component-specific styles use Astro's scoped styling
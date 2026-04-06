# Claude Code Skills

Drop the `.claude/` folder into the **root of your project** to activate all 21 skills in VS Code with Claude Code.

## Structure
```
your-project/
└── .claude/
    └── skills/
        ├── ui-ux-pro-max/       UI/UX design intelligence (67 styles, 161 palettes)
        ├── ui-styling/          Tailwind/shadcn styling guidance
        ├── design/              General design principles
        ├── design-system/       Design system creation
        ├── brand/               Brand identity & guidelines
        ├── banner-design/       Banner & ad design
        ├── slides/              Presentation slides design
        ├── build-graph/         Build codebase knowledge graph (needs MCP)
        ├── review-delta/        Review only changed code (needs MCP)
        ├── review-pr/           Full PR review with context (needs MCP)
        ├── code-review-skill/   Multi-language code review checklists
        ├── owasp-security/      OWASP Top 10:2025, ASVS 5.0, AI security
        ├── seo/                 Full SEO audit hub
        ├── seo-audit/           Site-wide SEO audits
        ├── seo-technical/       Technical SEO (crawl, CWV, indexability)
        ├── seo-content/         Content quality & E-E-A-T
        ├── seo-schema/          Structured data & schema markup
        ├── seo-local/           Local SEO signals
        ├── seo-geo/             GEO/AEO for AI Overviews & Perplexity
        ├── seo-backlinks/       Backlink analysis & acquisition
        └── seo-page/            Single-page SEO analysis
```

## Install
```bash
cp -r .claude /path/to/your-project/
```

> ⚠️ `build-graph`, `review-delta`, `review-pr` need the `code-review-graph` MCP server:
> ```bash
> uvx code-review-graph serve
> ```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server (Next.js 16, defaults to http://localhost:3000)
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, core-web-vitals + typescript)
- No test framework is configured yet

## Architecture

**StudyDeck** is a Next.js 16 App Router application that turns uploaded study materials into AI-generated flashcards and concept explanations. All state lives in browser localStorage — there is no database.

### Data flow

1. **Upload & Parse** — User uploads a file (PDF, DOCX, PPTX, or TXT) or pastes text. `POST /api/parse` delegates to format-specific parsers in `src/lib/parsers/` and returns a `ParsedMaterial`.
2. **Generate & Validate Cards** — `POST /api/generate` sends the parsed material to Claude which returns higher-order flashcards. A validation agent then automatically fact-checks each card against the source material, web search results (Tavily), and Claude's knowledge. Cards + validation results are saved as a `Deck` in localStorage.
3. **Study Session** — The `useStudySession` hook manages card queue, shuffling, grading (got-it / partially / missed-it), and spaced reinsertion of missed cards. Results are saved to localStorage.
4. **Concept Explainer** — `POST /api/explain` asks Claude for structured explanations with a "go deeper" drill-down that builds on previous explanations. Each explanation is also automatically fact-checked by the validation agent.

### Key layers

- **API routes** (`src/app/api/{parse,generate,explain}/route.ts`) — thin handlers that validate input and call into lib
- **AI module** (`src/lib/ai/`) — Anthropic SDK calls using `claude-sonnet-4-20250514`. Prompts live in `prompts.ts`. Both `generate-cards.ts` and `explain-concept.ts` parse raw JSON from model responses
- **Validation agent** (`src/lib/ai/validate.ts`) — automatically fact-checks generated flashcards and explanations after creation. Cross-references content against source material, web search (via Tavily), and Claude's knowledge. Results are embedded on each card/explanation as a `ValidationResult`
- **Web search** (`src/lib/ai/web-search.ts`) — Tavily wrapper for web-based fact-checking. Gracefully degrades if `TAVILY_API_KEY` is not set
- **Parsers** (`src/lib/parsers/`) — per-format file parsing (pdf-parse, mammoth for DOCX, officeparser for PPTX). All return `ParsedMaterial`
- **Storage** (`src/lib/storage.ts`) — localStorage CRUD for decks and session results. Keys: `studydeck_decks`, `studydeck_sessions`
- **Hooks** (`src/hooks/`) — `useDeck` (load/save/delete decks), `useStudySession` (card queue and grading state machine)

### Pages

- `/` — home page with file upload and deck list
- `/deck?id=` — deck detail view
- `/study?id=` — study session for a deck
- `/explain` — concept explainer

### UI

Tailwind CSS v4 + shadcn/ui components (in `src/components/ui/`). Dark mode is always on (class applied in root layout). Path alias: `@/*` maps to `./src/*`.

## Environment

Requires `ANTHROPIC_API_KEY` env var for the AI features (card generation and concept explanation).

Optional `TAVILY_API_KEY` enables web-based fact-checking for the validation agent. Without it, validation still runs using source material + Claude's knowledge.

# 📚 Book Intelligence — Extracted Wisdom Library

This folder holds **human-readable wisdom notes** distilled from every book Ravi
uploads. It is the permanent memory of the Book Intelligence Engine.

## How it works
1. Every uploaded PDF is processed (`pdf-parse` server-side, or offline) into
   page-referenced chunks stored as JSON in `public/books-data/<slug>.json`.
2. `public/books-data/index.json` lists every book, its categories, page count
   and chunk count. The app reads this to show "loaded & active" books.
3. For each book we also write a curated `.md` note here — real quotes, real
   page references, organised by the protocol it feeds (gym, skincare, mindset…).
4. The AI Daily Planner retrieves the most relevant chunks (by category +
   keyword) and injects the **actual book text** into the prompt. No summaries.

## Categories
`gym` · `skincare` · `grooming` · `communication` · `psychology` · `biography`
· `masculine` · `habits` · `nutrition`

## Books currently loaded
| Book | Author | Category | Pages | Chunks | Notes |
|------|--------|----------|-------|--------|-------|
| Glow From Within | Joanna Vargas | skincare, nutrition | 151 | 124 | [skincare/glow-from-within.md](skincare/glow-from-within.md) |
| MANMADE | Chris Salgardo | skincare, grooming | 251 | 102 | [grooming/manmade.md](grooming/manmade.md) |

## For the next agent
When Ravi uploads more books:
1. Drop the chunk JSON into `public/books-data/` and update `index.json`.
2. Write a curated note here in the matching category folder.
3. Tag chunks with the right category so the planner can retrieve them.
See `/AGENTS.md` for the full handoff.

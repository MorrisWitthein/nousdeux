# Recipe Import Feature — Design Sketch

Import a recipe from a website URL or a photo, have Claude extract the structured data, and pre-fill the recipe form for review before saving.

## Flow

```
User pastes URL or drops image
        ↓
Frontend sends to: POST /api/recipes/import
        ↓
Go handler fetches/reads the source and calls Claude API (vision or text)
        ↓
Claude returns structured JSON matching the recipe schema
        ↓
Frontend pre-fills RecipeForm with parsed data
        ↓
User reviews / edits → saves normally via existing addRecipe()
```

The imported recipe is never saved automatically — it always lands in the form first so the user can correct parsing errors before committing.

## Recipe schema Claude must return

```json
{
  "title": "Spaghetti Carbonara",
  "emoji": "🍝",
  "tags": ["pasta", "italian"],
  "ingredients": "200g Spaghetti\n100g Guanciale\n2 Eier\n50g Parmesan",
  "steps": "1. Pasta kochen\n2. Guanciale anbraten\n3. ...",
  "prepTime": 30,
  "servings": 2
}
```

`ingredients` and `steps` are newline-delimited strings — the same format the DB stores and `parseLines()` reads. Claude should translate everything to German.

## API endpoint

`POST /api/recipes/import`

Request body (one of the two sources):
```json
{ "url": "https://example.com/rezept", "who": "L" }
```
```json
{ "imageBase64": "data:image/jpeg;base64,...", "who": "L" }
```

Response on success: the structured recipe JSON above (not saved to DB yet).

### Handler steps

**For a URL:**
1. `http.Get` the page HTML
2. Strip tags to plain text (`golang.org/x/net/html`)
3. Send text to Claude with an extraction prompt
4. Return parsed JSON to the frontend

**For an image:**
1. Pass `imageBase64` directly as a Claude vision message (multimodal — no OCR step needed)
2. Return parsed JSON to the frontend

The Claude API key lives as an env var (e.g. `ANTHROPIC_API_KEY`), called via plain `net/http` — no SDK needed.

### Claude prompt (sketch)

```
Extract the recipe from the content below and return a JSON object with these fields:
- title (string)
- emoji (single emoji that fits the dish)
- tags (array of strings, max 4, lowercase)
- ingredients (newline-separated list, amounts first, e.g. "200g Mehl")
- steps (newline-separated numbered steps)
- prepTime (integer, total minutes including cooking)
- servings (integer)

Translate all text to German. Return only valid JSON, no markdown fences.
```

## Frontend changes

- Add an "Importieren" button — either alongside the FAB or as a secondary action inside the add sheet
- Small modal: paste a URL **or** drop / select an image file
- Show a spinner while the API call runs
- On success: call `setFields(parsed)` to pre-fill the existing `RecipeForm`
- No new form — reuse `RecipeForm` entirely

## Effort estimate

| What | Effort |
|---|---|
| Go: `POST /api/recipes/import` handler | ~1–2 h |
| Go: HTML → text stripping for URLs | ~30 min |
| Go: Anthropic API call via `net/http` | ~1 h |
| Frontend: import modal + spinner | ~1 h |
| Frontend: wire parsed result into `RecipeForm` | ~30 min |

**Total: roughly half a day.**

## Open question

Most recipe sites render server-side HTML, so a plain `http.Get` + strip works fine. For JS-rendered sites a headless browser would be needed — probably not worth the complexity for now. If a site doesn't parse well, the user can always fall back to manual entry.

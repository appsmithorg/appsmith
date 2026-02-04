# AI Prompts Reference (JS & Query Pages)

Locations of prompts that shape AI responses for JavaScript and query editors. Use these when tuning or extending AI assistance.

---

## 1. System prompts (what the model is “told” to be)

These define the AI’s role and constraints. Same text is used on **client** (direct API) and **server** (proxy) paths.

### JavaScript mode

**Files:**

- **Client:** `app/client/src/ce/services/AIAssistantService.ts` → `buildSystemPrompt()` (lines 132–137)
- **Server:** `app/server/appsmith-server/src/main/java/com/appsmith/server/services/ce/AIAssistantServiceCEImpl.java` → `JS_SYSTEM_PROMPT` (lines 271–273)

**Current text:**

```text
You are an expert JavaScript developer helping with Appsmith code.
Appsmith is a low-code platform. Provide clean, efficient JavaScript code that follows best practices.
Focus on the specific function or code block the user is working on.
```

### SQL / query mode

**Files:**

- **Client:** `app/client/src/ce/services/AIAssistantService.ts` → `buildSystemPrompt()` (lines 138–142)
- **Server:** `app/server/appsmith-server/src/main/java/com/appsmith/server/services/ce/AIAssistantServiceCEImpl.java` → `SQL_SYSTEM_PROMPT` (lines 275–278)

**Current text:**

```text
You are an expert SQL/query developer helping with database queries in Appsmith.
Provide optimized, correct SQL queries that follow best practices.
Consider the datasource type and ensure the query is syntactically correct.
```

**Note:** The client does not currently send datasource type in context; only `functionString`, `functionName`, and `cursorLineNumber` are sent (see “Context sent to the AI” below). To make “Consider the datasource type” effective, you’d need to add datasource (and optionally entity) info to the context.

---

## 2. User prompt template (context + user request)

The “user” message is built from editor context plus the user’s question. Same structure on client and server.

**Files:**

- **Client:** `app/client/src/ce/services/AIAssistantService.ts` → `buildUserPrompt()` (lines 144–162)
- **Server:** `app/server/appsmith-server/src/main/java/com/appsmith/server/services/ce/AIAssistantServiceCEImpl.java` → `buildUserPrompt()` (lines 286–326)

**Structure:**

- Optional: `Function: {functionName}`
- Optional: `Current function code:` + fenced block with `functionString`
- Optional: `Cursor at line: {cursorLineNumber + 1}`
- Then: `User request: {prompt}`
- Ending: `Provide the code solution:`

So the model is explicitly asked to “Provide the code solution” for both JS and query modes.

---

## 3. Context sent to the AI (what the model sees)

**Built in:** `app/client/src/ce/components/editorComponents/GPT/trigger.tsx` → `getAIContext()` (lines 34–71).

- **JavaScript:** ±15 lines around cursor.
- **SQL:** ±10 lines around cursor.
- **Sent fields:** `functionName` (currently always `""`), `cursorLineNumber`, `functionString`, `mode`, `cursorPosition`, `cursorCoordinates`.

**Not sent today (but could improve responses):**

- Datasource type (e.g. PostgreSQL, MySQL) for query mode
- Entity/action name (e.g. query or JS object name)
- App/page or widget names

Extending `getAIContext()` and the `AIEditorContext` / `AIEditorContextDTO` types would allow system/user prompts to reference these (e.g. “Consider the datasource type”).

---

## 4. Quick-action prompts (AI side panel)

Predefined buttons that send a fixed prompt. Same in CE and EE.

**File:** `app/client/src/ce/components/editorComponents/GPT/AISidePanel.tsx` → `QUICK_ACTIONS` (lines 386–408).

| Label        | Prompt |
|-------------|--------|
| Explain     | `Explain what this code does step by step` |
| Fix Errors  | `Find and fix any bugs or errors in this code` |
| Refactor    | `Refactor this code to be cleaner and more efficient` |
| Add Comments| `Add helpful comments to explain this code` |

These are passed through the same `buildUserPrompt()` so they get the same context (function code, cursor line, etc.).

---

## 5. Table widget validation assist (inline edit)

Not a “chat” prompt; it’s the short hint shown in the table inline-edit validation UI. Often used with “Ask AI” to generate validation expressions.

**File:** `app/client/src/ce/constants/messages.ts` → `TABLE_WIDGET_VALIDATION_ASSIST_PROMPT` (lines 1234–1235).

**Current text:** `Access the current cell using ` (incomplete in the constant; the rest may be concatenated or in the component).

**Used in:**

- `app/client/src/components/propertyControls/TableInlineEditValidationControl.tsx`
- `app/client/src/components/propertyControls/TableInlineEditValidPropertyControl.tsx`

Improving this message can guide users (and any AI that reads the UI) on how to write table validation expressions.

---

## 6. Where to change behavior

| Goal | Where to edit |
|------|----------------|
| Change JS or SQL “persona” / instructions | System prompts in `AIAssistantService.ts` (CE) and `AIAssistantServiceCEImpl.java` (keep in sync). |
| Change how user message is formatted | `buildUserPrompt()` in the same two places. |
| Add datasource/entity/name to context | `getAIContext()` in `trigger.tsx` and the types/DTOs that carry context to the API. |
| Add or change quick-action prompts | `QUICK_ACTIONS` in `app/client/src/ce/components/editorComponents/GPT/AISidePanel.tsx`. |
| Improve table validation hint | `TABLE_WIDGET_VALIDATION_ASSIST_PROMPT` in `app/client/src/ce/constants/messages.ts` and the property controls that use it. |

---

## 7. EE vs CE

- **CE:** `app/client/src/ce/services/AIAssistantService.ts` and `app/client/src/ce/components/editorComponents/GPT/*`.
- **EE:** Re-exports or extends CE; prompt text and quick actions are defined in CE. Keep prompts in CE so one place controls behavior for both.

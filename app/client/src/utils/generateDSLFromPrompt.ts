/**
 * GenSmith DSL Generation + Smart-Merge utilities
 *
 * Provides helpers to:
 *  1. Build a "page context" string from Redux state (queries + JS Objects)
 *     so AI always has full knowledge of the current page's resources.
 *  2. Generate a new page DSL from a prompt via the AI service.
 *  3. Smart-merge AI output into existing DSL without discarding existing widgets.
 */

import { flattenDSL, nestDSL, ROOT_CONTAINER_WIDGET_ID } from "@shared/dsl";
import type { FlattenedDSL, NestedDSL } from "@shared/dsl";
import type { WidgetProps } from "widgets/BaseWidget";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import type { JSCollectionDataState } from "ee/reducers/entityReducers/jsActionsReducer";
import { generateDslFromPrompt } from "./aiService";
import type { AiServiceConfig, ConversationTurn } from "./aiService";
import { compileRecipe, validateRecipe } from "./gensmithRecipes";
import type { Recipe } from "./gensmithRecipes";
import { sanitizeDsl } from "./gensmithSanitizer";

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

type NestedWidget = NestedDSL<WidgetProps>;

// ---------------------------------------------------------------------------
// Page context builder
// ---------------------------------------------------------------------------

/**
 * Builds a compact plain-text summary of all queries and JS Objects on the
 * current page.  This is injected automatically into every AI request so that
 * AI-generated DSL can reference correct query names, datasource shapes, and
 * existing JS Object APIs without needing the user to describe them manually.
 *
 * Including JS Object *bodies* (code) is important for the iterative-debugging
 * use-case: when the user wants to fix or extend previously generated JS logic,
 * the AI sees the existing code and can modify it correctly.
 */
export function buildPageContext(
  actions: ActionDataState,
  jsCollections: JSCollectionDataState,
  currentPageId: string,
): string {
  const pageActions = actions.filter((a) => a.config?.pageId === currentPageId);
  const pageJs = jsCollections.filter(
    (j) => j.config?.pageId === currentPageId,
  );

  // Queries
  const queryLines = pageActions.map((a) => {
    const name = a.config?.name ?? "unknown";
    const ds = (a.config?.datasource as { name?: string })?.name ?? "";
    const plugin = a.config?.pluginType ?? "";
    const body = (
      (a.config?.actionConfiguration as { body?: string })?.body ?? ""
    )
      .toString()
      .trim()
      .slice(0, 400);

    let line = `• ${name}`;

    if (ds) line += ` (datasource: ${ds}${plugin ? `, ${plugin}` : ""})`;

    if (body) line += `\n  Query body: ${body}`;

    return line;
  });

  // JS Objects — include full body so AI can see previously generated code
  const jsLines = pageJs.map((j) => {
    const name = j.config?.name ?? "unknown";
    const body = (j.config?.body ?? "").toString().trim().slice(0, 800);

    return `• ${name}:\n${body || "(empty)"}`;
  });

  const parts: string[] = [];

  parts.push(
    queryLines.length > 0
      ? `Queries on this page:\n${queryLines.join("\n\n")}`
      : "Queries on this page: (none)",
  );

  parts.push(
    jsLines.length > 0
      ? `JS Objects on this page:\n${jsLines.join("\n\n")}`
      : "JS Objects on this page: (none — if you need JS logic, see the Generated JS panel below)",
  );

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateNestedDsl(dsl: unknown): string | null {
  if (typeof dsl !== "object" || dsl === null) {
    return "DSL must be a JSON object.";
  }

  const root = dsl as Record<string, unknown>;

  if (!root.widgetId || typeof root.widgetId !== "string") {
    return 'Root widget is missing a valid "widgetId" field.';
  }

  if (!root.type || typeof root.type !== "string") {
    return 'Root widget is missing a valid "type" field.';
  }

  return null;
}

export function validateFlatDsl(flat: CanvasWidgetsReduxState): string | null {
  for (const [widgetId, widget] of Object.entries(flat)) {
    if (!widget.widgetId) return `Widget "${widgetId}" missing "widgetId".`;

    if (!widget.type) return `Widget "${widgetId}" missing "type".`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Smart merge
// ---------------------------------------------------------------------------

export function smartMerge(
  base: CanvasWidgetsReduxState,
  incoming: CanvasWidgetsReduxState,
): CanvasWidgetsReduxState {
  const merged: CanvasWidgetsReduxState = { ...base };

  for (const [widgetId, incomingWidget] of Object.entries(incoming)) {
    if (base[widgetId]) {
      merged[widgetId] = {
        ...base[widgetId],
        ...incomingWidget,
        children:
          incomingWidget.children && incomingWidget.children.length > 0
            ? incomingWidget.children
            : base[widgetId].children,
      };
    } else {
      merged[widgetId] = incomingWidget;

      const parentId = incomingWidget.parentId;

      if (parentId && merged[parentId]) {
        const existingChildren = merged[parentId].children ?? [];

        if (!existingChildren.includes(widgetId)) {
          merged[parentId] = {
            ...merged[parentId],
            children: [...existingChildren, widgetId],
          };
        }
      }
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  mergeIntoExisting?: boolean;
  aiConfig?: AiServiceConfig;
  /** Auto-built from Redux (query names/bodies + JS Object code). */
  pageContext?: string;
  /** Free-text context from the user (schemas, business rules, return shapes). */
  extraContext?: string;
  /** Prior conversation turns — enables iterative editing and debugging. */
  history?: ConversationTurn[];
}

export interface GenerateResult {
  flatDsl: CanvasWidgetsReduxState;
  nestedDsl: NestedWidget;
  formattedJson: string;
  /** JS Object code suggested by AI, or null if the request needed no new JS. */
  jsCode: string | null;
  /** "recipe" = LLM emitted a recipe (deterministic compile); "dsl" = raw DSL. */
  source: "recipe" | "dsl";
  /** Human-readable label for the badge in the UI (e.g. "crud-table"). */
  sourceLabel: string;
  /** Full user message sent to LLM — store in conversation history. */
  userMessage: string;
  /** Raw LLM response — store in conversation history. */
  assistantMessage: string;
}

export async function generateAndApplyDsl(
  prompt: string,
  currentFlatDsl: CanvasWidgetsReduxState,
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const {
    aiConfig = {},
    extraContext = "",
    history = [],
    mergeIntoExisting = true,
    pageContext = "",
  } = options;

  const currentNested = nestDSL(
    currentFlatDsl as FlattenedDSL<WidgetProps>,
    ROOT_CONTAINER_WIDGET_ID,
  ) as NestedWidget;

  const {
    assistantMessage,
    dsl: rawDsl,
    jsCode,
    recipe,
    userMessage,
  } = await generateDslFromPrompt(
    prompt,
    currentNested,
    pageContext,
    extraContext,
    aiConfig,
    history,
  );

  let generatedNested: NestedWidget;
  let source: "recipe" | "dsl";
  let sourceLabel: string;
  let useMerge = mergeIntoExisting;

  if (recipe) {
    // Recipe path: deterministic compile, always replace the page (a recipe
    // describes an entire page). This avoids fighting leftover widgets from
    // previous AI attempts.
    const recipeError = validateRecipe(recipe);

    if (recipeError) {
      throw new Error(`AI returned invalid recipe: ${recipeError}`);
    }

    generatedNested = compileRecipe(recipe as Recipe) as NestedWidget;
    source = "recipe";
    sourceLabel = (recipe as { type?: string }).type ?? "recipe";
    useMerge = false;
  } else {
    // Raw-DSL path: validate, then always run the sanitizer so common AI
    // mistakes (INPUT_WIDGET_V3, junk columns, out-of-grid buttons, etc.)
    // are repaired before we dispatch.
    if (!rawDsl) throw new Error("AI returned neither recipe nor DSL.");

    const validationError = validateNestedDsl(rawDsl);

    if (validationError) {
      throw new Error(`AI returned invalid DSL: ${validationError}`);
    }

    generatedNested = sanitizeDsl(rawDsl) as NestedWidget;
    source = "dsl";
    sourceLabel = "dsl";
  }

  const generatedFlat = flattenDSL(
    generatedNested as FlattenedDSL<WidgetProps>,
  ) as CanvasWidgetsReduxState;

  const finalFlat = useMerge
    ? smartMerge(currentFlatDsl, generatedFlat)
    : generatedFlat;

  const finalNested = nestDSL(
    finalFlat as FlattenedDSL<WidgetProps>,
    ROOT_CONTAINER_WIDGET_ID,
  ) as NestedWidget;

  return {
    flatDsl: finalFlat,
    nestedDsl: finalNested,
    formattedJson: JSON.stringify(finalNested, null, 2),
    jsCode,
    source,
    sourceLabel,
    userMessage,
    assistantMessage,
  };
}

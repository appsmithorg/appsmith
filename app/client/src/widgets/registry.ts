import { retryPromise } from "utils/AppsmithUtils";
import type BaseWidget from "./BaseWidget";

export type WidgetLoader = () => Promise<typeof BaseWidget>;

/**
 * The widget loader registry.
 *
 * This module is intentionally kept free of any static reference to widget
 * modules. The full loader map (which dynamically imports every widget) lives
 * in `widgets/index.ts` and is registered here as a side effect when that
 * module is imported at app/worker bootstrap (see `src/index.tsx` and
 * `evaluation.worker.ts`).
 *
 * Why the indirection: consumers in the evaluation/editor dependency graph
 * (e.g. `EvaluationsSaga`, `EditorUtils`) need `loadWidget`/`loadAllWidgets`,
 * but widget config modules import back into that same graph. Importing the
 * loaders directly therefore pulls the entire widget barrel into a large
 * dependency cycle. Reading the loaders from this registry — which does not
 * statically reach any widget — keeps those consumers out of the cycle.
 */
const WidgetLoaders = new Map<string, WidgetLoader>();

// Cache for loaded widgets
const loadedWidgets = new Map<string, typeof BaseWidget>();

/**
 * Populate the registry with widget loaders. Called once, as a side effect of
 * importing `widgets/index.ts` at bootstrap.
 */
export const registerWidgetLoaders = (
  entries: Iterable<[string, WidgetLoader]>,
): void => {
  for (const [type, loader] of entries) {
    WidgetLoaders.set(type, loader);
  }
};

// Function to load a specific widget by type
export const loadWidget = async (type: string): Promise<typeof BaseWidget> => {
  if (loadedWidgets.has(type)) {
    return loadedWidgets.get(type)!;
  }

  const loader = WidgetLoaders.get(type);

  if (!loader) {
    throw new Error(`Widget type ${type} not found`);
  }

  try {
    const widget = await retryPromise(async () => loader());

    loadedWidgets.set(type, widget);

    return widget;
  } catch (error) {
    throw new Error(`Error loading widget ${type}:` + error);
  }
};

// Function to load all widgets
export const loadAllWidgets = async (): Promise<
  Map<string, typeof BaseWidget>
> => {
  const allWidgets = new Map<string, typeof BaseWidget>();

  const widgetPromises = Array.from(WidgetLoaders.entries()).map(
    async ([type, loader]) => {
      if (loadedWidgets.has(type)) {
        return [type, loadedWidgets.get(type)!] as [string, typeof BaseWidget];
      }

      try {
        const widget = await retryPromise(async () => loader());

        loadedWidgets.set(type, widget);

        return [type, widget] as [string, typeof BaseWidget];
      } catch (error) {
        throw new Error(
          `Failed to load widget type ${type}: ${error instanceof Error ? error.message : error}`,
        );
      }
    },
  );

  const loadedWidgetEntries = await Promise.all(widgetPromises);

  for (const [type, widget] of loadedWidgetEntries) {
    allWidgets.set(type, widget);
  }

  return allWidgets;
};

export default WidgetLoaders;

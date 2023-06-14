import {
  ROOT_CONTAINER_WIDGET_ID,
  ROOT_CONTAINER_WIDGET_NAME,
} from "constants";
import type { NormalizedSchema } from "normalizr";
import { schema, normalize, denormalize } from "normalizr";

type WidgetProps = Record<string, any>;

export type NestedDSLWidget = WidgetProps & { children?: NestedDSLWidget[] };
export type NestedDSL = NestedDSLWidget;

export type UnnestedDSLWidget = WidgetProps & { children?: string[] };
export type UnnestedDSL = { [widgetId: string]: UnnestedDSLWidget };
export type UnnestedGitDSL = { [widgetName: string]: UnnestedDSLWidget };

export type UnnestedDSLEntities = { canvasWidgets: UnnestedDSL };
export type UnnestedGitDSLEntities = { canvasWidgets: UnnestedGitDSL };

// Schema by widgetId
const SCHEMA_BY_ID = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetId" },
);
SCHEMA_BY_ID.define({ children: [SCHEMA_BY_ID] });

// Schema by widgetName
const SCHEMA_BY_NAME = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetName" },
);
SCHEMA_BY_NAME.define({ children: [SCHEMA_BY_NAME] });

// Normalising using widgetId
export function unnestDSL(nestedDSL: NestedDSL): UnnestedDSL {
  const { entities }: NormalizedSchema<UnnestedDSLEntities, string> = normalize(
    nestedDSL,
    SCHEMA_BY_ID,
  );
  return entities.canvasWidgets;
}

// Denormalising using widgetId
export function nestDSL(
  unnestedDSL: UnnestedDSL,
  widgetId: string = ROOT_CONTAINER_WIDGET_ID,
): NestedDSL {
  return denormalize(widgetId, SCHEMA_BY_ID, unnestedDSL);
}

// Normalising using widgetName
export function unnestGitDSL(nestedDSL: NestedDSL): UnnestedGitDSL {
  const { entities }: NormalizedSchema<UnnestedGitDSLEntities, string> =
    normalize(nestedDSL, SCHEMA_BY_NAME);
  return entities.canvasWidgets;
}

// Denormalising using widgetName
export function nestGitDSL(
  unnestedDSL: UnnestedDSL,
  widgetName: string = ROOT_CONTAINER_WIDGET_NAME,
): NestedDSL {
  return denormalize(widgetName, SCHEMA_BY_NAME, unnestedDSL);
}

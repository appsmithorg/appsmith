import {
  ROOT_CONTAINER_WIDGET_ID,
  ROOT_CONTAINER_WIDGET_NAME,
} from "./constants";
import type { NormalizedSchema } from "normalizr";
import { schema, normalize, denormalize } from "normalizr";

// type WidgetProps = Record<string, any> & {
//   widgetId: string;
//   widgetName: string;
// };

export type NestedDSLWidget<W> = W & { children?: NestedDSLWidget<W>[] };
export type NestedDSL<W> = NestedDSLWidget<W>;

export type UnnestedDSLWidget<W> = W & { children?: string[] };
export type UnnestedDSL<W> = { [widgetId: string]: UnnestedDSLWidget<W> };
export type UnnestedGitDSL<W> = { [widgetName: string]: UnnestedDSLWidget<W> };

export type UnnestedDSLEntities<W> = { canvasWidgets: UnnestedDSL<W> };
export type UnnestedGitDSLEntities<W> = { canvasWidgets: UnnestedGitDSL<W> };

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
export function unnestDSL<W>(nestedDSL: NestedDSL<W>): UnnestedDSL<W> {
  const {
    entities,
  }: NormalizedSchema<UnnestedDSLEntities<W>, string> = normalize(
    nestedDSL,
    SCHEMA_BY_ID,
  );
  return entities.canvasWidgets;
}

// Denormalising using widgetId
export function nestDSL<W>(
  unnestedDSL: UnnestedDSL<W>,
  widgetId: string = ROOT_CONTAINER_WIDGET_ID,
): NestedDSL<W> {
  const entities = { canvasWidgets: unnestedDSL };
  return denormalize(widgetId, SCHEMA_BY_ID, entities);
}

// Normalising using widgetName
export function unnestGitDSL<W>(nestedDSL: NestedDSL<W>): UnnestedGitDSL<W> {
  const {
    entities,
  }: NormalizedSchema<UnnestedGitDSLEntities<W>, string> = normalize(
    nestedDSL,
    SCHEMA_BY_NAME,
  );
  return entities.canvasWidgets;
}

// Denormalising using widgetName
export function nestGitDSL<W>(
  unnestedDSL: UnnestedDSL<W>,
  widgetName: string = ROOT_CONTAINER_WIDGET_NAME,
): NestedDSL<W> {
  const entities = { canvasWidgets: unnestedDSL };
  return denormalize(widgetName, SCHEMA_BY_NAME, entities);
}

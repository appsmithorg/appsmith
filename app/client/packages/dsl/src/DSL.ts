import { ROOT_CONTAINER_WIDGET_ID } from "./constants";
import type { NormalizedSchema } from "normalizr";
import { schema, normalize, denormalize } from "normalizr";

export type NestedDSLWidget<W> = W & { children?: NestedDSLWidget<W>[] };
export type NestedDSL<W> = NestedDSLWidget<W>;

export type UnnestedDSLWidget<W> = W & { children?: string[] };
export type UnnestedDSL<W> = { [widgetId: string]: UnnestedDSLWidget<W> };

export type UnnestedDSLEntities<W> = { canvasWidgets: UnnestedDSL<W> };

// Schema by widgetId
const SCHEMA_BY_ID = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetId" },
);
SCHEMA_BY_ID.define({ children: [SCHEMA_BY_ID] });

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

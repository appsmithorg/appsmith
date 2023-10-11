import { ROOT_CONTAINER_WIDGET_ID } from "./constants";
import type { NormalizedSchema } from "normalizr";
import { schema, normalize, denormalize } from "normalizr";

export type NestedDSLWidget<W> = W & { children?: NestedDSLWidget<W>[] };
export type NestedDSL<W> = NestedDSLWidget<W>;

export type FlattenedDSLWidget<W> = W & { children?: string[] };
export type FlattenedDSL<W> = { [widgetId: string]: FlattenedDSLWidget<W> };

export type FlattenedDSLEntities<W> = { canvasWidgets: FlattenedDSL<W> };

// Schema by widgetId
const SCHEMA_BY_ID = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetId" },
);
SCHEMA_BY_ID.define({ children: [SCHEMA_BY_ID] });

// Normalising using widgetId
export function flattenDSL<W>(nestedDSL: NestedDSL<W>): FlattenedDSL<W> {
  const {
    entities,
  }: NormalizedSchema<FlattenedDSLEntities<W>, string> = normalize(
    nestedDSL,
    SCHEMA_BY_ID,
  );
  return entities.canvasWidgets;
}

// Denormalising using widgetId
export function nestDSL<W>(
  flattenedDSL: FlattenedDSL<W>,
  widgetId: string = ROOT_CONTAINER_WIDGET_ID,
): NestedDSL<W> {
  const entities = { canvasWidgets: flattenedDSL };
  return denormalize(widgetId, SCHEMA_BY_ID, entities);
}

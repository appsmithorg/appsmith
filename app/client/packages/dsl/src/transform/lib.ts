import { ROOT_CONTAINER_WIDGET_ID } from "./constants";
import type { NormalizedSchema } from "normalizr";
import { schema, normalize, denormalize } from "normalizr";
import type { FlattenedDSL, FlattenedDSLEntities, NestedDSL } from "./types";

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

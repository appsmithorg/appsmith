import { schema, normalize, denormalize } from "normalizr";

export type NestedDSL<DSLWidget> = DSLWidget & { children?: DSLWidget[] };
export type FlattenedDSLWidget<DSLWidget> = DSLWidget & { children?: string[] };

export type FlattenedDSLEntities<DSLWidget> = {
  canvasWidgets: {
    [widgetId: string]: FlattenedDSLWidget<DSLWidget>;
  };
};
export type FlattenedDSL<DSLWidget> = {
  entities: FlattenedDSLEntities<DSLWidget>;
  result: string;
};

export type FlattenedDSLEntitiesByName<DSLWidget> = {
  canvasWidgets: {
    [widgetName: string]: FlattenedDSLWidget<DSLWidget>;
  };
};
export type FlattenedDSLByName<DSLWidget> = {
  entities: FlattenedDSLEntitiesByName<DSLWidget>;
  result: string;
};

// Schema by widgetId
const schemaById = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetId" },
);
schemaById.define({ children: [schemaById] });

// Schema by widgetName
const schemaByName = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetName" },
);
schemaByName.define({ children: [schemaByName] });

// Normalising using widgetId
export function flattenDSLById<DSLWidget>(
  nestedDSL: NestedDSL<DSLWidget>,
): FlattenedDSL<DSLWidget> {
  return normalize(nestedDSL, schemaById);
}

// Denormalising using widgetId
export function unflattenDSLById<DSLWidget>(
  widgetId: string,
  entities: FlattenedDSLEntities<DSLWidget>,
): NestedDSL<DSLWidget> {
  return denormalize(widgetId, schemaById, entities);
}

// Normalising using widgetName
export function flattenDSLByName<DSLWidget>(
  nestedDSL: NestedDSL<DSLWidget>,
): FlattenedDSL<DSLWidget> {
  return normalize(nestedDSL, schemaById);
}

// Denormalising using widgetName
export function unflattenDSLByName<DSLWidget>(
  widgetId: string,
  entities: FlattenedDSLEntities<DSLWidget>,
): NestedDSL<DSLWidget> {
  return denormalize(widgetId, schemaById, entities);
}

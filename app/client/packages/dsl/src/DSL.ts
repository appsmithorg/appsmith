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

// schema by widgetId
const schemaById = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetId" },
);
schemaById.define({ children: [schemaById] });

// schema by widgetName
const schemaByName = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetName" },
);
schemaByName.define({ children: [schemaByName] });

export function flattenDSLById<DSLWidget>(
  nestedDSL: NestedDSL<DSLWidget>,
): FlattenedDSL<DSLWidget> {
  return normalize(nestedDSL, schemaById);
}

export function unflattenDSLById<DSLWidget>(
  widgetId: string,
  entities: FlattenedDSLEntities<DSLWidget>,
): NestedDSL<DSLWidget> {
  return denormalize(widgetId, schemaById, entities);
}

export function flattenDSLByName<DSLWidget>(
  nestedDSL: NestedDSL<DSLWidget>,
): FlattenedDSL<DSLWidget> {
  return normalize(nestedDSL, schemaById);
}

export function unflattenDSLByName<DSLWidget>(
  widgetId: string,
  entities: FlattenedDSLEntities<DSLWidget>,
): NestedDSL<DSLWidget> {
  return denormalize(widgetId, schemaById, entities);
}

// class DSL<DSLWidget> {
//   private rawDSL: NestedDSL<DSLWidget>;
//   private widgetSchemaById: schema.Entity<NestedDSL<DSLWidget>>;
//   private widgetSchemaByName: schema.Entity<NestedDSL<DSLWidget>>;

//   constructor(rawDSL: NestedDSL<DSLWidget>) {
//     this.rawDSL = rawDSL;
//   }

//   asNestedDSL(): NestedDSL<DSLWidget> {
//     return this.rawDSL;
//   }

//   asFlatDSL(): FlattenedDSL<DSLWidget> {
//     return normalize(this.rawDSL, this.widgetSchemaById);
//   }

//   asNestedDSLFromFlat(
//     widgetId: string,
//     entities: FlattenedDSLEntities<DSLWidget>,
//   ): NestedDSL<DSLWidget> {
//     return denormalize(widgetId, this.widgetSchemaById, entities);
//   }

//   asGitDSL(): GitFlattenedDSL<DSLWidget> {
//     return normalize(this.rawDSL, this.widgetSchemaByName);
//   }

//   asNestedDSLFromGit(
//     widgetName: string,
//     entities: GitFlattenedDSLEntities<DSLWidget>,
//   ): NestedDSL<DSLWidget> {
//     return denormalize(widgetName, this.widgetSchemaByName, entities);
//   }
// }

// export default DSL;

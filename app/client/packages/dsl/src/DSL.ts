import { schema, normalize, denormalize } from "normalizr";

type NestedDSL<DSLWidget> = DSLWidget & { children: DSLWidget[] };
type FlattenedDSLWidget<DSLWidget> = DSLWidget & { children: string[] };
type FlattenedDSL<DSLWidget> = {
  entities: { canvasWidgets: FlattenedDSLWidget<DSLWidget>[] };
  result: string;
};
type GitFlattenedDSL<DSLWidget> = FlattenedDSL<DSLWidget>;

class DSL<DSLWidget> {
  private rawDSL: NestedDSL<DSLWidget>;
  private widgetSchemaById: schema.Entity<NestedDSL<DSLWidget>>;
  private widgetSchemaByName: schema.Entity<NestedDSL<DSLWidget>>;

  constructor(rawDSL: NestedDSL<DSLWidget>) {
    this.rawDSL = rawDSL;

    // schema by widgetId
    this.widgetSchemaById = new schema.Entity(
      "canvasWidgets",
      {},
      { idAttribute: "widgetId" },
    );
    this.widgetSchemaById.define({ children: [this.widgetSchemaById] });

    // schema by widgetName
    this.widgetSchemaByName = new schema.Entity(
      "canvasWidgets",
      {},
      { idAttribute: "widgetName" },
    );
    this.widgetSchemaByName.define({ children: [this.widgetSchemaByName] });
  }

  asNestedDSL(): NestedDSL<DSLWidget> {
    return this.rawDSL;
  }

  asFlatDSL(): FlattenedDSL<DSLWidget> {
    return normalize(this.rawDSL, this.widgetSchemaById);
  }

  asNestedDSLFromFlat(
    widgetId: string,
    entities: { canvasWidgets: FlattenedDSLWidget<DSLWidget>[] },
  ): NestedDSL<DSLWidget> {
    return denormalize(widgetId, this.widgetSchemaById, entities);
  }

  asGitDSL(): GitFlattenedDSL<DSLWidget> {
    return normalize(this.rawDSL, this.widgetSchemaByName);
  }

  asNestedDSLFromGit(
    widgetName: string,
    entities: { canvasWidgets: FlattenedDSLWidget<DSLWidget>[] },
  ): NestedDSL<DSLWidget> {
    return denormalize(widgetName, this.widgetSchemaByName, entities);
  }
}

export default DSL;

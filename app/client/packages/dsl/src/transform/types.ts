export type NestedDSLWidget<W> = W & {
  children?: NestedDSLWidget<W>[];
  archived?: NestedDSLWidget<W>[];
};

export type NestedDSL<W> = NestedDSLWidget<W>;

export type FlattenedDSLWidget<W> = W & {
  children?: string[];
  archived?: string[];
};

export interface FlattenedDSL<W> {
  [widgetId: string]: FlattenedDSLWidget<W>;
}

export interface FlattenedDSLEntities<W> {
  canvasWidgets: FlattenedDSL<W>;
}

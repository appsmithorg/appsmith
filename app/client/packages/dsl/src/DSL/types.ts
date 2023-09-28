export type NestedDSLWidget<W> = W & { children?: NestedDSLWidget<W>[] };
export type NestedDSL<W> = NestedDSLWidget<W>;

export type FlattenedDSLWidget<W> = W & { children?: string[] };
export type FlattenedDSL<W> = { [widgetId: string]: FlattenedDSLWidget<W> };

export type FlattenedDSLEntities<W> = { canvasWidgets: FlattenedDSL<W> };

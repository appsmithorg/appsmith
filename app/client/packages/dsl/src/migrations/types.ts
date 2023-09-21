/* eslint-disable @typescript-eslint/no-explicit-any */
export type WidgetProps = Record<string, any>;

export type DSLWidget = WidgetProps & { children: DSLWidget[] };

export type ColumnProperties = any;

export type ColumnPropertiesV2 = any;

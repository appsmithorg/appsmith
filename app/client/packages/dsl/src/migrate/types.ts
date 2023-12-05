/* eslint-disable @typescript-eslint/no-explicit-any */
export type WidgetProps = Record<string, any>;

export type DSLWidget = WidgetProps & { children?: DSLWidget[] };

// mocking the below aliases as any, because dont want to maintaing redundant types
export type ColumnProperties = any;

export type ColumnPropertiesV2 = any;

export type DataRecord = Record<string, unknown>;

export interface RowDataChangeOptions {
  key: string;
  widgetId: string;
  prevData?: DataRecord;
  currData?: DataRecord;
}

export interface MetaWidgetRowCache {
  [key: string]: {
    data?: DataRecord;
    lastUpdated?: number;
  };
}

export interface RowCache {
  [key: string]: {
    data?: DataRecord;
    metaProperties?: DataRecord;
    lastUpdated?: number;
  };
}

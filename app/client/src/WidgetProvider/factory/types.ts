export type DerivedPropertiesMap = Record<string, string>; // exporting it as well so that existing imports are not affected

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WidgetDerivedPropertyType = any;
export type WidgetType = Record<string, string>[number];
export type WidgetTypeConfigMap = Record<
  string,
  {
    defaultProperties: Record<string, string>;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metaProperties: Record<string, any>;
    derivedProperties: WidgetDerivedPropertyType;
  }
>;

export interface WidgetCreationException {
  message: string;
}

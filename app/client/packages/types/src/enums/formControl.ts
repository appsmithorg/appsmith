export enum ViewTypes {
  JSON = "json",
  COMPONENT = "component",
}

export enum PaginationSubComponent {
  Limit = "limit",
  Offset = "offset",
  Cursor = "cursor",
}

export enum FormControlTypes {
  INPUT_TEXT = "INPUT_TEXT",
  FIXED_KEY_INPUT = "FIXED_KEY_INPUT",
  DROP_DOWN = "DROP_DOWN",
  SEGMENTED_CONTROL = "SEGMENTED_CONTROL",
  SWITCH = "SWITCH",
  KEYVALUE_ARRAY = "KEYVALUE_ARRAY",
  FILE_PICKER = "FILE_PICKER",
  QUERY_DYNAMIC_TEXT = "QUERY_DYNAMIC_TEXT",
  QUERY_DYNAMIC_INPUT_TEXT = "QUERY_DYNAMIC_INPUT_TEXT",
  CHECKBOX = "CHECKBOX",
  NUMBER_INPUT = "NUMBER_INPUT",
  ARRAY_FIELD = "ARRAY_FIELD",
  WHERE_CLAUSE = "WHERE_CLAUSE",
  ENTITY_SELECTOR = "ENTITY_SELECTOR",
  PAGINATION = "PAGINATION",
  SORTING = "SORTING",
  PROJECTION = "PROJECTION",
  FORM_TEMPLATE = "FORM_TEMPLATE",
  MULTIPLE_FILE_PICKER = "MULTIPLE_FILE_PICKER",
}

export enum SortingSubComponent {
  Column = "column",
  Order = "order",
}

export enum WhereClauseSubComponent {
  Condition = "condition",
  Children = "children",
  Key = "key",
  Value = "value",
}

export enum EditorControlTypes {
  E_GRAPHQL_PAGINATION = "E_GRAPHQL_PAGINATION",
}

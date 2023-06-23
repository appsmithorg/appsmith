export default {
  connectData: '[data-testId="t--one-click-binding-connect-data"]',
  datasourceDropdownSelector:
    "[data-testId='t--one-click-binding-datasource-selector']",
  datasourceDropdownOptionSelector: (query: string) =>
    `[data-testId="t--one-click-binding-datasource-trigger"]:contains(${query})`,
  dropdownOptionSelector: (query: string) =>
    `[data-testId="t--one-click-binding-datasource-trigger"]:contains(${query})`,
  datasourceQueryBindHeaderSelector:
    "[data-testId='t--one-click-binding-datasource-selector--bind-to-query']",
  datasourceGenerateAQuerySelector:
    "[data-testId='t--one-click-binding-datasource-selector--generate-a-query']",
  datasourceOtherActionsSelector:
    "[data-testId='t--one-click-binding-datasource-selector--other-actions']",
  datasourceQuerySelector: (query?: string) =>
    `[data-testId='t--one-click-binding-datasource-selector--query']${
      query ? `:contains(${query})` : ""
    }`,
  datasourceSelector: (datasource?: string) =>
    `[data-testId="t--one-click-binding-datasource-selector--datasource"]${
      datasource ? `:contains(${datasource})` : ""
    }`,
  otherActionSelector: (action?: string) =>
    `[data-testId='t--one-click-binding-datasource-selector--other-action']${
      action ? `:contains(${action})` : ""
    }`,
  tableOrSpreadsheetDropdown:
    '[data-testid="t--one-click-binding-table-selector"] .rc-select-selector',
  tableOrSpreadsheetDropdownOption: (table?: string) =>
    `[data-testId='t--one-click-binding-table-selector--table']${
      table ? `:contains(${table})` : ""
    }`,
  tableOrSpreadsheetSelectedOption: (table?: string) =>
    `[data-testid="t--one-click-binding-table-selector"] .rc-select-selection-item${
      table ? `:contains(${table})` : ""
    }`,
  searchableColumn:
    '[data-testId="t--one-click-binding-column-searchableColumn"]',
  searchableColumnDropdownOption: (column?: string) =>
    `[data-testId='t--one-click-binding-column-searchableColumn--column']${
      column ? `:contains(${column})` : ""
    }`,
  searchableColumnSelectedOption: (column?: string) =>
    `[data-testId="t--one-click-binding-column-searchableColumn"] .rc-select-selection-item${
      column ? `:contains(${column})` : ""
    }`,
  validTableRowData:
    '.t--widget-tablewidgetv2 [role="rowgroup"] [role="button"]',
  tableError: (error: string) =>
    `[data-testId="t--one-click-binding-table-selector--error"]:contains(${error})`,
  dateInput: `[data-testId="datepicker-container"] input`,
  dayViewFromDate: ".DayPicker-Day",
  loadMore: "[data-testId='t--one-click-binding-datasource--load-more']",
  datasourceSearch: `[data-testId="t--one-click-binding-datasource--search"]`,
};

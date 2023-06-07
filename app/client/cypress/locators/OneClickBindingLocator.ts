export default {
  connectData: '[data-testId="t--one-click-binding-connect-data"]',
  datasourceDropdownSelector: ".t--one-click-binding-datasource-selector",
  datasourceDropdownOptionSelector: (query: string) =>
    `.t--one-click-binding-datasource-selector .rc-select-selection-item:contains(${query})`,
  dropdownOptionSelector: (query: string) =>
    `.rc-select-selection-item:contains(${query})`,
  datasourceQueryBindHeaderSelector:
    ".t--one-click-binding-datasource-selector--bind-to-query",
  datasourceGenerateAQuerySelector:
    ".t--one-click-binding-datasource-selector--generate-a-query",
  datasourceOtherActionsSelector:
    ".t--one-click-binding-datasource-selector--other-actions",
  datasourceQuerySelector: ".t--one-click-binding-datasource-selector--query",
  datasourceSelector: (datasource?: string) =>
    `[data-testid="t--one-click-binding-datasource-selector--datasource"]${
      datasource ? `:contains(${datasource})` : ""
    }`,
  otherActionSelector: (action?: string) =>
    `.t--one-click-binding-datasource-selector--other-action${
      action ? `:contains(${action})` : ""
    }`,
  tableOrSpreadsheetDropdown:
    '[data-testid="t--one-click-binding-table-selector"]',
  tableOrSpreadsheetDropdownOption: (table?: string) =>
    `.t--one-click-binding-table-selector--table${
      table ? `:contains(${table})` : ""
    }`,
  tableOrSpreadsheetSelectedOption: (table?: string) =>
    `[data-testid="t--one-click-binding-table-selector"] .rc-select-selection-item${
      table ? `:contains(${table})` : ""
    }`,
  searchableColumn:
    '[data-testid="t--one-click-binding-column-searchableColumn"]',
  searchableColumnDropdownOption: (column?: string) =>
    `.t--one-click-binding-column-searchableColumn--column${
      column ? `:contains(${column})` : ""
    }`,
  searchableColumnSelectedOption: (column?: string) =>
    `[data-testid="t--one-click-binding-column-searchableColumn"] .rc-select-selection-item${
      column ? `:contains(${column})` : ""
    }`,
  validTableRowData:
    '.t--widget-tablewidgetv2 [role="rowgroup"] [role="button"]',
  tableError: (error: string) =>
    `[data-testId="t--one-click-binding-table-selector--error"]:contains(${error})`,
  dateInput: `[data-testid="datepicker-container"] input`,
  dayViewFromDate: ".DayPicker-Day",
};

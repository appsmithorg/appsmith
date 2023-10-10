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
    `//div[@data-testId='t--one-click-binding-table-selector--table']//div[text()='${table}']`,
  tableOrSpreadsheetSelectedOption: (table?: string) =>
    `[data-testid="t--one-click-binding-table-selector"] .rc-select-selection-item${
      table ? `:contains(${table})` : ""
    }`,
  validTableRowData:
    '.t--widget-tablewidgetv2 [role="rowgroup"] [role="button"]',
  tableError: (error: string) =>
    `[data-testId="t--one-click-binding-table-selector--error"]:contains(${error})`,
  dateInput: `[data-testId="datepicker-container"] input`,
  dayViewFromDate: ".DayPicker-Day",
  loadMore: "[data-testId='t--one-click-binding-datasource--load-more']",
  datasourceSearch: `[data-testId="t--one-click-binding-datasource--search"]`,
  searchableColumn:
    '[data-testId="t--one-click-binding-column-searchableColumn"]',
  formType: '[data-testId="t--one-click-binding-column-formType"]',
  defaultValues: '[data-testId="t--one-click-binding-column-defaultValues"]',
  dataIdentifier: '[data-testId="t--one-click-binding-column-dataIdentifier"]',
  label: '[data-testId="t--one-click-binding-column-label"]',
  value: '[data-testId="t--one-click-binding-column-value"]',
  columnDropdownOption: (column: string, value?: string) =>
    `[data-testId='t--one-click-binding-column-${column}--column']${
      value ? `:contains(${value})` : ""
    }`,
  columnSelectedOption: (column: string, value?: string) =>
    `[data-testId="t--one-click-binding-column-${column}"] .rc-select-selection-item${
      value ? `:contains(${value})` : ""
    }`,
  columnSelectorModalTrigger: '[data-testid="t--edit-fields-button"]',
  columnSelectorModal: '[data-testid="t--column-selector-modal"]',
  columnselectorModalSaveBtn: '[data-testid="t--edit-fields-save-btn"]',
  columnselectorModalCancelBtn: '[data-testid="t--edit-fields-cancel-btn"]',
  columnSelectorField: (columnName: string) =>
    `[data-column-id="t--edit-field-${columnName}"]`,
  checkBox: ".ads-v2-checkbox",
};

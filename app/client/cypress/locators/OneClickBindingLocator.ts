export default {
  connectData: ".t--one-click-binding-connect-data",
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
    `.t--one-click-binding-datasource-selector--datasource${
      datasource ? `:contains(${datasource})` : ""
    }`,
  otherActionSelector: (action?: string) =>
    `.t--one-click-binding-datasource-selector--other-action${
      action ? `:contains(${action})` : ""
    }`,
  datasourcePage: ".t--integrationsHomePage",
  backButton: ".t--back-button",
  tableError: (error: string) =>
    `.t--one-click-binding-table-selector--error:contains(${error})`,
};

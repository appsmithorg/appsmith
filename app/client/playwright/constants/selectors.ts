export const SELECTORS = {
  widgetByName: (name: string) => `[data-widgetname-cy="${name}"]`,
  widgetByType: (type: string) => `[data-widgetname-cy="${type}widget"]`,
  widgetInDeployed: (type: string) => `.t--widget-${type.toLowerCase()}`,
  deployedPage: ".t--app-viewer-navigation-header",
  modal: ".t--modal-widget",
  toast: ".t--toast-action",
  sliderThumb: '[data-testid="slider-thumb"]',
  tableCell: (row: number, col: number) =>
    `.tbody .td[data-rowindex="${row}"][data-colindex="${col}"]`,
  jsonFormInput: (label: string) =>
    `//p[text()='${label}']/ancestor::div[@direction='column']//input`,
} as const;

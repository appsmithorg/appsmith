export default class PartialImportExport {
  public readonly locators = {
    import: {
      importModal: "[data-testid='t--partialImportModal']",
    },
    export: {
      exportModal: "[data-testid='t--partialExportModal']",
      modelContents: {
        sectionHeaders:
          "[data-testid='t--partialExportModal-collapsibleHeader']",
        jsObjectsSection:
          "[data-testid='t--partialExportModal-jsObjectsSection']",
        datasourcesSection:
          "[data-testid='t--partialExportModal-datasourcesSection']",
        queriesSection: "[data-testid='t--partialExportModal-queriesSection']",
        customJSLibsSection:
          "[data-testid='t--partialExportModal-customJSLibsSection']",
        widgetsSection: "[data-testid='t--partialExportModal-widgetsSection']",
        exportButton: "[data-testid='t--partialExportModal-exportBtn']",
      },
    },
  };
}

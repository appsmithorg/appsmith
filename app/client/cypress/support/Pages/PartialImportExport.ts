import { ObjectsRegistry } from "../Objects/Registry";
import { EntityItems } from "./AssertHelper";
import { AppSidebar, AppSidebarButton, PageLeftPane } from "./EditorNavigation";
const exportedPropertiesToUIEntitiesMap = {
  jsObjects: "actionCollectionList",
  datasources: "datasourceList",
  queries: "actionList",
  customJSLibs: "customJSLibList",
  widgets: "widgets",
} as const;

export default class PartialImportExport {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private homePage = ObjectsRegistry.HomePage;
  private entityExplorer = ObjectsRegistry.EntityExplorer;

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
        exportButton: "[data-testid='t-partial-export-entities-btn']",
      },
    },
  };

  OpenExportModal(entityName = "Home") {
    this.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: entityName,
      action: "Export",
      entityType: EntityItems.Page,
    });

    this.agHelper.AssertElementVisibility(this.locators.export.exportModal);
    this.agHelper.AssertElementEnabledDisabled(
      this.locators.export.modelContents.exportButton,
    );
  }

  OpenImportModal(entityName = "Page1") {
    AppSidebar.navigate(AppSidebarButton.Editor);

    this.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: entityName,
      action: "Import",
      entityType: EntityItems.Page,
    });

    this.agHelper.AssertElementVisibility(this.locators.import.importModal);
  }
  ExportAndCompareDownloadedFile(
    sectionName: keyof typeof exportedPropertiesToUIEntitiesMap,
    sectionIndex: number,
    sectionSelector: string,
    fileNameToCompareWith: string,
    fixtureName: string,
  ) {
    this.agHelper.GetNClick(
      this.locators.export.modelContents.sectionHeaders,
      sectionIndex,
    );

    const currentSection = this.agHelper.GetElement(sectionSelector);

    const checkboxesInSection = currentSection.find("input[type='checkbox']");
    checkboxesInSection.each((element) => {
      cy.wrap(element).click({ force: true });
    });

    this.agHelper.AssertElementEnabledDisabled(
      this.locators.export.modelContents.exportButton,
      0,
      false,
    );
    this.agHelper.GetNClick(this.locators.export.modelContents.exportButton);
    this.agHelper.FailIfErrorToast(
      Cypress.env("MESSAGES").ERROR_IN_EXPORTING_APP(),
    );

    cy.readFile(`cypress/downloads/${fixtureName}`).then((exportedFile) => {
      cy.fixture(`PartialImportExport/${fileNameToCompareWith}`).then(
        (expectedFile) => {
          const propertyName = exportedPropertiesToUIEntitiesMap[sectionName];

          if (propertyName in exportedFile && propertyName in expectedFile) {
            const exportedPropertyContents = JSON.stringify(
              exportedFile[propertyName],
            )
              .split("")
              .sort()
              .join();
            const expectedFileContents = JSON.stringify(
              expectedFile[propertyName],
            )
              .split("")
              .sort()
              .join();
            expect(exportedPropertyContents).to.equal(expectedFileContents);
          } else {
            throw new Error(
              "Exported file does not match with the expected file",
            );
          }
        },
      );
    });
    cy.exec(`rm cypress/downloads/${fixtureName}`);
  }

  ImportPartiallyExportedFile(
    fileName: string,
    sectionTitle: "JSObjects" | "Queries" | "Widgets" | "Data" | "Libraries",
    elementsToCheck: string[],
    filePath: string = "fixtures",
  ) {
    cy.intercept("POST", "/api/v1/applications/import/partial/**").as(
      "partialImportNetworkCall",
    );

    if (filePath == "fixtures") {
      cy.xpath(this.homePage._uploadFile).selectFile(
        `cypress/fixtures/PartialImportExport/${fileName}`,
        {
          force: true,
        },
      );
    } else if (filePath == "downloads") {
      cy.xpath(this.homePage._uploadFile).selectFile(
        `cypress/downloads/${fileName}`,
        {
          force: true,
        },
      );
    }
    cy.wait("@partialImportNetworkCall");

    this.agHelper.FailIfErrorToast(
      "Internal server error while processing request",
    );
    this.agHelper.WaitUntilToastDisappear(
      "Partial Application imported successfully",
    );

    switch (sectionTitle) {
      case "Data":
        AppSidebar.navigate(AppSidebarButton.Data);
        elementsToCheck.forEach((dsName) => {
          this.agHelper.GetNAssertContains(
            ObjectsRegistry.DataSources._datasourceCard,
            dsName,
          );
        });
        return;
      case "Libraries":
        AppSidebar.navigate(AppSidebarButton.Libraries);
        elementsToCheck.forEach((customJsLib) => {
          cy.contains(customJsLib);
        });
        return;
      case "Widgets":
        PageLeftPane.switchSegment("UI");
        break;
      case "JSObjects":
        PageLeftPane.switchSegment("JS");
        break;
      case "Queries":
        PageLeftPane.switchSegment("Queries");
        break;
    }
    elementsToCheck.forEach((element) => {
      PageLeftPane.assertPresence(element);
    });
  }

  PartiallyExportFile(
    sectionIndex: number,
    sectionSelector: string,
    checkbox: string[],
  ) {
    this.agHelper.GetNClick(
      this.locators.export.modelContents.sectionHeaders,
      sectionIndex,
    );

    const currentSection = this.agHelper.GetElement(sectionSelector);

    currentSection.find("label").each((element) => {
      const labelText = element.text().trim();
      if (checkbox.includes(labelText)) {
        cy.wrap(element).click({ force: true });
      }
    });

    this.agHelper.AssertElementEnabledDisabled(
      this.locators.export.modelContents.exportButton,
      0,
      false,
    );
    this.agHelper.GetNClick(this.locators.export.modelContents.exportButton);
    this.agHelper.FailIfErrorToast(
      Cypress.env("MESSAGES").ERROR_IN_EXPORTING_APP(),
    );
  }
}

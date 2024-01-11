import { ObjectsRegistry } from "../Objects/Registry";
import { EntityItems } from "./AssertHelper";
import { AppSidebar, AppSidebarButton, PageLeftPane } from "./EditorNavigation";

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
        exportButton: "[data-testid='t--partialExportModal-exportBtn']",
      },
    },
  };

  OpenExportMenu() {
    this.entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Home",
      action: "Export",
      entityType: EntityItems.Page,
    });

    this.agHelper.AssertElementVisibility(this.locators.export.exportModal);
    this.agHelper.AssertElementEnabledDisabled(
      this.locators.export.modelContents.exportButton,
    );
  }

  ExportAndCompareDownloadedFile(
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

    cy.readFile(`cypress/downloads/${fixtureName}`).then((exportedFile) => {
      cy.fixture(`PartialImportExport/${fileNameToCompareWith}`).then(
        (expectedFile) => {
          // sort the contents of both the files before comparing
          exportedFile = JSON.stringify(exportedFile).split("").sort().join("");
          expectedFile = JSON.stringify(expectedFile).split("").sort().join("");

          expect(exportedFile).to.deep.equal(expectedFile);
        },
      );
    });
    cy.exec(`rm cypress/downloads/${fixtureName}`);
  }

  ImportPartiallyExportedFile(
    fileName: string,
    sectionTitle: string,
    elementsToCheck: string[],
  ) {
    cy.xpath(this.homePage._uploadFile).selectFile(
      `cypress/fixtures/PartialImportExport/${fileName}`,
      {
        force: true,
      },
    );

    this.agHelper.WaitUntilEleAppear(
      "Partial Application imported successfully",
    );
    this.agHelper.CheckForErrorToast(
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
        break;
      case "Libraries":
        AppSidebar.navigate(AppSidebarButton.Libraries);
        elementsToCheck.forEach((customJsLib) => {
          cy.contains(customJsLib);
        });
        break;
      default:
        PageLeftPane.expandCollapseItem(sectionTitle);
        elementsToCheck.forEach((element) => {
          PageLeftPane.assertPresence(element);
        });
    }
  }
}

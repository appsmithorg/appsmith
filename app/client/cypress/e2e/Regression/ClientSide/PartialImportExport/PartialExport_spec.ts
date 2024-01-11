import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  homePage,
  agHelper,
  partialImportExport,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

let guid: any;
let workspaceName;
const fixtureName = "PartialImportExportSampleApp.json";

describe(
  "Partial export functionality",
  { tags: ["@tag.ImportExport"] },
  () => {
    before(() => {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        guid = uid;
        workspaceName = "workspaceName-" + guid;
        homePage.CreateNewWorkspace(workspaceName, true);
        homePage.ImportApp(`PartialImportExport/${fixtureName}`, workspaceName);
      });

      featureFlagIntercept({
        release_show_partial_import_export_enabled: true,
      });
    });

    beforeEach(() => {
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Home",
        action: "Export",
        entityType: EntityItems.Page,
      });

      agHelper.AssertElementVisibility(
        partialImportExport.locators.export.exportModal,
      );
      agHelper.AssertElementEnabledDisabled(
        partialImportExport.locators.export.modelContents.exportButton,
      );
    });

    it("1. Should export all the selected JsObjects", () => {
      exportAndCompareDownloadedFile(
        0,
        partialImportExport.locators.export.modelContents.jsObjectsSection,
        "JSExportedOnly.json",
      );
    });

    it("2. Should export all the selected datasources", () => {
      exportAndCompareDownloadedFile(
        1,
        partialImportExport.locators.export.modelContents.datasourcesSection,
        "DatasourceExportedOnly.json",
      );
    });

    it("3. Should export all the selected queries", () => {
      exportAndCompareDownloadedFile(
        2,
        partialImportExport.locators.export.modelContents.queriesSection,
        "QueriesExportedOnly.json",
      );
    });

    it("4. Should export all the customjs libs", () => {
      exportAndCompareDownloadedFile(
        3,
        partialImportExport.locators.export.modelContents.customJSLibsSection,
        "CustomJsLibsExportedOnly.json",
      );
    });

    it("5. Should export all the widgets", () => {
      exportAndCompareDownloadedFile(
        4,
        partialImportExport.locators.export.modelContents.widgetsSection,
        "WidgetsExportedOnly.json",
      );
    });
  },
);

function exportAndCompareDownloadedFile(
  sectionIndex: number,
  sectionSelector: string,
  fileNameToCompareWith: string,
) {
  agHelper.GetNClick(
    partialImportExport.locators.export.modelContents.sectionHeaders,
    sectionIndex,
  );

  const currentSection = agHelper.GetElement(sectionSelector);

  const checkboxesInSection = currentSection.find("input[type='checkbox']");
  checkboxesInSection.each((element) => {
    cy.wrap(element).click({ force: true });
  });

  agHelper.AssertElementEnabledDisabled(
    partialImportExport.locators.export.modelContents.exportButton,
    0,
    false,
  );
  agHelper.GetNClick(
    partialImportExport.locators.export.modelContents.exportButton,
  );

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

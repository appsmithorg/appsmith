import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  homePage,
  agHelper,
  templates,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

import PartialImportExportLocatores from "./PartialImportExportLocators";

let guid: any;
let workspaceName;
const fixtureName = "PartialImportExportSampleApp.json";

describe("Partial export functionality", { tags: [] }, () => {
  before(() => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      guid = uid;
      workspaceName = "workspaceName-" + guid;
      homePage.CreateNewWorkspace(workspaceName, true);
      homePage.ImportApp(`PartialImportExport/${fixtureName}`, workspaceName);
    });

    featureFlagIntercept({ release_show_partial_import_export_enabled: true });
  });

  beforeEach(() => {
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Home",
      action: "Export",
      entityType: EntityItems.Page,
    });

    agHelper.AssertElementVisibility(PartialImportExportLocatores.exportModal);
    agHelper.AssertElementEnabledDisabled(
      PartialImportExportLocatores.modelContents.exportButton,
    );
  });

  it("1. Should export all the selected JsObjects", () => {
    exportAndCompareDownloadedFile(
      0,
      PartialImportExportLocatores.modelContents.jsObjectsSection,
      "JSExportedOnly.json",
    );
  });

  it("2. Should export all the selected datasources", () => {
    exportAndCompareDownloadedFile(
      1,
      PartialImportExportLocatores.modelContents.datasourcesSection,
      "DatasourceExportedOnly.json",
    );
  });

  it("3. Should export all the selected queries", () => {
    exportAndCompareDownloadedFile(
      2,
      PartialImportExportLocatores.modelContents.queriesSection,
      "QueriesExportedOnly.json",
    );
  });

  it("4. Should export all the customjs libs", () => {
    exportAndCompareDownloadedFile(
      3,
      PartialImportExportLocatores.modelContents.customJSLibsSection,
      "CustomJSLibsExportedOnly.json",
    );
  });

  it("5. Should export all the widgets", () => {
    exportAndCompareDownloadedFile(
      4,
      PartialImportExportLocatores.modelContents.widgetsSection,
      "WidgetsExportedOnly.json",
    );
  });
});

function exportAndCompareDownloadedFile(
  sectionIndex: number,
  sectionSelector: string,
  fileNameToCompareWith: string,
) {
  agHelper.GetNClick(
    PartialImportExportLocatores.modelContents.sectionHeaders,
    sectionIndex,
  );

  const currentSection = agHelper.GetElement(sectionSelector);

  const checkboxesInSection = currentSection.find("input[type='checkbox']");
  checkboxesInSection.each((element) => {
    cy.wrap(element).click({ force: true });
  });

  agHelper.AssertElementEnabledDisabled(
    PartialImportExportLocatores.modelContents.exportButton,
    0,
    false,
  );
  agHelper.GetNClick(PartialImportExportLocatores.modelContents.exportButton);

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

const dsl = require("../../../../../fixtures/Listv2/Listv2JSObjects.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
const commonlocators = require("../../../../../locators/commonlocators.json");

let ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  deployMode = ObjectsRegistry.DeployMode;

describe("List widget V2 Serverside Pagination", () => {
  before(() => {
    cy.addDsl(dsl);
  });
  it("1. Next button disabled when there's no data", () => {
    jsEditor.CreateJSObject(
      `
        const pageNo = List1.pageNo;
		const pageSize = List1.pageSize;
		const data = Table1.tableData;
		const startIndex = pageSize * (pageNo -1);
		 const endIndex = startIndex + pageSize;
		return data.slice(startIndex, endIndex);
          `,
      {
        paste: false,
        completeReplace: false,
        toRun: true,
        shouldCreateNewJSObj: true,
      },
    );

    ee.SelectEntityByName("List1", "Widgets");

    cy.get(commonlocators.listPaginateActivePage).should("have.text", "1");
    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });
    cy.get(commonlocators.listPaginateActivePage).should("have.text", "2");
    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });
    cy.get(commonlocators.listPaginateActivePage).should("have.text", "3");
    cy.get(commonlocators.listPaginateNextButtonDisabled).should("exist");
    cy.get(commonlocators.listPaginatePrevButton).click({
      force: true,
    });
    cy.get(commonlocators.listPaginateActivePage).should("have.text", "2");
  });
  it("2. Next button disabled but visible in view mode when there's no data", () => {
    deployMode.DeployApp();

    cy.get(commonlocators.listPaginateActivePage).should("have.text", "1");
    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });
    cy.get(commonlocators.listPaginateActivePage).should("have.text", "2");
    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });
    cy.get(commonlocators.listPaginateActivePage).should("have.text", "3");
    cy.get(commonlocators.listPaginateNextButtonDisabled).should("exist");
    cy.get(commonlocators.listPaginatePrevButton).click({
      force: true,
    });
    cy.get(commonlocators.listPaginateActivePage).should("have.text", "2");
  });
});

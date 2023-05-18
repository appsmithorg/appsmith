const dsl = require("../../../../../fixtures/Listv2/Listv2JSObjects.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
const commonlocators = require("../../../../../locators/commonlocators.json");

let ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  deployMode = ObjectsRegistry.DeployMode;

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

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

    deployMode.NavigateBacktoEditor();
  });

  it("3. SelectedItemView and TriggeredItemView", () => {
    cy.get(`${widgetSelector("SelectedRow")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("not.have.text");

    cy.get(
      `${widgetSelector("SelectedItemView")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());
      cy.wrap(data).should("deep.equal", {});
    });

    cy.get(
      `${widgetSelector("TriggeredItemView")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());
      cy.wrap(data).should("deep.equal", {});
    });

    // Select First Row
    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(0)
      .click();
    cy.wait(200);

    cy.get(
      `${widgetSelector("SelectedItemView")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());

      cy.wrap(data).should("deep.equal", {
        Image1: {
          isVisible: true,
        },
        Text1: {
          isVisible: true,
          text: "Perry234",
        },
        Text2: {
          isVisible: true,
          text: "8",
        },
      });
    });

    cy.get(
      `${widgetSelector("TriggeredItemView")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());
      cy.wrap(data).should("deep.equal", {
        Image1: {
          isVisible: true,
        },
        Text1: {
          isVisible: true,
          text: "Perry234",
        },
        Text2: {
          isVisible: true,
          text: "8",
        },
      });
    });

    cy.get(
      `${widgetSelector("SelectedRow")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());
      cy.wrap(data.name).should("equal", "Perry234");
      cy.wrap(data.phone).should("equal", "1234 456 789");
    });

    // Change Page and Validate Data
    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });

    cy.wait(2000);

    cy.get(
      `${widgetSelector("SelectedItemView")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());
      cy.wrap(data).should("deep.equal", {
        Image1: {
          isVisible: true,
        },
        Text1: {
          isVisible: true,
          text: "Perry234",
        },
        Text2: {
          isVisible: true,
          text: "8",
        },
      });
    });

    cy.get(
      `${widgetSelector("TriggeredItemView")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());
      cy.wrap(data).should("deep.equal", {
        Image1: {
          isVisible: true,
        },
        Text1: {
          isVisible: true,
          text: "Perry234",
        },
        Text2: {
          isVisible: true,
          text: "8",
        },
      });
    });

    cy.get(
      `${widgetSelector("SelectedRow")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());
      cy.wrap(data.name).should("equal", "Perry234");
      cy.wrap(data.phone).should("equal", "1234 456 789");
    });
  });

  it("4. SelectedItemView and TriggeredItemView with changing data", () => {
    // Initiate data change using store value
    cy.get(`${widgetSelector("Button1")} button`)
      .first()
      .click({ force: true });

    cy.wait(2000);

    // Expect value should be the same
    cy.get(
      `${widgetSelector("SelectedItemView")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());
      cy.wrap(data).should("deep.equal", {
        Image1: {
          isVisible: true,
        },
        Text1: {
          isVisible: true,
          text: "Perry234",
        },
        Text2: {
          isVisible: true,
          text: "8",
        },
      });
    });

    cy.get(
      `${widgetSelector("TriggeredItemView")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());
      cy.wrap(data).should("deep.equal", {
        Image1: {
          isVisible: true,
        },
        Text1: {
          isVisible: true,
          text: "Perry234",
        },
        Text2: {
          isVisible: true,
          text: "8",
        },
      });
    });

    // Change Page and Validate Data change
    cy.get(commonlocators.listPaginatePrevButton).click({
      force: true,
    });

    cy.wait(2000);

    cy.get(
      `${widgetSelector("SelectedItemView")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());
      cy.wrap(data).should("deep.equal", {
        Image1: {
          isVisible: true,
        },
        Text1: {
          isVisible: true,
          text: "Perry234 Changed",
        },
        Text2: {
          isVisible: true,
          text: "8",
        },
      });
    });

    cy.get(
      `${widgetSelector("TriggeredItemView")} ${commonlocators.bodyTextStyle}`,
    ).then(($el) => {
      const data = JSON.parse($el.text());
      cy.wrap(data).should("deep.equal", {
        Image1: {
          isVisible: true,
        },
        Text1: {
          isVisible: true,
          text: "Perry234 Changed",
        },
        Text2: {
          isVisible: true,
          text: "8",
        },
      });
    });
  });
});

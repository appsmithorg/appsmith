import {
  agHelper,
  deployMode,
  entityExplorer,
  jsEditor,
  locators,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
const commonlocators = require("../../../../../locators/commonlocators.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

describe(
  "List widget V2 Serverside Pagination",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Sanity"] },
  () => {
    before(() => {
      agHelper.AddDsl("Listv2/Listv2JSObjects");
    });

    it("1. Next button disabled when there's no data", () => {
      jsEditor.CreateJSObject(
        `const pageNo = List1.pageNo;
        const pageSize = List1.pageSize;
        const data = Table1.tableData;
        const startIndex = pageSize * (pageNo -1);
        const endIndex = startIndex + pageSize;
  	    return data.slice(startIndex, endIndex);
          `,
        {
          paste: true,
          completeReplace: false,
          toRun: true,
          shouldCreateNewJSObj: true,
        },
      );

      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      table.AssertPageNumber_List(1, false, "v2");
      //agHelper.GetNClick(commonlocators.listPaginateNextButton, 0, true);
      table.NavigateToNextPage_List("v2");
      cy.wait(500);
      //agHelper.AssertText(commonlocators.listPaginateActivePage, "text", "2");
      table.NavigateToNextPage_List("v2");
      cy.wait(500);
      table.AssertPageNumber_List(3, true, "v2");
      table.NavigateToPreviousPage_List("v2");
      cy.wait(500);
      deployMode.DeployApp();
    });

    it("2. Next button disabled but visible in view mode when there's no data", () => {
      agHelper.AssertText(commonlocators.listPaginateActivePage, "text", "1");
      agHelper.GetNClick(commonlocators.listPaginateNextButton, 0, true);
      cy.wait(1000);
      agHelper.AssertText(commonlocators.listPaginateActivePage, "text", "2");
      cy.wait(1000);
      agHelper.GetNClick(commonlocators.listPaginateNextButton, 0, true);
      cy.wait(1000);
      agHelper.AssertText(commonlocators.listPaginateActivePage, "text", "3");
      agHelper.AssertElementExist(
        commonlocators.listPaginateNextButtonDisabled,
      );

      agHelper.GetNClick(commonlocators.listPaginatePrevButton, 0, true);
      cy.wait(1000);
      agHelper.AssertText(commonlocators.listPaginateActivePage, "text", "2");

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
        `${widgetSelector("TriggeredItemView")} ${
          commonlocators.bodyTextStyle
        }`,
      ).then(($el) => {
        const data = JSON.parse($el.text());
        cy.wrap(data).should("deep.equal", {});
      });

      // Select First Row in List
      agHelper.GetNClick(locators._imgWidgetInsideList, 0, true);

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
        `${widgetSelector("TriggeredItemView")} ${
          commonlocators.bodyTextStyle
        }`,
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
      table.NavigateToNextPage_List("v2");

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
        `${widgetSelector("TriggeredItemView")} ${
          commonlocators.bodyTextStyle
        }`,
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
        `${widgetSelector("TriggeredItemView")} ${
          commonlocators.bodyTextStyle
        }`,
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
      table.NavigateToPreviousPage_List("v2");
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
        `${widgetSelector("TriggeredItemView")} ${
          commonlocators.bodyTextStyle
        }`,
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
  },
);

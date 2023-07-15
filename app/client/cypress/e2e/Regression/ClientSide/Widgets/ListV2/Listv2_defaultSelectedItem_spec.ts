import {
  agHelper,
  locators,
  entityExplorer,
  draggableWidgets,
  deployMode,
  apiPage,
  tedTestConfig,
  dataSources,
  propPane,
  assertHelper,
  jsEditor,
} from "../../../../../support/Objects/ObjectsCore";
const dsl = require("../../../../../fixtures/Listv2/ListV2_Reset_dsl.json");

const items = dsl.dsl.children[4]?.listData;
const verifyDefaultItem = () => {
  agHelper.Sleep(1000);
  cy.waitUntil(() =>
    agHelper
      .GetElement(
        `${locators._widgetByName("SelectedItemView")} ${
          locators._bodyTextStyle
        }`,
      )
      .then((val) => {
        const data = JSON.parse(val.text());
        cy.waitUntil(() => cy.wrap(data?.Text11?.text).should("equal", "4"));
      }),
  );

  agHelper
    .GetElement(
      `${locators._widgetByName("SelectedItem")} ${locators._bodyTextStyle}`,
    )
    .then((val) => {
      const data = JSON.parse(val.text());
      cy.wrap(data?.id).should("deep.equal", 4);
    });

  agHelper
    .GetElement(
      `${locators._widgetByName("SelectedItemKey")} ${locators._bodyTextStyle}`,
    )
    .then((val) => {
      const data = JSON.parse(val.text());
      cy.wrap(data).should("deep.equal", 4);
    });
};

function setUpDataSource() {
  apiPage.CreateAndFillApi(tedTestConfig.mockApiUrl + "0");
  apiPage.RunAPI(false);
  entityExplorer.SelectEntityByName("List1");
  agHelper.Sleep(200);
}

describe("List widget v2 defaultSelectedItem", () => {
  before(() => {
    agHelper.AddDsl("Listv2/ListV2_Reset_dsl");
  });

  it("1. Loads the Page with the default Selected Item", () => {
    // Loads to page 2
    cy.waitUntil(() =>
      agHelper.AssertElementLength(
        `${locators._widgetByName("List1")} ${
          locators._containerWidget
        } ${locators._widgetInDeployed(draggableWidgets.IMAGE)}`,
        3,
      ),
    );
    agHelper.GetNAssertElementText(locators._listActivePage, "2");
    agHelper
      .GetElement(
        `${locators._widgetByName("SelectedItem")} ${locators._bodyTextStyle}`,
      )
      .then((val) => {
        const data = JSON.parse(val.text());
        cy.wrap(data).should("deep.equal", items[4]);
      });

    //Change Default Selected Item
    entityExplorer.SelectEntityByName("List1");

    propPane.TypeTextIntoField("defaultselecteditem", "001");

    cy.waitUntil(() =>
      agHelper.AssertElementLength(
        `${locators._widgetByName("List1")} ${
          locators._containerWidget
        } ${locators._widgetInDeployed(draggableWidgets.IMAGE)}`,
        3,
      ),
    );

    agHelper.AssertText(locators._listActivePage, "text", "1");
    agHelper
      .GetElement(
        `${locators._widgetByName("SelectedItem")} ${locators._bodyTextStyle}`,
      )
      .then((val) => {
        const data = JSON.parse(val.text());
        cy.wrap(data).should("deep.equal", items[0]);
      });
  });

  it("2. use query data", () => {
    // Create sample(mock) user database.
    setUpDataSource();

    cy.waitUntil(() =>
      agHelper.AssertElementLength(
        `${locators._widgetByName("List1")} ${
          locators._containerWidget
        } ${locators._widgetInDeployed(draggableWidgets.IMAGE)}`,
        3,
      ),
    );

    //Change Default Selected Item
    entityExplorer.SelectEntityByName("List1");

    propPane.TypeTextIntoField("items", "{{Api1.data}}");

    propPane.TypeTextIntoField("defaultselecteditem", "4");

    agHelper.AssertText(locators._listActivePage, "text", "2");

    agHelper
      .GetElement(
        `${locators._widgetByName("SelectedItem")} ${locators._bodyTextStyle}`,
      )
      .then((val) => {
        const data = JSON.parse(val.text());
        cy.wrap(data?.id).should("deep.equal", 4);
      });

    // In view Mode

    deployMode.DeployApp();

    cy.waitUntil(() =>
      agHelper.AssertElementLength(
        `${locators._widgetByName("List1")} ${
          locators._containerWidget
        } ${locators._widgetInDeployed(draggableWidgets.IMAGE)}`,
        3,
      ),
    );

    agHelper.AssertText(locators._listActivePage, "text", "2");
    agHelper
      .GetElement(
        `${locators._widgetByName("SelectedItem")} ${locators._bodyTextStyle}`,
      )
      .then((val) => {
        const data = JSON.parse(val.text());
        cy.wrap(data?.id).should("deep.equal", 4);
      });
    deployMode.NavigateBacktoEditor();
  });
});

describe("List widget v2 Reset List widget and Refresh Data", () => {
  it("1. Setup List Widget", () => {
    entityExplorer.SelectEntityByName("List1");
    propPane.TypeTextIntoField("defaultselecteditem", "4");
    agHelper.AssertText(locators._listActivePage, "text", "2");

    verifyDefaultItem();
  });

  it("2. Reset List Widget", () => {
    // Select a new List Item on another page
    agHelper.GetNClick(
      `${locators._widgetByName("List1")} ${locators._paginationItem(1)}`,
      0,
      true,
    );

    agHelper.AssertText(locators._listActivePage, "text", "1");

    agHelper.GetNClick(
      `${locators._widgetByName("List1")} ${locators._containerWidget}`,
      0,
      true,
    );

    agHelper.Sleep(400);

    cy.waitUntil(() =>
      agHelper
        .GetElement(
          `${locators._widgetByName("SelectedItem")} ${
            locators._bodyTextStyle
          }`,
        )
        .then((val) => {
          const data = JSON.parse(val.text());
          cy.wrap(data?.id).should("deep.equal", 1);
        }),
    );

    agHelper.GetNClick(
      `${locators._widgetByName("ResetWidget")} button`,
      0,
      true,
    );

    agHelper.AssertText(locators._listActivePage, "text", "2");

    cy.waitUntil(() =>
      agHelper.AssertElementLength(
        `${locators._widgetByName("List1")} ${
          locators._containerWidget
        } ${locators._widgetInDeployed(draggableWidgets.IMAGE)}`,
        3,
      ),
    );

    agHelper.Sleep(200);

    verifyDefaultItem();

    //Move to another page and verify the value is cached.
    agHelper.GetNClick(
      `${locators._widgetByName("List1")} ${locators._paginationItem(4)}`,
      0,
      true,
    );

    agHelper.AssertText(locators._listActivePage, "text", "4");

    verifyDefaultItem();

    // Refresh Data and see the Default Item remains the same
    agHelper.GetNClick(
      `${locators._widgetByName("RefreshData")} button`,
      0,
      true,
    );

    cy.waitUntil(() =>
      agHelper.AssertElementLength(
        `${locators._widgetByName("List1")} ${
          locators._containerWidget
        } ${locators._widgetInDeployed(draggableWidgets.IMAGE)}`,
        3,
      ),
    );
    agHelper.Sleep(200);

    verifyDefaultItem();

    // Select another container on the Same Page and reset the list widget

    agHelper.GetNClick(
      `${locators._widgetByName("List1")} ${locators._containerWidget} `,
      0,
      true,
    );

    agHelper.Sleep(500);

    agHelper.GetNClick(
      `${locators._widgetByName("ResetWidget")} button`,
      0,
      true,
    );

    agHelper.Sleep(500);

    verifyDefaultItem();
  });
});

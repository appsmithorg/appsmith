import {
  agHelper,
  apiPage,
  dataManager,
  deployMode,
  draggableWidgets,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const dsl = require("../../../../../fixtures/Listv2/ListV2_Reset_dsl.json");

const items = dsl.dsl.children[4]?.listData;
const verifyDefaultItem = () => {
  agHelper.Sleep(1000);

  agHelper
    .GetText(
      `${locators._widgetByName("SelectedItemView")} ${propPane._propertyText}`,
    )
    .then((val: any) => {
      cy.wrap(JSON.parse(val)?.Text11?.text).should("equal", "4");
    });

  agHelper
    .GetText(
      `${locators._widgetByName("SelectedItem")} ${propPane._propertyText}`,
    )
    .then((val: any) => {
      cy.wrap(JSON.parse(val)?.id).should("deep.equal", 4);
    });

  agHelper
    .GetText(
      `${locators._widgetByName("SelectedItemKey")} ${propPane._propertyText}`,
    )
    .then((val: any) => {
      cy.wrap(JSON.parse(val)).should("deep.equal", 4);
    });
};

function setUpDataSource() {
  apiPage.CreateAndFillApi(
    dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl + "0",
  );
  apiPage.RunAPI(false);
  EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
  agHelper.Sleep(200);
}

describe(
  "List widget v2 defaultSelectedItem",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
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

      table.AssertPageNumber_List(2, true, "v2");
      agHelper
        .GetElement(
          `${locators._widgetByName("SelectedItem")} ${propPane._propertyText}`,
        )
        .then((val) => {
          const data = JSON.parse(val.text());
          cy.wrap(data).should("deep.equal", items[4]);
        });

      //Change Default Selected Item
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);

      propPane.UpdatePropertyFieldValue("Default selected item", "001");

      cy.waitUntil(() =>
        agHelper.AssertElementLength(
          `${locators._widgetByName("List1")} ${
            locators._containerWidget
          } ${locators._widgetInDeployed(draggableWidgets.IMAGE)}`,
          3,
        ),
      );

      table.AssertPageNumber_List(1, false, "v2");

      agHelper
        .GetElement(
          `${locators._widgetByName("SelectedItem")} ${propPane._propertyText}`,
        )
        .then((val) => {
          const data = JSON.parse(val.text());
          cy.wrap(data).should("deep.equal", items[0]);
        });
    });

    it("2. use query data", () => {
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
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);

      propPane.UpdatePropertyFieldValue("Items", "{{Api1.data}}");
      propPane.UpdatePropertyFieldValue("Default selected item", "4");

      table.AssertPageNumber_List(2, false, "v2");

      agHelper
        .GetElement(
          `${locators._widgetByName("SelectedItem")} ${propPane._propertyText}`,
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

      table.AssertPageNumber_List(2, false, "v2");

      agHelper
        .GetElement(
          `${locators._widgetByName("SelectedItem")} ${propPane._propertyText}`,
        )
        .then((val) => {
          const data = JSON.parse(val.text());
          cy.wrap(data?.id).should("deep.equal", 4);
        });
      deployMode.NavigateBacktoEditor();
    });
  },
);

describe(
  "List widget v2 Reset List widget and Refresh Data",
  { tags: ["@tag.Widget", "@tag.List"] },
  () => {
    it("1. Setup List Widget", () => {
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Default selected item",
        "4",
        true,
        false,
      );
      table.AssertPageNumber_List(2, false, "v2");

      verifyDefaultItem();
    });

    it("2. Reset List Widget", () => {
      // Select a new List Item on another page
      table.NavigateToSpecificPage_List(1);

      table.AssertPageNumber_List(1, false, "v2");

      agHelper.GetNClick(
        `${locators._widgetByName("List1")} ${locators._containerWidget}`,
        0,
        true,
      );

      agHelper.Sleep(400);

      agHelper
        .GetText(
          `${locators._widgetByName("SelectedItem")} ${propPane._propertyText}`,
        )
        .then((val: any) => {
          cy.wrap(JSON.parse(val)?.id).should("equal", 1);
        });

      agHelper.ClickButton("Reset List Widget");

      table.AssertPageNumber_List(2, false, "v2");

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
      table.NavigateToSpecificPage_List(4);

      table.AssertPageNumber_List(4, false, "v2");

      verifyDefaultItem();

      // Refresh Data and see the Default Item remains the same
      agHelper.ClickButton("Refresh Data");

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
      agHelper.ClickButton("Reset List Widget");
      agHelper.Sleep(500);
      verifyDefaultItem();
    });
  },
);

/// <reference types="Cypress" />

import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/listdsl.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Container Widget Functionality",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  function () {
    const items = JSON.parse(dsl.dsl.children[0].listData);

    before(() => {
      _.agHelper.AddDsl("listdsl");
    });

    it("1. ListWidget-Copy & Delete Verification", function () {
      //Copy Chart and verify all properties
      _.propPane.CopyPasteWidgetFromPropertyPane("List1");
      _.propPane.DeleteWidgetFromPropertyPane("List1Copy");
      _.deployMode.DeployApp();
      // Verify the copied list widget is deleted
      cy.get(commonlocators.containerWidget).should("have.length", 2);
      _.deployMode.NavigateBacktoEditor();
    });

    it("2. List widget background colour and deploy ", function () {
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);

      cy.moveToStyleTab();
      // Scroll down to Styles and Add background colour
      cy.selectColor("backgroundcolor");
      cy.wait(1000);
      cy.selectColor("itembackgroundcolor");
      // Click on Deploy and ensure it is deployed appropriately
      _.deployMode.DeployApp();
      // Ensure List Background Color
      cy.get(widgetsPage.listWidget).should(
        "have.css",
        "background-color",
        "rgb(219, 234, 254)",
      );
      // Verify List Item Background Color
      cy.get(widgetsPage.itemContainerWidget).should(
        "have.css",
        "background-color",
        "rgb(219, 234, 254)",
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("3. Toggle JS - List widget background colour and deploy ", function () {
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);

      cy.moveToStyleTab();
      // Scroll down to Styles and Add background colour
      cy.get(widgetsPage.backgroundColorToggleNew).click({ force: true });
      cy.testJsontext("backgroundcolor", "#FFC13D");
      cy.wait(1000);
      cy.get(widgetsPage.itemBackgroundColorToggle).click({ force: true });
      cy.testJsontext("itembackgroundcolor", "#38AFF4");
      // Click on Deploy and ensure it is deployed appropriately
      _.deployMode.DeployApp();
      // Ensure List Background Color
      cy.get(widgetsPage.listWidget).should(
        "have.css",
        "background-color",
        "rgb(255, 193, 61)",
      );
      // Verify List Item Background Color
      cy.get(widgetsPage.itemContainerWidget).should(
        "have.css",
        "background-color",
        "rgb(56, 175, 244)",
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("4. Add new item in the list widget array object", function () {
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);

      //Add the new item in the list
      _.propPane.UpdatePropertyFieldValue(
        "Items",
        JSON.stringify(this.dataSet.ListItems),
      );
      cy.wait(2000);
      _.deployMode.DeployApp();
      _.deployMode.NavigateBacktoEditor();
    });

    it("5. Adding large item Spacing for item card", function () {
      // Open Property pane
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      _.propPane.MoveToTab("Style");
      // Scroll down to Styles and Add item spacing for item card
      cy.testJsontext("itemspacing\\(" + "px" + "\\)", 12);
      cy.wait(2000);
      // Click on Deploy and ensure it is deployed appropriately
      _.deployMode.DeployApp();
      _.deployMode.NavigateBacktoEditor();
    });

    it("6. Renaming the widget from Property pane and Entity explorer ", function () {
      // Open Property pane & rename the list widget
      _.propPane.RenameWidget("List1", "List2");
      _.agHelper.Sleep(); //for renaming the widget
      // Change the list widget name from Entity Explorer
      _.entityExplorer.RenameEntityFromExplorer("List2", "List1", false);
      // Mouse over to list name
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);

      cy.get(widgetsPage.listWidgetName)
        .first()
        .trigger("mouseover", { force: true });
      // Verify the list name is changed
      cy.contains(
        widgetsPage.listWidgetName + " " + commonlocators.listWidgetNameTag,
        "List1",
      );
      _.deployMode.DeployApp();
    });
  },
);

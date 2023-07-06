/// <reference types="Cypress" />

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/listdsl.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Container Widget Functionality", function () {
  const items = JSON.parse(dsl.dsl.children[0].listData);

  before(() => {
    _.agHelper.AddDsl("listdsl");
  });

  it("1. List-Unckeck Visible field Validation", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    //Uncheck the disabled checkbox and validate
    _.propPane.TogglePropertyState("Visible", "Off");
    _.deployMode.DeployApp();
    cy.get(widgetsPage.listWidget).should("not.exist");
    _.deployMode.NavigateBacktoEditor();
    // List-Check Visible field Validation
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    //Check the disableed checkbox and Validate
    _.propPane.TogglePropertyState("Visible", "On");
    _.deployMode.DeployApp();
    cy.get(widgetsPage.listWidget).should("be.visible");
    _.deployMode.NavigateBacktoEditor();
  });

  it("2. Toggle JS - List-Unckeck Visible field Validation", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    //Uncheck the disabled checkbox using JS and validate
    _.propPane.EnterJSContext("Visible", "false");
    _.deployMode.DeployApp();
    cy.get(widgetsPage.listWidget).should("not.exist");
    _.deployMode.NavigateBacktoEditor();
    //Toggle JS - List-Check Visible field Validation
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    //Check the disabled checkbox using JS and Validate
    _.propPane.EnterJSContext("Visible", "true");
    _.deployMode.DeployApp();
    cy.get(widgetsPage.listWidget).should("be.visible");
    _.deployMode.NavigateBacktoEditor();
  });

  it("3. checks if list shows correct no. of items", function () {
    // Verify the length of list
    cy.get(commonlocators.containerWidget).then(function ($lis) {
      expect($lis).to.have.length(2);
    });
    //checks currentItem binding
    // Open property pane
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("List1");
    _.entityExplorer.ExpandCollapseEntity("Container1");
    _.entityExplorer.SelectEntityByName("Text1");
    cy.testJsontext("text", `{{currentItem.first_name}}`);
    cy.wait(1000);

    cy.closePropertyPane();
    // Verify Current Item Bindings
    cy.get(commonlocators.TextInside).then(function ($lis) {
      expect($lis.eq(0)).to.contain(items[0].first_name);
      expect($lis.eq(1)).to.contain(items[1].first_name);
    });
  });

  it("4. doesn't alter the no of items present when invalid item spacing is entered", () => {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    cy.moveToStyleTab();
    // Update an invalid value to item spacing
    cy.testJsontext("itemspacing\\(" + "px" + "\\)", "-");
    cy.wait(2000);
    // Verify the length of list
    cy.get(commonlocators.containerWidget).then(function ($lis) {
      expect($lis).to.have.length(2);
    });

    // Clear item spacing
    cy.testJsontext("itemspacing\\(" + "px" + "\\)", "");
    cy.wait(2000);

    // Close property pane
    cy.closePropertyPane();
  });

  it("5. checks button action", function () {
    // Open property pane
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("List1");
    _.entityExplorer.ExpandCollapseEntity("Container1");
    _.entityExplorer.SelectEntityByName("Button1");
    cy.testJsontext("label", `{{currentItem.last_name}}`);
    cy.addAction("{{currentItem.last_name}}", "onClick");
    cy.wait(3000);
    _.deployMode.DeployApp();
    // Verify Widget Button by clicking on it
    cy.get(widgetsPage.widgetBtn).should("have.length", 2);
    cy.get(widgetsPage.widgetBtn).closest("div").first().click({ force: true });
    // Verify the click on first button
    cy.get(commonlocators.toastmsg).contains(items[0].last_name);
  });

  it("6. it checks onListItem click action", function () {
    // Verify Clicking on list item shows message of first name
    _.deployMode.NavigateBacktoEditor(); // Open property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");

    // Verify Action type and Message of List Item
    // Click on the onListItemClick action dropdown.
    // Write binding inside the Message code textarea
    cy.addAction("{{currentItem.first_name}}", "onListItemClick");

    _.deployMode.DeployApp();
    // Click on list first item
    cy.get(
      "div[type='LIST_WIDGET'] .t--widget-containerwidget:first-child",
    ).click();
    cy.get("body").then(($ele) => {
      if ($ele.find(commonlocators.toastmsg).length <= 0) {
        cy.get(
          "div[type='LIST_WIDGET'] .t--widget-containerwidget:first-child",
        ).click();
      }
    });
    // Verify the click on first item
    cy.get(commonlocators.toastmsg).contains(items[0].first_name);
  });

  it("7. it checks pagination", function () {
    // clicking on second pagination button
    cy.get(`${commonlocators.paginationButton}-2`).click();

    // now we are on the second page which shows first the 3rd item in the list
    cy.get(commonlocators.TextInside).then(function ($lis) {
      expect($lis.eq(0)).to.contain(items[2].first_name);
      expect($lis.eq(1)).to.contain(items[3].first_name);
    });
    _.deployMode.NavigateBacktoEditor();
  });

  it("8. ListWidget-Copy & Delete Verification", function () {
    //Copy Chart and verify all properties
    _.propPane.CopyWidgetFromPropertyPane("List1");
    _.propPane.DeleteWidgetFromPropertyPane("List1Copy");
    _.deployMode.DeployApp();
    // Verify the copied list widget is deleted
    cy.get(commonlocators.containerWidget).should("have.length", 2);
    _.deployMode.NavigateBacktoEditor();
  });

  it("9. List widget background colour and deploy ", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");

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
      "rgb(126, 34, 206)",
    );
    // Verify List Item Background Color
    cy.get(widgetsPage.itemContainerWidget).should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    );
    _.deployMode.NavigateBacktoEditor();
  });

  it("10. Toggle JS - List widget background colour and deploy ", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");

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
});

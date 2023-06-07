/// <reference types="Cypress" />

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/listdsl.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Container Widget Functionality", function () {
  const items = JSON.parse(dsl.dsl.children[0].listData);

  before(() => {
    cy.addDsl(dsl);
    cy.wait(5000);
  });

  it("1. List-Unckeck Visible field Validation", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    //Uncheck the disabled checkbox and validate
    cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(widgetsPage.listWidget).should("not.exist");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("2. List-Check Visible field Validation", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    //Check the disableed checkbox and Validate
    cy.CheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(widgetsPage.listWidget).should("be.visible");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("3. Toggle JS - List-Unckeck Visible field Validation", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    //Uncheck the disabled checkbox using JS and validate
    cy.get(widgetsPage.toggleVisible).click({ force: true });
    cy.testJsontext("visible", "false");
    cy.PublishtheApp();
    cy.get(widgetsPage.listWidget).should("not.exist");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("4. Toggle JS - List-Check Visible field Validation", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");
    //Check the disabled checkbox using JS and Validate
    cy.testJsontext("visible", "true");
    cy.PublishtheApp();
    cy.get(widgetsPage.listWidget).should("be.visible");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("5. checks if list shows correct no. of items", function () {
    // Verify the length of list
    cy.get(commonlocators.containerWidget).then(function ($lis) {
      expect($lis).to.have.length(2);
    });
  });

  it("6. checks currentItem binding", function () {
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

  it("7. doesn't alter the no of items present when invalid item spacing is entered", () => {
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

  it("8. checks button action", function () {
    // Open property pane
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("List1");
    _.entityExplorer.ExpandCollapseEntity("Container1");
    _.entityExplorer.SelectEntityByName("Button1");
    cy.testJsontext("label", `{{currentItem.last_name}}`);
    cy.addAction("{{currentItem.last_name}}", "onClick");
    cy.wait(3000);
    cy.PublishtheApp();
    cy.wait(2000);
    // Verify Widget Button by clicking on it
    cy.get(widgetsPage.widgetBtn).should("have.length", 2);
    cy.get(widgetsPage.widgetBtn).closest("div").first().click({ force: true });
    // Verify the click on first button
    cy.get(commonlocators.toastmsg).contains(items[0].last_name);
  });

  it("9. it checks onListItem click action", function () {
    // Verify Clicking on list item shows message of first name
    cy.get(publishPage.backToEditor).click({ force: true });
    // Open property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");

    // Verify Action type and Message of List Item
    // Click on the onListItemClick action dropdown.
    // Write binding inside the Message code textarea
    cy.addAction("{{currentItem.first_name}}", "onListItemClick");

    cy.PublishtheApp();
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

  it("10. it checks pagination", function () {
    // clicking on second pagination button
    cy.get(`${commonlocators.paginationButton}-2`).click();

    // now we are on the second page which shows first the 3rd item in the list
    cy.get(commonlocators.TextInside).then(function ($lis) {
      expect($lis.eq(0)).to.contain(items[2].first_name);
      expect($lis.eq(1)).to.contain(items[3].first_name);
    });
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});

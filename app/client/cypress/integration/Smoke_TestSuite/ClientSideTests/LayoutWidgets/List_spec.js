const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const dsl = require("../../../../fixtures/listdsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Container Widget Functionality", function() {
  const items = JSON.parse(dsl.dsl.children[0].listData);

  before(() => {
    cy.addDsl(dsl);
  });

  it("List-Unckeck Visible field Validation", function() {
    // Open Property pane
    cy.SearchEntityandOpen("List1");
    //Uncheck the disabled checkbox and validate
    cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(widgetsPage.listWidget).should("not.exist");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("List-Check Visible field Validation", function() {
    // Open Property pane
    cy.SearchEntityandOpen("List1");
    //Check the disableed checkbox and Validate
    cy.CheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(widgetsPage.listWidget).should("be.visible");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Toggle JS - List-Unckeck Visible field Validation", function() {
    // Open Property pane
    cy.SearchEntityandOpen("List1");
    //Uncheck the disabled checkbox using JS and validate
    cy.get(widgetsPage.toggleVisible).click({ force: true });
    cy.testJsontext("visible", "false");
    cy.PublishtheApp();
    cy.get(widgetsPage.listWidget).should("not.exist");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Toggle JS - List-Check Visible field Validation", function() {
    // Open Property pane
    cy.SearchEntityandOpen("List1");
    //Check the disabled checkbox using JS and Validate
    cy.testJsontext("visible", "true");
    cy.PublishtheApp();
    cy.get(widgetsPage.listWidget).should("be.visible");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("checks if list shows correct no. of items", function() {
    // Verify the length of list
    cy.get(commonlocators.containerWidget).then(function($lis) {
      expect($lis).to.have.length(2);
    });
  });

  it("checks currentItem binding", function() {
    // Open property pane
    cy.SearchEntityandOpen("Text1");
    cy.testJsontext("text", `{{currentItem.first_name}}`);
    cy.wait(1000);

    cy.closePropertyPane();
    // Verify Current Item Bindings
    cy.get(commonlocators.TextInside).then(function($lis) {
      expect($lis.eq(0)).to.contain(items[0].first_name);
      expect($lis.eq(1)).to.contain(items[1].first_name);
    });
  });

  it("checks button action", function() {
    // Open property pane
    cy.SearchEntityandOpen("Button1");
    cy.testJsontext("label", `{{currentItem.first_name}}`);
    cy.addAction("{{currentItem.first_name}}");

    cy.PublishtheApp();
    // Verify Widget Button by clicking on it
    cy.get(`${widgetsPage.widgetBtn}`)
      .first()
      .click();
    // Verify the click on first button
    cy.get(commonlocators.toastmsg).contains(items[0].first_name);
  });

  it("it checks onListItem click action", function() {
    // Verify Clicking on list item shows message of first name
    cy.get(publishPage.backToEditor).click({ force: true });
    // Open property pane
    cy.SearchEntityandOpen("List1");
    // Verify Action type and Message of List Item
    cy.addAction("{{currentItem.first_name}}");

    cy.PublishtheApp();
    // Click on list first item
    cy.get(
      "div[type='LIST_WIDGET'] .t--widget-containerwidget:first-child",
    ).click();
    // Verify the click on first item
    cy.get(commonlocators.toastmsg).contains(items[0].first_name);
  });

  it("it checks pagination", function() {
    // clicking on second pagination button
    cy.get(`${commonlocators.paginationButton}-2`).click();

    // now we are on the second page which shows first the 3rd item in the list
    cy.get(commonlocators.TextInside).then(function($lis) {
      expect($lis.eq(0)).to.contain(items[2].first_name);
    });
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Chart-Copy Verification", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    //Copy Chart and verify all properties
    cy.SearchEntityandOpen("List1");
    cy.copyWidget("List1Copy", commonlocators.containerWidget);

    // cy.PublishtheApp();
  });

  it("Chart-Delete Verification", function() {
    // Delete the Chart widget
    cy.SearchEntityandOpen("List1Copy");
    cy.deleteWidget();
    cy.PublishtheApp();
    // Verify the cart is deleted
    cy.get(commonlocators.containerWidget).should("not.exist");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("List widget background colour and deploy ", function() {
    // Open Property pane
    cy.SearchEntityandOpen("List1");
    // Scroll down to Styles and Add background colour
    cy.selectColor("backgroundcolor");
    cy.wait(1000);
    cy.selectColor("itembackgroundcolor");
    // Click on Deploy and ensure it is deployed appropriately
    cy.PublishtheApp();
    // Ensure List Background Color
    cy.get(widgetsPage.listWidget).should(
      "have.css",
      "background-color",
      "rgb(3, 179, 101)",
    );
    // Verify List Item Background Color
    cy.get(widgetsPage.itemContainerWidget).should(
      "have.css",
      "background-color",
      "rgb(3, 179, 101)",
    );
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Toggle JS - List widget background colour and deploy ", function() {
    // Open Property pane
    cy.SearchEntityandOpen("List1");
    // Scroll down to Styles and Add background colour
    cy.get(widgetsPage.backgroundColorToggle).click({ force: true });
    cy.testJsontext("backgroundcolor", "#FFC13D");
    cy.wait(1000);
    cy.get(widgetsPage.itemBackgroundColorToggle).click({ force: true });
    cy.testJsontext("itembackgroundcolor", "#38AFF4");
    // Click on Deploy and ensure it is deployed appropriately
    cy.PublishtheApp();
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
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Add new item in the list widget array object", function() {
    // Open Property pane
    cy.SearchEntityandOpen("List1");
    //Add the new item in the list
    cy.testJsontext("items", JSON.stringify(this.data.ListItems));
    cy.wait(2000);
    cy.PublishtheApp();
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Adding large item Spacing for item card", function() {
    // Open Property pane
    cy.SearchEntityandOpen("List1");
    // Scroll down to Styles and Add item spacing for item card
    cy.testJsontext("itemspacing\\(" + "px" + "\\)", 12);
    cy.wait(2000);
    // Click on Deploy and ensure it is deployed appropriately
    cy.PublishtheApp();
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Renaming the widget from Property pane and Entity explorer ", function() {
    // Open Property pane
    cy.SearchEntityandOpen("List1");
    // Change the list widget name from property pane and Verify it
    cy.widgetText(
      "List2",
      widgetsPage.listWidgetName,
      widgetsPage.listWidgetName + " " + commonlocators.listWidgetNameTag,
    );
    cy.closePropertyPane();
    // Change the list widget name from Entity Explorer
    cy.SearchEntityandDblClick("List2").type("List1{enter}");
    // Mouse over to list name
    cy.SearchEntityandOpen("List1");
    cy.get(widgetsPage.listWidgetName)
      .first()
      .trigger("mouseover", { force: true });
    // Verify the list name is changed
    cy.contains(
      widgetsPage.listWidgetName + " " + commonlocators.listWidgetNameTag,
      "List1",
    );
    cy.PublishtheApp();
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});

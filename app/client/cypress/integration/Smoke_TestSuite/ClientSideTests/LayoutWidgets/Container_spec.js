const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const dsl = require("../../../../fixtures/containerdsl.json");

describe("Container Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Container Widget Functionality", function() {
    cy.openPropertyPane("containerwidget");
    /**
     * @param{Text} Random Text
     * @param{ContainerWidget}Mouseover
     * @param{ContainerPre Css} Assertion
     */
    cy.widgetText(
      "job",
      widgetsPage.containerWidget,
      commonlocators.containerInnerText,
    );
    /**
     * @param{Text} Random Border Colour
     */
    cy.get(widgetsPage.borderColorPickerNew)
      .first()
      .click({ force: true });
    cy.xpath(widgetsPage.yellowColor).click();
    cy.get(
      `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}'] div`,
    )
      .should("have.css", "border-color")
      .and("eq", "rgb(255, 193, 61)");
    /**
     * @param{Text} Random Background Colour
     */
    cy.get(widgetsPage.backgroundcolorPickerNew)
      .first()
      .click({ force: true });
    cy.xpath(widgetsPage.greenColor).click();
    cy.get(widgetsPage.containerD)
      .should("have.css", "background-color")
      .and("eq", "rgb(3, 179, 101)");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(widgetsPage.Scrollbutton);
    cy.get(widgetsPage.containerD)
      .eq(0)
      .scrollIntoView({ easing: "linear" })
      .should("be.visible");
    cy.PublishtheApp();
  });
  it("Container Widget Functionality To Verify The Colour", function() {
    cy.get(widgetsPage.containerD)
      .eq(0)
      .should("have.css", "background-color")
      .and("eq", "rgb(3, 179, 101)");
  });

  it("Test border width and verity", function() {
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("containerwidget");

    cy.testJsontext("borderwidth", "10");
    cy.get(
      `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}'] div`,
    )
      .should("have.css", "border-width")
      .and("eq", "10px");
  });

  it("Test border radius and verity", function() {
    cy.testJsontext("borderradius", "10");
    cy.get(
      `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}'] div`,
    )
      .should("have.css", "border-radius")
      .and("eq", "10px");
    // should have overflow : hidden to show border edges
    cy.get(
      `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}'] div`,
    )
      .should("have.css", "overflow")
      .and("eq", "hidden");
    // wrapper should have same border radius
    cy.get(
      `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
    )
      .should("have.css", "border-radius")
      .and("eq", "10px");
  });

  it("Test Box shadow and verity", function() {
    cy.get(widgetsPage.boxShadow)
      .children()
      .eq(3)
      .click({ force: true });
    cy.get(
      `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
    )
      .should("have.css", "box-shadow")
      .and("eq", "rgba(0, 0, 0, 0.5) 0px 1px 3px 0px");

    // change shadow color and check box-shadow again
    cy.get(widgetsPage.boxShadowColorPicker)
      .first()
      .click({ force: true });
    cy.xpath(widgetsPage.blueColor).click();
    cy.get(
      `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
    )
      .should("have.css", "box-shadow")
      .and("eq", "rgb(51, 102, 255) 0px 1px 3px 0px");
  });

  it("Test overflow of widget boundaries", function() {
    cy.testJsontext("borderwidth", "500");
    // prevent overflow of widget boundaries
    cy.get(
      `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
    )
      .should("have.css", "overflow")
      .and("eq", "hidden");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});

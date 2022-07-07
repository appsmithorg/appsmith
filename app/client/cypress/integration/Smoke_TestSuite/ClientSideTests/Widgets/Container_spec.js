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
      .click({ force: true })
      .clear()
      .type(widgetsPage.yellowColorHex);
    cy.get(
      `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
    )
      .should("have.css", "border-color")
      .and("eq", "rgb(255, 193, 61)");
    /**
     * @param{Text} Random Background Colour
     */
    cy.get(widgetsPage.backgroundcolorPickerNew)
      .first()
      .click({ force: true })
      .clear()
      .type(widgetsPage.greenColorHex);
    cy.get(widgetsPage.containerD)
      .should("have.css", "background")
      .and(
        "eq",
        "rgb(3, 179, 101) none repeat scroll 0% 0% / auto padding-box border-box",
      );
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
      .should("have.css", "background")
      .and(
        "eq",
        "rgb(3, 179, 101) none repeat scroll 0% 0% / auto padding-box border-box",
      );
  });

  it("Test border width and verity", function() {
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("containerwidget");

    cy.testJsontext("borderwidth", "10");
    cy.get(
      `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
    )
      .should("have.css", "border-width")
      .and("eq", "10px");
  });

  it("Test border radius and verity", function() {
    // check if border radius is changed on button

    cy.get(`.t--property-control-borderradius  button > div`)
      .eq(0)
      .click({ force: true });

    cy.get(`.t--property-control-borderradius  button > div`)
      .eq(0)
      .invoke("css", "border-top-left-radius")
      .then((borderRadius) => {
        cy.get(
          `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
        ).should("have.css", "border-radius", borderRadius);
      });
  });

  it("Test Box shadow and verity", function() {
    cy.get(`.t--property-control-boxshadow  button > div`)
      .eq(0)
      .click({ force: true });

    cy.get(`.t--property-control-boxshadow  button > div`)
      .eq(0)
      .invoke("css", "box-shadow")
      .then((boxShadow) => {
        cy.get(
          `div[data-testid='container-wrapper-${dsl.dsl.children[0].widgetId}']`,
        ).should("have.css", "box-shadow", boxShadow);
      });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});

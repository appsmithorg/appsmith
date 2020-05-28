const commonlocators = require("../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../locators/ViewWidgets.json");
const dsl = require("../../../fixtures/viewdsl.json");

describe("Chart Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Chart Widget Functionality", function() {
    cy.openPropertyPane("chartwidget");

    /**
     * @param{Text} Random Text
     * @param{ChartWidget}Mouseover
     * @param{ChartPre Css} Assertion
     */
    cy.widgetText(
      "Test",
      viewWidgetsPage.chartWidget,
      commonlocators.containerInnerText,
    );
    /**
     * @param{Text} Random Input Value
     */
    cy.testCodeMirror(this.data.chartIndata);
    cy.get(viewWidgetsPage.chartInnerText)
      .contains("App Sign Up")
      .should("have.text", "App Sign Up");

    cy.get(viewWidgetsPage.chartType)
      .find(commonlocators.dropdownbuttonclick)
      .click({ force: true })
      .get(commonlocators.dropdownmenu)
      .children()
      .contains("Column Chart")
      .click();
    cy.get(viewWidgetsPage.chartType)
      .find(commonlocators.menuSelection)
      .should("have.text", "Column Chart");
    cy.get(viewWidgetsPage.chartWidget)
      .should("be.visible")
      .and(chart => {
        expect(chart.height()).to.be.greaterThan(200);
      });
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach(k => {
      cy.get(viewWidgetsPage.rectangleChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel)
        .eq(k)
        .should("have.text", labels[k]);
    });
    cy.get(viewWidgetsPage.xlabel)
      .click({ force: true })
      .type(this.data.command)
      .type(this.data.plan);
    cy.get(viewWidgetsPage.ylabel)
      .click({ force: true })
      .type(this.data.command)
      .type(this.data.ylabel);
    //Close edit prop
    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});

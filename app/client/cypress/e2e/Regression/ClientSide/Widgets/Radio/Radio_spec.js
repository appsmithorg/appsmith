const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Radio Widget Functionality", function () {
  before(() => {
    _.agHelper.AddDsl("newFormDsl");
  });
  it("Radio Widget Functionality", function () {
    cy.openPropertyPane("radiogroupwidget");
    /**
     * @param{Text} Random Text
     * @param{RadioWidget}Mouseover
     * @param{RadioPre Css} Assertion
     */
    cy.widgetText(
      "radiotest",
      formWidgetsPage.radioWidget,
      widgetsPage.widgetNameSpan,
    );
    /**
     * @param{IndexValue} Provide Input Index Value
     * @param{Text} Index Text Value.
     *
     */
    cy.radioInput(0, this.dataSet.radio1);
    cy.get(formWidgetsPage.labelradio).eq(0).should("have.text", "test1");
    cy.radioInput(1, "1");
    cy.radioInput(2, this.dataSet.radio2);
    cy.get(formWidgetsPage.labelradio)
      .eq(1)
      .should("have.text", this.dataSet.radio2);
    cy.radioInput(3, "2");
    cy.get(formWidgetsPage.radioAddButton).click({ force: true });
    cy.radioInput(4, this.dataSet.radio4);
    cy.get(formWidgetsPage.deleteradiovalue).eq(2).click({ force: true });
    cy.get(formWidgetsPage.labelradio).should("not.have.value", "test4");
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert("onSelectionChange");
    cy.get(formWidgetsPage.defaultSelect);
    cy.get(".t--add-action-onSelectionChange")
      .scrollIntoView()
      .click({ force: true })
      .type("2");
    _.deployMode.DeployApp();
  });
  it("Radio Functionality To Unchecked Visible Widget", function () {
    _.deployMode.NavigateBacktoEditor();
    cy.openPropertyPane("radiogroupwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    _.deployMode.DeployApp();
    cy.get(publish.radioWidget + " " + "input").should("not.exist");
    _.deployMode.NavigateBacktoEditor();
  });
  it("Radio Functionality To Check Visible Widget", function () {
    cy.openPropertyPane("radiogroupwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    _.deployMode.DeployApp();
    cy.get(publish.radioWidget + " " + "input").should("be.checked");
  });
  it("Radio Functionality To Button Text", function () {
    cy.get(publish.radioWidget + " " + "label")
      .eq(1)
      .should("have.text", "test2");
    _.deployMode.NavigateBacktoEditor();
  });
});
afterEach(() => {
  // put your clean up code if any
});

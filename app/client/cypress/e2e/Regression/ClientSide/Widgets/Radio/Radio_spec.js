const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import {
  agHelper,
  propPane,
  deployMode,
} from "../../../../../support/Objects/ObjectsCore";

describe("Radio Widget Functionality", function () {
  before(() => {
    agHelper.AddDsl("newFormDsl");
  });
  it("1. Radio Widget Functionality", function () {
    propPane.RenameWidget("RadioGroup1", "RGtest");
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
    agHelper.ClickButton("Add option");
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
    deployMode.DeployApp();
  });

  it("2. Radio Functionality To Unchecked Visible Widget", function () {
    deployMode.NavigateBacktoEditor();
    cy.openPropertyPane("radiogroupwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    deployMode.DeployApp();
    cy.get(publish.radioWidget + " " + "input").should("not.exist");
    deployMode.NavigateBacktoEditor();
    //Radio Functionality To Check Visible Widget
    cy.openPropertyPane("radiogroupwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    deployMode.DeployApp();
    cy.get(publish.radioWidget + " " + "input").should("be.checked");
    //Radio Functionality To Button Text
    cy.get(publish.radioWidget + " " + "label")
      .eq(1)
      .should("have.text", "test2");
    deployMode.NavigateBacktoEditor();
  });
});

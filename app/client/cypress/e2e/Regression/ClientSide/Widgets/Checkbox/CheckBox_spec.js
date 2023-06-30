const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import {
  entityExplorer,
  agHelper,
  deployMode,
} from "../../../../../support/Objects/ObjectsCore";

describe("Checkbox Widget Functionality", function () {
  before(() => {
    cy.fixture("newFormDsl").then((val) => {
      agHelper.AddDsl(val);
    });
  });
  it("Checkbox Widget Functionality", function () {
    entityExplorer.SelectEntityByName("Checkbox1", "Widgets");
    /**
     * @param{Text} Random Text
     * @param{CheckboxWidget}Mouseover
     * @param{CheckboxPre Css} Assertion
     */
    cy.widgetText(
      "checker",
      formWidgetsPage.checkboxWidget,
      widgetsPage.widgetNameSpan,
    );
    /**
     * @param{Text} Random Value
     */
    cy.testCodeMirror(this.dataSet.checkbocInputName);
    cy.get(widgetsPage.checkboxLabel).should("have.text", "value");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(widgetsPage.defaultcheck);
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert("onCheckChange");
    deployMode.DeployApp();
    //Checkbox Functionality To Check Label
    cy.get(publish.checkboxWidget + " " + "label").should(
      "have.text",
      this.dataSet.checkbocInputName,
    );
  });
  it("Checkbox Functionality To Check Disabled Widget", function () {
    entityExplorer.SelectEntityByName("Checkbox1", "Widgets");
    cy.togglebar(commonlocators.Disablejs + " " + "input");
    deployMode.DeployApp();
    cy.get(publish.checkboxWidget + " " + "input").should("be.disabled");
  });
  it("Checkbox Functionality To Check Enabled Widget", function () {
    entityExplorer.SelectEntityByName("Checkbox1", "Widgets");
    cy.togglebarDisable(commonlocators.Disablejs + " " + "input");
    deployMode.DeployApp();
    cy.get(publish.checkboxWidget + " " + "input").should("be.enabled");
  });
  it("Checkbox Functionality To Unchecked Visible Widget", function () {
    entityExplorer.SelectEntityByName("Checkbox1", "Widgets");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    deployMode.DeployApp();
    cy.get(publish.checkboxWidget + " " + "input").should("not.exist");
  });
  it("Checkbox Functionality To Check Visible Widget", function () {
    entityExplorer.SelectEntityByName("Checkbox1", "Widgets");
    cy.togglebar(commonlocators.visibleCheckbox);
    deployMode.DeployApp();
    cy.get(publish.checkboxWidget + " " + "input").should("be.checked");
  });

  it("Check isDirty meta property", function () {
    entityExplorer.SelectEntityByName("Text1", "Widgets");
    cy.updateCodeInput(".t--property-control-text", `{{checker.isDirty}}`);
    // Check if initial value of isDirty is false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Interact with UI
    cy.get(`${formWidgetsPage.checkboxWidget} label`).first().click();
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
    // Change defaultCheckedState property
    entityExplorer.SelectEntityByName("Checkbox1", "Widgets");
    cy.get(".t--property-control-defaultstate label").last().click();
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
    deployMode.DeployApp();
  });
});

afterEach(() => {
  deployMode.NavigateBacktoEditor();
});

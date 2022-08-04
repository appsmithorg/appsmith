const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/newFormDsl.json");

describe("Switch Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Switch Widget Functionality", function() {
    cy.openPropertyPane("switchwidget");
    /**
     * @param{Text} Random Text
     * @param{SwitchWidget}Mouseover
     * @param{SwitchPre Css} Assertion
     */
    cy.widgetText(
      "Toggler",
      formWidgetsPage.switchWidget,
      widgetsPage.switchInput,
    );
    /**
     * @param{Text} Random Value
     */
    cy.testCodeMirror(this.data.switchInputName);
    cy.get(widgetsPage.switchLabel).should("have.text", "Switch1");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(widgetsPage.defaultcheck);
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.optionchangetextSwitch);
    cy.PublishtheApp();
  });
  it("Switch Functionality To Switch Label", function() {
    cy.get(publish.switchwidget + " " + "label").should(
      "have.text",
      this.data.switchInputName,
    );
    cy.get(publish.backToEditor).click();
  });
  it("Switch Functionality To Check Disabled Widget", function() {
    cy.openPropertyPane("switchwidget");
    cy.togglebar(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + "input").should("be.disabled");
    cy.get(publish.backToEditor).click();
  });
  it("Switch Functionality To Check Enabled Widget", function() {
    cy.openPropertyPane("switchwidget");
    cy.togglebarDisable(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + "input").should("be.enabled");
    cy.get(publish.backToEditor).click();
  });
  it("Switch Functionality To Unchecked Visible Widget", function() {
    cy.openPropertyPane("switchwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + "input").should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Switch Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("switchwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + "input").should("be.checked");
    cy.get(publish.backToEditor).click();
  });

  it("Switch Functionality To swap label alignment of switch", function() {
    cy.openPropertyPane("switchwidget");
    cy.get(publish.switchwidget + " " + ".bp3-align-right").should("not.exist");
    cy.get(publish.switchwidget + " " + ".bp3-align-left").should("exist");
    // align right
    cy.get(".t--property-control-alignment .t--button-tab-RIGHT")
      .first()
      .click();
    cy.wait(200);
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + ".bp3-align-right").should("exist");
    cy.get(publish.switchwidget + " " + ".bp3-align-left").should("not.exist");
    cy.get(publish.backToEditor).click();
  });

  it("Switch Functionality To swap label position of switch", function() {
    cy.openPropertyPane("switchwidget");
    cy.get(publish.switchwidget + " " + ".t--switch-widget-label").should(
      "have.css",
      "text-align",
      "right",
    );
    cy.get(commonlocators.optionposition)
      .last()
      .click({ force: true });
    cy.wait(200);
    cy.get(commonlocators.dropdownmenu)
      .contains("Left")
      .click({ force: true });
    cy.wait(200);
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + ".t--switch-widget-label").should(
      "have.css",
      "text-align",
      "left",
    );
    cy.get(publish.backToEditor).click();
  });

  it("Switch Functionality To change label color of switch", function() {
    cy.openPropertyPane("switchwidget");
    cy.get(".t--property-control-textcolor .bp3-input").type("red");
    cy.wait(200);
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + ".t--switch-widget-label").should(
      "have.css",
      "color",
      "rgb(255, 0, 0)",
    );
    cy.get(publish.backToEditor).click();
  });

  it("Switch Functionality To change label size of switch", function() {
    cy.openPropertyPane("switchwidget");
    cy.get(widgetsPage.textSize)
      .last()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.selectTxtSize("XL");
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + ".t--switch-widget-label").should(
      "have.css",
      "font-size",
      "30px",
    );
    cy.get(publish.backToEditor).click();
  });

  it("Switch Functionality To change label style of switch", function() {
    cy.openPropertyPane("switchwidget");
    cy.get(".t--property-control-labelfontstyle .t--button-tab-BOLD").click({
      force: true,
    });
    cy.PublishtheApp();
    cy.get(publish.switchwidget + " " + ".t--switch-widget-label").should(
      "have.css",
      "font-weight",
      "700",
    );
    cy.get(publish.backToEditor).click();
  });

  it("Check isDirty meta property", function() {
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{Toggler.isDirty}}`);
    // Change defaultSwitchState property
    cy.openPropertyPane("switchwidget");
    cy.get(".t--property-control-defaultselected label")
      .last()
      .click();
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Interact with UI
    cy.get(`${formWidgetsPage.switchWidget} label`)
      .first()
      .click();
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
    // Change defaultSwitchState property
    cy.openPropertyPane("switchwidget");
    cy.get(".t--property-control-defaultselected label")
      .last()
      .click();
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
  });
});
afterEach(() => {
  // put your clean up code if any
});

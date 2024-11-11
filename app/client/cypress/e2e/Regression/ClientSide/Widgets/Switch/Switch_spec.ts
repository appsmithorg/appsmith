const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Switch Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Switch", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("newFormDsl");
    });
    it("1. Switch Widget Functionality", function () {
      cy.openPropertyPane("switchwidget");
      /**
       * @param{Text} Random Text
       * @param{SwitchWidget}Mouseover
       * @param{SwitchPre Css} Assertion
       */
      cy.widgetText(
        "Toggler",
        formWidgetsPage.switchWidget,
        widgetsPage.widgetNameSpan,
      );
      /**
       * @param{Text} Random Value
       */
      cy.testCodeMirror(this.dataSet.switchInputName);
      cy.get(widgetsPage.switchLabel).should("have.text", "Switch1");
      /**
       * @param{toggleButton Css} Assert to be checked
       */
      _.agHelper.CheckUncheck(widgetsPage.defaultcheck);
      /**
       * @param{Show Alert} Css for InputChange
       */
      cy.getAlert("onChange");
      _.deployMode.DeployApp();
    });

    it("2. Switch Functionality To Switch Label", function () {
      cy.get(publish.switchwidget + " " + "label").should(
        "have.text",
        this.dataSet.switchInputName,
      );
      _.deployMode.NavigateBacktoEditor();

      //Switch Functionality To Check Disabled Widget
      cy.openPropertyPane("switchwidget");
      _.agHelper.CheckUncheck(commonlocators.Disablejs + " " + "input");
      _.deployMode.DeployApp();
      cy.get(publish.switchwidget + " " + "input").should("be.disabled");
      _.deployMode.NavigateBacktoEditor();

      //Switch Functionality To Check Enabled Widget
      cy.openPropertyPane("switchwidget");
      _.agHelper.CheckUncheck(commonlocators.Disablejs + " " + "input", false);
      _.deployMode.DeployApp();
      cy.get(publish.switchwidget + " " + "input").should("be.enabled");
      _.deployMode.NavigateBacktoEditor();

      //Switch Functionality To Unchecked Visible Widget
      cy.openPropertyPane("switchwidget");
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox, false);
      _.deployMode.DeployApp();
      cy.get(publish.switchwidget + " " + "input").should("not.exist");
      _.deployMode.NavigateBacktoEditor();

      // Switch Functionality To Check Visible Widget
      cy.openPropertyPane("switchwidget");
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publish.switchwidget + " " + "input").should("be.checked");
      _.deployMode.NavigateBacktoEditor();
    });

    it("3. Switch Functionality To swap label alignment of switch", function () {
      cy.openPropertyPane("switchwidget");
      cy.get(publish.switchwidget + " " + ".t--switch-widget-label").should(
        "have.css",
        "text-align",
        "left",
      );
      // align right
      cy.xpath(widgetsPage.rightAlign).first().click({ force: true });
      cy.wait(200);
      _.deployMode.DeployApp();
      cy.get(publish.switchwidget + " " + ".t--switch-widget-label").should(
        "have.css",
        "text-align",
        "right",
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("4. Switch Functionality To swap label position of switch", function () {
      cy.openPropertyPane("switchwidget");
      cy.get(publish.switchwidget + " " + ".bp3-align-left").should("exist");
      cy.get(publish.switchwidget + " " + ".bp3-align-right").should(
        "not.exist",
      );
      cy.get(commonlocators.optionposition).last().click({ force: true });
      cy.wait(200);
      cy.get(commonlocators.optionpositionL).last().click({ force: true });
      cy.wait(200);
      _.deployMode.DeployApp();
      cy.get(publish.switchwidget + " " + ".bp3-align-right").should("exist");
      cy.get(publish.switchwidget + " " + ".bp3-align-left").should(
        "not.exist",
      );

      _.deployMode.NavigateBacktoEditor();
    });

    it("5. Switch Functionality To change label color of switch", function () {
      cy.openPropertyPane("switchwidget");
      cy.moveToStyleTab();
      cy.get(".t--property-control-fontcolor .bp3-input").type("red");
      cy.wait(200);
      _.deployMode.DeployApp();
      cy.get(publish.switchwidget + " " + ".t--switch-widget-label").should(
        "have.css",
        "color",
        "rgb(255, 0, 0)",
      );
      _.deployMode.NavigateBacktoEditor();

      //Switch Functionality To change label size of switch
      cy.openPropertyPane("switchwidget");
      cy.moveToStyleTab();
      cy.get(widgetsPage.textSizeNew).last().click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.selectTxtSize("XL");
      _.deployMode.DeployApp();
      cy.get(publish.switchwidget + " " + ".t--switch-widget-label").should(
        "have.css",
        "font-size",
        "30px",
      );
      _.deployMode.NavigateBacktoEditor();

      //Switch Functionality To change label style of switch
      cy.openPropertyPane("switchwidget");
      cy.moveToStyleTab();
      cy.get(".t--property-control-emphasis .t--button-group-BOLD").click();
      _.deployMode.DeployApp();
      cy.get(publish.switchwidget + " " + ".t--switch-widget-label").should(
        "have.css",
        "font-weight",
        "700",
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("6. Check isDirty meta property", function () {
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(".t--property-control-text", `{{Toggler.isDirty}}`);
      // Change defaultSwitchState property
      cy.openPropertyPane("switchwidget");
      cy.get(".t--property-control-defaultstate label").last().click();
      // Check if isDirty is reset to false
      cy.get(".t--widget-textwidget")
        .scrollIntoView()
        .should("contain", "false");
      // Interact with UI
      cy.get(`${formWidgetsPage.switchWidget} label`).first().click();
      // Check if isDirty is set to true
      cy.get(".t--widget-textwidget")
        .scrollIntoView()
        .should("contain", "true");
      // Change defaultSwitchState property
      cy.openPropertyPane("switchwidget");
      cy.get(".t--property-control-defaultstate input").last().click();
      // Check if isDirty is reset to false
      cy.get(".t--widget-textwidget")
        .scrollIntoView()
        .should("contain", "false");
    });
  },
);
afterEach(() => {
  // put your clean up code if any
});

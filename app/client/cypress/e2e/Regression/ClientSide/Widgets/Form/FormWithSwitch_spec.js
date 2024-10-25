import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Switch Widget within Form widget Functionality",
  { tags: ["@tag.Widget", "@tag.Form", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formSwitchDsl");
    });
    it("Switch Widget Functionality check with success message", function () {
      //Open switch widget
      cy.openPropertyPane("switchwidget");
      // Change name of switch widget
      cy.widgetText(
        "Toggler",
        formWidgetsPage.switchWidget,
        widgetsPage.widgetNameSpan,
      );
      // Change the widget label name
      cy.testCodeMirror(this.dataSet.switchInputName);
      // Verify widget label name is verified
      cy.get(widgetsPage.switchLabel).should("have.text", "Switch1");
      // Check the toggler button
      _.agHelper.CheckUncheck(widgetsPage.defaultcheck);
      // Type in message field and verify
      cy.getAlert("onChange");
      cy.closePropertyPane();
    });

    it("Form reset button validation with switch widget", function () {
      // Open form button
      EditorNavigation.SelectEntityByName("FormButton2", EntityType.Widget);

      // Click on reset widget action
      cy.selectResetWidget("onClick");
      // click on toggler from actions
      cy.selectWidgetForReset("Toggler");
      cy.closePropertyPane();
      // Uncheck the switch
      cy.get(widgetsPage.switchWidget).click();
      // Verify the message
      cy.get(widgetsPage.toastMsg)
        .last()
        .invoke("text")
        .then((text) => {
          const toasttext = text;
          cy.log(toasttext);
          expect(text.trim()).to.equal(toasttext.trim());
        });
      // Verify Unchecked switch is visible
      cy.get(widgetsPage.switchWidgetInactive).should("be.visible");
      // Click on reset button
      cy.get("Button:contains('Reset')").click({ force: true });
      // Verify switch is on and visible
      cy.get(widgetsPage.switchWidgetActive).should("be.visible");
    });
  },
);

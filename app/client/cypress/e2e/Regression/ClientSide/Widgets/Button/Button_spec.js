import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

const iconAlignmentProperty = ".t--property-control-position";

describe(
  "Button Widget Functionality",
  { tags: ["@tag.All", "@tag.Button", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("newFormDsl");
    });

    beforeEach(() => {
      cy.openPropertyPane("buttonwidget");
    });

    it("1. Icon alignment should not change when changing the icon", () => {
      cy.moveToStyleTab();
      cy.wait(500);
      // Add an icon
      cy.get(".t--property-control-selecticon .bp3-icon-caret-down").click({
        force: true,
      });

      cy.get(".bp3-icon-add").first().click({
        force: true,
      });

      // Assert if the icon exists
      cy.get(`${widgetsPage.buttonWidget} .bp3-icon-add`).should("exist");
      // Change icon alignment to right
      cy.get(`${iconAlignmentProperty} span[data-value="right"]`).last().click({
        force: true,
      });
      cy.wait(200);
      // Assert if the icon appears on the right hand side of the button text
      cy.get(widgetsPage.buttonWidget)
        .contains("Submit")
        .children("span")
        .should("have.length", 2);
      cy.get(`${widgetsPage.buttonWidget} span.bp3-button-text`)
        .next()
        .should("have.class", "bp3-icon-add");
      // Change the existing icon
      cy.get(".t--property-control-selecticon .bp3-icon-caret-down").click({
        force: true,
      });
      cy.get(".bp3-icon-airplane").first().click({
        force: true,
      });
      // Assert if the icon changes
      // Assert if the icon still exists on the right side of the text
      cy.get(`${widgetsPage.buttonWidget} .bp3-icon-airplane`)
        .should("exist")
        .prev()
        .should("have.text", "Submit");
    });

    it("2. Button-Color Validation", function () {
      // Change button color
      cy.changeButtonColor("rgb(255, 0, 0)");
      _.deployMode.NavigateBacktoEditor();
      // Button default variant validation", function () {
      // Checks whether the default variant is PRIMARY or not
      cy.openPropertyPane("buttonwidget");
      cy.get(widgetsPage.widgetBtn).should(
        "have.attr",
        "data-test-variant",
        "PRIMARY",
      );
    });

    it("3. Button-Name validation", function () {
      //changing the Button Name
      cy.widgetText(
        this.dataSet.ButtonName,
        widgetsPage.buttonWidget,
        widgetsPage.widgetNameSpan,
      );

      //Changing the text on the Button
      cy.testJsontext("label", this.dataSet.ButtonLabel);

      _.agHelper.AssertAutoSave();

      //Verify the Button name and label
      cy.get(widgetsPage.buttonWidget).trigger("mouseover");
      cy.get(widgetsPage.buttonWidget + " span.bp3-button-text").should(
        "have.text",
        this.dataSet.ButtonLabel,
      );
      _.deployMode.DeployApp();
      cy.get(publishPage.buttonWidget + " span.bp3-button-text").should(
        "have.text",
        this.dataSet.ButtonLabel,
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("4. Button-Disable Validation", function () {
      //Check the disableed checkbox and Validate
      cy.CheckWidgetProperties(commonlocators.disableCheckbox);
      cy.validateDisableWidget(
        widgetsPage.buttonWidget,
        commonlocators.disabledField,
      );
      _.deployMode.DeployApp();
      cy.validateDisableWidget(
        publishPage.buttonWidget,
        commonlocators.disabledField,
      );
      _.deployMode.NavigateBacktoEditor();

      //Uncheck the disabled checkbox and validate
      cy.openPropertyPane("buttonwidget");
      cy.UncheckWidgetProperties(commonlocators.disableCheckbox);
      cy.validateEnableWidget(
        widgetsPage.buttonWidget,
        commonlocators.disabledField,
      );
      _.deployMode.DeployApp();
      cy.validateEnableWidget(
        publishPage.buttonWidget,
        commonlocators.disabledField,
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("5. Toggle JS - Button-Disable Validation", function () {
      //Check the disabled checkbox by using JS widget and Validate
      cy.get(widgetsPage.toggleDisable).click({ force: true });
      cy.testJsontext("disabled", "true");
      cy.validateDisableWidget(
        widgetsPage.buttonWidget,
        commonlocators.disabledField,
      );
      _.deployMode.DeployApp();
      cy.validateDisableWidget(
        publishPage.buttonWidget,
        commonlocators.disabledField,
      );
      _.deployMode.NavigateBacktoEditor();

      //Uncheck the disabled checkbox and validate
      cy.openPropertyPane("buttonwidget");
      cy.testJsontext("disabled", "false");
      cy.validateEnableWidget(
        widgetsPage.buttonWidget,
        commonlocators.disabledField,
      );
      _.deployMode.DeployApp();
      cy.validateEnableWidget(
        publishPage.buttonWidget,
        commonlocators.disabledField,
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("6. Button-Unckeck Visible field Validation", function () {
      //Uncheck the disabled checkbox and validate
      cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publishPage.buttonWidget).should("not.exist");
      _.deployMode.NavigateBacktoEditor();

      //Check the disableed checkbox and Validate
      cy.openPropertyPane("buttonwidget");
      cy.CheckWidgetProperties(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publishPage.buttonWidget).should("be.visible");
      _.deployMode.NavigateBacktoEditor();
    });

    it("7. Toggle JS - Button-Unckeck Visible field Validation", function () {
      //Uncheck the disabled checkbox using JS and validate
      cy.get(widgetsPage.toggleVisible).click({ force: true });
      cy.EnableAllCodeEditors();
      cy.testJsontext("visible", "false");
      _.deployMode.DeployApp();
      cy.get(publishPage.buttonWidget).should("not.exist");
      _.deployMode.NavigateBacktoEditor();
      //Check the disabled checkbox using JS and Validate
      cy.openPropertyPane("buttonwidget");
      cy.EnableAllCodeEditors();
      cy.testJsontext("visible", "true");
      _.deployMode.DeployApp();
      cy.get(publishPage.buttonWidget).should("be.visible");
      _.deployMode.NavigateBacktoEditor();
    });

    it(
      "8. Button-Check recaptcha type can be selected",
      { tags: ["@tag.excludeForAirgap"] },
      function () {
        cy.selectDropdownValue(commonlocators.recaptchaVersion, "reCAPTCHA v2");
        cy.get(commonlocators.recaptchaVersionText)
          .last()
          .should("have.text", "reCAPTCHA v2");
      },
    );

    it(
      "airgap",
      "9. Button-Check recaptcha type should not exist for airgap",
      function () {
        cy.get(commonlocators.recaptchaVersion).should("not.exist");
      },
    );

    it("10. Button-Copy & Delete Verification", function () {
      //Copy button and verify all properties
      _.agHelper.Sleep();
      EditorNavigation.SelectEntityByName("Container3", EntityType.Widget);
      PageLeftPane.expandCollapseItem("Container3");
      _.propPane.CopyPasteWidgetFromPropertyPane("Submitbutton");
      //cy.copyWidget("buttonwidget", widgetsPage.buttonWidget);
      //_.deployMode.NavigateBacktoEditor();
      // Delete the button widget

      PageLeftPane.expandCollapseItem("Container3");
      _.propPane.DeleteWidgetFromPropertyPane("SubmitbuttonCopy");
      _.deployMode.DeployApp();
      cy.get(widgetsPage.buttonWidget).should("not.exist");
    });
  },
);

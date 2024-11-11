import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Form Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Form", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formdsl");
    });
    it("1. Default Form text,  Reset and Close button Validation", function () {
      cy.get(widgetsPage.textWidget).should("be.visible");
      cy.get(widgetsPage.formButtonWidget)
        .contains("Submit")
        .scrollIntoView()
        .should("be.visible");
      cy.get(widgetsPage.formButtonWidget)
        .contains("Reset")
        .scrollIntoView()
        .should("be.visible");
    });

    it("2. Add Multiple widgets in Form", function () {
      cy.get(commonlocators.entityExplorersearch).should("be.visible");
      cy.dragAndDropToWidget("multiselectwidgetv2", "formwidget", {
        x: 100,
        y: 100,
      });
      cy.wait(500);
      PageLeftPane.switchToAddNew();
      cy.dragAndDropToWidget("inputwidgetv2", "formwidget", { x: 50, y: 200 });
      cy.wait(500);
      cy.get(formWidgetsPage.multiselectwidgetv2).should("be.visible");
      cy.get(widgetsPage.inputWidget).should("be.visible");
    });

    it("3. Form_Widget Minimize and maximize General Validation", function () {
      cy.openPropertyPane("formwidget");
      cy.get(commonlocators.generalChevran).click({ force: true });
      cy.get(commonlocators.generalSection).should("not.be.visible");
      cy.get(commonlocators.generalChevran).click({ force: true });
      cy.get(commonlocators.generalSection).should("be.visible");
      _.deployMode.DeployApp();
      _.deployMode.NavigateBacktoEditor();

      //Rename Form widget from Entity Explorer
      EditorNavigation.SelectEntityByName("Form1", EntityType.Widget, {}, [
        "Container3",
      ]);
      _.entityExplorer.RenameEntityFromExplorer("Form1", "Form");

      //Form Widget Functionality To Verify The Colour
      _.deployMode.DeployApp();
      cy.get(formWidgetsPage.formD)
        .should("have.css", "background-color")
        .and("eq", "rgb(128, 128, 128)");
      _.deployMode.NavigateBacktoEditor();
    });

    //it("Form Widget Functionality", function() {
    // cy.openPropertyPane("formwidget");
    // /**
    //  * @param{Text} Random Text
    //  * @param{FormWidget}Mouseover
    //  * @param{FormPre Css} Assertion
    //  */
    // // Change the form name
    // cy.widgetText(
    //   "FormTest",
    //   formWidgetsPage.formWidget,
    //   formWidgetsPage.formInner,
    // );
    // /**
    //  * @param{Text} Random Colour
    //  */
    // // Change the form  background color
    // cy.get(widgetsPage.backgroundcolorPicker)
    //   .first()
    //   .click({ force: true });
    // cy.get(widgetsPage.greenColor).last().click();
    // // Verify the form background color
    // cy.get(formWidgetsPage.formD)
    //   .should("have.css", "background-color")
    //   .and("eq", "rgb(128, 128, 128)");
    // /**
    //  * @param{toggleButton Css} Assert to be checked
    //  */
    // // Check the Scroll and verify
    // cy.togglebar(commonlocators.scrollView);
    // cy.get(formWidgetsPage.formD)
    //   .scrollTo("bottom")
    //   .should("be.visible");
    // // Close the form propert pane
    // cy.get(commonlocators.editPropCrossButton).click({ force: true });
    //});

    it("4. Form Widget Functionality To Unchecked Visible Widget", function () {
      cy.openPropertyPane("formwidget");
      // Uncheck the visble JS
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox, false);
      _.deployMode.DeployApp();
      // Verify the unchecked visible JS
      cy.get(publish.formWidget).should("not.exist");
      _.deployMode.NavigateBacktoEditor();

      //Check Visible
      // Open property pone
      cy.openPropertyPane("formwidget");
      // Check the visible JS
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      // Verify the Checked Visible JS
      cy.get(publish.formWidget).should("be.visible");
      _.deployMode.NavigateBacktoEditor();
    });

    it("5. Toggle JS - Form-Unckeck Visible field Validation", function () {
      cy.openPropertyPane("formwidget");
      //Uncheck the disabled checkbox using JS and validate
      cy.get(widgetsPage.toggleVisible).click({ force: true });
      cy.wait(1000);
      cy.testJsontext("visible", "false");
      _.deployMode.DeployApp();
      cy.get(publish.formWidget).should("not.exist");
      _.deployMode.NavigateBacktoEditor();

      //check visible:
      cy.openPropertyPane("formwidget");
      //Check the disabled checkbox using JS and Validate
      cy.testJsontext("visible", "true");
      _.deployMode.DeployApp();
      cy.get(publish.formWidget).should("be.visible");
      _.deployMode.NavigateBacktoEditor();
    });

    it("6. Form-Copy Verification", function () {
      cy.openPropertyPane("formwidget");
      //Copy Form and verify all properties
      cy.copyWidget("formwidget", widgetsPage.formWidget);
      _.deployMode.DeployApp();
    });

    /*
  it("Form-Delete Verification", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    cy.openPropertyPane("formwidget");
    // Delete the Form widget
    cy.get("body").type("{del}", { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    //cy.deleteWidget(widgetsPage.formWidget);
    _.deployMode.DeployApp();
    cy.get(widgetsPage.formWidget).should("not.exist");
  });
  */
  },
);

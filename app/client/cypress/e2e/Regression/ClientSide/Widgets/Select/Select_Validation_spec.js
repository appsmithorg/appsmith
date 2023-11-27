/* eslint-disable cypress/no-unnecessary-waiting */
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Select Widget Functionality", function () {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.SELECT);
  });

  it("1. Select Widget name update/Disabeld state", function () {
    _.propPane.RenameWidget("Select1", "SelectRenamed");
    // Disable the widget and check visibility in publish mode
    _.propPane.TogglePropertyState("Disabled", "On");
    cy.get(".bp3-disabled").should("be.visible");
    _.deployMode.DeployApp();
    cy.get(".bp3-disabled").should("be.visible");
    _.deployMode.NavigateBacktoEditor();
    //Enable the widget and check in publish mode", function () {
    cy.openPropertyPane("selectwidget");
    EditorNavigation.SelectEntityByName("SelectRenamed", EntityType.Widget);
    cy.get(".bp3-disabled").should("be.visible");
    _.propPane.TogglePropertyState("Disabled", "Off");
    cy.get(".t--widget-selectwidget .bp3-button").should("be.visible");
    _.deployMode.DeployApp();
    cy.get(".t--widget-selectwidget .bp3-button")
      .should("be.visible")
      .click({ force: true });
    cy.get(commonlocators.singleSelectActiveMenuItem).should(
      "contain.text",
      "Green",
    );
    _.deployMode.NavigateBacktoEditor();
  });

  it("2. Shows validation error for invalid defaultSelectedValue", () => {
    const { agHelper, entityExplorer, locators, propPane } = _;

    EditorNavigation.SelectEntityByName("SelectRenamed", EntityType.Widget);

    propPane.UpdatePropertyFieldValue("Default selected value", "GREEN1", true);

    agHelper.VerifyEvaluatedErrorMessage(
      "Default value is missing in options. Please update the value.",
    );

    propPane.ToggleJSMode("Source Data", true);

    // Updates the options and asserts that the validation error is fixed
    propPane.UpdatePropertyFieldValue(
      "Source Data",
      '[{"name": "Green", "code":"GREEN1"}]',
      true,
    );

    agHelper.FocusElement(
      locators._propertyInputField("Default selected value"),
    );

    agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);

    // Changes options to bring back validation error
    propPane.UpdatePropertyFieldValue(
      "Source Data",
      '[{"name": "Green", "code":"GREEN"}]',
      true,
    );

    agHelper.FocusElement(
      locators._propertyInputField("Default selected value"),
    );

    agHelper.VerifyEvaluatedErrorMessage(
      "Default value is missing in options. Please update the value.",
    );

    // Reload to check if the error persists
    agHelper.RefreshPage();

    EditorNavigation.SelectEntityByName("SelectRenamed", EntityType.Widget);

    agHelper.FocusElement(
      locators._propertyInputField("Default selected value"),
    );

    agHelper.VerifyEvaluatedErrorMessage(
      "Default value is missing in options. Please update the value.",
    );

    // Fixes the validation error
    propPane.UpdatePropertyFieldValue(
      "Source Data",
      '[{"name": "Green", "code": {{"GREEN1"}}}]',
      true,
    );

    agHelper.FocusElement(
      locators._propertyInputField("Default selected value"),
    );

    agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
  });
});

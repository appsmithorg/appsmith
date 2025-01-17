import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Icon button Widget Functionality",
  { tags: ["@tag.All", "@tag.IconButton", "@tag.Binding"] },
  function () {
    before(() => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.ICONBUTTON);
    });

    it("1. check default buttonVariant with isJSConvertible", function () {
      EditorNavigation.SelectEntityByName("IconButton1", EntityType.Widget);
      _.propPane.MoveToTab("Style");
      cy.get(widgetsPage.iconWidgetBtn).should(
        "have.css",
        "background-color",
        "rgb(85, 61, 233)",
      );
    });

    it("2. add space into buttonVariant and validate", function () {
      _.propPane.EnterJSContext("Button variant", "PRIMARY   ");
      cy.get(widgetsPage.iconWidgetBtn).should(
        "have.css",
        "background-color",
        "rgb(85, 61, 233)",
      );
    });

    it("3. show alert on button click", function () {
      _.propPane.MoveToTab("Content");
      _.propPane.EnterJSContext(
        "onClick",
        "{{showAlert('Icon button Clicked','success')}}",
      );
      cy.get(widgetsPage.iconWidgetBtn).click({ force: true });
      cy.get(commonlocators.toastmsg).contains("Icon button Clicked");
      _.deployMode.DeployApp();
      cy.wait(2000);
      cy.get(publishPage.iconWidgetBtn).click();
      cy.get(commonlocators.toastmsg).contains("Icon button Clicked");
      _.deployMode.NavigateBacktoEditor();
    });

    it("4. should not show alert onclick if button is disabled", function () {
      cy.openPropertyPane("iconbuttonwidget");
      cy.CheckWidgetProperties(commonlocators.disableCheckbox);
      cy.get(widgetsPage.iconWidgetBtn).click({ force: true });
      cy.get(commonlocators.toastmsg).should("not.exist");
      _.deployMode.DeployApp();
      cy.get(publishPage.iconWidgetBtn).click({ force: true });
      cy.get(commonlocators.toastmsg).should("not.exist");
    });
  },
);

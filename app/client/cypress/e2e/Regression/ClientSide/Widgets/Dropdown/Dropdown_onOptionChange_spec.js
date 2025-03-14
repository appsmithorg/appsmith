import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  locators,
  propPane,
  deployMode,
  dataSources,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Dropdown Widget",
  { tags: ["@tag.Widget", "@tag.Dropdown", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("newFormDsl");
    });

    it("1. Dropdown-Modal Validation", function () {
      EditorNavigation.SelectEntityByName("Dropdown1", EntityType.Widget, {}, [
        "Container3",
      ]);
      propPane.UpdatePropertyFieldValue(
        "Source Data",
        JSON.stringify(this.dataSet.input),
      );
      //creating the Modal and verify Modal name //to fix below
      // cy.createModal("Modal1", false);
      // deployMode.DeployApp();
      // // Changing the option to verify the success message
      // cy.get(formWidgetsPage.selectWidget)
      //   .find(widgetLocators.dropdownSingleSelect)
      //   .click({ force: true });
      // cy.get(commonlocators.singleSelectWidgetMenuItem)
      //   .contains("Option 2")
      //   .click({ force: true });
      // cy.wait(1000);
      // cy.get(modalWidgetPage.modelTextField).should(
      //   "have.text",
      //   "Modal1",
      // );
    });

    it("2. Dropdown-Call-Api Validation", function () {
      //creating an api and calling it from the onOptionChangeAction of the Dropdown widget.
      // Creating the api
      cy.CreateAPI("dropdownApi");
      cy.log("Creation of buttonApi Action successful");
      cy.enterDatasourceAndPath(
        this.dataSet.paginationUrl,
        "mock-api?records=20&page=4&size=3",
      );
      cy.SaveAndRunAPI();

      // Going to HomePage where the button widget is located and opeing it's property pane.
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.expandCollapseItem("Container3", "Widgets");
      EditorNavigation.SelectEntityByName("Dropdown1", EntityType.Widget);
      cy.reload();

      cy.executeDbQuery("dropdownApi", "onOptionChange");
      // Filling the messages for success/failure in the onOptionChangeAction of the dropdown widget.
      cy.onClickActions(
        "Success",
        "Error",
        "Execute a query",
        "dropdownApi.run",
      );

      deployMode.DeployApp();
      // Changing the option to verify the success message
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("Option 3")
        .click({ force: true });
      cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
      deployMode.NavigateBacktoEditor();
    });

    it("3. Dropdown-Call-Query Validation", function () {
      //creating a query and calling it from the onOptionChangeAction of the Dropdown widget.
      // Creating a query
      dataSources.CreateDataSource("Postgres");
      dataSources.CreateQueryAfterDSSaved(
        'SELECT * FROM public."country" LIMIT 10;',
      );
      // Going to HomePage where the button widget is located and opeing it's property pane.
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.openPropertyPane("selectwidget");
      cy.reload();
      // Adding the query in the onOptionChangeAction of the dropdown widget.
      cy.executeDbQuery("Query1", "onOptionChange");
      // Filling the messages for success/failure in the onOptionChangeAction of the dropdown widget.
      cy.onClickActions("Success", "Error", "Execute a query", "Query1.run");

      deployMode.DeployApp();

      // Changing the option to verify the success message
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("Option 2")
        .click({ force: true });
      cy.get(formWidgetsPage.apiCallToast).should("contain.text", "Success");
      deployMode.NavigateBacktoEditor();
    });

    it("4. Toggle JS - Dropdown-Call-Query Validation", function () {
      //creating an api and calling it from the onOptionChangeAction of the button widget.
      // calling the existing api
      EditorNavigation.SelectEntityByName("Dropdown1", EntityType.Widget, {}, [
        "Container3",
      ]);

      cy.get(formWidgetsPage.toggleOnOptionChange).click({ force: true });
      cy.EnableAllCodeEditors();
      cy.testJsontext(
        "onoptionchange",
        "{{Query1.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
      );

      deployMode.DeployApp();
      // Changing the option to verify the success message
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("Option 2")
        .click({ force: true });
      cy.get(formWidgetsPage.apiCallToast).should("contain.text", "Success");
      deployMode.NavigateBacktoEditor();
    });

    it("5. Toggle JS - Dropdown-CallAnApi Validation", function () {
      //creating an api and calling it from the onOptionChangeAction of the button widget.
      // calling the existing api
      EditorNavigation.SelectEntityByName("Dropdown1", EntityType.Widget, {}, [
        "Container3",
      ]);

      cy.testJsontext(
        "onoptionchange",
        "{{dropdownApi.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
      );

      deployMode.DeployApp();
      // Changing the option to verify the success message
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("Option 1")
        .click({ force: true });
      cy.get(formWidgetsPage.apiCallToast).should("contain.text", "Success");
      deployMode.NavigateBacktoEditor();
      cy.openPropertyPane("selectwidget");
    });

    it("6. Dropdown Widget Functionality to Verify On Option Change Action", function () {
      // Open property pane
      EditorNavigation.SelectEntityByName("Dropdown1", EntityType.Widget, {}, [
        "Container3",
      ]);

      // Clear the JS code
      propPane.UpdatePropertyFieldValue("onOptionChange", "");
      cy.get(locators._jsToggle("onoptionchange")).click();

      // Dropdown On Option Change
      propPane.ToggleJSMode("onOptionChange", false);
      cy.getAlert("onOptionChange", "Option Changed");
      deployMode.DeployApp();
      // Change the Option
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("Option 3")
        .click({ force: true });
      // Verify Option is changed
      cy.validateToastMessage("Option Changed");
      deployMode.NavigateBacktoEditor();
    });
  },
);

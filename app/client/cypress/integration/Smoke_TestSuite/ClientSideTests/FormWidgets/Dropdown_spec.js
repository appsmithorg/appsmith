const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const data = require("../../../../fixtures/example.json");
const apiPage = require("../../../../locators/ApiEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");

describe("Dropdown Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Dropdown-AlertModal Validation", function() {
    cy.SearchEntityandOpen("Dropdown1");
    cy.testJsontext("options", JSON.stringify(data.input));
    //creating the Alert Modal and verify Modal name
    cy.createModal("Alert Modal", this.data.AlertModalName);
    cy.PublishtheApp();
    // Changing the option to verify the success message
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("Option 1")
      .click({ force: true });
    cy.wait(1000);
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.AlertModalName,
    );
    cy.get(publish.backToEditor).click();
  });

  it("Dropdown-FromModal Validation", function() {
    cy.openPropertyPane("dropdownwidget");
    //creating the Alert Modal and verify Modal name
    cy.updateModal("Form Modal", this.data.FormModalName);
    cy.PublishtheApp();
    // Changing the option to verify the success message
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("Option 2")
      .click({ force: true });
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.FormModalName,
    );
    cy.get(publish.backToEditor).click();
  });

  it("Dropdown-Call-Api Validation", function() {
    //creating an api and calling it from the onOptionChangeAction of the Dropdown widget.
    // Creating the api
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("dropdownApi");
    cy.log("Creation of buttonApi Action successful");
    cy.enterDatasourceAndPath(this.data.paginationUrl, "users?page=4&size=3");
    cy.SaveAndRunAPI();

    // Going to HomePage where the button widget is located and opeing it's property pane.
    cy.get(formWidgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.SearchEntityandOpen("Dropdown1");
    cy.testJsontext("options", JSON.stringify(data.input));
    // Adding the api in the onClickAction of the button widget.
    cy.addAPIFromLightningMenu("dropdownApi");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error", "onoptionchange");

    cy.PublishtheApp();

    // Changing the option to verify the success message
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("Option 3")
      .click({ force: true });
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
    cy.get(publish.backToEditor).click();
  });

  it("Dropdown-Call-Query Validation", function() {
    //creating a query and calling it from the onOptionChangeAction of the Dropdown widget.
    // Creating a mock query
    // cy.CreateMockQuery("Query1");
    let postgresDatasourceName;

    cy.startRoutesForDatasource();
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.generateUUID().then((uid) => {
      postgresDatasourceName = uid;

      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(postgresDatasourceName, { force: true })
        .should("have.value", postgresDatasourceName)
        .blur();
    });
    cy.wait("@saveDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.fillPostgresDatasourceForm();
    cy.saveDatasource();

    cy.CreateMockQuery("Query1");

    // Going to HomePage where the button widget is located and opeing it's property pane.
    cy.get(formWidgetsPage.NavHomePage).click({ force: true });
    cy.reload();
    cy.openPropertyPane("dropdownwidget");
    cy.testJsontext("options", JSON.stringify(data.input));
    // Adding the query in the onClickAction of the button widget.
    cy.addQueryFromLightningMenu("Query1");
    // Filling the messages for success/failure in the onClickAction of the button widget.
    cy.onClickActions("Success", "Error", "onoptionchange");

    cy.PublishtheApp();

    // Changing the option to verify the success message
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("Option 2")
      .click({ force: true });
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
    cy.get(publish.backToEditor).click();
  });

  it("Toggle JS - Dropdown-Call-Query Validation", function() {
    //creating an api and calling it from the onOptionChangeAction of the button widget.
    // calling the existing api
    cy.openPropertyPane("dropdownwidget");
    cy.get(formWidgetsPage.toggleOnOptionChange).click({ force: true });
    cy.testJsontext(
      "onoptionchange",
      "{{Query1.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    cy.PublishtheApp();
    // Changing the option to verify the success message
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("Option 2")
      .click({ force: true });
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
    cy.get(publish.backToEditor).click();
  });

  it("Toggle JS - Dropdown-CallAnApi Validation", function() {
    //creating an api and calling it from the onOptionChangeAction of the button widget.
    // calling the existing api
    cy.openPropertyPane("dropdownwidget");
    cy.testJsontext(
      "onoptionchange",
      "{{dropdownApi.run(() => showAlert('Success','success'), () => showAlert('Error','error'))}}",
    );

    cy.PublishtheApp();
    // Changing the option to verify the success message
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("Option 1")
      .click({ force: true });
    cy.get(formWidgetsPage.apiCallToast).should("have.text", "Success");
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("dropdownwidget");
    // Click on onOptionChange JS button
    cy.get(formWidgetsPage.toggleOnOptionChange).click({ force: true });
    cy.get(commonlocators.dropdownSelectButton)
      .eq(0)
      .click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("No Action")
      .click();
    cy.testJsontext("options", "");
  });

  it("Verify Search box for selecting drop-down options", function() {
    cy.SearchEntityandOpen("Dropdown1");
    cy.togglebar(formWidgetsPage.filterCheckbox);
    cy.PublishtheApp();
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(formWidgetsPage.searchBoxDropdown).should("be.visible");
    cy.get(publish.backToEditor).click();
  });

  it("Verify Dropdown default value", function() {
    cy.PublishtheApp();
    cy.get(formWidgetsPage.dropdownDefaultButton).should("contain", "Select");
    cy.get(publish.backToEditor).click();
  });

  it("Selects value with invalid default value", () => {
    cy.SearchEntityandOpen("Dropdown1");
    // Add options in dropdown
    cy.testJsontext("options", JSON.stringify(data.input));
    // Assign the invalid default value
    cy.testJsontext("defaultoption", "{{ undefined }}");
    // Select value with invalid default value
    cy.get(formWidgetsPage.dropdownWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("Option 3")
      .click({ force: true });
    // Varify the selected value
    cy.get(formWidgetsPage.dropdownWidget)
      .find(widgetLocators.defaultSingleSelectValue)
      .should("have.text", "Option 3");
  });

  it("Verify Dropdown Icon is available", function() {
    cy.PublishtheApp();
    cy.get(formWidgetsPage.dropdowonChevranDown).should("be.visible");
    cy.get(publish.backToEditor).click();
  });

  it("Dropdown Widget Functionality To Verify Drag and Drop widget", function() {
    // Click on Add widget button
    cy.get(formWidgetsPage.addWidget).click();
    // Drag and drop table widget
    cy.dragAndDropToCanvas("dropdownwidget", { x: 170, y: 720 });
    cy.wait(1000);
    cy.get(commonlocators.closeWidgetBar).click({ force: true });
    cy.GlobalSearchEntity("Select1");
    cy.SearchEntityandOpen("Select1");
    // Delete Table2
    cy.deleteWidget(formWidgetsPage.dropdownwidget);
    cy.wait(2000);
  });

  it("Explore Widget related documents Validation", function() {
    // Open property pane
    cy.SearchEntityandOpen("Dropdown1");
    cy.widgetText(
      "Select",
      formWidgetsPage.dropdownWidget,
      commonlocators.dropdownInner,
    );
    // Click on "Explore widget related docs" button
    cy.get(formWidgetsPage.exploreWidget).click();
    cy.wait(2000);
    // Verify the widget related document
    cy.get(formWidgetsPage.widgetRelatedDocument).should("contain", "Select");
    cy.wait(2000);
    cy.get("#header-root").click();
    cy.widgetText(
      "Dropdown1",
      formWidgetsPage.dropdownWidget,
      commonlocators.dropdownInner,
    );
    cy.wait(1000);
  });

  it("Dropdown Close Verification", function() {
    // Open property pane
    cy.SearchEntityandOpen("Dropdown1");
    // Close propert pane
    cy.closePropertyPane();
  });

  it("Dropdown Widget Functionality to Verify On Option Change Action", function() {
    // Open property pane
    cy.SearchEntityandOpen("Dropdown1");
    // Dropdown On Option Change
    cy.addAction("Option Changed");
    cy.PublishtheApp();
    // Change the Option
    cy.get(formWidgetsPage.selectWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("Option 3")
      .click({ force: true });
    // Verify Option is changed
    cy.validateToastMessage("Option Changed");
    cy.get(publish.backToEditor).click();
  });

  it("Selects value with enter in default value", () => {
    // cy.openPropertyPane("dropdownwidget");
    cy.openPropertyPane("dropdownwidget");
    // Enter value in default option
    cy.testJsontext("defaultoption", "3\n");
    // Verify the default value is selected
    cy.get(formWidgetsPage.dropdownWidget)
      .find(widgetLocators.defaultSingleSelectValue)
      .should("have.text", "Option 3");
  });

  it("Copy paste dropdown widget", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    // Open property pane
    cy.SearchEntityandOpen("Dropdown1");
    cy.widgetText(
      "Dropdown1",
      formWidgetsPage.dropdownWidget,
      commonlocators.dropdownInner,
    );
    cy.get("body").type(`{${modifierKey}}c`);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(commonlocators.toastBody)
      .first()
      .contains("Copied");
    cy.get("body").click();
    cy.get("body").type(`{${modifierKey}}v`, { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(commonlocators.toastAction).should("be.visible");

    //Check after copying new table widget should not have any warnings
    cy.get('.t--draggable-dropdownwidget [name="warning"]').should("not.exist");
    cy.GlobalSearchEntity("Dropdown1Copy");
  });

  it("Dropdown-Delete Verification", function() {
    // Open property pane
    cy.SearchEntityandOpen("Dropdown1Copy");
    // Delete the Dropdown widget
    cy.deleteWidget(formWidgetsPage.dropdownwidget);
    cy.PublishtheApp();
    // Verify the Dropdown widget is deleted
    cy.get(formWidgetsPage.dropdownwidget).should("not.exist");
    cy.get(publish.backToEditor).click();
  });

  it("Dropdown Widget Functionality", function() {
    cy.SearchEntityandOpen("Dropdown1");
    // Change dropdown name
    cy.widgetText(
      "lock",
      formWidgetsPage.dropdownWidget,
      commonlocators.containerInnerText,
    );
    cy.get(formWidgetsPage.dropdownSelectionType)
      .last()
      .click({ force: true });
    // Change the selection type to multi
    cy.get(commonlocators.dropdownmenu)
      .children()
      .contains("Multi Select")
      .click();
    // Verify the selection type is multi
    cy.get(formWidgetsPage.dropdownSelectionType)
      .last()
      .should("have.text", "Multi Select");
    /**
     * @param{Show Alert} Css for InputChange
     */
    // Type in the message and validate it
    cy.getAlert(commonlocators.optionchangetextDropdown);
    cy.get(formWidgetsPage.dropdownInput).click({ force: true });
    // Select dropdown option and Verify it
    cy.get(formWidgetsPage.dropdownInput).type("Option");
    cy.dropdownDynamic("Option 1");
    cy.PublishtheApp();
    cy.get(publish.dropdownWidget + " " + ".bp3-button").should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Dropdown Functionality To Validate Options", function() {
    // select two options at a time and verify
    cy.get(formWidgetsPage.dropdownInput).click({ force: true });
    cy.get(formWidgetsPage.dropdownInput).type("Option");
    cy.dropdownDynamic("Option 1");
    cy.get(publish.backToEditor).click();
  });
  it("Dropdown Functionality To Check disabled Widget", function() {
    cy.openPropertyPane("dropdownwidget");
    // Disable the visible JS
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    // Verify the disabled visible JS
    cy.get(publish.dropdownWidget + " " + "input").should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Dropdown Functionality To UnCheck disabled Widget", function() {
    cy.openPropertyPane("dropdownwidget");
    // Check the visible JS
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    // Verify the checked visible JS
    cy.get(publish.dropdownWidget + " " + "input").should("be.visible");
    cy.get(publish.backToEditor).click();
  });
  it("Toggle JS - Dropdown-Unckeck Visible field Validation", function() {
    // Open Property pane
    cy.openPropertyPane("dropdownwidget");
    //Uncheck the disabled checkbox using JS and validate
    cy.get(formWidgetsPage.toggleVisible).click({ force: true });
    cy.EditWidgetPropertiesUsingJS(formWidgetsPage.inputToggleVisible, "false");
    cy.PublishtheApp();
    cy.get(formWidgetsPage.selectWidget).should("not.exist");
    cy.get(publish.backToEditor).click({ force: true });
  });

  it("Toggle JS - Dropdown-Check Visible field Validation", function() {
    // Open Property pane
    cy.openPropertyPane("dropdownwidget");
    //Check the disabled checkbox using JS and Validate
    cy.EditWidgetPropertiesUsingJS(formWidgetsPage.inputToggleVisible, "true");
    cy.PublishtheApp();
    cy.get(formWidgetsPage.selectWidget).should("be.visible");
    cy.get(publish.backToEditor).click({ force: true });
  });
});
afterEach(() => {
  cy.goToEditFromPublish();
});

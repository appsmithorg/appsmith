// const commonlocators = require("../../../../locators/commonlocators.json");
// const formWidgetsPage = require("../../../../locators/FormWidgets.json");
// const widgetLocators = require("../../../../locators/Widgets.json");
// const publish = require("../../../../locators/publishWidgetspage.json");
// const dsl = require("../../../../fixtures/newFormDsl.json");
// const data = require("../../../../fixtures/example.json");
// const apiPage = require("../../../../locators/ApiEditor.json");
// const datasource = require("../../../../locators/DatasourcesEditor.json");
// const modalWidgetPage = require("../../../../locators/ModalWidget.json");

// describe("Dropdown Widget Functionality", function() {
//   before(() => {
//     cy.addDsl(dsl);
//   });

//   it("Verify Search box for selecting drop-down options", function() {
//     cy.openPropertyPane("selectwidget");
//     cy.togglebar(formWidgetsPage.filterCheckbox);
//     cy.PublishtheApp();
//     cy.get(formWidgetsPage.selectWidget)
//       .find(widgetLocators.dropdownSingleSelect)
//       .click({ force: true });
//     cy.get(formWidgetsPage.searchBoxDropdown).should("be.visible");
//   });

//   it("Verify Dropdown default value", function() {
//     cy.PublishtheApp();
//     cy.get(formWidgetsPage.dropdownDefaultButton).should("contain", "Select");
//   });

//   it("Selects value with invalid default value", () => {
//     cy.openPropertyPane("selectwidget");
//     // Add options in dropdown
//     cy.testJsontext("options", JSON.stringify(data.input));
//     // Assign the invalid default value
//     cy.testJsontext("defaultoption", "{{ undefined }}");
//     // Select value with invalid default value
//     cy.get(formwidgetsPage.selectwidget)
//       .find(widgetLocators.dropdownSingleSelect)
//       .click({ force: true });
//     cy.get(commonlocators.singleSelectMenuItem)
//       .contains("Option 3")
//       .click({ force: true });
//     // Varify the selected value
//     cy.get(formwidgetsPage.selectwidget)
//       .find(widgetLocators.defaultSingleSelectValue)
//       .should("have.text", "Option 3");
//   });

//   it("Verify Dropdown Icon is available", function() {
//     cy.PublishtheApp();
//     cy.get(formWidgetsPage.dropdowonChevranDown).should("exist");
//   });

//   // it("Explore Widget related documents Validation", function() {
//   //   // Open property pane
//   //   cy.openPropertyPane("selectwidget");
//   //   cy.widgetText(
//   //     "Select",
//   //     formwidgetsPage.selectwidget,
//   //     commonlocators.dropdownInner,
//   //   );
//   //   // Click on "Explore widget related docs" button
//   //   cy.get(formWidgetsPage.exploreWidget).click();
//   //   cy.wait(2000);
//   //   // Verify the widget related document
//   //   cy.get(formWidgetsPage.widgetRelatedDocument).should("contain", "Select");
//   //   cy.wait(2000);
//   //   cy.get("#header-root").click();
//   //   cy.widgetText(
//   //     "Dropdown1",
//   //     formwidgetsPage.selectwidget,
//   //     commonlocators.dropdownInner,
//   //   );
//   //   cy.wait(1000);
//   // });

//   it("Dropdown Close Verification", function() {
//     // Open property pane
//     cy.SearchEntityandOpen("Dropdown1");
//     // Close propert pane
//     cy.closePropertyPane();
//   });

//   it("Selects value with enter in default value", () => {
//     // cy.openPropertyPane("selectwidget");
//     cy.SearchEntityandOpen("Dropdown1");
//     // Enter value in default option
//     cy.testJsontext("defaultoption", "3\n");
//     // Verify the default value is selected
//     cy.get(formwidgetsPage.selectwidget)
//       .find(widgetLocators.defaultSingleSelectValue)
//       .should("have.text", "Option 3");
//   });

//   it("Copy paste dropdown widget", function() {
//     const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
//     // Open property pane
//     cy.SearchEntityandOpen("Dropdown1");
//     cy.widgetText(
//       "Dropdown1",
//       formwidgetsPage.selectwidget,
//       commonlocators.dropdownInner,
//     );
//     cy.get("body").type(`{${modifierKey}}c`);
//     // eslint-disable-next-line cypress/no-unnecessary-waiting
//     cy.wait(500);
//     cy.get(commonlocators.toastBody)
//       .first()
//       .contains("Copied");
//     cy.get("body").click();
//     cy.get("body").type(`{${modifierKey}}v`, { force: true });
//     cy.wait("@updateLayout").should(
//       "have.nested.property",
//       "response.body.responseMeta.status",
//       200,
//     );
//     cy.get(commonlocators.toastAction).should("be.visible");

//     //Check after copying new table widget should not have any warnings
//     cy.get('.t--draggable-selectwidget [name="warning"]').should("not.exist");
//     cy.GlobalSearchEntity("Dropdown1Copy");
//   });

//   it("Dropdown-Delete Verification", function() {
//     // Open property pane
//     cy.SearchEntityandOpen("Dropdown1Copy");
//     // Delete the Dropdown widget
//     cy.deleteWidget(formwidgetsPage.selectwidget);
//     cy.PublishtheApp();
//     // Verify the Dropdown widget is deleted
//     cy.get(formwidgetsPage.selectwidget).should("not.exist");
//   });

//   it("Dropdown Widget Functionality", function() {
//     cy.SearchEntityandOpen("Dropdown1");
//     // Change dropdown name
//     cy.widgetText(
//       "lock",
//       formwidgetsPage.selectwidget,
//       commonlocators.containerInnerText,
//     );
//     cy.closePropertyPane();
//   });
//   it("Dropdown Functionality To Check disabled Widget", function() {
//     cy.openPropertyPane("selectwidget");
//     // Disable the visible JS
//     cy.togglebarDisable(commonlocators.visibleCheckbox);
//     cy.PublishtheApp();
//     // Verify the disabled visible JS
//     cy.get(publish.selectwidget + " " + "input").should("not.exist");
//   });
//   it("Dropdown Functionality To UnCheck disabled Widget", function() {
//     cy.SearchEntityandOpen("lock");
//     // Check the visible JS
//     cy.togglebar(commonlocators.visibleCheckbox);
//     cy.PublishtheApp();
//     // Verify the checked visible JS
//     cy.get(publish.selectwidget).should("exist");
//   });
//   it("Toggle JS - Dropdown-Unckeck Visible field Validation", function() {
//     // Open Property pane
//     cy.openPropertyPane("selectwidget");
//     //Uncheck the disabled checkbox using JS and validate
//     cy.get(formWidgetsPage.toggleVisible).click({ force: true });
//     cy.EditWidgetPropertiesUsingJS(formWidgetsPage.inputToggleVisible, "false");
//     cy.PublishtheApp();
//     cy.get(formWidgetsPage.selectWidget).should("not.exist");
//   });

//   it("Toggle JS - Dropdown-Check Visible field Validation", function() {
//     // Open Property pane
//     cy.openPropertyPane("selectwidget");
//     //Check the disabled checkbox using JS and Validate
//     cy.EditWidgetPropertiesUsingJS(formWidgetsPage.inputToggleVisible, "true");
//     cy.PublishtheApp();
//     cy.get(formWidgetsPage.selectWidget).should("exist");
//   });
// });
// afterEach(() => {
//   cy.goToEditFromPublish();
// });

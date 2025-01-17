const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const {
  default: OneClickBindingLocator,
} = require("../../../../../locators/OneClickBindingLocator");
const widgetLocators = require("../../../../../locators/Widgets.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const {
  agHelper,
  assertHelper,
  dataSources,
  propPane,
} = require("../../../../../support/Objects/ObjectsCore");
const {
  default: EditorNavigation,
  EntityType,
} = require("../../../../../support/Pages/EditorNavigation");
const { OneClickBinding } = require("../../OneClickBinding/spec_utility");

const oneClickBinding = new OneClickBinding();

describe(
  "Select widget",
  { tags: ["@tag.All", "@tag.Select", "@tag.Binding"] },
  () => {
    it("1. Drag and drop Select/Text widgets", () => {
      cy.dragAndDropToCanvas("selectwidget", { x: 300, y: 300 });
      cy.get(formWidgetsPage.selectWidget).should("exist");
    });

    it("2. Check isDirty meta property", () => {
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
      cy.updateCodeInput(".t--property-control-text", `{{Select1.isDirty}}`);
      // Check if initial value of isDirty is false
      cy.get(".t--widget-textwidget").should("contain", "false");
      // Interact with UI
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("Blue")
        .click({ force: true });
      // Check if isDirty is set to true
      cy.get(".t--widget-textwidget").should("contain", "true");
      // Change defaultOptionValue property
      cy.updateCodeInput(".t--property-control-defaultselectedvalue", "RED");
      // Check if isDirty is reset to false
      cy.get(".t--widget-textwidget").should("contain", "false");
    });

    it("3. Clears the search field when widget is closed and serverSideFiltering is off", () => {
      // open the select widget
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });
      // search for option Red in the search input
      cy.get(commonlocators.selectInputSearch).type("Red");
      // Select the Red option from dropdown list
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("Red")
        .click({ force: true });
      cy.wait(200);
      // Assert if the select widget has Red as the selected value
      cy.get(formWidgetsPage.selectWidget).contains("Red");
      // Open the select widget again
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });
      // Assert if the search input is empty now
      cy.get(commonlocators.selectInputSearch).invoke("val").should("be.empty");
    });

    it("4. Does not clear the search field when widget is closed and serverSideFiltering is on", () => {
      // toggle the serversidefiltering option on
      agHelper.CheckUncheck(widgetLocators.serversideFilteringInput);
      // search for option Red in the search input
      cy.get(commonlocators.selectInputSearch).type("Red");
      // Select the Red option from dropdown list
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("Red")
        .click({ force: true });
      cy.wait(200);
      // Open the select widget again
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });
      // Assert if the search input is not empty
      cy.get(commonlocators.selectInputSearch)
        .invoke("val")
        .should("not.be.empty");
    });

    it("5. Select widget selection is not cleared when the widget is server side filtered", () => {
      dataSources.CreateDataSource("Postgres");

      cy.get("@dsName").then((dsName) => {
        EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
        propPane.ToggleJSMode("sourcedata", false);

        oneClickBinding.ChooseAndAssertForm(
          `${dsName}`,
          dsName,
          "public.employees",
          {
            label: "first_name",
            value: "last_name",
          },
        );
      });

      agHelper.GetNClick(OneClickBindingLocator.connectData);

      assertHelper.AssertNetworkStatus("@postExecute");

      cy.get(formWidgetsPage.selectWidget)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });

      cy.get(commonlocators.selectInputSearch).clear().type("Janet");

      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("Janet")
        .click({ force: true });

      cy.get(formWidgetsPage.selectWidget)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });

      cy.get(commonlocators.selectInputSearch).clear().type("Steven");

      assertHelper.AssertNetworkStatus("@postExecute");

      cy.get(".select-button").should("contain", "Janet");
    });

    it("6. Select tooltip renders if tooltip prop is not empty", () => {
      cy.openPropertyPane("selectwidget");
      // enter tooltip in property pan
      cy.get(widgetsPage.inputTooltipControl).type(
        "Helpful text for tooltip !",
      );
      // tooltip help icon shows
      cy.get(".select-tooltip").scrollIntoView().should("be.visible");
    });
  },
);

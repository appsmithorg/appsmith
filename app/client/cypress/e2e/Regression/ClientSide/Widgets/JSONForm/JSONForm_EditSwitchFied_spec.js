import EditorNavigation, {
    EntityType,
  } from "../../../../../support/Pages/EditorNavigation";
  
  const commonlocators = require("../../../../../locators/commonlocators.json");
  const jsonFormDslSwitchWidgetSourceData = require("../../../../../fixtures/jsonFormDslSwitchWidgetSourceData.json");
  import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
  const locators = ObjectsRegistry.CommonLocators;
  const {
    deployMode,
    propPane,
  } = require("../../../../../support/Objects/ObjectsCore");
  
  const fieldPrefix = ".t--jsonformfield";
  
  describe(
    "JSON Form Widget Custom Field",
    { tags: ["@tag.Widget", "@tag.JSONForm"] },
    () => {
      it("uses the custom field when the accessor matches", () => {
        const formDsl = JSON.parse(
          JSON.stringify(jsonFormDslSwitchWidgetSourceData),
        );
  
        cy.addDsl(formDsl);
  
        cy.openPropertyPane("jsonformwidget");
  
        // Add new custom field
        cy.get(".t--add-column-btn")
          .contains("Add new field")
          .click({ force: true });
  
        cy.openFieldConfiguration("customField1");
  
        cy.testJsontext("propertyname", "education");
        cy.testJsontext("text", "Education");
        cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Switch");
  
        // check for the position alignment
        cy.get(commonlocators.optionposition).last().click({ force: true });
        cy.get('.t--jsonformfield-customField1.switch')
        .should('have.attr', 'direction', 'row-reverse');
        cy.get(commonlocators.optionpositionL).last().click({ force: true });
        cy.get('.t--jsonformfield-customField1.switch')
        .should('have.attr', 'direction', 'row');
        cy.closePropertyPane();
  
        const sourceData = {
          name: "John",
          email: "john@example.com",
        };
  
        EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
        propPane.NavigateBackToPropertyPane();
        propPane.EnterJSContext("Source data", JSON.stringify(sourceData), true);
  
        cy.get(`${fieldPrefix}-name label`).contains("Name");
        cy.get(`${fieldPrefix}-name input`).should("have.value", "John");
      });
    },
  );
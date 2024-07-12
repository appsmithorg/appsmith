import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const jsonFormDslSwitchWidgetSourceData = require("../../../../../fixtures/jsonFormDslSwitchWidgetSourceData.json");
const { propPane } = require("../../../../../support/Objects/ObjectsCore");

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
      cy.get(commonlocators.jsonFormAddNewCustomFieldBtn).click({
        force: true,
      });

      cy.openFieldConfiguration("customField1");

      cy.testJsontext("propertyname", "education");
      cy.testJsontext("text", "Education");
      cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Switch");

      // check for the position alignment
      cy.get(commonlocators.optionposition).last().click({ force: true });
      cy.get(commonlocators.jsonformFieldCustomFieldSwitch).should(
        "have.attr",
        "direction",
        "row-reverse",
      );
      cy.get(commonlocators.optionpositionL).last().click({ force: true });
      cy.get(commonlocators.jsonformFieldCustomFieldSwitch).should(
        "have.attr",
        "direction",
        "row",
      );
      cy.closePropertyPane();

      const sourceData = {
        name: "John",
        email: "john@example.com",
      };

      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      propPane.NavigateBackToPropertyPane();
      propPane.EnterJSContext("Source data", JSON.stringify(sourceData), true);

      cy.get(`${commonlocators.jsonFieldPrefix} label`).contains("Name");
      cy.get(`${commonlocators.jsonFieldPrefix} input`).should(
        "have.value",
        "John",
      );
    });
  },
);

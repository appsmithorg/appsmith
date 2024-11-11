import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithSchema = require("../../../../../fixtures/jsonFormDslWithSchema.json");
const fieldPrefix = ".t--jsonformfield";
const education = `${fieldPrefix}-education`;
const addButton = ".t--jsonformfield-array-add-btn";
const deleteButton = ".t--jsonformfield-array-delete-btn";
import {
  agHelper,
  deployMode,
  entityExplorer,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "JSON Form Widget Array Field",
  { tags: ["@tag.Widget", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    it("1. can remove default items when default value changes from undefined to an array", () => {
      agHelper.AddDsl("jsonFormDslWithSchemaAndWithoutSourceData");

      const sourceData = {
        name: "John",
        age: 30,
        dob: "10/12/1992",
        migrant: false,
        address: {
          street: "Koramangala",
          city: "Bangalore",
        },
        education: [
          {
            college: "MIT",
            year: "20/10/2014",
          },
        ],
      };

      cy.openPropertyPane("jsonformwidget");
      propPane.EnterJSContext("Source data", JSON.stringify(sourceData), true);

      deployMode.DeployApp();
      cy.get(`${education} ${addButton}`).click({ force: true });
      cy.get(`${education}-item`).should("have.length", 2);

      cy.get(`${education}-item`)
        .last()
        .within(() => {
          cy.get(`${education}-1--college input`).type("Dummy college");
          cy.get(`${education}-1--year input`).type("10/08/2010");
        });

      cy.get(`${education}-item.t--item-0`)
        .find(deleteButton)
        .click({ force: true });

      cy.get(`${education}-item`).should("have.length", 1);

      cy.get(`${education}-item`)
        .last()
        .within(() => {
          cy.get(`${education}-0--college input`).should(
            "have.value",
            "Dummy college",
          );
          cy.get(`${education}-0--year input`).should(
            "have.value",
            "10/08/2010",
          );
        });

      deployMode.NavigateBacktoEditor();
    });

    it("2. can add more items to the field", () => {
      cy.addDsl(dslWithSchema);

      cy.openPropertyPane("jsonformwidget");
      cy.get(locators._jsToggle("sourcedata")).click({ force: true });
      cy.get(`${education}-item`)
        .should("have.length", 1)
        .first()
        .within(() => {
          cy.get(`${education}-0--college input`).should("have.value", "MIT");
          cy.get(`${education}-0--year input`).should(
            "have.value",
            "20/10/2014",
          );
        });

      cy.get(`${education} ${addButton}`).click({ force: true });

      cy.get(`${education}-item`)
        .should("have.length", 2)
        .first()
        .within(() => {
          cy.get(`${education}-0--college input`).should("have.value", "MIT");
          cy.get(`${education}-0--year input`).should(
            "have.value",
            "20/10/2014",
          );
        });

      cy.get(`${education}-item`)
        .should("have.length", 2)
        .last()
        .within(() => {
          cy.get(`${education}-1--college input`).should("have.value", "");
          cy.get(`${education}-1--year input`).should("have.value", "");
        });
    });

    it("3. can remove items from the field", () => {
      cy.get(`${education} ${addButton}`).click({ force: true });
      cy.get(`${education}-item`).should("have.length", 3);

      cy.get(`${education}-item`)
        .eq(1)
        .within(() => {
          cy.get(`${education}-1--college input`).type("Dummy college");
          cy.get(`${education}-1--year input`).type("10/08/2010");
        });

      cy.get(commonlocators.canvas).click({ force: true });

      cy.get(`${education}-item`)
        .eq(2)
        .within(() => {
          cy.get(`${education}-2--college input`).type("Dummy college 2");
          cy.get(`${education}-2--year input`).type("01/01/2020");
        });

      cy.get(commonlocators.canvas).click({ force: true });

      cy.get(`${education}-item.t--item-1`)
        .find(deleteButton)
        .click({ force: true });

      cy.get(`${education}-item`).should("have.length", 2);

      cy.get(`${education}-item`)
        .eq(1)
        .within(() => {
          cy.get(`${education}-1--college input`).should(
            "have.value",
            "Dummy college 2",
          );
          cy.get(`${education}-1--year input`).should(
            "have.value",
            "01/01/2020",
          );
        });
    });

    it("4. can change the visibility of the field", () => {
      cy.get(education).should("exist");
      agHelper.AssertElementExist(education);
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openPropertyPane("jsonformwidget");
      cy.openFieldConfiguration("education");

      // Visible -> false
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(education);
      deployMode.NavigateBacktoEditor();

      // Visible -> true
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("education");

      propPane.TogglePropertyState("Visible", "On");
      agHelper.AssertElementExist(education);
    });

    it("5. disables all underlying field when array field is disabled", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("education");

      // Disable -> true
      propPane.TogglePropertyState("Disabled", "On");
      deployMode.DeployApp();
      cy.get(education)
        .first()
        .within(() => {
          cy.get(`${education}-0--college input`).should(
            "have.attr",
            "disabled",
          );
          cy.get(`${education}-0--year input`).should("have.attr", "disabled");
        });

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("education");
      propPane.TogglePropertyState("Disabled", "Off");
      cy.get(education).should("exist");
      cy.get(education)
        .first()
        .within(() => {
          cy.get(`${education}-0--college input`).should(
            "not.have.attr",
            "disabled",
          );
          cy.get(`${education}-0--year input`).should(
            "not.have.attr",
            "disabled",
          );
        });
    });

    it("6. disables add new and remove buttons when array field is disabled", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("education");

      let initialNoOfItems = 0;
      cy.get(`${education}-item`).then(($items) => {
        initialNoOfItems = $items.length;
      });

      // Disable -> true
      propPane.TogglePropertyState("Disabled", "On");
      deployMode.DeployApp();
      cy.get(`${education} ${addButton}`).should("have.attr", "disabled");
      cy.get(`${education} ${addButton}`).should("have.attr", "disabled");

      // Click add button
      cy.get(`${education} ${addButton}`).click({ force: true });
      cy.get(`${education}-item`).then(($items) => {
        expect($items.length).equal(initialNoOfItems);
      });
      // Click remove button
      cy.get(`${education} ${deleteButton}`).last().click({ force: true });
      cy.get(`${education}-item`).then(($items) => {
        expect($items.length).equal(initialNoOfItems);
      });

      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("education");
      propPane.TogglePropertyState("Disabled", "Off");

      deployMode.DeployApp();
      // Disable -> false
      cy.get(addButton).should("not.have.attr", "disabled");
      cy.get(deleteButton).should("not.have.attr", "disabled");
      // Click add button
      cy.get(`${education} ${addButton}`).click({ force: true });
      cy.get(`${education}-item`).then(($items) => {
        expect($items.length).equal(initialNoOfItems + 1);
      });
      // Click remove button
      cy.get(`${education} ${deleteButton}`).last().click({ force: true });
      cy.get(`${education}-item`).then(($items) => {
        expect($items.length).equal(initialNoOfItems);
      });
      deployMode.NavigateBacktoEditor();
    });

    it("7. should not render field level default value if form level is present", () => {
      const collegeFieldDefaultValue = "College default value";

      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);

      cy.openFieldConfiguration("education")
        .openFieldConfiguration("__array_item__", false)
        .openFieldConfiguration("college", false);

      // Modify default text of eductation -> college field
      cy.testJsontext("defaultvalue", collegeFieldDefaultValue);
      cy.closePropertyPane();
      cy.get(`${education}-item`)
        .should("have.length", 1)
        .first()
        .within(() => {
          cy.get(`${education}-0--college input`).should("have.value", "MIT");
          cy.get(`${education}-0--year input`).should(
            "have.value",
            "20/10/2014",
          );
        });

      // Add new item to education array
      cy.get(`${education} ${addButton}`).click({ force: true });

      cy.get(`${education}-item`)
        .should("have.length", 2)
        .first()
        .within(() => {
          cy.get(`${education}-0--college input`).should("have.value", "MIT");
          cy.get(`${education}-0--year input`).should(
            "have.value",
            "20/10/2014",
          );
        });
      cy.get(`${education}-item`)
        .should("have.length", 2)
        .last()
        .within(() => {
          cy.get(`${education}-1--college input`).should(
            "have.value",
            collegeFieldDefaultValue,
          );
          cy.get(`${education}-1--year input`).should("have.value", "");
        });
    });

    it("8. phone input dropdown should update the selected value", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("education");
      cy.openFieldConfiguration("__array_item__", false);

      // Add new custom field
      cy.get(
        ".t--property-control-fieldconfiguration .t--add-column-btn",
      ).click({
        force: true,
      });

      cy.openFieldConfiguration("customField1", false);
      cy.selectDropdownValue(
        commonlocators.jsonFormFieldType,
        /^Phone Number Input/,
      );

      // Enable Allow Country Code Change
      agHelper.CheckUncheck(commonlocators.allowcountrycodechangeInput);
      // Change the label of the field to Phone Number
      cy.testJsontext("text", "Phone Number");

      deployMode.DeployApp();
      // Open country code dropdown and select +91
      cy.get(".t--input-country-code-change").first().click();
      cy.get(".t--search-input input").type("+91");
      cy.wait(500);
      cy.get(".t--dropdown-option").contains("+91").click({ force: true });

      cy.get(".t--input-country-code-change").should("contain", "🇮🇳+91");
      deployMode.NavigateBacktoEditor();
    });

    it("9. currency input dropdown should update the selected value", () => {
      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      cy.openFieldConfiguration("education");
      cy.openFieldConfiguration("__array_item__", false);

      // Add new custom field
      cy.get(
        ".t--property-control-fieldconfiguration .t--add-column-btn",
      ).click({
        force: true,
      });

      cy.openFieldConfiguration("customField1", false);
      cy.selectDropdownValue(
        commonlocators.jsonFormFieldType,
        /^Currency Input/,
      );

      // Enable Allow Country Code Change
      agHelper.CheckUncheck(commonlocators.allowCurrencyChange);
      // Change the label of the field to Phone Number
      cy.testJsontext("text", "Currency");

      deployMode.DeployApp();
      // Open country code dropdown and select gbp
      cy.get(".t--input-currency-change").first().click();
      cy.get(".t--search-input input").type("gbp");
      cy.wait(500);
      cy.get(".t--dropdown-option").first().click();

      cy.get(".t--input-currency-change").should("contain", "£");
    });
  },
);

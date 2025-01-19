const dslWithSchema = require("../../../../../fixtures/jsonFormDslWithSchema.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

const fieldPrefix = ".t--jsonformfield";
const propertyControlPrefix = ".t--property-control";
let backBtn = "[data-testid='t--property-pane-back-btn']";

import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;
const locators = ObjectsRegistry.CommonLocators;

describe(
  "JSON Form Widget Form Bindings",
  { tags: ["@tag.All", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
      cy.addDsl(dslWithSchema);
      cy.openPropertyPane("jsonformwidget");
      cy.get(locators._jsToggle("sourcedata")).click({ force: true });
    });

    it("1. updates formData when field value changes", () => {
      const expectedInitialFormData = {
        age: 30,
        dob: "10/12/1992",
        migrant: false,
        address: { street: "Koramangala", city: "Bangalore" },
        hobbies: ["travelling", "swimming"],
        education: [{ college: "MIT", year: "20/10/2014" }],
        name: "John",
      };
      const updatedFormData = {
        age: 40,
        dob: "10/12/1992",
        migrant: false,
        address: { street: "Indranagar", city: "Bangalore" },
        hobbies: ["travelling"],
        education: [{ college: "IIT", year: "20/10/2014" }],
        name: "Test",
      };
      // Bind formData to Text1 widget text property
      cy.openPropertyPane("textwidget");
      cy.testJsontext("text", "{{JSON.stringify(JSONForm1.formData)}}");
      cy.closePropertyPane();

      // Validate initial form data
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).then(($el) => {
        const formData = JSON.parse($el.text());
        cy.wrap(formData).should("deep.equal", expectedInitialFormData);
      });

      // Modify form field values
      cy.get(`${fieldPrefix}-name input`)
        .clear({ force: true })
        .type(updatedFormData.name);
      cy.get(`${fieldPrefix}-age input`)
        .clear({ force: true })
        .clear({ force: true })
        .type(updatedFormData.age);
      cy.get(`${fieldPrefix}-address-street input`)
        .clear({ force: true })
        .type(updatedFormData.address.street);
      cy.get(`${fieldPrefix}-hobbies .rc-select-selection-item`)
        .contains("swimming")
        .siblings(".rc-select-selection-item-remove")
        .click({ force: true });
      cy.get(`${fieldPrefix}-education-0--college input`)
        .clear({ force: true })
        .type(updatedFormData.education[0].college)
        .wait(200);

      cy.wait(1000);
      // Check if modified text updates formData
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).then(($el) => {
        const formData = JSON.parse($el.text());
        cy.wrap(formData).should("deep.equal", updatedFormData);
      });
    });

    it("2. updates fieldState", () => {
      const expectedInitialFieldState = {
        name: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
        },
        age: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
        },
        dob: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
        },
        migrant: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
          isValid: true,
        },
        address: {
          street: {
            isDisabled: false,
            isVisible: true,
            isRequired: false,
            isValid: true,
          },
          city: {
            isDisabled: false,
            isVisible: true,
            isRequired: false,
            isValid: true,
          },
        },
        education: [
          {
            college: {
              isDisabled: false,
              isVisible: true,
              isRequired: false,
              isValid: true,
            },
            year: {
              isDisabled: false,
              isVisible: true,
              isRequired: false,
              isValid: true,
            },
          },
        ],
        hobbies: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
          filterText: "",
        },
      };

      const expectedUpdatedFieldState = {
        name: {
          isDisabled: false,
          isVisible: true,
          isRequired: true,
          isValid: false,
        },
        age: {
          isDisabled: true,
          isVisible: true,
          isRequired: false,
          isValid: true,
        },
        dob: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
        },
        migrant: {
          isDisabled: false,
          isVisible: false,
          isRequired: false,
          isValid: true,
        },
        address: {
          street: {
            isDisabled: false,
            isVisible: true,
            isRequired: true,
            isValid: false,
          },
          city: {
            isDisabled: false,
            isVisible: true,
            isRequired: false,
            isValid: true,
          },
        },
        education: [
          {
            college: {
              isDisabled: false,
              isVisible: true,
              isRequired: true,
              isValid: false,
            },
            year: {
              isDisabled: false,
              isVisible: false,
              isRequired: false,
              isValid: true,
            },
          },
        ],
        hobbies: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
          filterText: "",
        },
      };

      cy.openPropertyPane("textwidget");
      cy.get(".t--property-control-text .CodeMirror textarea").first().clear({
        force: true,
      });
      cy.testJsontext("text", "{{JSON.stringify(JSONForm1.fieldState)}}");
      cy.closePropertyPane();

      cy.wait(3000);

      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).then(($el) => {
        const formData = JSON.parse($el.text());
        cy.wrap(formData).should("deep.equal", expectedInitialFieldState);
      });

      cy.openPropertyPane("jsonformwidget");

      // name.required -> true
      cy.openFieldConfiguration("name");
      agHelper.CheckUncheck(`${propertyControlPrefix}-required input`);
      cy.get(backBtn).click({ force: true }).wait(500);

      // age.disabled -> true
      cy.openFieldConfiguration("age");
      agHelper.CheckUncheck(`${propertyControlPrefix}-disabled input`);
      cy.get(backBtn).click({ force: true }).wait(500);

      // migrant.visible -> false
      cy.openFieldConfiguration("migrant", false);
      agHelper.CheckUncheck(`${propertyControlPrefix}-visible input`, false);
      cy.get(backBtn).click({ force: true }).wait(500);

      // address.street.required -> true
      cy.openFieldConfiguration("address", false);
      cy.openFieldConfiguration("street", false);
      agHelper.CheckUncheck(`${propertyControlPrefix}-required input`);
      cy.get(backBtn).click({ force: true }).wait(500);
      cy.get(backBtn).click({ force: true }).wait(500);

      // education.college.required -> true
      // education.year.visible -> false
      cy.openFieldConfiguration("education");
      cy.openFieldConfiguration("__array_item__", false);
      cy.openFieldConfiguration("college", false);
      agHelper.CheckUncheck(`${propertyControlPrefix}-required input`);
      cy.get(backBtn).click({ force: true }).wait(500);
      cy.openFieldConfiguration("year", false);
      agHelper.CheckUncheck(`${propertyControlPrefix}-visible input`, false);
      cy.get(backBtn).click({ force: true }).wait(500);

      cy.closePropertyPane();

      cy.get(`${fieldPrefix}-name input`).clear({ force: true });
      cy.get(`${fieldPrefix}-address-street input`).clear({ force: true });
      cy.get(`${fieldPrefix}-address-city input`).clear({ force: true });
      cy.get(`${fieldPrefix}-education-0--college input`)
        .clear({ force: true })
        .wait(500);

      cy.wait(3000);

      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).then(($el) => {
        const formState = JSON.parse($el.text());
        cy.wrap(formState).should("deep.equal", expectedUpdatedFieldState);
      });
    });

    it("3. change field accessor should reflect in fieldState", () => {
      const expectedFieldStateChange = {
        firstName: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
        },
        age: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
        },
        dob: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
        },
        migrant: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
        },
        address: {
          street: {
            isDisabled: false,
            isVisible: true,
            isRequired: false,
            isValid: true,
          },
          city: {
            isDisabled: false,
            isVisible: true,
            isRequired: false,
            isValid: true,
          },
        },
        education: [
          {
            graduatingCollege: {
              isDisabled: false,
              isVisible: true,
              isRequired: false,
              isValid: true,
            },
            year: {
              isDisabled: false,
              isVisible: true,
              isRequired: false,
              isValid: true,
            },
          },
        ],
        hobbies: {
          isDisabled: false,
          isVisible: true,
          isRequired: false,
          isValid: true,
          filterText: "",
        },
      };

      cy.openPropertyPane("textwidget");
      cy.get(".t--property-control-text .CodeMirror textarea").first().clear({
        force: true,
      });
      cy.testJsontext("text", "{{JSON.stringify(JSONForm1.fieldState)}}");

      cy.openPropertyPane("jsonformwidget");

      // Change accessor name -> firstName
      cy.openFieldConfiguration("name");
      cy.testJsontext("propertyname", "firstName");
      cy.wait(1000);

      cy.get(backBtn).click({ force: true }).wait(500);

      // Change accessor education -> college to education -> graduatingCollege
      cy.openFieldConfiguration("education", false);
      cy.openFieldConfiguration("__array_item__", false);
      cy.openFieldConfiguration("college", false);
      cy.testJsontext("propertyname", "graduatingCollege");

      cy.wait(5000);

      // Verify if formState reflects accessor change
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).then(($el) => {
        const formState = JSON.parse($el.text());
        cy.wrap(formState).should("deep.equal", expectedFieldStateChange);
      });
    });

    it("4. change field accessor should reflect in formData", () => {
      const expectedFormDataChange = {
        age: 30,
        dob: "10/12/1992",
        migrant: false,
        address: { street: "Koramangala", city: "Bangalore" },
        hobbies: ["travelling", "swimming"],
        education: [{ graduatingCollege: "MIT", year: "20/10/2014" }],
        firstName: "John",
      };

      cy.openPropertyPane("jsonformwidget");

      // Change accessor name -> firstName
      cy.openFieldConfiguration("name");
      cy.testJsontext("propertyname", "firstName");
      cy.wait(1000);

      cy.get(backBtn).click({ force: true }).wait(500);

      // Change accessor education -> college to education -> graduatingCollege
      cy.openFieldConfiguration("education");
      cy.openFieldConfiguration("__array_item__", false);
      cy.openFieldConfiguration("college", false);
      cy.testJsontext("propertyname", "graduatingCollege");

      cy.wait(5000);

      cy.openPropertyPane("textwidget");
      cy.testJsontext("text", "{{JSON.stringify(JSONForm1.formData)}}");

      cy.wait(1000);

      // Verify if formData reflects accessor change
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).then(($el) => {
        const formData = JSON.parse($el.text());
        cy.wrap(formData).should("deep.equal", expectedFormDataChange);
      });
    });
  },
);

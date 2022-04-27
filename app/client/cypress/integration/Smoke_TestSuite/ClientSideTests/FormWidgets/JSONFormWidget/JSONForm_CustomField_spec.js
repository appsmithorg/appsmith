const commonlocators = require("../../../../../locators/commonlocators.json");
const jsonFormDslWithSchemaAndWithoutSourceData = require("../../../../../fixtures/jsonFormDslWithSchemaAndWithoutSourceData.json");

const fieldPrefix = ".t--jsonformfield";

describe("JSON Form Widget Custom Field", () => {
  it("uses the custom field when the accessor matches", () => {
    const formDsl = JSON.parse(
      JSON.stringify(jsonFormDslWithSchemaAndWithoutSourceData),
    );

    cy.addDsl(formDsl);

    cy.openPropertyPane("jsonformwidget");

    // Add new custom field
    cy.get(".t--property-pane-section-general button")
      .contains("Add a new field")
      .click({ force: true });

    cy.openFieldConfiguration("customField1");

    cy.testJsontext("propertyname", "gender");
    cy.testJsontext("label", "Gender");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Select");
    cy.closePropertyPane();

    const sourceData = {
      name: "John",
      age: 30,
      dob: "10/12/1992",
      migrant: false,
      gender: "male",
      address: {
        street: "Koramangala",
        city: "Bangalore",
        state: "Karnataka",
      },
      education: [
        {
          college: "MIT",
          year: "20/10/2014",
          course: "CS",
        },
      ],
    };

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(sourceData));

    cy.wait(500);

    cy.get(`${fieldPrefix}-name label`).contains("Name");
    cy.get(`${fieldPrefix}-name input`).should("have.value", "John");

    cy.get(`${fieldPrefix}-age label`).contains("Age");
    cy.get(`${fieldPrefix}-age input`).should("have.value", 30);

    cy.get(`${fieldPrefix}-dob label`).contains("Dob");
    cy.get(`${fieldPrefix}-dob input`).should("have.value", "10/12/1992");

    cy.get(`${fieldPrefix}-customField1 label`).contains("Gender");
    cy.get(`${fieldPrefix}-customField1 .bp3-popover-wrapper`).should("exist");

    cy.get(`${fieldPrefix}-migrant label`).contains("Migrant");
    cy.get(`${fieldPrefix}-migrant .t--switch-widget-inactive`).should("exist");

    cy.get(`${fieldPrefix}-address`)
      .find("label")
      .should("have.length", 4);
    cy.get(`${fieldPrefix}-address-street label`).contains("Street");
    cy.get(`${fieldPrefix}-address-street input`).should(
      "have.value",
      "Koramangala",
    );

    cy.get(`${fieldPrefix}-address-city label`).contains("City");
    cy.get(`${fieldPrefix}-address-city input`).should(
      "have.value",
      "Bangalore",
    );

    cy.get(`${fieldPrefix}-address-state label`).contains("State");
    cy.get(`${fieldPrefix}-address-state input`).should(
      "have.value",
      "Karnataka",
    );

    cy.get(`${fieldPrefix}-education label`).should("have.length", 4);

    cy.get(`${fieldPrefix}-education-0--college label`).contains("College");
    cy.get(`${fieldPrefix}-education-0--college input`).should(
      "have.value",
      "MIT",
    );

    cy.get(`${fieldPrefix}-education-0--year label`).contains("Year");
    cy.get(`${fieldPrefix}-education-0--year input`).should(
      "have.value",
      "20/10/2014",
    );

    cy.get(`${fieldPrefix}-education-0--course label`).contains("Course");
    cy.get(`${fieldPrefix}-education-0--course input`).should(
      "have.value",
      "CS",
    );
  });
});

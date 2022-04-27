const dslWithSchema = require("../../../../../fixtures/jsonFormDslWithSchema.json");

const fieldPrefix = ".t--jsonformfield";

describe("JSON Form reset", () => {
  beforeEach(() => {
    cy.addDsl(dslWithSchema);
  });

  it("updates formData when field value changes", () => {
    const initialFormData = {
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

    // Verify current field values
    cy.get(`${fieldPrefix}-name input`).should(
      "have.value",
      initialFormData.name,
    );
    cy.get(`${fieldPrefix}-age input`).should(
      "have.value",
      initialFormData.age,
    );
    cy.get(`${fieldPrefix}-dob input`).should(
      "have.value",
      initialFormData.dob,
    );
    cy.get(`${fieldPrefix}-address-street input`).should(
      "have.value",
      initialFormData.address.street,
    );
    cy.get(`${fieldPrefix}-address-city input`).should(
      "have.value",
      initialFormData.address.city,
    );
    cy.get(`${fieldPrefix}-education-0--college input`).should(
      "have.value",
      initialFormData.education[0].college,
    );
    cy.get(`${fieldPrefix}-education-0--year input`).should(
      "have.value",
      initialFormData.education[0].year,
    );

    // Modify field values
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

    // Verify new field values
    cy.get(`${fieldPrefix}-name input`).should(
      "have.value",
      updatedFormData.name,
    );
    cy.get(`${fieldPrefix}-age input`).should(
      "have.value",
      updatedFormData.age,
    );
    cy.get(`${fieldPrefix}-dob input`).should(
      "have.value",
      updatedFormData.dob,
    );
    cy.get(`${fieldPrefix}-address-street input`).should(
      "have.value",
      updatedFormData.address.street,
    );
    cy.get(`${fieldPrefix}-address-city input`).should(
      "have.value",
      updatedFormData.address.city,
    );
    cy.get(`${fieldPrefix}-education-0--college input`).should(
      "have.value",
      updatedFormData.education[0].college,
    );
    cy.get(`${fieldPrefix}-education-0--year input`).should(
      "have.value",
      updatedFormData.education[0].year,
    );

    // Reset form
    cy.get("button")
      .contains("Reset")
      .parent("button")
      .click({ force: true });

    // Verify initial field values
    cy.get(`${fieldPrefix}-name input`).should(
      "have.value",
      initialFormData.name,
    );
    cy.get(`${fieldPrefix}-age input`).should(
      "have.value",
      initialFormData.age,
    );
    cy.get(`${fieldPrefix}-dob input`).should(
      "have.value",
      initialFormData.dob,
    );
    cy.get(`${fieldPrefix}-address-street input`).should(
      "have.value",
      initialFormData.address.street,
    );
    cy.get(`${fieldPrefix}-address-city input`).should(
      "have.value",
      initialFormData.address.city,
    );
    cy.get(`${fieldPrefix}-education-0--college input`).should(
      "have.value",
      initialFormData.education[0].college,
    );
    cy.get(`${fieldPrefix}-education-0--year input`).should(
      "have.value",
      initialFormData.education[0].year,
    );
  });
});

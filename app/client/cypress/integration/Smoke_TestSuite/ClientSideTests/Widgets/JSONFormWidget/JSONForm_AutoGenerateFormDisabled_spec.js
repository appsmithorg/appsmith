const jsonFormDslWithSchemaAndWithoutSourceData = require("../../../../../fixtures/jsonFormDslWithSchemaAndWithoutSourceData.json");

const fieldPrefix = ".t--jsonformfield";

describe("JSON Form Widget AutoGenerate Disabled", () => {
  it("generates fields with valid source data json", () => {
    const formDsl = JSON.parse(
      JSON.stringify(jsonFormDslWithSchemaAndWithoutSourceData),
    );

    cy.addDsl(formDsl);

    cy.openPropertyPane("jsonformwidget");

    cy.togglebarDisable(`.t--property-control-autogenerateform input`);

    const sourceData = {
      name: "John",
      age: 30,
      dob: "10/12/1992",
      migrant: false,
      gender: "male",
      address: {
        street: "Koramangala",
        city: "Bangalore",
        state: "State",
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
    cy.closePropertyPane();

    // Fields that should exist
    cy.get(`${fieldPrefix}-name label`).contains("Name");
    cy.get(`${fieldPrefix}-name input`).then((input) => {
      cy.wrap(input).should("have.value", "John");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-age label`).contains("Age");
    cy.get(`${fieldPrefix}-age input`).then((input) => {
      cy.wrap(input).should("have.value", 30);
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-dob label`).contains("Dob");
    cy.get(`${fieldPrefix}-dob input`).then((input) => {
      cy.wrap(input).should("have.value", "10/12/1992");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-migrant label`).contains("Migrant");
    cy.get(`${fieldPrefix}-migrant .t--switch-widget-inactive`).should("exist");

    cy.get(`${fieldPrefix}-address`)
      .find("label")
      .should("have.length", 3);
    cy.get(`${fieldPrefix}-address-street label`).contains("Street");
    cy.get(`${fieldPrefix}-address-street input`).then((input) => {
      cy.wrap(input).should("have.value", "Koramangala");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-address-city label`).contains("City");
    cy.get(`${fieldPrefix}-address-city input`).then((input) => {
      cy.wrap(input).should("have.value", "Bangalore");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-education label`).should("have.length", 3);

    cy.get(`${fieldPrefix}-education-0--college label`).contains("College");
    cy.get(`${fieldPrefix}-education-0--college input`).then((input) => {
      cy.wrap(input).should("have.value", "MIT");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-education-0--year label`).contains("Year");
    cy.get(`${fieldPrefix}-education-0--year input`).then((input) => {
      cy.wrap(input).should("have.value", "20/10/2014");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(
      `${fieldPrefix}-education .t--jsonformfield-array-delete-btn .t--text`,
    ).should("have.text", "Delete");
    cy.get(
      `${fieldPrefix}-education .t--jsonformfield-array-add-btn .t--text`,
    ).should("have.text", "Add New");

    /**
     * Fields that shouldn't exist
     *  */
    cy.get(`${fieldPrefix}-gender label`).should("not.exist");
    cy.get(`${fieldPrefix}-gender input`).should("not.exist");

    cy.get(`${fieldPrefix}-address-state label`).should("not.exist");
    cy.get(`${fieldPrefix}-address-state input`).should("not.exist");

    cy.get(`${fieldPrefix}-education-0--course label`).should("not.exist");
    cy.get(`${fieldPrefix}-education-0--course input`).should("not.exist");
  });

  it("modifies field when generate form button is pressed", () => {
    const formDsl = JSON.parse(
      JSON.stringify(jsonFormDslWithSchemaAndWithoutSourceData),
    );

    cy.addDsl(formDsl);

    cy.openPropertyPane("jsonformwidget");

    cy.togglebarDisable(`.t--property-control-autogenerateform input`);

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

    cy.get(".t--property-pane-section-general button")
      .contains("Generate Form")
      .click({ force: true });
    cy.closePropertyPane();

    cy.get(`${fieldPrefix}-name label`).contains("Name");
    cy.get(`${fieldPrefix}-name input`).should("have.value", "John");

    cy.get(`${fieldPrefix}-age label`).contains("Age");
    cy.get(`${fieldPrefix}-age input`).should("have.value", 30);

    cy.get(`${fieldPrefix}-dob label`).contains("Dob");
    cy.get(`${fieldPrefix}-dob input`).should("have.value", "10/12/1992");

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

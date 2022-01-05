const dsl = require("../../../../fixtures/jsonFormDsl.json");

describe("New JSON Form Widget Functionality", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("generates fields with valid source data json", () => {
    const sourceData = {
      name: "John",
      age: 30,
      dob: "10/12/1992",
      migrant: false,
      address: {
        line1: "Koramangala",
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
    cy.testJsontext("sourcedata", JSON.stringify(sourceData));
  });
});

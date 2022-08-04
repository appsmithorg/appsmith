const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithSchema = require("../../../../../fixtures/jsonFormDslWithSchema.json");
const jsonFormDslWithSchemaAndWithoutSourceData = require("../../../../../fixtures/jsonFormDslWithSchemaAndWithoutSourceData.json");

const fieldPrefix = ".t--jsonformfield";
const education = `${fieldPrefix}-education`;
const addButton = ".t--jsonformfield-array-add-btn";
const deleteButton = ".t--jsonformfield-array-delete-btn";

describe("JSON Form Widget Array Field", () => {
  it("can remove default items when default value changes from undefined to an array", () => {
    cy.addDsl(jsonFormDslWithSchemaAndWithoutSourceData);

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
    cy.testJsontext("sourcedata", JSON.stringify(sourceData));
    cy.closePropertyPane();

    cy.get(`${education} ${addButton}`).click({ force: true });
    cy.get(`${education}-item`).should("have.length", 2);

    cy.get(`${education}-item`).within(() => {
      cy.get(`${education}-1--college input`).type("Dummy college");
      cy.get(`${education}-1--year input`).type("10/08/2010");
    });

    cy.get(`${education}-item.t--item-0`)
      .find(deleteButton)
      .click({ force: true });

    cy.get(`${education}-item`).should("have.length", 1);

    cy.get(`${education}-item`).within(() => {
      cy.get(`${education}-0--college input`).should(
        "have.value",
        "Dummy college",
      );
      cy.get(`${education}-0--year input`).should("have.value", "10/08/2010");
    });
  });

  it("can add more items to the field", () => {
    cy.addDsl(dslWithSchema);

    cy.openPropertyPane("jsonformwidget");

    cy.get(`${education}-item`)
      .should("have.length", 1)
      .within(() => {
        cy.get(`${education}-0--college input`).should("have.value", "MIT");
        cy.get(`${education}-0--year input`).should("have.value", "20/10/2014");
      });

    cy.get(`${education} ${addButton}`).click({ force: true });

    cy.get(`${education}-item`)
      .should("have.length", 2)
      .within(() => {
        cy.get(`${education}-0--college input`).should("have.value", "MIT");
        cy.get(`${education}-0--year input`).should("have.value", "20/10/2014");
        cy.get(`${education}-1--college input`).should("have.value", "");
        cy.get(`${education}-1--year input`).should("have.value", "");
      });
  });

  it("can remove items from the field", () => {
    cy.get(`${education} ${addButton}`).click({ force: true });
    cy.get(`${education}-item`).should("have.length", 3);

    cy.get(`${education}-item`).within(() => {
      cy.get(`${education}-1--college input`).type("Dummy college");
      cy.get(`${education}-1--year input`).type("10/08/2010");
    });

    cy.get(commonlocators.canvas).click({ force: true });

    cy.get(`${education}-item`).within(() => {
      cy.get(`${education}-2--college input`).type("Dummy college 2");
      cy.get(`${education}-2--year input`).type("01/01/2020");
    });

    cy.get(commonlocators.canvas).click({ force: true });

    cy.get(`${education}-item.t--item-1`)
      .find(deleteButton)
      .click({ force: true });

    cy.get(`${education}-item`).should("have.length", 2);

    cy.get(`${education}-item`).within(() => {
      cy.get(`${education}-1--college input`).should(
        "have.value",
        "Dummy college 2",
      );
      cy.get(`${education}-1--year input`).should("have.value", "01/01/2020");
    });
  });

  it("can change the visibility of the field", () => {
    cy.get(education).should("exist");

    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("education");

    // Visible -> false
    cy.togglebarDisable(".t--property-control-visible input");
    cy.get(education).should("not.exist");

    // Visible -> true
    cy.togglebar(".t--property-control-visible input");
    cy.get(education).should("exist");
  });

  it("disables all underlying field when array field is disabled", () => {
    cy.closePropertyPane();
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("education");

    // Disable -> true
    cy.togglebar(".t--property-control-disabled input");
    cy.get(education).within(() => {
      cy.get(`${education}-0--college input`).should("have.attr", "disabled");
      cy.get(`${education}-0--year input`).should("have.attr", "disabled");
    });

    // Disable -> false
    cy.togglebarDisable(".t--property-control-disabled input");
    cy.get(education).should("exist");
    cy.get(education).within(() => {
      cy.get(`${education}-0--college input`).should(
        "not.have.attr",
        "disabled",
      );
      cy.get(`${education}-0--year input`).should("not.have.attr", "disabled");
    });
  });

  it("disables add new and remove buttons when array field is disabled", () => {
    cy.closePropertyPane();
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("education");

    let initialNoOfItems = 0;
    cy.get(`${education}-item`).then(($items) => {
      initialNoOfItems = $items.length;
    });

    // Disable -> true
    cy.togglebar(".t--property-control-disabled input");
    cy.get(`${education} ${addButton}`).should("have.attr", "disabled");
    cy.get(`${education} ${addButton}`).should("have.attr", "disabled");

    // Click add button
    cy.get(`${education} ${addButton}`).click({ force: true });
    cy.get(`${education}-item`).then(($items) => {
      expect($items.length).equal(initialNoOfItems);
    });
    // Click remove button
    cy.get(`${education} ${deleteButton}`)
      .last()
      .click({ force: true });
    cy.get(`${education}-item`).then(($items) => {
      expect($items.length).equal(initialNoOfItems);
    });

    // Disable -> false
    cy.togglebarDisable(".t--property-control-disabled input");
    cy.get(addButton).should("not.have.attr", "disabled");
    cy.get(deleteButton).should("not.have.attr", "disabled");
    // Click add button
    cy.get(`${education} ${addButton}`).click({ force: true });
    cy.get(`${education}-item`).then(($items) => {
      expect($items.length).equal(initialNoOfItems + 1);
    });
    // Click remove button
    cy.get(`${education} ${deleteButton}`)
      .last()
      .click({ force: true });
    cy.get(`${education}-item`).then(($items) => {
      expect($items.length).equal(initialNoOfItems);
    });
  });

  it("should not render field level default value if form level is present", () => {
    const collegeFieldDefaultValue = "College default value";

    cy.closePropertyPane();
    cy.openPropertyPane("jsonformwidget");

    cy.openFieldConfiguration("education")
      .openFieldConfiguration("__array_item__")
      .openFieldConfiguration("college");

    // Modify default text of eductation -> college field
    cy.testJsontext("defaultvalue", collegeFieldDefaultValue);
    cy.closePropertyPane();
    cy.get(`${education}-item`)
      .should("have.length", 1)
      .within(() => {
        cy.get(`${education}-0--college input`).should("have.value", "MIT");
        cy.get(`${education}-0--year input`).should("have.value", "20/10/2014");
      });

    // Add new item to education array
    cy.get(`${education} ${addButton}`).click({ force: true });

    cy.get(`${education}-item`)
      .should("have.length", 2)
      .within(() => {
        cy.get(`${education}-0--college input`).should("have.value", "MIT");
        cy.get(`${education}-0--year input`).should("have.value", "20/10/2014");
        cy.get(`${education}-1--college input`).should(
          "have.value",
          collegeFieldDefaultValue,
        );
        cy.get(`${education}-1--year input`).should("have.value", "");
      });
  });

  it("phone input dropdown should update the selected value", () => {
    cy.closePropertyPane();
    cy.openPropertyPane("jsonformwidget");

    cy.openFieldConfiguration("education");
    cy.openFieldConfiguration("__array_item__");

    // Add new custom field
    cy.get(".t--property-pane-section-general button")
      .contains("Add a new field")
      .click({ force: true });

    cy.openFieldConfiguration("customField1");
    cy.selectDropdownValue(
      commonlocators.jsonFormFieldType,
      /^Phone Number Input/,
    );

    // Enable Allow Country Code Change
    cy.togglebar(
      ".t--property-control-allowcountrycodechange input[type='checkbox']",
    );
    // Change the label of the field to Phone Number
    cy.testJsontext("label", "Phone Number");

    // Open country code dropdown and select +91
    cy.get(".t--input-country-code-change")
      .first()
      .click();
    cy.get(".t--search-input input").type("+91");
    cy.wait(500);
    cy.get(".t--dropdown-option")
      .last()
      .click();

    cy.get(".t--input-country-code-change").should("contain", "🇮🇳+91");
  });

  it("currency input dropdown should update the selected value", () => {
    cy.closePropertyPane();
    cy.openPropertyPane("jsonformwidget");

    cy.openFieldConfiguration("education");
    cy.openFieldConfiguration("__array_item__");

    // Add new custom field
    cy.get(".t--property-pane-section-general button")
      .contains("Add a new field")
      .click({ force: true });

    cy.openFieldConfiguration("customField1");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Currency Input/);

    // Enable Allow Country Code Change
    cy.togglebar(
      ".t--property-control-allowcurrencychange input[type='checkbox']",
    );
    // Change the label of the field to Phone Number
    cy.testJsontext("label", "Currency");

    // Open country code dropdown and select gbp
    cy.get(".t--input-currency-change")
      .first()
      .click();
    cy.get(".t--search-input input").type("gbp");
    cy.wait(500);
    cy.get(".t--dropdown-option")
      .first()
      .click();

    cy.get(".t--input-currency-change").should("contain", "£");
  });
});

/**
 * Spec to test the events made available by each field type
 */

const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetLocators = require("../../../../../locators/Widgets.json");

const fieldPrefix = ".t--jsonformfield";

const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;

describe("Radio Group Field", () => {
  before(() => {
    const schema = {
      answer: "Y",
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("answer");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, "Radio Group");
    cy.closePropertyPane();
  });

  it("shows alert on optionChange", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("answer");

    // Enable JS mode for onSelectionChange
    cy.get(toggleJSButton("onselectionchange")).click({ force: true });

    // Add onSelectionChange action
    cy.testJsontext("onselectionchange", "{{showAlert(formData.answer)}}");

    cy.get(`${fieldPrefix}-answer`)
      .find("label")
      .contains("No")
      .click({ force: true });

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("N");
  });
});

describe("Multiselect Field", () => {
  before(() => {
    const schema = {
      colors: ["BLUE"],
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.closePropertyPane();
  });

  it("shows updated formData values in onOptionChange binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("colors");

    // Enable JS mode for onOptionChange
    cy.get(toggleJSButton("onoptionchange")).click({ force: true });

    // Add onOptionChange action
    cy.testJsontext(
      "onoptionchange",
      "{{showAlert(formData.colors.join(', '))}}",
    );

    // Click on multiselect field
    cy.get(`${fieldPrefix}-colors`)
      .find(".rc-select-selection-search-input")
      .first()
      .focus({ force: true })
      .type("{uparrow}", { force: true });
    cy.dropdownMultiSelectDynamic("Red");

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("BLUE, RED");
  });
});

describe("Select Field", () => {
  before(() => {
    const schema = {
      color: "BLUE",
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("color");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Select/);
    cy.closePropertyPane();
  });

  it("shows updated formData values in onOptionChange binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("color");

    // Enable JS mode for onOptionChange
    cy.get(toggleJSButton("onoptionchange")).click({ force: true });

    // Add onOptionChange action
    cy.testJsontext("onoptionchange", "{{showAlert(formData.color)}}");

    // Click on select field
    cy.get(`${fieldPrefix}-color`)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });

    // Select "Red" option
    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("Red")
      .click({ force: true });

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("RED");
  });
});

describe("Input Field", () => {
  before(() => {
    const schema = {
      name: "John",
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.closePropertyPane();
  });

  it("shows updated formData values in onOptionChange binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("name");

    // Enable JS mode for onTextChanged
    cy.get(toggleJSButton("ontextchanged")).click({ force: true });

    // Add onTextChanged action
    cy.testJsontext("ontextchanged", "{{showAlert(formData.name)}}");

    // Change input value
    cy.get(`${fieldPrefix}-name`).type(" Doe");

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("John Doe");
  });
});

describe("Checkbox Field", () => {
  before(() => {
    const schema = {
      agree: true,
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("agree");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Checkbox/);
    cy.closePropertyPane();
  });

  it("shows updated formData values in onChange binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("agree");

    // Enable JS mode for onCheckChange
    cy.get(toggleJSButton("oncheckchange")).click({ force: true });

    // Add onCheckChange action
    cy.testJsontext(
      "oncheckchange",
      "{{showAlert(formData.agree.toString())}}",
    );

    // Click on select field
    cy.get(`${fieldPrefix}-agree input`).click({ force: true });

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("false");
  });
});

describe("Switch Field", () => {
  before(() => {
    const schema = {
      agree: true,
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.closePropertyPane();
  });

  it("shows updated formData values in onChange binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("agree");

    // Enable JS mode for onChange
    cy.get(toggleJSButton("onchange")).click({ force: true });

    // Add onChange action
    cy.testJsontext("onchange", "{{showAlert(formData.agree.toString())}}");

    // Click on select field
    cy.get(`${fieldPrefix}-agree input`).click({ force: true });

    // Check for alert
    cy.get(commonlocators.toastmsg).contains("false");
  });
});

describe("Date Field", () => {
  before(() => {
    const schema = {
      dob: "20/12/1992",
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.closePropertyPane();
  });

  it("shows updated formData values in onDateSelected binding", () => {
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("dob");

    // Enable JS mode for onDateSelected
    cy.get(toggleJSButton("ondateselected")).click({ force: true });

    // Add onDateSelected action
    cy.testJsontext("ondateselected", "{{showAlert(formData.dob)}}");

    // Click on select field
    cy.get(`${fieldPrefix}-dob .bp3-input`)
      .clear({ force: true })
      .type("10/08/2010");

    // Check for alert
    cy.contains("10/08/2010").should("be.visible");
  });
});

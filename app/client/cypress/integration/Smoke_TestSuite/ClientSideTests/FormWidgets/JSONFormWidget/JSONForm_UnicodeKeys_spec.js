const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const jsonFormUnicodeDSLWithoutSourceData = require("../../../../../fixtures/jsonFormUnicodeDSLWithoutSourceData.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

const fieldPrefix = ".t--jsonformfield";
const backBtn = ".t--property-pane-back-btn";

describe("JSON Form Widget Unicode keys", () => {
  it("generates fields with valid source data json", () => {
    cy.addDsl(dslWithoutSchema);
    const sourceData = {
      नाम: "John",
      суроға: {
        شارع: "Koramangala",
      },
      การศึกษา: [
        {
          କଲେଜ: "MIT",
        },
      ],
    };

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(sourceData));
    cy.closePropertyPane();

    cy.get(`${fieldPrefix}-xn__l2bm1c label`).contains("नाम");
    cy.get(`${fieldPrefix}-xn__l2bm1c input`).then((input) => {
      cy.wrap(input).should("have.value", "John");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-xn__80a1afdk69b label`).should("have.length", 2);
    cy.get(`${fieldPrefix}-xn__80a1afdk69b-xn__mgbuhw label`).contains("شارع");
    cy.get(`${fieldPrefix}-xn__80a1afdk69b-xn__mgbuhw input`).then((input) => {
      cy.wrap(input).should("have.value", "Koramangala");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-xn__12ca5huag4ce3a label`).should("have.length", 2);

    cy.get(`${fieldPrefix}-xn__12ca5huag4ce3a-0--xn__ohco9d4d label`).contains(
      "କଲେଜ",
    );
    cy.get(`${fieldPrefix}-xn__12ca5huag4ce3a-0--xn__ohco9d4d input`).then(
      (input) => {
        cy.wrap(input).should("have.value", "MIT");
        cy.wrap(input)
          .invoke("attr", "type")
          .should("contain", "text");
      },
    );

    cy.get(
      `${fieldPrefix}-xn__12ca5huag4ce3a .t--jsonformfield-array-delete-btn .t--text`,
    ).should("have.text", "Delete");
    cy.get(
      `${fieldPrefix}-xn__12ca5huag4ce3a .t--jsonformfield-array-add-btn .t--text`,
    ).should("have.text", "Add New");
  });

  it("modifies field when source data changes", () => {
    cy.addDsl(jsonFormUnicodeDSLWithoutSourceData);

    const modifiedSourceData = {
      "पहला नाम": "John",
      "अंतिम नाम": "Doe",
      суроға: {
        شارع: "Koramangala",
      },
      การศึกษา: [
        {
          କଲେଜ: "MIT",
          卒業の日: "21/03/2010",
        },
      ],
    };

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(modifiedSourceData));
    cy.closePropertyPane();

    cy.get(`${fieldPrefix}-xn____xvdesr5bxbc label`).contains("पहला नाम");
    cy.get(`${fieldPrefix}-xn____xvdesr5bxbc input`).then((input) => {
      cy.wrap(input).should("have.value", "John");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-xn____qtdi9jva8ac1kf label`).contains("अंतिम नाम");
    cy.get(`${fieldPrefix}-xn____qtdi9jva8ac1kf input`).then((input) => {
      cy.wrap(input).should("have.value", "Doe");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-xn__80a1afdk69b label`).should("have.length", 2);
    cy.get(`${fieldPrefix}-xn__80a1afdk69b-xn__mgbuhw label`).contains("شارع");
    cy.get(`${fieldPrefix}-xn__80a1afdk69b-xn__mgbuhw input`).then((input) => {
      cy.wrap(input).should("have.value", "Koramangala");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-xn__12ca5huag4ce3a label`).should("have.length", 3);

    cy.get(`${fieldPrefix}-xn__12ca5huag4ce3a-0--xn__ohco9d4d label`).contains(
      "କଲେଜ",
    );
    cy.get(`${fieldPrefix}-xn__12ca5huag4ce3a-0--xn__ohco9d4d input`).then(
      (input) => {
        cy.wrap(input).should("have.value", "MIT");
        cy.wrap(input)
          .invoke("attr", "type")
          .should("contain", "text");
      },
    );

    cy.get(
      `${fieldPrefix}-xn__12ca5huag4ce3a-0--xn__u9j436hvxmjkd label`,
    ).contains("卒業の日");
    cy.get(`${fieldPrefix}-xn__12ca5huag4ce3a-0--xn__u9j436hvxmjkd input`).then(
      (input) => {
        cy.wrap(input).should("have.value", "21/03/2010");
        cy.wrap(input)
          .invoke("attr", "type")
          .should("contain", "text");
      },
    );

    cy.get(
      `${fieldPrefix}-xn__12ca5huag4ce3a .t--jsonformfield-array-delete-btn .t--text`,
    ).should("have.text", "Delete");
    cy.get(
      `${fieldPrefix}-xn__12ca5huag4ce3a .t--jsonformfield-array-add-btn .t--text`,
    ).should("have.text", "Add New");
  });

  it("change in accessor updates formData", () => {
    cy.addDsl(jsonFormUnicodeDSLWithoutSourceData);
    const sourceData = {
      नाम: "John",
      суроға: {
        شارع: "Koramangala",
      },
      การศึกษา: [
        {
          କଲେଜ: "MIT",
        },
      ],
    };

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(sourceData));
    cy.closePropertyPane();

    const expectedInitialFormData = sourceData;

    const formDataBeforeArrayAccessorChange = {
      "नाम नाम": "John",
      суроға: {
        "شارع1 شارع": "Koramangala",
      },
      การศึกษา: [
        {
          କଲେଜ: "MIT",
        },
      ],
    };

    const formDataAfterArrayAccessorChange = {
      "नाम नाम": "John",
      суроға: {
        "شارع1 شارع": "Koramangala",
      },
      การศึกษา: [
        {
          "ସ୍ନାତକ କଲେଜ": "MIT",
        },
      ],
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

    cy.openPropertyPane("jsonformwidget");

    // नाम field
    cy.openFieldConfiguration("xn__l2bm1c");
    cy.testJsontext("propertyname", "नाम नाम");
    cy.get(backBtn)
      .click({ force: true })
      .wait(500);

    // open field суроға -> شارع
    cy.openFieldConfiguration("xn__80a1afdk69b");
    cy.openFieldConfiguration("xn__mgbuhw");
    cy.testJsontext("propertyname", "شارع1 شارع");
    cy.get(backBtn)
      .click({ force: true })
      .wait(500);
    cy.get(backBtn)
      .click({ force: true })
      .wait(500);

    // Validate initial form data
    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).then(($el) => {
      const formData = JSON.parse($el.text());
      cy.wrap(formData).should("deep.equal", formDataBeforeArrayAccessorChange);
    });

    // open field การศึกษา -> array item -> କଲେଜ
    cy.openFieldConfiguration("xn__12ca5huag4ce3a");
    cy.openFieldConfiguration("__array_item__");
    cy.openFieldConfiguration("xn__ohco9d4d");
    cy.testJsontext("propertyname", "ସ୍ନାତକ କଲେଜ");

    cy.wait(5000);

    // Validate initial form data
    cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).then(($el) => {
      const formData = JSON.parse($el.text());
      cy.wrap(formData).should("deep.equal", formDataAfterArrayAccessorChange);
    });
  });
});

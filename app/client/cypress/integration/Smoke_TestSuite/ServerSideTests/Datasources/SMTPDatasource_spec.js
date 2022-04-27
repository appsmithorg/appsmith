const datasource = require("../../../../locators/DatasourcesEditor.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const dsl = require("../../../../fixtures/SMTPTestdsl.json");
let datasourceName;

describe("SMTP datasource test cases using ted", function() {
  let SMTPDatasourceName;
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Create and configure smtp datasource and query, binding widgets to query fields", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.SMTP).click();
    cy.generateUUID().then((uid) => {
      SMTPDatasourceName = uid;

      cy.get(".t--edit-datasource-name").click();
      cy.get(".t--edit-datasource-name input")
        .clear()
        .type(SMTPDatasourceName, { force: true })
        .should("have.value", SMTPDatasourceName)
        .blur();

      cy.getPluginFormsAndCreateDatasource();
      cy.fillSMTPDatasourceForm();
      cy.testSaveDatasource();
      cy.NavigateToActiveDSQueryPane(SMTPDatasourceName);
    });
    // create new query and bind fields with widgets
    cy.get(queryLocators.queryNameField).type("smtpquery");
    cy.get(queryLocators.queryFromEmail)
      .first()
      .type("{{From.text}}", { parseSpecialCharSequences: false });
    cy.get(queryLocators.queryFromEmail)
      .eq(1)
      .type("{{To.text}}", { parseSpecialCharSequences: false });
    cy.get(queryLocators.queryFromEmail)
      .eq(4)
      .type("{{Subject.text}}", { parseSpecialCharSequences: false });
    cy.get(queryLocators.queryFromEmail)
      .eq(5)
      .type("{{Body.text}}", { parseSpecialCharSequences: false });
    cy.get(queryLocators.queryFromEmail)
      .eq(6)
      .type("{{FilePicker.text}}", { parseSpecialCharSequences: false });
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.wait(2000);
  });

  it("2. On canvas, passing wrong email address in widgets should give error", function() {
    // verify an error is thrown when recipient address is not added
    cy.xpath("//input[@class='bp3-input']")
      .eq(0)
      .type("test@appsmith.com");
    cy.get("span.bp3-button-text:contains('Run query')")
      .closest("div")
      .click();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.statusCode).to.eq("5005");
      expect(response.body.data.body).to.contain(
        "Couldn't find a valid recipient address. Please check your action configuration",
      );
    });
    // verify an error is thrown when sender address is not added
    cy.xpath("//input[@class='bp3-input']")
      .eq(0)
      .clear();
    cy.xpath("//input[@class='bp3-input']")
      .eq(1)
      .type("qwerty@appsmith.com");
    cy.get("span.bp3-button-text:contains('Run query')")
      .closest("div")
      .click();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.statusCode).to.eq("5005");
      expect(response.body.data.body).to.contain(
        "Couldn't find a valid sender address. Please check your action configuration",
      );
    });
  });

  /* it("3. On canvas, fill to email, from email, subject, body, attachment and run query", function() {
    cy.get(`.t--entity-name:contains("smtpquery")`)
      .should("be.visible")
      .click({ force: true });
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.wait(2000);
    cy.xpath("//input[@class='bp3-input']")
      .eq(0)
      .type("test@appsmith.com");
    cy.xpath("//input[@class='bp3-input']")
      .eq(2)
      .type("this is a smtp test");
    // adding an attachment in file picker
    /* cy.SearchEntityandOpen("FilePicker");
    const fixturePath = "testFile.mov";
    cy.get(commonlocators.filePickerButton).click();
    cy.get(commonlocators.filePickerInput)
      .first()
      .attachFile(fixturePath);
    cy.get(commonlocators.filePickerUploadButton).click();
    cy.get(".bp3-spinner").should("have.length", 1);
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("button").contains("1 files selected"); 
    cy.xpath(
      "//span[text()='Run query' and @class='bp3-button-text']",
    ).click();
    cy.wait("@postExecute", { timeout: 8000 }).then(({ response }) => {
      //  expect(response.body.data.statusCode).to.eq("5000");
      expect(response.body.data.body).to.contain("Sent the email successfully");
    });
  }); */
});

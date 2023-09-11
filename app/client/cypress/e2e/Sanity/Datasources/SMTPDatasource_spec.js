const datasource = require("../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../locators/QueryEditor.json");
import { agHelper } from "../../../support/Objects/ObjectsCore";

describe("SMTP datasource test cases using ted", function () {
  let SMTPDatasourceName;
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });
  before(() => {
    agHelper.AddDsl("SMTPTestdsl");
  });

  it("1. Create and configure smtp datasource and query, binding widgets to query fields", function () {
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
      .type("{{FilePicker.files}}", { parseSpecialCharSequences: false });
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.wait(2000);
  });

  it("2. On canvas, passing wrong email address in widgets should give error", function () {
    // verify an error is thrown when recipient address is not added
    cy.xpath("//input[@class='bp3-input']").eq(0).type("test@appsmith.com");
    cy.get("span.bp3-button-text:contains('Run query')").closest("div").click();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.statusCode).to.eq("PE-ARG-5000");
    });
    agHelper.ValidateToastMessage(
      "Couldn't find a valid recipient address. Please check your action configuration",
    );
    // verify an error is thrown when sender address is not added
    cy.xpath("//input[@class='bp3-input']").eq(0).clear();
    cy.xpath("//input[@class='bp3-input']").eq(1).type("qwerty@appsmith.com");
    cy.get("span.bp3-button-text:contains('Run query')").closest("div").click();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.statusCode).to.eq("PE-ARG-5000");
    });
    agHelper.ValidateToastMessage(
      "Couldn't find a valid sender address. Please check your action configuration",
    );
  });

  it("3. On canvas, fill to email, from email, subject, body, attachment and run query", function () {
    cy.get(`.t--entity-name:contains("smtpquery")`)
      .should("be.visible")
      .click({ force: true });
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.wait(2000);
    cy.xpath("//input[@class='bp3-input']").eq(0).type("test@appsmith.com");
    cy.xpath("//input[@class='bp3-input']").eq(2).type("this is a smtp test");
    // adding an attachment in file picker
    const fixturePath = "testFile.mov";
    agHelper.ClickButton("Select Files"); //1 files selected
    agHelper.UploadFile(fixturePath);
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("button").contains("1 files selected");
    agHelper.ClickButton("Run query");
    agHelper.ValidateToastMessage("Sent the email successfully");
    //not working
    // cy.exec("exim -bp", { failOnNonZeroExit: false }).then((result) => {
    //   const { stdout, stderr, code } = result;

    //   // Log the command output
    //   cy.log("exim -bp stdout:", stdout); // result is empty
    //   cy.log("exim -bp stderr:", stderr);
    //   cy.log("exim -bp result:", result);
    //   expect(code).to.eq(0); //(0 indicates success)
    //   //expect(stdout).to.contain("qwerty@appsmith.com");//not working here since stdout is empty
    // });

    const tedUrl = "http://localhost:5001/v1/parent/cmd";

    cy.request({
      method: "GET",
      url: tedUrl,
      qs: {
        cmd: "exim -bp",
      },
    }).then((res) => {
      cy.log("exim -bp output is", res.body.stdout);
      cy.log("res.body.stderr" + res.body.stderr);
      cy.log("res.status" + res.status);
      expect(stdout).to.contain("qwerty@appsmith.com");
      //expect(res.status).equal(200);
    });
    expect(true).to.be.false;
  });
});

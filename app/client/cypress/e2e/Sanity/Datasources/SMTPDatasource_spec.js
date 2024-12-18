import EditorNavigation from "../../../support/Pages/EditorNavigation";

const datasource = require("../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../locators/QueryEditor.json");
import { agHelper, dataSources } from "../../../support/Objects/ObjectsCore";

describe(
  "SMTP datasource test cases using ted",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    let SMTPDatasourceName;
    beforeEach(() => {
      dataSources.StartDataSourceRoutes();
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
        dataSources.CreateQueryAfterDSSaved();
      });
      // create new query and bind fields with widgets
      agHelper.RenameQuery("smtpquery");
      cy.get(queryLocators.queryFromEmail)
        .first()
        .type("{{From.text}}", { parseSpecialCharSequences: false });
      agHelper.ClickOutside(); //to close the evaluated pop-up
      cy.get(queryLocators.queryFromEmail)
        .eq(1)
        .type("{{To.text}}", { parseSpecialCharSequences: false });
      agHelper.ClickOutside(); //to close the evaluated pop-up
      cy.get(queryLocators.queryFromEmail)
        .eq(4)
        .type("{{Subject.text}}", { parseSpecialCharSequences: false });
      agHelper.ClickOutside(); //to close the evaluated pop-up
      cy.get(queryLocators.queryFromEmail)
        .eq(5)
        .type("{{Body.text}}", { parseSpecialCharSequences: false });
      agHelper.ClickOutside(); //to close the evaluated pop-up
      cy.get(queryLocators.queryFromEmail)
        .eq(6)
        .type("{{FilePicker.files}}", { parseSpecialCharSequences: false });
      agHelper.ClickOutside(); //to close the evaluated pop-up
      EditorNavigation.ShowCanvas();
      cy.wait(2000);
    });

    it("2. On canvas, passing wrong email address in widgets should give error", function () {
      // verify an error is thrown when recipient address is not added
      cy.xpath("//input[@class='bp3-input']")
        .eq(0)
        .type("test@appsmith.com")
        .wait(500);
      cy.get("span.bp3-button-text:contains('Run query')")
        .closest("div")
        .click()
        .wait(500);
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.statusCode).to.eq("PE-ARG-5000");
      });
      agHelper.WaitUntilToastDisappear(
        "Couldn't find a valid recipient address. Please check your action configuration",
      );
      // verify an error is thrown when sender address is not added
      cy.xpath("//input[@class='bp3-input']").eq(0).clear().wait(500);
      cy.xpath("//input[@class='bp3-input']")
        .eq(1)
        .type("qwerty@appsmith.com")
        .wait(500);
      cy.get("span.bp3-button-text:contains('Run query')")
        .closest("div")
        .click()
        .wait(500);
      cy.wait("@postExecute").then(({ response }) => {
        expect(response.body.data.statusCode).to.eq("PE-ARG-5000");
      });
      agHelper.ValidateToastMessage(
        "Couldn't find a valid sender address. Please check your action configuration",
      );
    });

    it("3. On canvas, fill to email, from email, subject, body, attachment and run query", function () {
      EditorNavigation.ShowCanvas();
      const noise = Math.random().toString(36).substring(0, 7);
      const fromEmail = `smtp.datasource.tester.${noise}@appsmith.com`;
      cy.wait(2000);
      cy.xpath("//input[@class='bp3-input']").eq(0).type(fromEmail);
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

      //Verifying if mail is sent/received using ted
      cy.request("http://localhost:5001/api/v1/maildev-emails").then((res) => {
        expect(res.status).equal(200);
        cy.log(res.body);
        const thisTestEmail = res.body.find(
          (email) => email.headers.from === fromEmail,
        );
        expect(thisTestEmail).to.exist;
        expect(thisTestEmail.headers.subject).equal("this is a smtp test");
        expect(thisTestEmail.headers.to).equal("qwerty@appsmith.com");
        expect(thisTestEmail.attachments.length).equal(1);
      });
    });

    it("4. Verify the default port for the datasource", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("SMTP");

      agHelper.AssertAttribute(dataSources._port, "value", "25");
    });
  },
);

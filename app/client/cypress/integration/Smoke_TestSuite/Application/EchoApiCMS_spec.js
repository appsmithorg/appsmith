const dsl = require("../../../fixtures/CMSdsl.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");
import apiEditor from "../../../locators/ApiEditor";
import appPage from "../../../locators/CMSApplocators";
const commonlocators = require("../../../locators/commonlocators.json");
describe("Content Management System App", function() {
  let repoName;

  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1.Create Get echo Api call", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("get_data");
    // creating get request using echo
    cy.enterDatasourceAndPath("https://mock-api.appsmith.com/echo", "/get");
    cy.get(apiwidget.headerKey).type("info");
    cy.xpath("//span[text()='Key']").click();
    // entering the data in header
    cy.get(
      apiwidget.headerValue,
    ).type(
      '[{"due":"2021-11-23","assignee":"Dan.Wyman@hotmail.com","title":"Recusan","description":"Ut quisquam eum beatae facere eos aliquam laborum ea.","id":"1"},{"due":"2021-11-23","assignee":"Dashawn_Maggio30@gmail.com","title":"Dignissimos eaque","description":"Consequatur corrupti et possimus en.","id":"2"},{"due":"2021-11-24","assignee":"Curt50@gmail.com","title":"Voluptas explicabo","description":"Quia ratione optio et maiores.","id":"3"},{"due":"2021-11-23","assignee":"Shanna63@hotmail.com","title":"Aut omnis.","description":"Neque rerum numquam veniam voluptatum id. Aut daut.","id":"4"}]',
      { parseSpecialCharSequences: false },
    );
    cy.SaveAndRunAPI();
    cy.ResponseStatusCheck("200");
  });

  it("2. Create Post echo Api call", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("send_mail");
    cy.get(apiEditor.ApiVerb).click();
    cy.xpath(appPage.selectPost).click();
    // creating post request using echo
    cy.enterDatasourceAndPath("https://mock-api.appsmith.com/echo", "/post");
    cy.contains(apiEditor.bodyTab).click({ force: true });
    cy.xpath(apiwidget.postbody)
      .click({ force: true })
      .clear();
    // binding the data with widgets in body tab
    cy.xpath(apiwidget.postbody)
      .click({ force: true })
      .focus()
      .type(
        '{"to":"{{to_input.text}}","subject":"{{subject.text}}","content":"{{content.text}}"}',
        { parseSpecialCharSequences: false },
      )
      .type("{del}{del}{del}");
    cy.SaveAndRunAPI();
    cy.ResponseStatusCheck("201");
  });

  it("3. Create Delete echo Api call", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("delete_proposal");
    cy.get(apiEditor.ApiVerb).click();
    cy.xpath(appPage.selectDelete).click();
    // creating delete request using echo
    cy.enterDatasourceAndPath("https://mock-api.appsmith.com/echo", "/delete");
    cy.contains(apiEditor.bodyTab).click({ force: true });
    // binding the data with widgets in body tab
    cy.xpath(apiwidget.postbody)
      .click({ force: true })
      .focus()
      .type(
        '{"title":"{{title.text}}","due":"{{due.text}}","assignee":"{{assignee.text}}"}',
        { parseSpecialCharSequences: false },
      )
      .type("{del}{del}{del}");
    cy.SaveAndRunAPI();
    //cy.ResponseStatusCheck("200");
  });

  it("4. Send mail and verify post request body", function() {
    // navigating to canvas
    cy.xpath(appPage.pagebutton).click();
    cy.get(appPage.submitButton).should("be.visible");
    cy.xpath("//span[text()='3']").click({ force: true });
    cy.get(appPage.mailButton)
      .closest("div")
      .click();
    // verifying the mail to send and asserting post call's response
    cy.xpath(appPage.sendMailText).should("be.visible");
    cy.xpath("//input[@value='Curt50@gmail.com']").should("be.visible");
    cy.xpath(appPage.subjectField).type("Test");
    cy.xpath(appPage.contentField)
      .last()
      .type("Task completed", { force: true });
    cy.get(appPage.confirmButton)
      .closest("div")
      .click({ force: true });
    cy.get(appPage.closeButton)
      .closest("div")
      .click({ force: true });
    cy.xpath(appPage.pagebutton).click({ force: true });
    //cy.xpath(appPage.datasourcesbutton).click({ force: true });
    cy.xpath(appPage.postApi).click({ force: true });
    cy.ResponseCheck("Test");
    // cy.ResponseCheck("Task completed");
    cy.ResponseCheck("Curt50@gmail.com");
  });

  it("5. Delete proposal and verify delete request body", function() {
    // navigating back to canvas
    cy.xpath(appPage.pagebutton).click({ force: true });
    cy.get(appPage.submitButton)
      .closest("div")
      .should("be.visible");
    cy.xpath("//span[text()='Dan.Wyman@hotmail.com']").click({ force: true });
    // deleting the proposal and asserting delete call's response
    cy.xpath(appPage.deleteButton).click({ force: true });
    cy.xpath(appPage.deleteTaskText).should("be.visible");
    cy.get(appPage.confirmButton)
      .closest("div")
      .click({ force: true });
    cy.xpath(appPage.pagebutton).click({ force: true });
    //cy.xpath(appPage.datasourcesbutton).click({ force: true });
    cy.xpath(appPage.deleteApi).click({ force: true });
    cy.ResponseCheck("Dan.Wyman@hotmail.com");
    cy.ResponseCheck("Recusan");
  });
  /*it("6. Connect app to git, verify data binding in edit and deploy mode", ()=>{
    cy.get(`.t--entity-name:contains("Page1")`)
    .should("be.visible")
    .click({ force: true });
    cy.generateUUID().then((uid) => {
      repoName = uid;

      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
    cy.latestDeployPreview()
    cy.wait(2000)
    cy.xpath("//span[text()='Curt50@gmail.com']").should("be.visible").click({ force: true });
    cy.xpath(appPage.subjectField).type("Test");
    cy.xpath(appPage.contentField)
      .last()
      .type("Task completed", { force: true });
    cy.get(appPage.confirmButton)
      .closest("div")
      .click({ force: true });
    cy.get(appPage.closeButton)
      .closest("div")
      .click({ force: true });
      cy.get(commonlocators.backToEditor).click();
      cy.wait(1000);
  }) */
});

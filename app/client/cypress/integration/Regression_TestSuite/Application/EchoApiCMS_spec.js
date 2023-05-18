import appPage from "../../../locators/CMSApplocators";
import * as _ from "../../../support/Objects/ObjectsCore";

describe("Content Management System App", function () {
  before(() => {
    _.homePage.NavigateToHome();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      _.homePage.CreateNewWorkspace("EchoApiCMS" + uid);
      _.homePage.CreateAppInWorkspace("EchoApiCMS" + uid, "EchoApiCMSApp");
      cy.fixture("CMSdsl").then((val) => {
        _.agHelper.AddDsl(val);
      });
    });
  });

  let repoName;
  it("1.Create Get echo Api call", function () {
    cy.fixture("datasources").then((datasourceFormData) => {
      _.apiPage.CreateAndFillApi(datasourceFormData["echoApiUrl"], "get_data");
      // creating get request using echo
      _.apiPage.EnterHeader(
        "info",
        '[{"due":"2021-11-23","assignee":"Dan.Wyman@hotmail.com","title":"Recusan","description":"Ut quisquam eum beatae facere eos aliquam laborum ea.","id":"1"},{"due":"2021-11-23","assignee":"Dashawn_Maggio30@gmail.com","title":"Dignissimos eaque","description":"Consequatur corrupti et possimus en.","id":"2"},{"due":"2021-11-24","assignee":"Curt50@gmail.com","title":"Voluptas explicabo","description":"Quia ratione optio et maiores.","id":"3"},{"due":"2021-11-23","assignee":"Shanna63@hotmail.com","title":"Aut omnis.","description":"Neque rerum numquam veniam voluptatum id. Aut daut.","id":"4"}]',
      );
      // entering the data in header
      _.apiPage.RunAPI();
      _.apiPage.ResponseStatusCheck("200");
    });
  });

  it("2. Create Post echo Api call", function () {
    cy.fixture("datasources").then((datasourceFormData) => {
      _.apiPage.CreateAndFillApi(
        datasourceFormData["echoApiUrl"],
        "send_mail",
        10000,
        "POST",
      );
      _.apiPage.SelectPaneTab("Body");
      _.apiPage.SelectSubTab("JSON");
      // creating post request using echo
      _.dataSources.EnterQuery(
        '{"to":"{{to_input.text}}","subject":"{{subject.text}}","content":"{{content.text}}"}',
      );
      _.apiPage.RunAPI();
      _.apiPage.ResponseStatusCheck("200");
    });
  });

  it("3. Create Delete echo Api call", function () {
    cy.fixture("datasources").then((datasourceFormData) => {
      _.apiPage.CreateAndFillApi(
        datasourceFormData["echoApiUrl"],
        "delete_proposal",
        10000,
        "DELETE",
      );
      _.apiPage.SelectPaneTab("Body");
      _.apiPage.SelectSubTab("JSON");
      // creating post request using echo
      _.dataSources.EnterQuery(
        '{"title":"{{title.text}}","due":"{{due.text}}","assignee":"{{assignee.text}}"}',
      );
      _.apiPage.RunAPI();
      _.apiPage.ResponseStatusCheck("200");
    });
  });

  it("4. Send mail and verify post request body", function () {
    // navigating to canvas
    cy.xpath(appPage.pagebutton).click();
    cy.get(appPage.submitButton).should("be.visible");
    cy.xpath("//span[text()='3']").click({ force: true });
    cy.get(appPage.mailButton).closest("div").click();
    // verifying the mail to send and asserting post call's response
    cy.xpath(appPage.sendMailText).should("be.visible");
    cy.xpath("//input[@value='Curt50@gmail.com']").should("be.visible");
    cy.xpath(appPage.subjectField).type("Test");
    cy.get(appPage.contentField)
      .last()
      .find("textarea")
      .type("Task completed", { force: true });
    cy.get(appPage.confirmButton).closest("div").click({ force: true });
    cy.get(appPage.closeButton).closest("div").click({ force: true });
    cy.xpath(appPage.pagebutton).click({ force: true });
    //cy.xpath(appPage.datasourcesbutton).click({ force: true });
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.xpath(appPage.postApi).click({ force: true });
    cy.ResponseCheck("Test");
    // cy.ResponseCheck("Task completed");
    cy.ResponseCheck("Curt50@gmail.com");
  });

  it("5. Delete proposal and verify delete request body", function () {
    // navigating back to canvas
    cy.xpath(appPage.pagebutton).click({ force: true });
    cy.get(appPage.submitButton).closest("div").should("be.visible");
    cy.xpath("//span[text()='Dan.Wyman@hotmail.com']").click({ force: true });
    // deleting the proposal and asserting delete call's response
    cy.xpath(appPage.deleteButton).click({ force: true });
    cy.xpath(appPage.deleteTaskText).should("be.visible");
    cy.get(appPage.confirmButton).closest("div").click({ force: true });
    cy.xpath(appPage.pagebutton).click({ force: true });
    //cy.xpath(appPage.datasourcesbutton).click({ force: true });
    cy.xpath(appPage.deleteApi).click({ force: true });
    cy.ResponseCheck("Dan.Wyman@hotmail.com");
    cy.ResponseCheck("Recusan");
  });

  it("6. Connect app to git, verify data binding in edit and deploy mode", () => {
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    _.gitSync.CreateNConnectToGit(repoName);
    cy.get("@gitRepoName").then((repName) => {
      repoName = repName;
    });
    cy.latestDeployPreview();
    cy.wait(2000);
    cy.xpath("//span[text()='Curt50@gmail.com']")
      .should("be.visible")
      .click({ force: true });
    cy.get(appPage.mailButton).closest("div").click();
    cy.xpath(appPage.sendMailText).should("be.visible");
    cy.xpath(appPage.subjectField).type("Test");
    cy.get(appPage.contentField)
      .last()
      .find("textarea")
      .type("Task completed", { force: true });
    cy.get(appPage.confirmButton).closest("div").click({ force: true });
    cy.get(appPage.closeButton).closest("div").click({ force: true });
    _.deployMode.NavigateBacktoEditor();
  });

  after(() => {
    //clean up
    _.gitSync.DeleteTestGithubRepo(repoName);
  });
});

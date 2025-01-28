import appPage from "../../../locators/CMSApplocators";
import { featureFlagIntercept } from "../../../support/Objects/FeatureFlags";
import {
  agHelper,
  deployMode,
  homePage,
  gitSync,
  apiPage,
  dataSources,
  dataManager,
} from "../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../support/Pages/EditorNavigation";

describe(
  "Content Management System App",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    before(() => {
      homePage.RenameApplication("EchoApiCMSApp");
      agHelper.AddDsl("CMSdsl");
    });

    let repoName;
    it("1.Create Get echo Api call", function () {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].echoApiUrl,
        "get_data",
      );
      // creating get request using echo
      apiPage.EnterHeader(
        "info",
        '[{"due":"2021-11-23","assignee":"Dan.Wyman@hotmail.com","title":"Recusan","description":"Ut quisquam eum beatae facere eos aliquam laborum ea.","id":"1"},{"due":"2021-11-23","assignee":"Dashawn_Maggio30@gmail.com","title":"Dignissimos eaque","description":"Consequatur corrupti et possimus en.","id":"2"},{"due":"2021-11-24","assignee":"Curt50@gmail.com","title":"Voluptas explicabo","description":"Quia ratione optio et maiores.","id":"3"},{"due":"2021-11-23","assignee":"Shanna63@hotmail.com","title":"Aut omnis.","description":"Neque rerum numquam veniam voluptatum id. Aut daut.","id":"4"}]',
      );
      // entering the data in header
      apiPage.RunAPI();
      apiPage.ResponseStatusCheck("200");
    });

    it("2. Create Post echo Api call", function () {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].echoApiUrl,
        "send_mail",
        10000,
        "POST",
      );
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("JSON");
      // creating post request using echo
      dataSources.EnterQuery(
        '{"to":"{{to_input.text}}","subject":"{{subject.text}}","content":"{{content.text}}"}',
      );
      apiPage.RunAPI();
      apiPage.ResponseStatusCheck("200");
    });

    it("3. Create Delete echo Api call", function () {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].echoApiUrl,
        "delete_proposal",
        10000,
        "DELETE",
      );
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("JSON");
      // creating post request using echo
      dataSources.EnterQuery(
        '{"title":"{{title.text}}","due":"{{due.text}}","assignee":"{{assignee.text}}"}',
      );
      apiPage.RunAPI();
      apiPage.ResponseStatusCheck("200");
    });

    it("4. Send mail and verify post request body", function () {
      // navigating to canvas
      PageLeftPane.switchSegment(PagePaneSegment.UI);
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
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      cy.xpath(appPage.postApi).click({ force: true });
      cy.ResponseCheck("Test");
      // cy.ResponseCheck("Task completed");
      cy.ResponseCheck("Curt50@gmail.com");
    });

    it("5. Delete proposal and verify delete request body", function () {
      // navigating back to canvas
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.get(appPage.submitButton).closest("div").should("be.visible");
      cy.xpath("//span[text()='Dan.Wyman@hotmail.com']").click({ force: true });
      // deleting the proposal and asserting delete call's response
      cy.xpath(appPage.deleteButton).click({ force: true });
      cy.xpath(appPage.deleteTaskText).should("be.visible");
      cy.get(appPage.confirmButton).closest("div").click({ force: true });
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      EditorNavigation.SelectEntityByName("delete_proposal", EntityType.Api);
      cy.ResponseCheck("Dan.Wyman@hotmail.com");
      cy.ResponseCheck("Recusan");
    });

    it("6. Connect app to git, verify data binding in edit and deploy mode", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      gitSync.CreateNConnectToGit(repoName);
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;

        cy.latestDeployPreview();
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
        deployMode.NavigateBacktoEditor();
        gitSync.DeleteTestGithubRepo(repoName);
      });
    });
  },
);

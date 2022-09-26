describe("Fork a template to the current app", () => {
  let repoName;
  const branchName = "test/template";
  const mainBranch = "master";

  before(() => {
    cy.generateUUID().then((uid) => {
      repoName = uid;

      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
  });
  it("Bug#17002 Forking a template into an existing app which is connected to git makes the application go into a bad state ", function() {
    cy.get(template.startFromTemplateCard).click();
    cy.wait(1000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath(
      "//div[text()='Customer Support Dashboard']/following-sibling::div//button[contains(@class, 'fork-button')]",
    ).click();
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
    cy.commitAndPush();
  });
  it("Import template page in child branch and verify", function() {
    cy.createGitBranch(branchName);
    cy.CreatePage();
    cy.get(template.startFromTemplateCard).click();
    cy.wait(1000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.xpath("//div[text()='Customer Support Dashboard']").click();
    cy.wait("@importTemplate").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(template.selectAllPages)
      .next()
      .uncheck();
    cy.xpath("//span[text()='DASHBOARD']")
      .parent()
      .next()
      .check();
    cy.get(template.templateViewForkButton).click();
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
    cy.get(homePage.publishButton).click();
    cy.get(gitSyncLocators.commitCommentInput).type("Initial Commit");
    cy.get(gitSyncLocators.commitButton).click();
    cy.wait(8000);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.merge(mainBranch);
    cy.get(gitSyncLocators.closeGitSyncModal).click();
    cy.wait(2000);
    cy.latestDeployPreview();
  });
});

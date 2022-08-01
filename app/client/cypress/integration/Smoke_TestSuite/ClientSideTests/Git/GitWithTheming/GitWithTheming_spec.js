const commonlocators = require("../../../../../locators/commonlocators.json");

describe("Git with Theming:", function() {
  const backgroudColorMaster = "rgb(85, 61, 233)";
  const backgroudColorChildBranch = "rgb(100, 116, 139)";
  const tempBranch = "tempBranch";
  let repoName;
  let applicationId = null;
  let applicationName = null;
  before(() => {
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const newWorkspaceName = interception.response.body.data.name;
      cy.generateUUID().then((uid) => {
        cy.CreateAppForWorkspace(newWorkspaceName, uid);
        applicationName = uid;
        cy.get("@currentApplicationId").then(
          (currentAppId) => (applicationId = currentAppId),
        );
      });
    });

    cy.generateUUID().then((uid) => {
      repoName = uid;

      cy.createTestGithubRepo(repoName);
      cy.connectToGitRepo(repoName);
    });
  });
  it("Bug #13860 Theming is not getting applied on view mode when the app is connected to Git", function() {
    // apply theme on master branch and deploy
    cy.get(commonlocators.changeThemeBtn).click({ force: true });

    cy.get(commonlocators.themeCard)
      .eq(1)
      .click({ force: true });

    // check for alert
    cy.get(`${commonlocators.themeCard}`)
      .eq(1)
      .siblings("div")
      .first()
      .invoke("text")
      .then((text) => {
        cy.get(commonlocators.toastmsg).contains(`Theme ${text} Applied`);
      });
    // drag a widget and assert theme is applied
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 700 });
    //cy.get('.t--draggable-buttonwidget').closest("div").should('have.css' , 'background-color', backgroudColorChildBranch)
    cy.xpath("(//button[@type='button'])").should(
      "have.css",
      "background-color",
      backgroudColorMaster,
    );
    cy.commitAndPush();
    cy.wait(2000);
    cy.createGitBranch(tempBranch);
    cy.wait(1000);
    cy.get("body").click(300, 300);
    // change theme on tempBranch
    cy.get(commonlocators.changeThemeBtn).click({ force: true });

    // select a theme
    cy.get(commonlocators.themeCard)
      .last()
      .click({ force: true });

    // check for alert
    cy.get(`${commonlocators.themeCard}`)
      .last()
      .siblings("div")
      .first()
      .invoke("text")
      .then((text) => {
        cy.get(commonlocators.toastmsg).contains(`Theme ${text} Applied`);
      });

    cy.xpath("(//button[@type='button'])").should(
      "have.css",
      "background-color",
      backgroudColorChildBranch,
    );
    cy.commitAndPush();
    //assert theme is applied in view mode
    cy.latestDeployPreview();
    cy.get(".bp3-button:contains('Submit')").should(
      "have.css",
      "background-color",
      backgroudColorChildBranch,
    );
    cy.get(commonlocators.backToEditor).click();
    cy.wait(2000);
  });
  // commenting test until bug is closed
  /*it("Bug #14645 Custom themes are not getting copied for create branch", function() {
    cy.xpath("(//button[@type='button'])").should(
      "have.css",
      "background-color",
      backgroudColorChildBranch,
    );
    cy.switchGitBranch("master");
    cy.xpath("(//button[@type='button'])").should(
      "have.css",
      "background-color",
      backgroudColorMaster,
    );
    cy.pause();
    // delete tempBranch
    cy.get(gitSyncLocators.branchButton).click();
    cy.get(gitSyncLocators.branchListItem)
      .eq(1)
      .trigger("mouseenter")
      .within(() => {
        cy.get(gitSyncLocators.gitBranchContextMenu).click();
        cy.get(gitSyncLocators.gitBranchDelete).click();
      });
    cy.wait("@deleteBranch").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(gitSyncLocators.closeBranchList).click();
    // verify the app doesnt crash
    cy.xpath("(//button[@type='button'])").should(
      "have.css",
      "background-color",
      backgroudColorMaster,
    );
  }); */
});

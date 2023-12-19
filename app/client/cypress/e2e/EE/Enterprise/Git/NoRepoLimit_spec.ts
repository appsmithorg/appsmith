import {
  gitSync,
  agHelper,
  homePage,
  onboarding,
  locators,
} from "../../../../support/ee/ObjectsCore_EE";

let repoName1: any, repoName2: any, repoName3: any, repoName4: any;

describe(
  "Verify unlimited private repos connection in git",
  { tags: ["@tag.Git"] },
  function () {
    before(() => {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        repoName1 = uid;
      });
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        repoName2 = uid;
      });
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        repoName3 = uid;
      });
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        repoName4 = uid;
      });
    });
    it("1. Verify user can connect more then 3 private repos in appsmith", function () {
      agHelper.Sleep(3000); // adding wait for app to load
      homePage.LogOutviaAPI();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        homePage.SignUp(`${uid}@appsmithtest.com`, uid as unknown as string);
      });
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      gitSync.CreateNConnectToGit(repoName1, true, true);
      cy.get("@gitRepoName").then((repName) => {
        repoName1 = repName;
      });
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      gitSync.CreateNConnectToGit(repoName2, true, true);
      cy.get("@gitRepoName").then((repName) => {
        repoName2 = repName;
      });
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      gitSync.CreateNConnectToGit(repoName3, true, true);
      cy.get("@gitRepoName").then((repName) => {
        repoName3 = repName;
      });
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      gitSync.CreateNConnectToGit(repoName4, true, true);
      cy.get("@gitRepoName").then((repName) => {
        repoName4 = repName;
      });
      agHelper.AssertElementExist(gitSync._bottomBarCommit);
    });
    after(() => {
      homePage.DeleteAppviaAPI(repoName1);
      homePage.DeleteAppviaAPI(repoName2);
      homePage.DeleteAppviaAPI(repoName3);
      homePage.DeleteAppviaAPI(repoName4);
      gitSync.DeleteTestGithubRepo(repoName1);
      gitSync.DeleteTestGithubRepo(repoName2);
      gitSync.DeleteTestGithubRepo(repoName3);
      gitSync.DeleteTestGithubRepo(repoName4);
    });
  },
);

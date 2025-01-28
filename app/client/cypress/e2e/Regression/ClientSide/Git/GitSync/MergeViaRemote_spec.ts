import * as _ from "../../../../../support/Objects/ObjectsCore";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";

let tempBranch2 = "tempBranch2";
const mainBranch = "master";
const cleanUrlBranch = "feat/clean_url";
let applicationId: any;
let repoName: any;
let newPageName: string;

describe(
  "Git sync: Merge changes via remote",
  {
    tags: [
      "@tag.Git",
      "@tag.AccessControl",
      "@tag.Workflows",
      "@tag.Module",
      "@tag.Theme",
      "@tag.JS",
      "@tag.Container",
      "@tag.ImportExport",
    ],
  },
  function () {
    before(() => {
      _.homePage.NavigateToHome();
      _.homePage.CreateNewWorkspace();

      _.agHelper.GenerateUUID();
      cy.get("@guid").then((uid: any) => {
        cy.get("@workspaceName").then((workspaceName: any) => {
          _.homePage.CreateAppInWorkspace(workspaceName, uid);
          cy.get("@applicationId").then(
            (currentAppId) => (applicationId = currentAppId),
          );
        });
      });
      _.gitSync.CreateNConnectToGit(repoName);
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });
    });

    it("1. Supports merging head to base branch", function () {
      _.gitSync.CreateGitBranch(tempBranch2, true);
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageList.AddNewPage("New blank page")?.then((pageName) => {
        newPageName = pageName.toString();
        _.gitSync.CommitAndPush();
        _.gitSync.MergeToMaster();
        _.gitSync.SwitchGitBranch(mainBranch);
        PageList.assertPresence(newPageName);
      });
    });

    it("2. Clicking '+' icon on bottom bar should open deploy popup", function () {
      cy.get(_.gitSync.locators.quickActionsCommitBtn).click({ force: true });
      cy.get(_.gitSync.locators.opsModal).should("exist");
      cy.get(_.gitSync.locators.opsModalTabDeploy).should("exist");
      cy.get(_.gitSync.locators.opsModalTabDeploy)
        .invoke("attr", "aria-selected")
        .should("eq", "true");
      _.gitSync.CloseOpsModal();
    });

    it("3. Checks clean url updates across branches", () => {
      PageList.DeletePage(newPageName);
      let legacyPathname = "";
      let newPathname = "";
      // question to qa can we remove this assertion
      cy.intercept("GET", "/api/v1/pages?*mode=EDIT", (req) => {
        req.continue();
      }).as("appAndPages");
      cy.reload();
      cy.wait("@getConsolidatedData").then((intercept2) => {
        const { application, pages } =
          intercept2?.response?.body?.data?.pages?.data;
        const defaultPage = pages.find((p) => p.isDefault);
        legacyPathname = `/applications/${application.baseId}/pages/${defaultPage.baseId}`;
        newPathname = `/app/${application.slug}/${defaultPage.slug}-${defaultPage.baseId}`;
      });

      cy.location().should((location) => {
        expect(location.pathname).includes(newPathname);
      });

      cy.request("PUT", `/api/v1/applications/${applicationId}`, {
        applicationVersion: 1,
      });

      _.gitSync.CreateGitBranch(cleanUrlBranch, true);

      cy.location().should((location) => {
        expect(location.pathname).includes(legacyPathname);
      });

      _.gitSync.SwitchGitBranch(mainBranch);

      cy.get(".t--upgrade").click({ force: true });

      cy.get(".t--upgrade-confirm").click({ force: true });

      cy.location().should((location) => {
        expect(location.pathname).includes(newPathname);
      });

      _.gitSync.CreateGitBranch(cleanUrlBranch, false, false); //false is sent for assertCreateBranch since here it only goes to the branch already created
      cy.location().should((location) => {
        expect(location.pathname).includes(legacyPathname);
      });
    });
  },
);

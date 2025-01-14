import * as _ from "../../../../../support/Objects/ObjectsCore";
import {
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";

let tempBranch = "tempBranch",
  tempBranch0 = "tempBranch0",
  tempBranch1 = "tempBranch1",
  tempBranch2 = "tempBranch2",
  tempBranch3 = "tempBranch3";

const buttonNameMainBranch = "buttonMainBranch";
const buttonNameMainBranchEdited = "buttonMainBranchEdited";
const buttonNameTemp0Branch = "buttonTemp0Branch";
const buttonNameTempBranch1 = "buttonTempBranch1";
const mainBranch = "master";

const inputNameTempBranch3 = "inputNameTempBranch3";
const inputNameTempBranch31 = "inputNameTempBranch31";

const cleanUrlBranch = "feat/clean_url";

let applicationId: any;
let applicationName: any;
let repoName: any;

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
          applicationName = uid;
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
      //cy.switchGitBranch(mainBranch);
      _.gitSync.CreateGitBranch(tempBranch2, true);
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      PageList.AddNewPage();
      _.gitSync.CommitAndPush();
      _.gitSync.MergeToMaster();
      _.gitSync.CloseOpsModal();
      cy.get(_.gitSync.locators.branchItem).should("be.visible");
      _.gitSync.SwitchGitBranch(mainBranch);
      cy.get(_.gitSync.locators.branchItem).should("be.visible"); // wait for branch switch
      cy.contains("NewPage");
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
      PageList.DeletePage("NewPage");
      // Wait for page deletion to complete
      cy.get(".t--entity-name").should("be.visible");
      cy.wait("@deletePage");
      let legacyPathname = "";
      let newPathname = "";
      // question to qa can we remove this assertion
      cy.intercept("GET", "/api/v1/pages?*mode=EDIT", (req) => {
        req.continue();
      }).as("appAndPages");
      cy.reload();
      cy.wait("@getConsolidatedData").then((intercept2: any) => {
        if (intercept2.response?.body?.data?.pages?.data) {
          const { application, pages } =
            intercept2.response.body.data.pages.data;
          const defaultPage = pages.find(
            (p: { isDefault: boolean }) => p.isDefault,
          );
          legacyPathname = `/applications/${application.baseId}/pages/${defaultPage.baseId}`;
          newPathname = `/app/${application.slug}/${defaultPage.slug}-${defaultPage.baseId}`;
        }
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

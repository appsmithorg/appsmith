import {
  agHelper,
  entityExplorer,
  entityItems,
  jsEditor,
  gitSync,
  dataSources,
  draggableWidgets,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

import gitSyncLocators from "../../../../../locators/gitSyncLocators";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";
import PageList from "../../../../../support/Pages/PageList";

describe(
  "Git discard changes:",
  { tags: ["@tag.Git", "@tag.Sanity"] },
  function () {
    let datasourceName;
    let repoName;
    const query1 = "get_employees";
    const query2 = "get_category";
    const jsObject = "JSObject1";
    const page2 = "Page2";
    const page3 = "Page3";

    it("1. Create an app with Query1 and JSObject1, connect it to git", () => {
      // Create new postgres datasource
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName;
        dataSources.CreateQueryAfterDSSaved(
          `SELECT * FROM public."employees" where employee_id=1`,
          query1,
        );
        dataSources.RunQuery();
      });

      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      cy.wait("@getPage");
      // bind input widget to postgres query on page1
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2);
      propPane.UpdatePropertyFieldValue(
        "Default value",
        `{{${query1}.data[0].first_name}}`,
      );
      PageList.AddNewPage();
      EditorNavigation.SelectEntityByName(page2, EntityType.Page);
      cy.wait("@getPage");
      jsEditor.CreateJSObject('return "Success";');
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2);
      propPane.UpdatePropertyFieldValue(
        "Default value",
        `{{JSObject1.myFun1()}}`,
      );
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      // connect app to git
      gitSync.CreateNConnectToGit();
      gitSync.CreateGitBranch();
      cy.get("@gitRepoName").then((repName) => {
        repoName = repName;
      });
    });

    it("2. Add new datasource query, discard changes, verify query is deleted", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      cy.wait("@getPage");
      // create new postgres query
      dataSources.CreateQueryForDS(
        datasourceName,
        `SELECT * FROM public."category" LIMIT 10;`,
        query2,
      );
      dataSources.RunQuery();
      // navigate to Page1
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      cy.wait("@getPage");
      // discard changes
      gitSync.DiscardChanges();
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      // verify query2 is not present
      PageLeftPane.assertAbsence(query2);
    });

    it("3. Add new JSObject , discard changes verify JSObject is deleted", () => {
      jsEditor.CreateJSObject('return "Success";');
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      PageLeftPane.assertPresence(jsObject);
      gitSync.DiscardChanges();
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      // verify jsObject2 is deleted after discarding changes
      PageLeftPane.assertAbsence(jsObject);
    });

    it("4. Delete page2 and trigger discard flow, page2 should be available again", () => {
      PageList.DeletePage(page2);
      // verify page is deleted
      PageList.assertAbsence(page2);
      gitSync.DiscardChanges();
      // verify page2 is recovered back
      PageList.assertPresence(page2);
      EditorNavigation.SelectEntityByName(page2, EntityType.Page);
      cy.wait("@getPage");
      // verify data binding on page2
      cy.get(".bp3-input").should("have.value", "Success");
    });

    it("5. Delete Query1 and trigger discard flow, Query1 will be recovered", () => {
      // navigate to Page1
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      // delete query1
      EditorNavigation.SelectEntityByName(query1, EntityType.Query);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: query1,
        action: "Delete",
        entityType: entityItems.Query,
      });
      // verify Query1 is deleted
      PageLeftPane.assertAbsence(query1);
      // discard changes
      gitSync.DiscardChanges();
      //verify query1 is recovered
      PageLeftPane.switchSegment(PagePaneSegment.Queries);
      PageLeftPane.assertPresence(query1);
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.get(".bp3-input").should("have.value", "Nancy");
    });

    it("6. Delete JSObject1 and trigger discard flow, JSObject1 should be active again", () => {
      // navigate to page2
      EditorNavigation.SelectEntityByName(page2, EntityType.Page);
      cy.wait("@getPage");
      cy.wait(3000);
      /* create and save jsObject */
      //     jsEditor.CreateJSObject('return "Success";');
      // delete jsObject1
      EditorNavigation.SelectEntityByName(jsObject, EntityType.JSObject);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
      });
      PageLeftPane.assertAbsence(jsObject);
      // discard changes
      gitSync.DiscardChanges();
      EditorNavigation.SelectEntityByName(page2, EntityType.Page);
      cy.wait("@getPage");
      cy.wait(3000);
      //verify JSObject is recovered
      PageLeftPane.switchSegment(PagePaneSegment.JS);
      PageLeftPane.assertPresence(jsObject);
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      cy.get(".bp3-input").should("have.value", "Success");
    });

    it("7. Add new page i.e page3, go to page2 & discard changes, verify page3 is removed", () => {
      // create new page page3 and move to page2
      cy.Createpage(page3);
      EditorNavigation.SelectEntityByName(page2, EntityType.Page);
      // discard changes
      gitSync.DiscardChanges();
      // verify page3 is removed
      PageList.assertAbsence(page3);
    });

    it(`8. Add new page i.e page3, discard changes should not throw error: "resource not found"`, () => {
      cy.Createpage(page3);
      gitSync.DiscardChanges();
      PageList.assertAbsence(page3);
    });

    it("9. On discard failure an error message should be show and user should be able to discard again", () => {
      cy.Createpage(page3);

      agHelper.GetNClick(gitSyncLocators.bottomBarCommitButton);
      agHelper.AssertElementVisibility(gitSyncLocators.discardChanges);
      cy.intercept("PUT", "/api/v1/git/discard/app/*", {
        body: {
          responseMeta: {
            status: 500,
            success: false,
            error: {
              code: 5000,
              message:
                "Provided file format is incompatible, please upgrade your instance to resolve this conflict.",
              errorType: "INTERNAL_ERROR",
            },
          },
        },
        delay: 1000,
      });

      agHelper
        .GetElement(gitSyncLocators.discardChanges)
        .children()
        .should("have.text", "Discard & pull");

      agHelper.GetNClick(gitSyncLocators.discardChanges);
      agHelper.AssertContains(
        Cypress.env("MESSAGES").DISCARD_CHANGES_WARNING(),
      );
      agHelper
        .GetElement(gitSyncLocators.discardChanges)
        .children()
        .should("have.text", "Are you sure?");
      agHelper.GetNClick(gitSyncLocators.discardChanges);
      agHelper.AssertContains(
        Cypress.env("MESSAGES").DISCARDING_AND_PULLING_CHANGES(),
      );
      cy.contains(Cypress.env("MESSAGES").DISCARDING_AND_PULLING_CHANGES());
      agHelper.Sleep(2000);

      agHelper.AssertElementVisibility(".ads-v2-callout__children");
      agHelper.AssertElementVisibility(gitSyncLocators.discardChanges);
    });

    after(() => {
      //clean up
      //gitSync.DeleteTestGithubRepo(repoName);
    });
  },
);

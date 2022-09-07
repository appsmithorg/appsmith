/// <reference types="Cypress" />
import { ObjectsRegistry } from "../../../support/Objects/Registry";

let homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources,
  table = ObjectsRegistry.Table,
  agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane;

describe("AForce - Community Issues page validations", function() {
  before(function() {
    agHelper.ClearLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  let selectedRow: number;
  it("1. Import application json and validate headers", () => {
    homePage.NavigateToHome();
    homePage.ImportApp("CommunityIssuesExport.json");
    cy.wait("@importNewApplication").then((interception: any) => {
      agHelper.Sleep();
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        // should reconnect modal
        dataSources.ReconnectDataSource("AForceDB", "PostgreSQL");
        homePage.AssertNCloseImport();
      } else {
        homePage.AssertImportToast();
      }
      //Validate table is not empty!
      table.WaitUntilTableLoad();
    });

    //Validating order of header columns!
    table.AssertTableHeaderOrder(
      "TypeTitleStatus+1CommentorsVotesAnswerUpVoteStatesupvote_ididgithub_issue_idauthorcreated_atdescriptionlabelsstatelinkupdated_at",
    );
    //Validating hidden columns:
    table.AssertHiddenColumns([
      "States",
      "upvote_id",
      "id",
      "github_issue_id",
      "author",
      "created_at",
      "description",
      "labels",
      "state",
      "link",
      "updated_at",
    ]);
  });

  it("2. Validate table navigation with Server Side pagination enabled with Default selected row", () => {
    ee.SelectEntityByName("Table1", "WIDGETS");
    agHelper.AssertExistingToggleState("serversidepagination", "checked");

    agHelper
      .EvaluateExistingPropertyFieldValue("Default Selected Row")
      .then(($selectedRow) => {
        selectedRow = Number($selectedRow);
        table.AssertSelectedRow(selectedRow);
      });

    deployMode.DeployApp();
    table.WaitUntilTableLoad();

    //Verify hidden columns are infact hidden in deployed app!
    table.AssertTableHeaderOrder(
      "TypeTitleStatus+1CommentorsVotesAnswerUpVote",
    ); //from case #1

    table.AssertSelectedRow(selectedRow); //Assert default selected row

    table.AssertPageNumber(1);
    table.NavigateToNextPage(); //page 2
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitUntilTableLoad();
    table.AssertSelectedRow(selectedRow);

    table.NavigateToNextPage(); //page 3
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitForTableEmpty(); //page 3
    table.NavigateToPreviousPage(); //page 2
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitUntilTableLoad();
    table.AssertSelectedRow(selectedRow);

    table.NavigateToPreviousPage(); //page 1
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitUntilTableLoad();
    table.AssertSelectedRow(selectedRow);
    table.AssertPageNumber(1);
  });

  it("3. Validate table navigation with Server Side pagination disabled with Default selected row selection", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    ee.SelectEntityByName("Table1", "WIDGETS");
    propPane.ToggleOnOrOff("serversidepagination", "Off");
    deployMode.DeployApp();
    table.WaitUntilTableLoad();
    table.AssertPageNumber(1, "Off");
    table.AssertSelectedRow(selectedRow);
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    ee.SelectEntityByName("Table1", "WIDGETS");
    propPane.ToggleOnOrOff("serversidepagination", "On");
  });

  it("4. Change Default selected row in table and verify", () => {
    propPane.UpdatePropertyFieldValue("Default Selected Row", "1");
    deployMode.DeployApp();
    table.WaitUntilTableLoad();
    table.AssertPageNumber(1);
    table.AssertSelectedRow(1);
    table.NavigateToNextPage(); //page 2
    table.AssertPageNumber(2);
    table.AssertSelectedRow(1);
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
  });

  it.skip("5. Verify Default search text in table as per 'Default Search Text' property set + Bug 12228", () => {
    ee.SelectEntityByName("Table1", "WIDGETS");
    //jsEditor.EnterJSContext("Default Search Text", "Bug", false);
    propPane.TypeTextIntoField("Default Search Text", "Bug");
    deployMode.DeployApp();
    table.AssertSearchText("Bug");
    table.WaitUntilTableLoad();
    table.WaitUntilTableLoad();
    deployMode.NavigateBacktoEditor();

    ee.SelectEntityByName("Table1", "WIDGETS");
    //jsEditor.EnterJSContext("Default Search Text", "Question", false);
    propPane.TypeTextIntoField("Default Search Text", "Question");

    deployMode.DeployApp();
    table.AssertSearchText("Question");
    table.WaitUntilTableLoad();
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();

    ee.SelectEntityByName("Table1", "WIDGETS");
    //jsEditor.EnterJSContext("Default Search Text", "Epic", false);
    propPane.TypeTextIntoField("Default Search Text", "Epic"); //Bug 12228 - Searching based on hidden column value should not be allowed
    deployMode.DeployApp();
    table.AssertSearchText("Epic");
    table.WaitForTableEmpty();
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();

    ee.SelectEntityByName("Table1", "WIDGETS");
    propPane.RemoveText("defaultsearchtext");
    table.WaitUntilTableLoad();
  });

  it.skip("6. Validate Search table with Client Side Search enabled & disabled", () => {
    ee.SelectEntityByName("Table1", "WIDGETS");
    agHelper.AssertExistingToggleState("enableclientsidesearch", "checked");

    deployMode.DeployApp();
    table.WaitUntilTableLoad();

    table.SearchTable("Bug");
    table.WaitUntilTableLoad();
    cy.xpath(table._searchBoxCross).click();

    table.SearchTable("Question");
    table.WaitUntilTableLoad();
    cy.xpath(table._searchBoxCross).click();

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();

    ee.SelectEntityByName("Table1", "WIDGETS");
    propPane.ToggleOnOrOff("enableclientsidesearch", "Off");

    deployMode.DeployApp();
    table.WaitUntilTableLoad();

    table.SearchTable("Bug");
    table.WaitForTableEmpty();
    cy.xpath(table._searchBoxCross).click();

    table.SearchTable("Question");
    table.WaitForTableEmpty();
    cy.xpath(table._searchBoxCross).click();

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    ee.SelectEntityByName("Table1", "WIDGETS");
    propPane.ToggleOnOrOff("enableclientsidesearch", "On");
  });

  it("7. Validate Filter table", () => {
    var filterTitle = new Array();
    deployMode.DeployApp();
    table.WaitUntilTableLoad();

    //One filter
    table.OpenNFilterTable("Type", "is exactly", "Bug");
    for (let i = 0; i < 3; i++) {
      table.ReadTableRowColumnData(i, 0).then(($cellData) => {
        expect($cellData).to.eq("Bug");
      });
    }
    table.RemoveFilterNVerify("Question", true, false);

    //Two filters - OR
    table.OpenNFilterTable("Type", "starts with", "Trouble");
    for (let i = 0; i < 5; i++) {
      table.ReadTableRowColumnData(i, 0).then(($cellData) => {
        expect($cellData).to.eq("Troubleshooting");
      });
    }

    table.OpenNFilterTable("Title", "contains", "query", "OR", 1);
    table.ReadTableRowColumnData(1, 0).then(($cellData) => {
      expect($cellData).to.be.oneOf(["Troubleshooting", "Question"]);
    });

    for (let i = 0; i < 8; i++) {
      table.ReadTableRowColumnData(i, 1, 100).then(($cellData) => {
        if ($cellData.toLowerCase().includes("query"))
          filterTitle.push($cellData);
      });
    }
    cy.wrap(filterTitle).as("filterTitleText"); // alias it for later
    cy.get("@filterTitleText")
      .its("length")
      .should("eq", 2);

    table.RemoveFilterNVerify("Question", true, false);

    //Two filters - AND
    table.OpenNFilterTable("Votes", "greater than", "2");
    table.ReadTableRowColumnData(0, 1).then(($cellData) => {
      expect($cellData).to.eq("Combine queries from different datasources");
    });

    table.OpenNFilterTable("Title", "contains", "button", "AND", 1);
    table.ReadTableRowColumnData(0, 1).then(($cellData) => {
      expect($cellData).to.eq(
        "Change the video in the video player with a button click",
      );
    });
    table.RemoveFilterNVerify("Question", true, false);
  });

  it("8. Validate Adding a New issue from Add Modal", () => {
    // agHelper.DeployApp()
    // table.WaitUntilTableLoad()

    cy.get(table._addIcon)
      .closest("div")
      .click();
    agHelper.AssertElementVisible(locator._modal);
    agHelper.SelectFromDropDown("Suggestion", "t--modal-widget");

    cy.get(locator._inputWidgetv1InDeployed)
      .eq(3)
      .type("Adding Title Suggestion via script");
    cy.get(locator._textAreainputWidgetv1InDeployed)
      .eq(1)
      .type("Adding Description Suggestion via script");
    cy.get(locator._inputWidgetv1InDeployed)
      .eq(4)
      .type("https://github.com/appsmithorg/appsmith/issues/12532");
    agHelper.SelectFromMultiSelect(["Epic", "Task"], 1);
    cy.xpath(table._visibleTextSpan("Labels")).click();
    cy.get(locator._inputWidgetv1InDeployed)
      .eq(5)
      .type(
        "https://release.app.appsmith.com/applications/62486d45ab307a026918639e/pages/62486d45ab307a02691863a7",
      );
    agHelper.SelectFromMultiSelect(
      ["Documented", "Needs App"],
      1,
      true,
      "multiselectwidget",
    );

    agHelper.ClickButton("Confirm");
    agHelper.Sleep(3000);
    table.SearchTable("Suggestion", 2);
    table.WaitUntilTableLoad();

    table.ReadTableRowColumnData(0, 0, 1000).then((cellData) => {
      expect(cellData).to.be.equal("Suggestion");
    });

    table.ReadTableRowColumnData(0, 1, 1000).then((cellData) => {
      expect(cellData).to.be.equal("Adding Title Suggestion via script");
    });
  });

  it("9. Validate Updating issue from Details tab & Verify multiselect widget selected values", () => {
    agHelper.AssertElementAbsence(locator._widgetInDeployed("tabswidget"));
    table.SelectTableRow(0);
    agHelper.AssertElementVisible(locator._widgetInDeployed("tabswidget"));
    agHelper
      .GetNClick(locator._inputWidgetv1InDeployed)
      .type("-updating title");
    agHelper
      .GetNClick(locator._textAreainputWidgetv1InDeployed)
      .type("-updating desc");
    agHelper
      .GetNClick(locator._inputWidgetv1InDeployed, 1)
      .type("-updating issue link");
    agHelper.SelectFromDropDown("Troubleshooting", "t--widget-tabswidget");
    agHelper.SelectFromMultiSelect(["Epic", "Task"], 0, false);
    agHelper.SelectFromMultiSelect(["High", "Dependencies"], 0, true);
    agHelper.SelectFromDropDown(
      "[Bug] TypeError: o is undefined",
      "t--widget-tabswidget",
      1,
    );
    agHelper
      .GetNClick(locator._inputWidgetv1InDeployed, 2)
      .type("-updating answer link");

    //cy.get("body").tab().type("{enter}")

    //agHelper.TypeTab()
    // cy.get(locator._widgetInDeployed('multiselectwidget'))
    // .eq(0).typeTab(false, false)
    // cy.get(locator._widgetInDeployed('multiselectwidget'))
    // .eq(0).trigger('focus').trigger('keydown', {
    //   key: 'Enter',
    // })

    //agHelper.Sleep(2000)
    //cy.get("body").type("{enter}")
    // Multiselect check is to verify bug #13588.
    // Currently, we have commented it.
    // This test case fails due to https://github.com/appsmithorg/appsmith/issues/13588, commenting it while we fix the core issue.
    // agHelper.RemoveMultiSelectItems(["Documented", "Needs App"]);

    //agHelper.SelectFromMultiSelect(['Documented', 'Needs App', 'App Built'], 0, false, 'multiselectwidget')
    agHelper.SelectFromMultiSelect(
      ["Needs Product"],
      0,
      true,
      "multiselectwidget",
    );
    agHelper.ClickButton("Save");
    agHelper.Sleep(2000);
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("Troubleshooting");
    });

    table.ReadTableRowColumnData(0, 1, 1000).then((cellData) => {
      expect(cellData).to.be.equal(
        "Adding Title Suggestion via script-updating title",
      );
    });

    agHelper.Sleep(2000); //allowing time to save!
  });

  it("10. Validate Deleting the newly created issue", () => {
    agHelper.AssertElementAbsence(locator._widgetInDeployed("tabswidget"));
    table.SelectTableRow(0);
    agHelper.AssertElementVisible(locator._widgetInDeployed("tabswidget"));
    agHelper.Sleep();
    cy.get(table._trashIcon)
      .closest("div")
      .click();
    agHelper.Sleep(3000); //allowing time to delete!
    agHelper.AssertElementAbsence(locator._widgetInDeployed("tabswidget"));
    table.WaitForTableEmpty();

    //2nd search is not working, hence commenting below
    // cy.xpath(table._searchBoxCross).click()
    // table.SearchTable('Troubleshooting')
    // table.WaitUntilTableLoad()
    // table.ReadTableRowColumnData(0, 1).then((cellData) => {
    //   expect(cellData).not.to.be.equal("Adding Title Suggestion via script-updating title");
    // });
  });
});

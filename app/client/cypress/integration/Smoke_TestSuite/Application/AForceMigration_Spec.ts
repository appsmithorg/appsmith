/// <reference types="Cypress" />
import { ObjectsRegistry } from "../../../support/Objects/Registry";

let homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources,
  table = ObjectsRegistry.Table,
  agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators;

describe("AForce - Community Issues page validations", function () {

  before(function () {
    agHelper.clearLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.restoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.saveLocalStorageCache();
  });

  let reconnect = true, selectedRow: number;
  it("1. Import application json and validate headers", () => {
    cy.visit("/applications");
    homePage.ImportApp("AForceMigrationExport.json", reconnect);
    cy.wait("@importNewApplication").then((interception: any) => {
      cy.wait(100);
      const { isPartialImport } = interception.response.body.data;
      if (isPartialImport) {
        // should reconnect modal
        dataSources.ReconnectDataSourcePostgres("AForceDB")
      } else {
        agHelper.ValidateToastMessage("Application imported successfully")
      }
      //Validate table is not empty!
      table.WaitUntilTableLoad()
      //Validating order of header columns!
      table.AssertTableHeaderOrder("TypeTitleStatus+1CommentorsVotesAnswerUpVoteStatesupvote_ididgithub_issue_idauthorcreated_atdescriptionlabelsstatelinkupdated_at")
      //Validating hidden columns:
      table.AssertHiddenColumns(['States', 'upvote_id', 'id', 'github_issue_id', 'author', 'created_at', 'description', 'labels', 'state', 'link', 'updated_at'])
    });
  });

  it("2. Validate table navigation with Server Side pagination enabled with Default selected row", () => {
    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.AssertExistingToggleState("serversidepagination", 'checked')

    agHelper.EvaluateExistingPropertyFieldValue("Default Selected Row")
      .then($selectedRow => {
        selectedRow = Number($selectedRow);
        table.AssertSelectedRow(selectedRow)
      });

    agHelper.DeployApp()
    table.WaitUntilTableLoad()

    //Verify hidden columns are infact hidden in deployed app!
    table.AssertTableHeaderOrder("TypeTitleStatus+1CommentorsVotesAnswerUpVote")//from case #1

    table.AssertSelectedRow(selectedRow)//Assert default selected row

    table.AssertPageNumber(1);
    table.NavigateToNextPage()//page 2
    agHelper.Sleep(3000)//wait for table navigation to take effect!
    table.WaitUntilTableLoad()
    table.AssertSelectedRow(selectedRow)


    table.NavigateToNextPage()//page 3
    agHelper.Sleep(3000)//wait for table navigation to take effect!
    table.WaitForTableEmpty()//page 3
    table.NavigateToPreviousPage()//page 2
    agHelper.Sleep(3000)//wait for table navigation to take effect!
    table.WaitUntilTableLoad()
    table.AssertSelectedRow(selectedRow)

    table.NavigateToPreviousPage()//page 1
    agHelper.Sleep(3000)//wait for table navigation to take effect!
    table.WaitUntilTableLoad()
    table.AssertSelectedRow(selectedRow)
    table.AssertPageNumber(1);

  })

  it("3. Validate table navigation with Server Side pagination disabled with Default selected row selection", () => {

    agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()
    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.ToggleOnOrOff('serversidepagination', 'Off')
    agHelper.DeployApp()
    table.WaitUntilTableLoad()
    table.AssertPageNumber(1, 'Off');
    table.AssertSelectedRow(selectedRow)
    agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()
    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.ToggleOnOrOff('serversidepagination', 'On')

  });

  it("4. Change Default selected row in table and verify", () => {

    jsEditor.EnterJSContext("Default Selected Row", "1")
    agHelper.DeployApp()
    table.WaitUntilTableLoad()
    table.AssertPageNumber(1);
    table.AssertSelectedRow(1)
    table.NavigateToNextPage()//page 2
    table.AssertPageNumber(2);
    table.AssertSelectedRow(1)
    agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()

  });

  it.skip("5. Verify Default search text in table as per 'Default Search Text' property set + Bug 12228", () => {

    ee.SelectEntityByName("Table1", 'WIDGETS')
    jsEditor.EnterJSContext("Default Search Text", "Bug", false)
    agHelper.DeployApp()
    table.AssertSearchText('Bug')
    table.WaitUntilTableLoad()
    table.WaitUntilTableLoad()
    agHelper.NavigateBacktoEditor()

    ee.SelectEntityByName("Table1", 'WIDGETS')
    jsEditor.EnterJSContext("Default Search Text", "Question", false)
    agHelper.DeployApp()
    table.AssertSearchText('Question')
    table.WaitUntilTableLoad()
    agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()

    ee.SelectEntityByName("Table1", 'WIDGETS')
    jsEditor.EnterJSContext("Default Search Text", "Epic", false)//Bug 12228 - Searching based on hidden column value should not be allowed
    agHelper.DeployApp()
    table.AssertSearchText('Epic')
    table.WaitForTableEmpty()
    agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()

    ee.SelectEntityByName("Table1", 'WIDGETS')
    jsEditor.RemoveText('defaultsearchtext')
    table.WaitUntilTableLoad()

  });

  it.skip("6. Validate Search table with Client Side Search enabled & disabled", () => {
    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.AssertExistingToggleState("enableclientsidesearch", 'checked')

    agHelper.DeployApp()
    table.WaitUntilTableLoad()

    table.SearchTable('Bug')
    table.WaitUntilTableLoad()
    cy.xpath(table._searchBoxCross).click()

    table.SearchTable('Question')
    table.WaitUntilTableLoad()
    cy.xpath(table._searchBoxCross).click()

    agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()

    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.ToggleOnOrOff("enableclientsidesearch", 'Off')

    agHelper.DeployApp()
    table.WaitUntilTableLoad()

    table.SearchTable('Bug')
    table.WaitForTableEmpty()
    cy.xpath(table._searchBoxCross).click()

    table.SearchTable('Question')
    table.WaitForTableEmpty()
    cy.xpath(table._searchBoxCross).click()

    agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()
    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.ToggleOnOrOff("enableclientsidesearch", 'On')
  })

  it("7. Validate Filter table", () => {
    agHelper.DeployApp()
    table.WaitUntilTableLoad()

    //One filter
    table.FilterTable("Type", "is exactly", "Bug")
    table.ReadTableRowColumnData(0, 1).then(($cellData) => {
      expect($cellData).to.eq("[Bug]: Postgres queries unable to execute with more than 9 placeholders");
    });
    table.ReadTableRowColumnData(2, 1).then(($cellData) => {
      expect($cellData).to.eq("[Bug]: Input updates with default values are not captured");
    });
    table.RemoveFilterNVerify("Question", true, false)

    //Two filters - OR
    table.FilterTable("Type", "starts with", "Trouble")
    table.ReadTableRowColumnData(0, 0).then(($cellData) => {
      expect($cellData).to.eq("Troubleshooting");
    });
    table.ReadTableRowColumnData(0, 1).then(($cellData) => {
      expect($cellData).to.eq("Renew expired SSL certificate on a self-hosted instance");
    });

    table.FilterTable("Title", "contains", "query", 'OR', 1)
    table.ReadTableRowColumnData(1, 0).then(($cellData) => {
      expect($cellData).to.eq("Question");
    });
    table.ReadTableRowColumnData(7, 1).then(($cellData) => {
      expect($cellData).to.eq("Run storeValue commands before a Query.run()");
    });
    table.RemoveFilterNVerify("Question", true, false)

     //Two filters - AND
     table.FilterTable("Votes", "greater than", "3")
     table.ReadTableRowColumnData(1, 1).then(($cellData) => {
       expect($cellData).to.eq("Combine queries from different datasources");
     });
 
     table.FilterTable("Title", "contains", "button", 'AND', 1)
     table.ReadTableRowColumnData(0, 1).then(($cellData) => {
       expect($cellData).to.eq("Change the video in the video player with a button click");
     });
     table.RemoveFilterNVerify("Question", true, false)
  })
  
  it("8. Validate Adding a New issue from Add Modal", () => {
    // agHelper.DeployApp()
    // table.WaitUntilTableLoad()

    cy.get(table._addIcon).closest('div').click()
    agHelper.AssertElementPresence(locator._modal)
    agHelper.SelectFromDropDown('Suggestion', 't--modal-widget')

    cy.get(locator._inputWidgetv1InDeployed).eq(3).type("Adding Title Suggestion via script")
    cy.get(locator._textAreainputWidgetv1InDeployed).eq(1).type("Adding Description Suggestion via script")
    cy.get(locator._inputWidgetv1InDeployed).eq(4).type("https://github.com/appsmithorg/appsmith/issues/12532")
    agHelper.SelectFromMultiSelect(['Epic', 'Task'], 1)
    cy.xpath(table._visibleTextSpan('Labels')).click()
    cy.get(locator._inputWidgetv1InDeployed).eq(5).type("https://release.app.appsmith.com/applications/62486d45ab307a026918639e/pages/62486d45ab307a02691863a7")
    agHelper.SelectFromMultiSelect(['Documented', 'Needs App'], 1, true, 'multiselectwidget')

    agHelper.ClickButton('Confirm')
    agHelper.Sleep(3000)
    table.SearchTable('Suggestion', 2)
    table.WaitUntilTableLoad()

    table.ReadTableRowColumnData(0, 0, 1000).then((cellData) => {
      expect(cellData).to.be.equal("Suggestion");
    });

    table.ReadTableRowColumnData(0, 1, 1000).then((cellData) => {
      expect(cellData).to.be.equal("Adding Title Suggestion via script");
    });

  })

  it("9. Validate Updating issue from Details tab", () => {

    agHelper.AssertElementAbsence(locator._widgetInDeployed('tabswidget'))
    table.SelectTableRow(0)
    agHelper.AssertElementPresence(locator._widgetInDeployed('tabswidget'))
    agHelper.Sleep(2000)//load time for tabs
    agHelper.GetNClick(locator._inputWidgetv1InDeployed).type("-updating title")
    agHelper.GetNClick(locator._textAreainputWidgetv1InDeployed).type("-updating desc")
    agHelper.GetNClick(locator._inputWidgetv1InDeployed, 1).type("-updating issue link")
    agHelper.SelectFromDropDown('Troubleshooting', 't--widget-tabswidget')
    agHelper.SelectFromMultiSelect(['Epic', 'Task'], 0, false)
    agHelper.SelectFromMultiSelect(['High', 'Dependencies'], 0, true)
    agHelper.SelectFromDropDown('[Bug] TypeError: o is undefined', 't--widget-tabswidget', 1)
    agHelper.GetNClick(locator._inputWidgetv1InDeployed, 2).type("-updating answer link")

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

    agHelper.RemoveMultiSelectItems(['Documented', 'Needs App'])

    //agHelper.SelectFromMultiSelect(['Documented', 'Needs App', 'App Built'], 0, false, 'multiselectwidget')
    agHelper.SelectFromMultiSelect(['Needs Product'], 0, true, 'multiselectwidget')
    agHelper.ClickButton('Save')

    table.ReadTableRowColumnData(0, 0, 1000).then((cellData) => {
      expect(cellData).to.be.equal("Troubleshooting");
    });

    table.ReadTableRowColumnData(0, 1, 1000).then((cellData) => {
      expect(cellData).to.be.equal("Adding Title Suggestion via script-updating title");
    });

  })

  it("10. Validate Deleting the newly created issue", () => {
    agHelper.AssertElementAbsence(locator._widgetInDeployed('tabswidget'))
    table.SelectTableRow(0)
    agHelper.AssertElementPresence(locator._widgetInDeployed('tabswidget'))
    cy.get(table._trashIcon).closest('div').click()
    agHelper.AssertElementAbsence(locator._widgetInDeployed('tabswidget'))
    table.WaitForTableEmpty()

    //2nd search is not working, hence commenting below
    // cy.xpath(table._searchBoxCross).click()
    // table.SearchTable('Troubleshooting')
    // table.WaitUntilTableLoad()
    // table.ReadTableRowColumnData(0, 1).then((cellData) => {
    //   expect(cellData).not.to.be.equal("Adding Title Suggestion via script-updating title");
    // });
  });
});

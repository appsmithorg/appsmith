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

  let reconnect = true, selectedRow: number;
  it("1. Import application json and validate headers", () => {

    homePage.ImportApp("AForceMigrationExport.json", reconnect)
    if (reconnect)
      dataSources.ReconnectDataSourcePostgres("AForceDB")
    //Validate table is not empty!
    table.WaitUntilTableLoad()
    //Validating order of header columns!
    table.AssertTableHeaderOrder("TypeTitleStatus+1CommentorsVotesAnswerUpVoteStatesupvote_ididgithub_issue_idauthorcreated_atdescriptionlabelsstatelinkupdated_at")
    //Validating hidden columns:
    table.AssertHiddenColumns(['States', 'upvote_id', 'id', 'github_issue_id', 'author', 'created_at', 'description', 'labels', 'state', 'link', 'updated_at'])

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

    jsEditor.EnterJSContext("defaultselectedrow", "1", true)
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
    jsEditor.EnterJSContext("defaultsearchtext", "Bug", true)
    agHelper.DeployApp()
    table.AssertSearchText('Bug')
    table.WaitUntilTableLoad()
    table.WaitUntilTableLoad()
    agHelper.NavigateBacktoEditor()

    ee.SelectEntityByName("Table1", 'WIDGETS')
    jsEditor.EnterJSContext("defaultsearchtext", "Question", true)
    agHelper.DeployApp()
    table.AssertSearchText('Question')
    table.WaitUntilTableLoad()
    agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()

    ee.SelectEntityByName("Table1", 'WIDGETS')
    jsEditor.EnterJSContext("defaultsearchtext", "Epic", true)//Bug 12228 - Searching based on hidden column value should not be allowed
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
    cy.xpath(table._searchBoxCross).click(),

      table.SearchTable('Question')
    table.WaitUntilTableLoad()
    cy.xpath(table._searchBoxCross).click(),

      agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()

    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.ToggleOnOrOff("enableclientsidesearch", 'Off')

    agHelper.DeployApp()
    table.WaitUntilTableLoad()

    table.SearchTable('Bug')
    table.WaitForTableEmpty()
    cy.xpath(table._searchBoxCross).click(),

      table.SearchTable('Question')
    table.WaitForTableEmpty()
    cy.xpath(table._searchBoxCross).click(),

      agHelper.NavigateBacktoEditor()
    table.WaitUntilTableLoad()
    ee.SelectEntityByName("Table1", 'WIDGETS')
    agHelper.ToggleOnOrOff("enableclientsidesearch", 'On')
  })

  // it.skip("7. Validate Filter table", () => {

  // })


  it("8. Validate Adding a New issue from Add Modal", () => {

    agHelper.DeployApp()
    table.WaitUntilTableLoad()

    cy.get(table._addIcon).closest('div').click()
    agHelper.AssertElementPresence(locator._modal)
    agHelper.SelectDropDown('Suggestion', 'dropdownwidget')

    cy.get(locator._inputWidgetv1InDeployed).eq(0).type("Adding Title Suggestion via script")
    cy.get(locator._inputWidgetv1InDeployed).eq(1).type("Adding Description Suggestion via script")
    cy.get(locator._inputWidgetv1InDeployed).eq(2).type("https://github.com/appsmithorg/appsmith/issues/12532")
    agHelper.SelectFromMultiSelect(['Epic', 'Task'], 0)
    cy.get(locator._inputWidgetv1InDeployed).eq(3).type("https://release.app.appsmith.com/applications/62486d45ab307a026918639e/pages/62486d45ab307a02691863a7")
    agHelper.SelectFromMultiSelect(['Documented', 'Needs App'], 1, 'multiselectwidget')

    agHelper.ClickButton('Confirm')
    table.SearchTable('Suggestion')
    table.WaitUntilTableLoad()

    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("Suggestion");
    });

    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("Adding Title Suggestion via script");
    });

  })


  // it("9. Validate Updating issue from Details tab", () => {

  // })

  // it.skip("10. Validate Deleting the newly created issue", () => {

  //});
});

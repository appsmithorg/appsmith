import * as _ from "../../../../../support/Objects/ObjectsCore";
import { WIDGET } from "../../../../../locators/WidgetLocators";
import {
  ERROR_ACTION_EXECUTE_FAIL,
  createMessage,
} from "../../../../../support/Objects/CommonErrorMessages";

const listData = [
  {
    id: 10,
    name: "okbuddy",
  },
  {
    id: 11,
    name: "Aliess",
  },
  {
    id: 14,
    name: "Aliess123",
  },
  {
    id: 15,
    name: "Aliess",
  },
];

let dsName: any;
let userName, userEmail;

describe("Verify List widget binding, Server side Pagination & functionalities with Queries and API", function() {
  before(() => {
    const apiUrl = `http://host.docker.internal:5001/v1/mock-api?records=10`;
    _.apiPage.CreateAndFillApi(apiUrl, "API1");
    _.apiPage.RunAPI();
    _.agHelper.GetNClick(_.locators._jsonTab);
    _.apiPage.ReadApiResponsebyKey("name");
    cy.get("@apiResp").then((name) => {
      userName = name.trim();
    });
    _.apiPage.ReadApiResponsebyKey("email");
    cy.get("@apiResp").then((email) => {
      userEmail = email.trim();
    });
    _.agHelper.AssertElementAbsence(
      _.locators._specificToast(
        createMessage(ERROR_ACTION_EXECUTE_FAIL, "API1"),
      ),
    );
    _.apiPage.ResponseStatusCheck("200 OK");
  });

  it("1. Create new API & verify data on List widget", function() {
    _.ee.NavigateToSwitcher("widgets")
    _.ee.DragDropWidgetNVerify(WIDGET.LIST, 300, 100);
    _.propPane.UpdatePropertyFieldValue("Items", "{{API1.data}}");
    _.ee.NavigateToSwitcher("explorer");
    _.ee.ExpandCollapseEntity("List1");
    _.ee.ExpandCollapseEntity("Container1");
    _.ee.SelectEntityByName("Text1");
    _.propPane.UpdatePropertyFieldValue("Text", "{{currentItem.name}}");
    _.agHelper.GetNAssertElementText(
      _.locators._textWidget,
      userName,
      "have.text",
      0,
    );
    _.ee.SelectEntityByName("Text2");
    _.propPane.UpdatePropertyFieldValue("Text", "{{currentItem.email}}");
    _.agHelper.GetNAssertElementText(
      _.locators._textWidget,
      userEmail,
      "have.text",
      1,
    );
  });

  it("2. Verify 'onListitemClick' functionality of Show messgage event on deploy mode", function() {
    _.ee.SelectEntityByName("List1");
    _.propPane.EnterJSContext(
      "onListItemClick",
      "{{showAlert('ListWidget_' + currentItem.name + '_' + currentItem.email,'success')}}",
      true,
    );
    _.deployMode.DeployApp();
    _.agHelper.WaitUntilEleAppear(_.locators._listWidget);
    _.agHelper.GetNClick(_.locators._containerWidget, 0, true);
    _.agHelper.AssertContains("ListWidget"+"_"+ userName +"_" + userEmail);
    _.agHelper.GetNClick(_.locators._containerWidget, 1, true);
    _.agHelper.AssertContains("ListWidget"+"_"+ userName +"_" + userEmail);
    _.deployMode.NavigateBacktoEditor();
  });

  it("3. Verify pagination and also verify Next_Page/Prev_Page disabled when List reach to last/first page", function() {
    _.agHelper.WaitUntilEleAppear(_.locators._listWidget);
    _.ee.SelectEntityByName("List1", "Widgets");
    _.propPane.UpdatePropertyFieldValue("Items", JSON.stringify(listData));
    _.deployMode.DeployApp();
    _.agHelper.WaitUntilEleAppear(_.locators._listWidget);
    _.tableV2.AssertPageNumber_List(1);
    _.tableV2.NavigateToNextPage_List();
    _.tableV2.AssertPageNumber_List(2, true);
    _.tableV2.NavigateToPreviousPage_List();
    _.tableV2.AssertPageNumber_List(1);
    _.deployMode.NavigateBacktoEditor();
    _.agHelper.Sleep();
  });


  it("4. Verify List widget with error message on wrong input", function() {
    _.ee.ExpandCollapseEntity("Widgets");
    _.ee.ExpandCollapseEntity("List1");
    _.ee.ExpandCollapseEntity("Container1");
    _.ee.SelectEntityByName("Text1");
    _.propPane.UpdatePropertyFieldValue("Text", "{{text}}");
    _.agHelper.VerifyEvaluatedErrorMessage(
      "ReferenceError: text is not defined",
    );
    _.ee.SelectEntityByName("List1");
    _.propPane.UpdatePropertyFieldValue(
      "Items",
      "{'id': '001', 'name': 'Blue', img': 'https://assets.appsmith.com/widgets/default.png'}",
    );
    _.agHelper.VerifyEvaluatedErrorMessage(
      "This value does not evaluate to type Array",
    );
    _.agHelper.Sleep();
  });

  it("5. Verify Copy/Paste/Delete the copied List widget", function() {
    _.ee.SelectEntityByName("List1");
    _.ee.CopyPasteWidget("List1");
    _.agHelper.AssertElementExist(_.locators._listWidget, 1);
    _.agHelper.GetNAssertElementText(
      _.locators._propertyPaneTitle,
      "List1Copy",
      "have.text",
    );
    _.agHelper.Sleep();

    _.ee.SelectEntityByName("List1Copy");
    _.agHelper.GetNClick(_.propPane._deleteWidget);
  });

  it("6. Verify Pagination in Server side pagination and verify no pagination visible when Server Side Pagination is disabled", function() {
    _.ee.NavigateToSwitcher("explorer");
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      _.dataSources.CreateNewQueryInDS(
        dsName,
        "SELECT * FROM hogwartsstudents LIMIT {{List1.pageSize}} offset {{(List1.pageNo-1)*List1.pageSize}}",
        "postgres_ssp",
      );
      _.dataSources.ToggleUsePreparedStatement(false);
      _.dataSources.RunQuery(true);
      _.ee.SelectEntityByName("List1");
      _.propPane.UpdatePropertyFieldValue("Items", "{{postgres_ssp.data}}");
      _.propPane.ToggleOnOrOff("Server Side Pagination", "On");
      _.propPane.EnterJSContext("onPageChange", "{{postgres_ssp.run()}}", true);
      _.ee.ExpandCollapseEntity("List1");
      _.ee.ExpandCollapseEntity("Container1");
      _.ee.SelectEntityByName("Text1");
      _.propPane.UpdatePropertyFieldValue("Text", "{{currentItem.name}}");
      _.deployMode.DeployApp();
      _.agHelper.WaitUntilEleAppear(_.locators._listWidget);

      _.tableV2.AssertPageNumber_List(1, false, true);
      _.tableV2.AssertListPagesPresent(2, false);
      _.tableV2.NavigateToNextPage_List();
      _.tableV2.AssertPageNumber_List(2, false, true);
      _.tableV2.AssertListPagesPresent(1, false);
      _.tableV2.NavigateToPreviousPage_List();
      _.tableV2.AssertPageNumber_List(1, false, true);
      _.deployMode.NavigateBacktoEditor();
      _.ee.SelectEntityByName("List1", "Widgets");
      _.propPane.ToggleOnOrOff("Server Side Pagination", "Off");
      _.agHelper.AssertElementAbsence(_.tableV2._liPaginateItem);
      _.deployMode.DeployApp();
      _.agHelper.WaitUntilEleAppear(_.locators._listWidget);
      _.agHelper.AssertElementAbsence(_.tableV2._liPaginateItem);
      _.deployMode.NavigateBacktoEditor();
      _.agHelper.Sleep();
    });
  });

  it("7. Verify onPageSizeChange functionality in Server Side Pagination of list widget", function() {
    _.ee.SelectEntityByName("List1");
    _.propPane.ToggleOnOrOff("Server Side Pagination", "On");
    _.propPane.EnterJSContext(
      "onPageSizeChange",
      "{{showAlert('Page size changed ' + List1.pageSize)}}",
      true,
    );
    _.propPane.ToggleOnOrOff("Server Side Pagination", "Off");
    _.propPane.ToggleOnOrOff("Server Side Pagination", "On");
    _.agHelper.AssertContains("Page size changed 2");
    _.agHelper.Sleep();
  });

  it("8. Delete the List widget from canvas and verify it", function() {
    _.ee.SelectEntityByName("List1");
    _.agHelper.GetNClick(_.propPane._deleteWidget);
    _.agHelper.AssertContains("List1 is removed");
    _.deployMode.DeployApp();
    _.agHelper.Sleep(2000);
    _.agHelper.AssertElementAbsence(_.locators._listWidget);
    _.deployMode.NavigateBacktoEditor();
  });


  after(() => {
    _.ee.ExpandCollapseEntity("Queries/JS");
    _.ee.ActionContextMenuByEntityName("API1", "Delete", "Are you sure?");
    _.ee.ActionContextMenuByEntityName(
      "postgres_ssp",
      "Delete",
      "Are you sure?",
    );
  });
});


import * as _ from "../../../../../support/Objects/ObjectsCore";
import { getWidgetSelector, PROPERTY_SELECTOR, WIDGET } from "../../../../../locators/WidgetLocators";
import {
    ERROR_ACTION_EXECUTE_FAIL,
    createMessage,
  } from "../../../../../support/Objects/CommonErrorMessages";
import { __esModule } from "cypress-image-snapshot/constants";

let dsName : any;

describe("Verify List widget binding & functionalities with Queries and API", function() {

it("1. Create new API validate binding on List widget", function(){
    const apiUrl = `https://thronesapi.com/api/v2/Characters`
    _.apiPage.CreateAndFillApi(apiUrl,"API1")
    _.apiPage.RunAPI()
    _.agHelper.AssertElementAbsence(
        _.locators._specificToast(
            createMessage(ERROR_ACTION_EXECUTE_FAIL, "API1")
        ),
    )
    _.apiPage.ResponseStatusCheck("200 OK")
    _.ee.DragDropWidgetNVerify(WIDGET.LIST, 300,100)
    _.propPane.UpdatePropertyFieldValue("Items", "{{API1.data}}")
    _.ee.NavigateToSwitcher("explorer")
    _.ee.ExpandCollapseEntity("List1")
    _.ee.ExpandCollapseEntity("Container1")
    _.ee.SelectEntityByName("Text1")
    _.propPane.UpdatePropertyFieldValue("Text", "{{currentItem.family}}")
    _.agHelper.GetNAssertElementText(_.locators._textWidget,"House Targaryen","have.text",0)
    _.ee.SelectEntityByName("Text2")
    _.propPane.UpdatePropertyFieldValue("Text", "{{currentItem.id}}")
    _.agHelper.GetNAssertElementText(_.locators._textWidget,"0","have.text",1)
})

it("2. Verify 'onListitemClick' functionality of Show messgage event on deploy mode",function(){
    _.agHelper.GetNClick(_.locators._listWidget,0,true)
    _.propPane.EnterJSContext(
        "onListItemClick","{{showAlert('ListWidget_' + currentItem.family + '_' + currentItem.id,'success')}}"
        ,true)
    _.deployMode.DeployApp()
    _.agHelper.WaitUntilEleAppear(_.locators._listWidget)
    _.agHelper.GetNClick(_.locators._containerWidget,0,true)
    _.agHelper.ValidateToastMessage("ListWidget_House Targaryen_0")
    _.agHelper.WaitUntilAllToastsDisappear()
    _.agHelper.GetNClick(_.locators._containerWidget,1,true)
    _.agHelper.ValidateToastMessage("ListWidget_House Tarly_1")
    _.deployMode.NavigateBacktoEditor()
    _.agHelper.Sleep()
})

it("3. Verify pagination and also verify Next_Page/Prev_Page disabled when List reach to last/first page", function(){
    _.agHelper.GetNClick(_.locators._listWidget,0,true)
    _.ee.NavigateToSwitcher("explorer")
    _.dataSources.CreateDataSource("MySql")
    cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        _.dataSources.CreateNewQueryInDS(
            dsName,
            "SELECT * FROM users where role = 'Admin' ORDER BY id LIMIT 4",
            "Query1_mysql",
        )
        _.dataSources.ToggleUsePreparedStatement(false)
        _.dataSources.RunQuery(true)
        _.ee.NavigateToSwitcher("widgets")
        _.agHelper.GetNClick(_.locators._listWidget,0,true)
        _.propPane.UpdatePropertyFieldValue("Items", "{{Query1_mysql.data}}")
        _.deployMode.DeployApp()
        _.agHelper.WaitUntilEleAppear(_.locators._listWidget)
        _.agHelper.GetNAssertElementText(_.locators._listPaginateActivePage,"1","have.text")
        _.agHelper.GetNClick(_.locators._listPaginateNextButton)
        _.agHelper.GetNAssertElementText(_.locators._listPaginateActivePage,"2","have.text")
        _.agHelper.AssertElementDisabled(_.locators._listPaginateButtonsDisabled,"true")
        _.agHelper.GetNClick(_.locators._listPaginatePrevButton)
        _.agHelper.GetNAssertElementText(_.locators._listPaginateActivePage,"1","have.text")
        _.agHelper.AssertElementDisabled(_.locators._listPaginateButtonsDisabled,"true")
        _.deployMode.NavigateBacktoEditor()
        _.agHelper.Sleep()
       
    })
})

it("4. Delete the List widget from canvas and verify it",function(){
    _.agHelper.GetNClick(_.locators._listWidget,0,true)
    _.agHelper.GetNAssertElementText(_.locators._propertyPaneTitle,"List1","have.text")
    _.agHelper.GetNClick(_.propPane._deleteWidget)
    _.agHelper.ValidateToastMessage("List1 is removed")
    _.deployMode.DeployApp()
    _.agHelper.Sleep(2000)
    _.agHelper.AssertElementAbsence(_.locators._listWidget)
    _.deployMode.NavigateBacktoEditor()
})

it("5. Verify List widget with error message on wrong input", function(){
    _.ee.DragDropWidgetNVerify(WIDGET.LIST, 300,100)
    _.ee.NavigateToSwitcher("explorer")
    _.ee.ExpandCollapseEntity("List1")
    _.ee.ExpandCollapseEntity("Container1")
    _.ee.SelectEntityByName("Text1")
    _.propPane.UpdatePropertyFieldValue("Text", "{{text}}")
    _.agHelper.VerifyEvaluatedErrorMessage("ReferenceError: text is not defined")
    _.agHelper.GetNClick(_.locators._listWidget,0,true)
    _.propPane.UpdatePropertyFieldValue("Items", 
        "{'id': '001', 'name': 'Blue', img': 'https://assets.appsmith.com/widgets/default.png'}")
    _.agHelper.VerifyEvaluatedErrorMessage("This value does not evaluate to type Array")
    _.agHelper.Sleep()
})

it("6. Copy/Paste List widget", function(){
    _.agHelper.GetNClick(_.locators._listWidget,0,true)
    _.ee.CopyPasteWidget("List1")
    _.agHelper.AssertElementExist(_.locators._listWidget,1)
    _.agHelper.GetNAssertElementText(_.locators._propertyPaneTitle,"List1Copy","have.text")
    _.agHelper.Sleep() 
})


it("7. Verify Pagination in SSP and no pagination visible on disabling SSP", function(){
    _.agHelper.GetNClick(_.locators._listWidget,1,true)
    _.ee.NavigateToSwitcher("explorer")
    _.dataSources.CreateDataSource("Postgres")
    cy.get("@dsName").then(($dsName)=> {
        dsName = $dsName
        _.dataSources.CreateNewQueryInDS(
            dsName,
            "SELECT * FROM mockusers_v2 LIMIT {{List1Copy.pageSize}} offset {{(List1Copy.pageNo-1)*List1Copy.pageSize}}",
            "postgres_ssp",
        )
        _.dataSources.ToggleUsePreparedStatement(false)
        _.dataSources.RunQuery(true)
        _.ee.NavigateToSwitcher("widgets")
        _.agHelper.GetNClick(_.locators._listWidget,1,true)
        _.propPane.ToggleOnOrOff("Server Side Pagination", "On")
        _.propPane.EnterJSContext("onPageChange","{{postgres_ssp.run()}}",true)
        _.propPane.UpdatePropertyFieldValue("Items", "{{postgres_ssp.data}}")
        _.ee.NavigateToSwitcher("explorer")
        _.ee.ExpandCollapseEntity("Widgets")
        _.ee.ExpandCollapseEntity("List1Copy")
        _.ee.ExpandCollapseEntity("Container1Copy")
        _.ee.SelectEntityByName("Text2Copy")
        _.propPane.UpdatePropertyFieldValue("Text", "{{currentItem.phone}}")
        _.ee.SelectEntityByName("Image1Copy")
        _.propPane.UpdatePropertyFieldValue("Image", "{{currentItem.image}}")
        _.deployMode.DeployApp()
        _.agHelper.WaitUntilEleAppear(_.locators._listWidget)
        _.agHelper.GetNAssertElementText(_.locators._listPaginateActivePage,"1","have.text")
        _.agHelper.GetNAssertElementText(_.locators._listPaginateItem,"2","not.have.text")
        _.agHelper.GetNClick(_.locators._listPaginateNextButton)
        _.agHelper.GetNAssertElementText(_.locators._listPaginateActivePage,"2","have.text")
        _.deployMode.NavigateBacktoEditor()
        _.agHelper.GetNClick(_.locators._listWidget,1,true)
        _.propPane.ToggleOnOrOff("Server Side Pagination", "Off")
        _.agHelper.AssertElementAbsence(_.locators._listPaginateItem)
        _.agHelper.Sleep()
    })
})

it("8. Verify onPageSizeChange functionality in SSP of list widget", function(){
    _.propPane.ToggleOnOrOff("Server Side Pagination", "On")
    _.propPane.EnterJSContext("onPageSizeChange", "{{showAlert('Page size changed ' + List1Copy.pageSize)}}", true)
    _.propPane.ToggleOnOrOff("Server Side Pagination","Off")
    _.propPane.ToggleOnOrOff("Server Side Pagination","On")
    _.agHelper.ValidateToastMessage("Page size changed 2")
    _.agHelper.Sleep()
    
})

})

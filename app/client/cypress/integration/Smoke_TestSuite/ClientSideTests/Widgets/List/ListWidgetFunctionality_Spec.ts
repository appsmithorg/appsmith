import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
import { getWidgetSelector, PROPERTY_SELECTOR, WIDGET } from "../../../../../locators/WidgetLocators";
import {
    ERROR_ACTION_EXECUTE_FAIL,
    createMessage,
  } from "../../../../../support/Objects/CommonErrorMessages";
import { EntityExplorer } from "../../../../../support/Pages/EntityExplorer";
import { first, propertyOf } from "lodash";
import { data } from "cypress/types/jquery";
import { listenerCount, on } from "process";

const agHelper = ObjectsRegistry.AggregateHelper,
propPane = ObjectsRegistry.PropertyPane,
ee = ObjectsRegistry.EntityExplorer,
locator = ObjectsRegistry.CommonLocators,
deployMode = ObjectsRegistry.DeployMode,
apiPage = ObjectsRegistry.ApiPage,
dataSources = ObjectsRegistry.DataSources;

let dsName : any;

describe("Verify List widget binding with Queries and API", function() {

it("1. Create new API and bind it with List widget", function(){
    const apiUrl = `https://thronesapi.com/api/v2/Characters`
    apiPage.CreateAndFillApi(apiUrl,"API1")
    apiPage.RunAPI()
    agHelper.AssertElementAbsence(
        locator._specificToast(
            createMessage(ERROR_ACTION_EXECUTE_FAIL, "API1")
        ),
    )
    apiPage.ResponseStatusCheck("200 OK")
    ee.DragDropWidgetNVerify(WIDGET.LIST, 300,100)
    propPane.UpdatePropertyFieldValue("Items", "{{API1.data}}")
    agHelper.Sleep(2000)
    // Selecting widgets inside list for binding
    ee.NavigateToSwitcher("explorer")
    ee.ExpandCollapseEntity("List1")
    ee.ExpandCollapseEntity("Container1")
    ee.SelectEntityByName("Text1")
    propPane.UpdatePropertyFieldValue("Text", "{{currentItem.fullName}}")
    agHelper.Sleep(200)
    ee.SelectEntityByName("Text2")
    propPane.UpdatePropertyFieldValue("Text", "{{currentItem.family}}")
    ee.SelectEntityByName("Image1")
   // agHelper.GetNClick(locator._imageWidget, 0, true) //Image1
    propPane.UpdatePropertyFieldValue("Image", "{{currentItem.imageUrl}}")
    deployMode.DeployApp()
    agHelper.Sleep()
    //click on pagination and navigate through different pages after app deployed and then go back to editor
    // cy.get(".t--widget-listwidget .t--list-widget-next-page")
    // agHelper.WaitUntilEleAppear(".t--widget-listwidget")
    // cy.get(".t--widget-listwidget .t--list-widget-next-page")
    deployMode.NavigateBacktoEditor()
    agHelper.Sleep()
})

it("2. Call MYSQL query and bind it with List widget", function(){
    ee.NavigateToSwitcher("explorer")
    dataSources.CreateDataSource("MySql")
    cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateNewQueryInDS(
            dsName,
            "SELECT * FROM users where role = 'Admin' ORDER BY id LIMIT 10",
            "Query1_mysql",
        )
        dataSources.ToggleUsePreparedStatement(false)
        dataSources.RunQuery(true)
        ee.NavigateToSwitcher("widgets")
        agHelper.Sleep(1000)
        agHelper.GetNClick(locator._listWidget,0,true)
        propPane.UpdatePropertyFieldValue("Items", "{{Query1_mysql.data}}")
        // Selecting widgets inside list for binding
        ee.NavigateToSwitcher("explorer")
        ee.ExpandCollapseEntity("Widgets")
        ee.ExpandCollapseEntity("List1")
        ee.ExpandCollapseEntity("Container1")
        ee.SelectEntityByName("Text1")
        propPane.UpdatePropertyFieldValue("Text", "{{currentItem.id}}")
        agHelper.Sleep(200)
        ee.SelectEntityByName("Text2")
        propPane.UpdatePropertyFieldValue("Text", "{{currentItem.email}}")
        ee.SelectEntityByName("Image1")
        //agHelper.GetNClick(locator._imageWidget, 0, true) //Image1
        propPane.UpdatePropertyFieldValue("Image", "{{currentItem.avatar}}")
        deployMode.DeployApp()
        agHelper.Sleep()
        deployMode.NavigateBacktoEditor()
        agHelper.Sleep()
    
    })
})

it("3. Call Postgres query and bind it with List widget", function(){
    ee.NavigateToSwitcher("explorer")
    dataSources.CreateDataSource("Postgres")
    cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateNewQueryInDS(
            dsName,
            "SELECT * FROM mockusers_v2 LIMIT 10;",
            "Query1_postgres",
        )
        dataSources.ToggleUsePreparedStatement(false)
        dataSources.RunQuery(true)
        ee.NavigateToSwitcher("widgets")
        agHelper.GetNClick(locator._listWidget,0,true)
        propPane.UpdatePropertyFieldValue("Items", "{{Query1_postgres.data}}")
        agHelper.Sleep(2000)
        // Selecting widgets inside list for binding
        ee.NavigateToSwitcher("explorer")
        ee.ExpandCollapseEntity("Widgets")
        ee.ExpandCollapseEntity("List1")
        ee.ExpandCollapseEntity("Container1")
        ee.SelectEntityByName("Text1")
        propPane.UpdatePropertyFieldValue("Text", "{{currentItem.name}}")
        agHelper.Sleep(200)
        ee.SelectEntityByName("Text2")
        propPane.UpdatePropertyFieldValue("Text", "{{currentItem.email}}")
        ee.SelectEntityByName("Image1")
        propPane.UpdatePropertyFieldValue("Image", "{{currentItem.image}}")
        deployMode.DeployApp()
        agHelper.Sleep()
        deployMode.NavigateBacktoEditor()
        agHelper.Sleep()
    })
})



it("4. Copy/Paste List widget", function(){
    agHelper.GetNClick(locator._listWidget,0,true)
    ee.CopyPasteWidget("List1")
    
})

it("5. Create new API with pagination and bind it with List widget", function(){
    const apiUrl = `https://mock-api.appsmith.com/users?page={{List1Copy.pageNo}}&pageSize={{List1Copy.pageSize}}`
    apiPage.CreateAndFillApi(apiUrl,"API1_ssp")
    apiPage.RunAPI()
    agHelper.AssertElementAbsence(
        locator._specificToast(
            createMessage(ERROR_ACTION_EXECUTE_FAIL, "API1_ssp")
        ),
    )
    apiPage.ResponseStatusCheck("200 OK")
    ee.NavigateToSwitcher("widgets")
    agHelper.GetNClick(locator._listWidget,1,true)
    propPane.ToggleOnOrOff("Server Side Pagination", "On")
    propPane.UpdatePropertyFieldValue("Items", "{{API1_ssp.data.users}}")
    propPane.EnterJSContext("onPageChange","{{Api1_ssp.run()}}",true)
    // Selecting widgets inside list for binding
    ee.NavigateToSwitcher("explorer")
    ee.ExpandCollapseEntity("List1Copy")
    ee.ExpandCollapseEntity("Container1Copy")
    ee.SelectEntityByName("Text1Copy")
    propPane.UpdatePropertyFieldValue("Text", "{{currentItem.name}}")
    agHelper.Sleep(200)
    ee.SelectEntityByName("Text2Copy")
    propPane.UpdatePropertyFieldValue("Text", "{{currentItem.gender}}")
    ee.SelectEntityByName("Image1Copy")
   // agHelper.GetNClick(locator._imageWidget, 0, true) //Image1
    propPane.UpdatePropertyFieldValue("Image", "{{currentItem.avatar}}")
    deployMode.DeployApp()
    agHelper.Sleep(5000)
    //click on pagination and navigate through different pages after app deployed and then go back to editor
    deployMode.NavigateBacktoEditor()
})

it("6. Enable and bind SSP Query with List widget - MySql", function(){
    ee.NavigateToSwitcher("explorer")
    dataSources.CreateDataSource("MySql")
    cy.get("@dsName").then(($dsName)=> {
        dsName = $dsName
        dataSources.CreateNewQueryInDS(
            dsName,
            "SELECT * FROM users where role = 'Admin' ORDER BY id LIMIT {{List1Copy.pageSize}} offset {{(List1Copy.pageNo-1)*List1Copy.pageSize}}",
            "mysql_ssp",
        )
        dataSources.ToggleUsePreparedStatement(false)
        dataSources.RunQuery(true)
        ee.NavigateToSwitcher("widgets")
        agHelper.Sleep(1000)
        agHelper.GetNClick(locator._listWidget,1,true)
        propPane.ToggleOnOrOff("Server Side Pagination", "On")
        propPane.EnterJSContext("onPageChange","{{mysql_ssp.run()}}",true)
        propPane.UpdatePropertyFieldValue("Items", "{{mysql_ssp.data}}")
        ee.NavigateToSwitcher("explorer")
        ee.ExpandCollapseEntity("Widgets")
        ee.ExpandCollapseEntity("List1Copy")
        ee.ExpandCollapseEntity("Container1Copy")
        ee.SelectEntityByName("Text1Copy")
        propPane.UpdatePropertyFieldValue("Text", "{{currentItem.dob}}")
        agHelper.Sleep(200)
        ee.SelectEntityByName("Text2Copy")
        propPane.UpdatePropertyFieldValue("Text", "{{currentItem.address}}")
        ee.SelectEntityByName("Image1Copy")
        propPane.UpdatePropertyFieldValue("Image", "{{currentItem.avatar}}")
        deployMode.DeployApp()
        agHelper.Sleep(5000)
        deployMode.NavigateBacktoEditor()
        agHelper.Sleep()
    
    })
})

it("7. Enable and bind SSP Query with List widget - Postgres", function(){
    ee.NavigateToSwitcher("explorer")
    dataSources.CreateDataSource("Postgres")
    cy.get("@dsName").then(($dsName)=> {
        dsName = $dsName
        dataSources.CreateNewQueryInDS(
            dsName,
            "SELECT * FROM mockusers_v2 LIMIT {{List1Copy.pageSize}} offset {{(List1Copy.pageNo-1)*List1Copy.pageSize}}",
            "postgres_ssp",
        )
        dataSources.ToggleUsePreparedStatement(false)
        dataSources.RunQuery(true)
        ee.NavigateToSwitcher("widgets")
        agHelper.Sleep(1000)
        agHelper.GetNClick(locator._listWidget,1,true)
        propPane.ToggleOnOrOff("Server Side Pagination", "On")
        propPane.EnterJSContext("onPageChange","{{postgres_ssp.run()}}",true)
        propPane.UpdatePropertyFieldValue("Items", "{{postgres_ssp.data}}")
        ee.NavigateToSwitcher("explorer")
        ee.ExpandCollapseEntity("Widgets")
        ee.ExpandCollapseEntity("List1Copy")
        ee.ExpandCollapseEntity("Container1Copy")
        ee.SelectEntityByName("Text1Copy")
        propPane.UpdatePropertyFieldValue("Text", "{{currentItem.name}}")
        agHelper.Sleep(200)
        ee.SelectEntityByName("Text2Copy")
        propPane.UpdatePropertyFieldValue("Text", "{{currentItem.phone}}")
        ee.SelectEntityByName("Image1Copy")
        propPane.UpdatePropertyFieldValue("Image", "{{currentItem.image}}")
        deployMode.DeployApp()
        agHelper.Sleep()
    
    })
})

})

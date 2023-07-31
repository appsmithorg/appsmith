import {
  agHelper,
  locators,
  entityExplorer,
  draggableWidgets,
  deployMode,
  dataSources,
  propPane,
  assertHelper,
  table,
} from "../../../../../support/Objects/ObjectsCore";

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
  {
    id: 16,
    name: "Aliess",
  },
  {
    id: 17,
    name: "Aliess",
  },
  {
    id: 18,
    name: "Aliess",
  },
  {
    id: 19,
    name: "Aliess",
  },
  {
    id: 20,
    name: "Jennie James",
  },
  {
    id: 21,
    name: "Aliess",
  },
  {
    id: 22,
    name: "Aliess",
  },
  {
    id: 23,
    name: "Aliess",
  },
  {
    id: 24,
    name: "Aliess",
  },
  {
    id: 25,
    name: "Aliess",
  },
  {
    id: 26,
    name: "Aliess",
  },
  {
    id: 27,
    name: "Aliess",
  },
  {
    id: 28,
    name: "Aliess",
  },
  {
    id: 29,
    name: "Aliess",
  },
  {
    id: 30,
    name: "Aliess",
  },
];

describe("List widget V2 page number and page size", () => {
  before(() => {
    agHelper.AddDsl("listv2PaginationDsl");
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. List widget V2 with client side pagination", () => {
    entityExplorer.SelectEntityByName("List1");
    propPane.UpdatePropertyFieldValue("Items", JSON.stringify(listData));
    assertHelper.WaitForNetworkCall("@updateLayout");
    entityExplorer.SelectEntityByName("Text3");
    propPane.UpdatePropertyFieldValue("Text", "PageSize {{List1.pageSize}}");
    assertHelper.WaitForNetworkCall("@updateLayout");

    agHelper.GetNAssertElementText(
      locators._textWidgetStyleInDeployed,
      "PageSize 4",
    );

    entityExplorer.SelectEntityByName("Text3");
    propPane.UpdatePropertyFieldValue("Text", "Page Number {{List1.pageNo}}");
    assertHelper.WaitForNetworkCall("@updateLayout");
    agHelper.GetNAssertElementText(
      locators._textWidgetStyleInDeployed,
      "Page Number 1",
    );

    table.NavigateToNextPage_List("v2", 0);
    agHelper.GetNAssertElementText(
      locators._textWidgetStyleInDeployed,
      "Page Number 2",
    );

    entityExplorer.SelectEntityByName("List1");
    agHelper.GetNClick(propPane._deleteWidget, 0, true);
  });

  it("2. List widget V2 with server side pagination", () => {
    entityExplorer.DragDropWidgetNVerify("listwidgetv2", 300, 300);
    entityExplorer.SelectEntityByName("List1");

    entityExplorer.SelectEntityByName("Text3");
    propPane.UpdatePropertyFieldValue("Text", "PageSize {{List1.pageSize}}");
    assertHelper.WaitForNetworkCall("@updateLayout");

    agHelper.GetNAssertElementText(
      locators._textWidgetStyleInDeployed,
      "PageSize 3",
    );

    // toggle serversidepagination -> true
    entityExplorer.SelectEntityByName("List1");
    agHelper.GetNClick(locators._propertyControlInput("serversidepagination"));

    agHelper.GetNAssertElementText(
      locators._textWidgetStyleInDeployed,
      "PageSize 2",
    );
  });

  it("excludeForAirgap 3. should reset page no if higher than max when switched from server side to client side", () => {
    agHelper.AddDsl("Listv2/listWithServerSideData");
    agHelper.Sleep(2000);
    dataSources.CreateMockDB("Users").then(() => {
      dataSources.CreateQueryAfterDSSaved();
      dataSources.ToggleUsePreparedStatement(false);
    });
    // writing query to get the schema
    dataSources.EnterQuery(
      "SELECT * FROM users OFFSET {{List1.pageNo * List1.pageSize}} LIMIT {{List1.pageSize}};",
    );

    agHelper.AssertAutoSave();
    dataSources.RunQuery();
    entityExplorer.SelectEntityByName("Page1");
    //agHelper.GetNClick(entityExplorer._entityNameContains("Page1"), 0, true);

    agHelper.Sleep(3000);

    // Click next page in list widget
    table.NavigateToPageUsingButton("next", 2);

    // Change to client side pagination
    entityExplorer.SelectEntityByName("List1");
    agHelper.GetNClick(locators._propertyControlInput("serversidepagination"));

    agHelper.Sleep(2000);

    agHelper.AssertElementLength(
      locators._widgetInDeployed(draggableWidgets.CONTAINER),
      3,
    );
  });

  it("airgap 3. should reset page no if higher than max when switched from server side to client side - airgap", () => {
    agHelper.AddDsl("Listv2/listWithServerSideData");
    agHelper.Sleep(2000);
    dataSources.CreateDataSource("Postgres");
    dataSources.CreateQueryAfterDSSaved();

    // switching off Use Prepared Statement toggle
    dataSources.ToggleUsePreparedStatement(false);

    dataSources.EnterQuery(
      "SELECT * FROM users OFFSET {{List1.pageNo * 1}} LIMIT {{List1.pageSize}};",
    );

    agHelper.AssertAutoSave();

    dataSources.RunQuery();

    entityExplorer.SelectEntityByName("Page1");
    //agHelper.GetNClick(entityExplorer._entityNameContains("Page1"), 0, true);

    agHelper.Sleep(3000);

    // Click next page in list widget
    table.NavigateToPageUsingButton("next", 2);

    // Change to client side pagination
    entityExplorer.SelectEntityByName("List1");
    agHelper.GetNClick(locators._propertyControlInput("serversidepagination"));

    agHelper.Sleep(2000);

    agHelper.AssertElementLength(
      locators._widgetInDeployed(draggableWidgets.CONTAINER),
      3,
    );
  });
});

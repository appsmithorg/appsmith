import {
  entityExplorer,
  propPane,
  agHelper,
  draggableWidgets,
  deployMode,
  table,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

const readTableLocalColumnOrder = (columnOrderKey: string) => {
  const localColumnOrder = window.localStorage.getItem(columnOrderKey) || "";
  if (localColumnOrder) {
    const parsedTableConfig = JSON.parse(localColumnOrder);
    if (parsedTableConfig) {
      const tableWidgetId = Object.keys(parsedTableConfig)[0];
      return parsedTableConfig[tableWidgetId];
    }
  }
};

const freezeColumnFromDropdown = (columnName: string, direction: string) => {
  agHelper
    .GetElement(`[data-header=${columnName}] .header-menu .bp3-popover2-target`)
    .click({ force: true });
  agHelper.GetNClickByContains(".bp3-menu", `Freeze column ${direction}`);
};

const checkIfColumnIsFrozenViaCSS = (
  columnName: string,
  position = "sticky",
) => {
  agHelper
    .GetElement(table._headerCell(columnName))
    .should("have.css", "position", position);
};

const TABLE_DATA_1 = `[
    {
      "step": "#1",
      "task": "Drop a table",
      "status": "✅",
      "action": ""
    },
    {
      "step": "#2",
      "task": "Create a query fetch_users with the Mock DB",
      "status": "--",
      "action": ""
    },
    {
      "step": "#3",
      "task": "Bind the query using => fetch_users.data",
      "status": "--",
      "action": ""
    }
  ]`;

const TABLE_DATA_2 = `[
    {
      "id": 1,
      "name": "Barty Crouch",
      "status": "APPROVED",
      "gender": "",
      "avatar": "http://host.docker.internal:4200/clouddefaultImage.png",
      "email": "barty.crouch@gmail.com",
      "address": "St Petersberg #911 4th main",
      "createdAt": "2020-03-16T18:00:05.000Z",
      "updatedAt": "2020-08-12T17:29:31.980Z"
    },
    {
      "id": 2,
      "name": "Jenelle Kibbys",
      "status": "APPROVED",
      "gender": "Female",
      "avatar": "http://host.docker.internal:4200/453-200x300.jpg",
      "email": "jkibby1@hp.com",
      "address": "85 Tennessee Plaza",
      "createdAt": "2019-10-04T03:22:23.000Z",
      "updatedAt": "2019-09-11T20:18:38.000Z"
    },
    {
      "id": 3,
      "name": "Demetre",
      "status": "APPROVED",
      "gender": "Male",
      "avatar": "http://host.docker.internal:4200/clouddefaultImage.png",
      "email": "aaaa@bbb.com",
      "address": "262 Saint Paul Park",
      "createdAt": "2020-05-01T17:30:50.000Z",
      "updatedAt": "2019-10-08T14:55:53.000Z"
    },
    {
      "id": 10,
      "name": "Tobin Shellibeer",
      "status": "APPROVED",
      "gender": "Male",
      "avatar": "http://host.docker.internal:4200/453-200x300.jpg",
      "email": "tshellibeer9@ihg.com",
      "address": "4 Ridgeway Lane",
      "createdAt": "2019-11-27T06:09:41.000Z",
      "updatedAt": "2019-09-07T16:35:48.000Z"
    }]`;

describe(
  "Table widget v2: tableData change test",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.ClearLocalStorageCache();
    });

    it("1. should test that the number of columns needs to be same when table data changes in depoyed app", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 300, 100);
      propPane.EnterJSContext(
        "Table data",
        `{{appsmith.store.test === '0' ? ${TABLE_DATA_1} : ${TABLE_DATA_2}}}`,
      );

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 500, 500);
      propPane.UpdatePropertyFieldValue("Label", "Set table data 1");
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.EnterActionValue("Key", "test");
      agHelper.EnterActionValue("Value", "0");

      // add a success callback
      agHelper.GetNClick(propPane._actionAddCallback("success"));
      agHelper.GetNClick(locators._dropDownValue("Show alert"));
      agHelper.EnterActionValue("Message", "table data 1 set");

      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 500, 600);
      propPane.UpdatePropertyFieldValue("Label", "Set table data 2");
      propPane.SelectPlatformFunction("onClick", "Store value");
      agHelper.EnterActionValue("Key", "test");
      agHelper.EnterActionValue("Value", "1");

      // add a success callback
      agHelper.GetNClick(propPane._actionAddCallback("success"));
      agHelper.GetNClick(locators._dropDownValue("Show alert"));
      agHelper.EnterActionValue("Message", "table data 2 set");

      deployMode.DeployApp();

      agHelper.ClickButton("Set table data 1");

      agHelper.WaitUntilToastDisappear("table data 1 set");
      table.AssertTableHeaderOrder("statussteptaskaction");
      let tableLocalColumnOrder = readTableLocalColumnOrder(
        "tableWidgetColumnOrder",
      );
      if (tableLocalColumnOrder)
        expect(tableLocalColumnOrder.columnOrder.join("")).equal(
          "statussteptaskaction",
        );

      agHelper.ClickButton("Set table data 2");

      agHelper.WaitUntilToastDisappear("table data 2 set");

      table.AssertTableHeaderOrder(
        "statusidnamegenderavataremailaddresscreatedAtupdatedAt",
      );
      tableLocalColumnOrder = readTableLocalColumnOrder(
        "tableWidgetColumnOrder",
      );
      if (tableLocalColumnOrder)
        expect(tableLocalColumnOrder.columnOrder.join("")).equal(
          "statusidnamegenderavataremailaddresscreatedAtupdatedAt",
        );

      /**
       * Flow: Check the above flow for frozen columns
       * 1. Freeze columns with table data 1.
       * 2. Refresh the page.
       * 3. Check if the frozen columns are same.
       * 4. Similarly do the same thing for table data 2.
       */

      agHelper.ClickButton("Set table data 1");

      agHelper.WaitUntilToastDisappear("table data 1 set");

      table.AssertTableHeaderOrder("statussteptaskaction");
      tableLocalColumnOrder = readTableLocalColumnOrder(
        "tableWidgetColumnOrder",
      );
      if (tableLocalColumnOrder)
        expect(tableLocalColumnOrder.columnOrder.join("")).equal(
          "statussteptaskaction",
        );

      freezeColumnFromDropdown("status", "left");
      freezeColumnFromDropdown("action", "right");

      agHelper.RefreshPage("getConsolidatedData");

      checkIfColumnIsFrozenViaCSS("status");
      checkIfColumnIsFrozenViaCSS("action");

      agHelper.ClickButton("Set table data 2");

      agHelper.WaitUntilToastDisappear("table data 2 set");

      table.AssertTableHeaderOrder(
        "statusidnamegenderavataremailaddresscreatedAtupdatedAt",
      );
      tableLocalColumnOrder = readTableLocalColumnOrder(
        "tableWidgetColumnOrder",
      );
      if (tableLocalColumnOrder)
        expect(tableLocalColumnOrder.columnOrder.join("")).equal(
          "statusidnamegenderavataremailaddresscreatedAtupdatedAt",
        );

      freezeColumnFromDropdown("id", "left");
      freezeColumnFromDropdown("updatedAt", "right");

      agHelper.RefreshPage("getConsolidatedData");

      checkIfColumnIsFrozenViaCSS("id");
      checkIfColumnIsFrozenViaCSS("updatedAt");
    });
  },
);

import {
  agHelper,
  dataSources,
  propPane,
  dataManager,
  locators,
  entityExplorer,
  deployMode,
  draggableWidgets,
  table,
  entityItems,
  apiPage,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Validate Oracle DS",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    let dataSourceName: string, guid: any, query: string, selectQuery: string;

    before("Generate GUID", () => {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        guid = uid;
        dataSourceName = "Oracle" + " " + uid;
      });
    });

    it("1. Tc #2354, #2204 - Oracle placeholder, port default value & mandatory mark verification", () => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Oracle");
      agHelper.GetNAssertContains(locators._dsName, "Untitled datasource");
      agHelper.GetNClick(locators._dsName);
      agHelper.ClearTextField(locators._dsNameTxt); //removing ds name
      agHelper.AssertTooltip(
        Cypress.env("MESSAGES").ACTION_INVALID_NAME_ERROR(),
      );
      agHelper.TypeText(locators._dsNameTxt, dataSourceName);
      agHelper.PressEnter();
      agHelper.AssertAttribute(
        dataSources._host(),
        "placeholder",
        "myapp.abcde.oracle.net",
      );
      agHelper.AssertAttribute(dataSources._port, "value", "1521");
      agHelper.AssertAttribute(
        dataSources._databaseName,
        "placeholder",
        "gfb284db6bcee33_testdb_high.adb.oraclecloud.com",
      );
      agHelper.AssertAttribute(dataSources._username, "placeholder", "admin");
      agHelper.AssertAttribute(
        dataSources._password,
        "placeholder",
        "password",
      );
      agHelper.AssertElementLength(dataSources._mandatoryMark, 4); //verifyng all 4 fields are mandatory
      agHelper.AssertText(dataSources._host(), "val", "");
      agHelper.ClearNType(
        dataSources._host(),
        dataManager.dsValues[dataManager.environments[1]].oracle_host,
      );
      agHelper.AssertText(
        dataSources._host(),
        "val",
        dataManager.dsValues[dataManager.environments[1]].oracle_host,
      );
      agHelper.GetNClick(dataSources._deleteDSHostPort); //Delete the value & verify
      agHelper.AssertText(dataSources._host(), "val", "");
      agHelper.ClickButton("Add more");
      agHelper.AssertElementVisibility(dataSources._host("1"));
      agHelper.ClickButton("Add more");
      agHelper.AssertElementVisibility(dataSources._host("2"));
      Cypress._.times(2, () => {
        //Delete the added extra hosts
        agHelper.GetNClick(dataSources._deleteDSHostPort);
      });
    });

    it("2. Tc #2357, #2356, #2355, #2354 Verify Oracle connection errors", () => {
      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage("Missing endpoint");
      agHelper.ValidateToastMessage("Missing authentication details");
      agHelper.WaitUntilAllToastsDisappear();

      agHelper.ClearNType(
        dataSources._host(),
        dataManager.dsValues[dataManager.defaultEnviorment].oracle_host,
      );
      agHelper.ClearNType(
        dataSources._databaseName,
        dataManager.dsValues[dataManager.defaultEnviorment].oracle_service,
      );
      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage("Missing username for authentication");
      agHelper.ValidateToastMessage("Missing password for authentication");

      agHelper.ClearNType(
        dataSources._username,
        dataManager.dsValues[dataManager.defaultEnviorment].oracle_username,
      );
      agHelper.ClearNType(
        dataSources._password,
        dataManager.dsValues[dataManager.defaultEnviorment].oracle_password,
      );
      dataSources.TestDatasource(false);
      agHelper.ValidateToastMessage(
        "An exception occurred while creating connection pool. One or more arguments in the datasource configuration may be invalid.",
      );
      agHelper.ValidateToastMessage("Failed to initialize pool:");
      propPane.AssertPropertiesDropDownValues("SSL mode", ["Disable", "TLS"]);
      dataSources.ValidateNSelectDropdown("SSL mode", "TLS", "Disable");
      dataSources.TestSaveDatasource();
      //Validate Review page
      dataSources.AssertDataSourceInfo([
        "Host address",
        "Port",
        "Service Name",
      ]);
      agHelper.ClickButton("Edit"); //Navigate to Edit page & check if DS edit is opened
      dataSources.ValidateNSelectDropdown("SSL mode", "Disable");
      AppSidebar.navigate(AppSidebarButton.Editor);
      AppSidebar.navigate(AppSidebarButton.Data);
      dataSources.AssertDSInActiveList(dataSourceName);
    });

    it("3. Tc #2359, Tc # 2360 , Tc # 2358, Tc # 2366 - Create Insert, Alter & Select queries, Widgets to query binding", () => {
      const currentDate = new Date().toISOString().slice(0, 10);

      entityExplorer.DragDropWidgetNVerify(
        draggableWidgets.DATEPICKER,
        200,
        50,
      );
      propPane.SelectPropertiesDropDown("Date format", "YYYY-MM-DD");
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 500, 50);
      propPane.EnterJSContext(
        "Source Data",
        `[{
    "name": "Cargo Plane",
    "value": "Cargo Plane"
  },
  {
    "name": "Passenger Plane",
    "code": "Passenger Plane"
  },
  {
    "name": "Helicopter",
    "code": "Helicopter"
  }]`,
      );
      propPane.UpdatePropertyFieldValue(
        "Default selected value",
        "Cargo Plane",
      );
      propPane.AssertPropertiesDropDownValues("Label key", [
        "name",
        "code",
        "value",
      ]);
      propPane.SelectPropertiesDropDown(
        "Label key",
        "value",
        "Action",
        0,
        0,
        true,
      );
      propPane.SelectPropertiesDropDown(
        "Value key",
        "name",
        "Action",
        0,
        1,
        true,
      );
      query = `CREATE TABLE ${guid} (
      aircraft_id NUMBER(5) PRIMARY KEY,
      aircraft_type VARCHAR2(50) NOT NULL,
      registration_number VARCHAR2(20) UNIQUE,
      manufacturer VARCHAR2(50),
      seating_capacity NUMBER(3),
      maximum_speed NUMBER(5, 2),
      range NUMBER(7, 2),
      purchase_date DATE,
      maintenance_last_date DATE,
      notes CLOB
  );`;
      dataSources.CreateQueryForDS(dataSourceName, query);
      dataSources.RunQuery();

      query = `INSERT INTO ${guid} (
    aircraft_id,
    aircraft_type,
    registration_number,
    manufacturer,
    seating_capacity,
    maximum_speed,
    range,
    purchase_date,
    maintenance_last_date,
    notes) VALUES (
    1,
    '{{Select1.selectedOptionLabel}}',
    'N12345',
    'Boeing',
    150,
    550.03,
    3500.30,
    TO_DATE('2020-01-15', 'YYYY-MM-DD'),
    TO_DATE('{{DatePicker1.formattedDate}}', 'YYYY-MM-DD'),
    'This aircraft is used for domestic flights.')`;
      selectQuery = `SELECT * FROM ${guid} WHERE ROWNUM < 10`;
      dataSources.EnterQuery(selectQuery);

      dataSources.RunQuery();
      agHelper
        .GetText(dataSources._noRecordFound)
        .then(($noRecMsg) =>
          expect($noRecMsg).to.eq("No data records to show"),
        );
      dataSources.EnterQuery(query);
      agHelper.VerifyEvaluatedValue(
        `INSERT INTO ${guid} (\n    aircraft_id,\n    aircraft_type,\n    registration_number,\n    manufacturer,\n    seating_capacity,\n    maximum_speed,\n    range,\n    purchase_date,\n    maintenance_last_date,\n    notes) VALUES (\n    1,\n    $1,\n    'N12345',\n    'Boeing',\n    150,\n    550.03,\n    3500.30,\n    TO_DATE('2020-01-15', 'YYYY-MM-DD'),\n    TO_DATE($2, 'YYYY-MM-DD'),\n    'This aircraft is used for domestic flights.')`,
      );
      dataSources.ToggleUsePreparedStatement(false);
      agHelper.GetNClick(locators._codeEditorTarget);
      agHelper.VerifyEvaluatedValue(
        `INSERT INTO ${guid} (\n    aircraft_id,\n    aircraft_type,\n    registration_number,\n    manufacturer,\n    seating_capacity,\n    maximum_speed,\n    range,\n    purchase_date,\n    maintenance_last_date,\n    notes) VALUES (\n    1,\n    'Cargo Plane',\n    'N12345',\n    'Boeing',\n    150,\n    550.03,\n    3500.30,\n    TO_DATE('2020-01-15', 'YYYY-MM-DD'),\n    TO_DATE('${currentDate}', 'YYYY-MM-DD'),\n    'This aircraft is used for domestic flights.')`,
      );
      dataSources.RunQuery();
      dataSources.EnterQuery(selectQuery);
      dataSources.runQueryAndVerifyResponseViews({ count: 1, operator: "gte" });
      dataSources.ToggleUsePreparedStatement(true);
      query = `ALTER TABLE ${guid} ADD (raw_data RAW(16), maintenance_interval INTERVAL YEAR(3) TO MONTH);`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      query = `INSERT INTO ${guid} (
    aircraft_id,
    aircraft_type,
    registration_number,
    manufacturer,
    seating_capacity,
    maximum_speed,
    range,
    purchase_date,
    maintenance_last_date,
    notes,
    raw_data,
    maintenance_interval) VALUES (
    4,
    'Passenger Plane',
    'N77777',
    'Airbus',
    100,
    600.67,
    3800.82,
    TO_DATE('2017-05-25', 'YYYY-MM-DD'),
    TO_DATE('2023-02-18', 'YYYY-MM-DD'),
    'This aircraft is part of the international fleet.',
    UTL_RAW.CAST_TO_RAW('raw_value'),
    INTERVAL '1' YEAR(3) -- 1 year maintenance interval
);`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.EnterQuery(selectQuery);
      dataSources.runQueryAndVerifyResponseViews({ count: 2 });
      query = `INSERT ALL
      INTO ${guid} (
          aircraft_id,
          aircraft_type,
          registration_number,
          manufacturer,
          seating_capacity,
          maximum_speed,
          range,
          purchase_date,
          maintenance_last_date,
          notes,
          raw_data,
          maintenance_interval
      )
      VALUES (
          5,
          'Cargo Plane',
          'N45678',
          'Boeing',
          280,
          570.00,
          5500.00,
          TO_DATE('2018-08-30', 'YYYY-MM-DD'),
          TO_DATE('2022-12-12', 'YYYY-MM-DD'),
          'This cargo aircraft is used for long-haul freight.',
          UTL_RAW.CAST_TO_RAW('cargo_raw_data'),
          INTERVAL '2' YEAR(3) -- Two-year maintenance interval
      )
      INTO ${guid} (
          aircraft_id,
          aircraft_type,
          registration_number,
          manufacturer,
          seating_capacity,
          maximum_speed,
          range,
          purchase_date,
          maintenance_last_date,
          notes,
          raw_data,
          maintenance_interval
      )
      VALUES (
          6,
          'Helicopter',
          'N98765',
          'Robinson',
          2,
          150.00,
          350.00,
          TO_DATE('2019-06-15', 'YYYY-MM-DD'),
          TO_DATE('2023-08-20', 'YYYY-MM-DD'),
          'This helicopter is used for aerial photography.',
          UTL_RAW.CAST_TO_RAW('helicopter_raw'),
          INTERVAL '6' MONTH -- Six-month maintenance interval
      );
      SELECT * FROM DUAL;`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.EnterQuery(selectQuery);
      dataSources.runQueryAndVerifyResponseViews({ count: 4 });
      selectQuery = selectQuery + ` and  aircraft_id IN (1, 6)`;
      dataSources.EnterQuery(selectQuery);
      dataSources.runQueryAndVerifyResponseViews({ count: 2 });
      dataSources.AddSuggestedWidget(Widgets.Table);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");
      table.ReadTableRowColumnData(0, 10, "v2").then(($cellData) => {
        expect($cellData).to.be.empty;
      });
      table.ReadTableRowColumnData(0, 11, "v2").then(($cellData) => {
        expect($cellData).to.be.empty;
      });
      table.ReadTableRowColumnData(1, 10, "v2").then(($cellData) => {
        expect($cellData).not.to.be.empty;
      });
      table.ReadTableRowColumnData(1, 11, "v2").then(($cellData) => {
        expect($cellData).not.to.be.empty;
      });
      deployMode.NavigateBacktoEditor();
    });

    it("4. Tc #2362  - Update query validation", () => {
      EditorNavigation.SelectEntityByName("Query1", EntityType.Query);
      query = `UPDATE ${guid}
SET
    maximum_speed = CASE
        WHEN seating_capacity <= 100 THEN 400.89
        WHEN seating_capacity > 100 AND seating_capacity <= 200 THEN 500.96
        ELSE 600.00
    END,
    maintenance_interval = CASE
        WHEN seating_capacity <= 50 THEN INTERVAL '3' MONTH
        WHEN seating_capacity > 50 AND seating_capacity <= 150 THEN TO_YMINTERVAL('0-6')
        ELSE TO_YMINTERVAL('1-0')
    END
WHERE aircraft_type = 'Passenger Plane'`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      selectQuery = selectQuery + ` or  aircraft_type = 'Passenger Plane'`;
      dataSources.EnterQuery(selectQuery);
      dataSources.runQueryAndVerifyResponseViews({ count: 3 });
      dataSources.AddSuggestedWidget(
        Widgets.Table,
        dataSources._addSuggestedExisting,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");
      table.ReadTableRowColumnData(1, 5, "v2").then(($cellData) => {
        expect($cellData).to.eq("400.89");
      });
      table.ReadTableRowColumnData(1, 11, "v2").then(($cellData) => {
        expect($cellData).to.eq("0-6");
      });
      deployMode.NavigateBacktoEditor();
    });

    it("5. Tc #2361  - Delete query validation", () => {
      EditorNavigation.SelectEntityByName("Query1", EntityType.Query);
      query = `DELETE FROM ${guid}
    WHERE
        (aircraft_type = 'Cargo Plane' AND seating_capacity <= 100)
        OR
        (aircraft_type = 'Passenger Plane' AND purchase_date < TO_DATE('2020-01-01', 'YYYY-MM-DD'))
        OR
        (aircraft_type = 'Helicopter' AND manufacturer = 'Robinson' AND maintenance_interval = INTERVAL '6' MONTH)`;
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      selectQuery = `SELECT * FROM ${guid}`;
      dataSources.EnterQuery(selectQuery);
      dataSources.runQueryAndVerifyResponseViews({ count: 2 });
      dataSources.AddSuggestedWidget(
        Widgets.Table,
        dataSources._addSuggestedExisting,
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad(0, 0, "v2");
      for (let i = 0; i < 2; i++) {
        table.ReadTableRowColumnData(i, 1, "v2").then(($cellData) => {
          expect($cellData).to.eq("Cargo Plane");
        });
      }

      table.OpenNFilterTable("MAINTENANCE_INTERVAL", "not empty");
      table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
        expect($cellData).to.eq("5");
      });
      agHelper
        .GetText(table._showPageItemsCount)
        .then(($count) => expect($count).contain("1"));
      table.CloseFilter();
      agHelper
        .GetText(table._filtersCount)
        .then(($count) => expect($count).contain("1"));
      deployMode.NavigateBacktoEditor();
    });

    it("6. Tc #2363  - Copy & Move query validations", () => {
      EditorNavigation.SelectEntityByName("Query1", EntityType.Query);
      agHelper.ActionContextMenuWithInPane({
        action: "Copy to page",
        subAction: "Page1",
        toastToValidate: "copied to page",
      });
      agHelper.GetNAssertContains(locators._queryName, "Query1Copy");
      dataSources.runQueryAndVerifyResponseViews({ count: 2 });
      PageList.AddNewPage();
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      agHelper.ActionContextMenuWithInPane({
        action: "Move to page",
        subAction: "Page2",
        toastToValidate: "moved to page",
      });
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.GetNAssertContains(locators._queryName, "Query1Copy");
      dataSources.runQueryAndVerifyResponseViews({ count: 2 });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Query1", EntityType.Query);
    });

    it("7. Tc #2365  - Query settings tab validations", () => {
      apiPage.ToggleOnPageLoadRun(false); // ALl above cases validated for onpage load run with confirmation dialog set to false
      apiPage.ToggleConfirmBeforeRunning(true);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitForTableEmpty("v2");
      deployMode.NavigateBacktoEditor();
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 300, 500);
      propPane.EnterJSContext("onClick", `{{Query1.run()}}`);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      agHelper.ClickButton("Submit");
      jsEditor.ConfirmationClick("No"); //Handling both No & Yes from confirmation dialog

      table.WaitUntilTableLoad(0, 0, "v2");
      deployMode.NavigateBacktoEditor();
    });

    after(
      "Verify Deletion of the Oracle datasource after all created queries are deleted",
      () => {
        dataSources.DeleteDatasourceFromWithinDS(dataSourceName, 409); //Since all queries exists
        entityExplorer.DeleteAllQueriesForDB(dataSourceName);
        deployMode.DeployApp();
        deployMode.NavigateBacktoEditor();
        dataSources.DeleteDatasourceFromWithinDS(dataSourceName, 200);
      },
    );
  },
);

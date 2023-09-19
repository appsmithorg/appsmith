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
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

describe("Validate Oracle DS", () => {
  let dataSourceName: string, guid: any, query: string, selectQuery: string;

  before("Generate GUID", () => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      guid = uid;
      dataSourceName = "Oracle" + " " + uid;
    });
  });

  it("1. Tc #2354, #2204 - Oracle placeholder & mandatory mark verification", () => {
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Oracle");
    agHelper.GetNAssertContains(locators._dsName, "Untitled datasource");
    agHelper.GetNClick(locators._dsName);
    agHelper.ClearTextField(locators._dsNameTxt); //removing ds name
    agHelper.AssertTooltip("Please enter a valid name");
    //agHelper.ValidateToastMessage("Invalid name");
    agHelper.TypeText(locators._dsNameTxt, dataSourceName);
    agHelper.PressEnter();
    agHelper.AssertAttribute(
      dataSources._host(),
      "placeholder",
      "myapp.abcde.oracle.net",
    );
    agHelper.AssertAttribute(
      dataSources._databaseName,
      "placeholder",
      "gfb284db6bcee33_testdb_high.adb.oraclecloud.com",
    );
    agHelper.AssertAttribute(dataSources._username, "placeholder", "admin");
    agHelper.AssertAttribute(dataSources._password, "placeholder", "password");
    agHelper.AssertElementLength(dataSources._mandatoryMark, 4); //verifyng all 4 fields are mandatory
    agHelper.AssertText(dataSources._host(), "val", "");
    agHelper.UpdateInputValue(
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

    agHelper.UpdateInputValue(
      dataSources._host(),
      dataManager.dsValues[dataManager.defaultEnviorment].oracle_host,
    );
    agHelper.UpdateInputValue(
      dataSources._databaseName,
      dataManager.dsValues[dataManager.defaultEnviorment].oracle_service,
    );
    dataSources.TestDatasource(false);
    agHelper.ValidateToastMessage("Missing username for authentication");
    agHelper.ValidateToastMessage("Missing password for authentication");

    agHelper.UpdateInputValue(
      dataSources._username,
      dataManager.dsValues[dataManager.defaultEnviorment].oracle_username,
    );
    agHelper.UpdateInputValue(
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
    dataSources.AssertDataSourceInfo(["Host address", "Port", "Service Name"]);
    agHelper.ClickButton("Edit"); //Navigate to Edit page & check if DS edit is opened
    dataSources.ValidateNSelectDropdown("SSL mode", "Disable");
    agHelper.GoBack(); //Do not edit anythin, go back to active ds list, ensure no modal is opened
    dataSources.AssertDSInActiveList(dataSourceName);
    // });
  });

  it("3. Tc #2359, Tc # 2360 , Tc # 2358 - Create Insert, Alter & Select queries", () => {
    dataSources.NavigateFromActiveDS(dataSourceName, true);
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
    agHelper.RenameWithInPane("CreateAircraft");
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    entityExplorer.ExpandCollapseEntity("Datasources");
    entityExplorer.ExpandCollapseEntity(dataSourceName);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: dataSourceName,
      action: "Refresh",
    });
    agHelper.AssertElementVisibility(
      entityExplorer._entityNameInExplorer(guid.toUpperCase()),
    );
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
    'Cargo Plane',
    'N12345',
    'Boeing',
    150,
    550.03,
    3500.30,
    TO_DATE('2020-01-15', 'YYYY-MM-DD'),
    TO_DATE('September 14, 2023', 'Month DD, YYYY'),
    'This aircraft is used for domestic flights.');`;
    entityExplorer.ActionTemplateMenuByEntityName(guid.toUpperCase(), "SELECT");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
    dataSources.EnterQuery(query);
    dataSources.RunQuery();
    selectQuery = `SELECT * FROM ${guid} WHERE ROWNUM < 10`;
    dataSources.EnterQuery(selectQuery);
    dataSources.RunQueryNVerifyResponseViews();
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
    dataSources.RunQueryNVerifyResponseViews(2);
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
    dataSources.RunQueryNVerifyResponseViews(4);
    selectQuery = selectQuery + ` and  aircraft_id IN (1, 6)`;
    dataSources.EnterQuery(selectQuery);
    dataSources.RunQueryNVerifyResponseViews(2);
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
    entityExplorer.SelectEntityByName("Query1", "Queries/JS");
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
    dataSources.RunQueryNVerifyResponseViews(3);
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
    entityExplorer.SelectEntityByName("Query1", "Queries/JS");
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
    dataSources.RunQueryNVerifyResponseViews(2);
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

  after(
    "Verify Deletion of the Oracle datasource after all created queries are deleted",
    () => {
      dataSources.DeleteDatasouceFromWinthinDS(dataSourceName, 409); //Since all queries exists
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      entityExplorer.DeleteAllQueriesForDB(dataSourceName);
      deployMode.DeployApp();
      deployMode.NavigateBacktoEditor();
      entityExplorer.ExpandCollapseEntity("Queries/JS");
      dataSources.DeleteDatasouceFromWinthinDS(dataSourceName, 200);
    },
  );
});

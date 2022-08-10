import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import { seconds, testTimeout } from "../../../../support/timeout";

let dsName: any, newCallsign: any;

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  table = ObjectsRegistry.Table,
  homePage = ObjectsRegistry.HomePage,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  deployMode = ObjectsRegistry.DeployMode;

describe("Validate Postgres Generate CRUD with JSON Form", () => {
  it("1. Create DS & then Add new Page and generate CRUD template using created datasource", () => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      ee.AddNewPage();
      agHelper.GetNClick(homePage._buildFromDataTableActionCard);
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);
    });

    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "film");

    GenerateCRUDNValidateDeployPage(
      "ACADEMY DINOSAUR",
      "2006",
      "English",
      "film_id",
    );

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ActionContextMenuByEntityName("Page2", "Delete", "Are you sure?");
    agHelper.ValidateNetworkStatus("@deletePage", 200);

    //Should not be able to delete ds until app is published again
    //coz if app is published & shared then deleting ds may cause issue, So!
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.DeleteDatasouceFromActiveTab(dsName as string, 409);
    });

    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.DeleteDatasouceFromActiveTab(dsName as string, 200);
    });
  });

  it("2. Create new app and Generate CRUD page using a new datasource", () => {
    homePage.NavigateToHome();
    homePage.CreateNewApplication();
    agHelper.GetNClick(homePage._buildFromDataTableActionCard);
    agHelper.GetNClick(dataSources._selectDatasourceDropdown);
    agHelper.GetNClickByContains(
      dataSources._dropdownOption,
      "Connect New Datasource",
    );
    dataSources.CreateDataSource("Postgres", false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "suppliers");

    GenerateCRUDNValidateDeployPage(
      "Exotic Liquids",
      "Purchasing Manager",
      "49 Gilbert St.",
      "supplier_id",
    );

    deployMode.NavigateBacktoEditor();
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
    propPane.ChangeTheme("Sunrise");
  });

  it("3. Generate CRUD page from datasource present in ACTIVE section", function() {
    dataSources.NavigateFromActiveDS(dsName, false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure");
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "orders");

    GenerateCRUDNValidateDeployPage(
      "VINET",
      "1996-07-04",
      "1996-08-01",
      "order_id",
    );

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ExpandCollapseEntity("PAGES");
    ee.ActionContextMenuByEntityName(
      "Public.orders",
      "Delete",
      "Are you sure?",
    );
    agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it("4. Create new CRUD Table 'Vessels' and populate & refresh Entity Explorer to find the new table", () => {
    const tableCreateQuery = `CREATE TABLE Vessels(
      SHIP_ID                  INTEGER  NOT NULL PRIMARY KEY
     ,CALLSIGN                 VARCHAR(7)
     ,SHIPNAME                 VARCHAR(30) NOT NULL
     ,COUNTRY                  VARCHAR(16) NOT NULL
     ,NEXT_PORT_NAME           VARCHAR(20)
     ,DESTINATION              VARCHAR(29)
     ,VESSEL_TYPE              VARCHAR(17) NOT NULL
     ,TIMEZONE                 NUMERIC(4,1)
     ,STATUS_NAME              VARCHAR(26) NOT NULL
     ,YEAR_BUILT               INTEGER
     ,AREA_CODE                VARCHAR(33) NOT NULL
     ,SPEED                    NUMERIC(8,4)
     ,ETA_UPDATED              VARCHAR(19)
     ,DISTANCE_TO_GO           INTEGER  NOT NULL
     ,CURRENT_PORT             VARCHAR(20)
   );
   INSERT INTO Vessels(SHIP_ID,CALLSIGN,SHIPNAME,COUNTRY,NEXT_PORT_NAME,DESTINATION,VESSEL_TYPE,TIMEZONE,STATUS_NAME,YEAR_BUILT,AREA_CODE,SPEED,ETA_UPDATED,DISTANCE_TO_GO,CURRENT_PORT) VALUES (371681,'ZCEF6','QUEEN MARY 2','Bermuda','STAVANGER','STAVANGER,NORWAY','Passenger',2,'Moored',2003,'NORDIC - Norwegian Coast',0.0,NULL,0,'STAVANGER');
   INSERT INTO Vessels(SHIP_ID,CALLSIGN,SHIPNAME,COUNTRY,NEXT_PORT_NAME,DESTINATION,VESSEL_TYPE,TIMEZONE,STATUS_NAME,YEAR_BUILT,AREA_CODE,SPEED,ETA_UPDATED,DISTANCE_TO_GO,CURRENT_PORT) VALUES (5630138,'H3RC','EVER GIVEN','Panama','KAOHSIUNG','KAOHSIUNG','Cargo',8,'Underway using Engine',2018,'SCHINA - South China',20.5,'2022-05-27 11:10:00',609,NULL);
   INSERT INTO Vessels(SHIP_ID,CALLSIGN,SHIPNAME,COUNTRY,NEXT_PORT_NAME,DESTINATION,VESSEL_TYPE,TIMEZONE,STATUS_NAME,YEAR_BUILT,AREA_CODE,SPEED,ETA_UPDATED,DISTANCE_TO_GO,CURRENT_PORT) VALUES (371584,'ZCDX4','ECLIPSE','Bermuda',NULL,'CRUISING','Pleasure Craft',3,'At Anchor',2010,'EMED - East Mediterranean',0.1,NULL,0,NULL);
   INSERT INTO Vessels(SHIP_ID,CALLSIGN,SHIPNAME,COUNTRY,NEXT_PORT_NAME,DESTINATION,VESSEL_TYPE,TIMEZONE,STATUS_NAME,YEAR_BUILT,AREA_CODE,SPEED,ETA_UPDATED,DISTANCE_TO_GO,CURRENT_PORT) VALUES (371668,'ZCEF2','QUEEN ELIZABETH','Bermuda','MANZANILLO','MANZANILLO','Passenger',-7,'Underway using Engine',2010,'WCCA - West Coast Central America',15.1,'2022-05-27 11:29:00',9,NULL);
   INSERT INTO Vessels(SHIP_ID,CALLSIGN,SHIPNAME,COUNTRY,NEXT_PORT_NAME,DESTINATION,VESSEL_TYPE,TIMEZONE,STATUS_NAME,YEAR_BUILT,AREA_CODE,SPEED,ETA_UPDATED,DISTANCE_TO_GO,CURRENT_PORT) VALUES (400773,'WDH2111','TIME BANDIT','USA',NULL,'FISHGROUNDS','Fishing',-8,'Underway using Engine',1991,'ALASKA - Alaska',8.0,NULL,0,'HOMER');
   INSERT INTO Vessels(SHIP_ID,CALLSIGN,SHIPNAME,COUNTRY,NEXT_PORT_NAME,DESTINATION,VESSEL_TYPE,TIMEZONE,STATUS_NAME,YEAR_BUILT,AREA_CODE,SPEED,ETA_UPDATED,DISTANCE_TO_GO,CURRENT_PORT) VALUES (372813,'C6XS7','OASIS OF THE SEAS','Bahamas','BAYONNE','BAYONNE','Passenger',-5,'Underway using Engine',2009,'CARIBS - Caribbean Sea',19.0,'2022-05-27 04:52:00',3872,NULL);
   INSERT INTO Vessels(SHIP_ID,CALLSIGN,SHIPNAME,COUNTRY,NEXT_PORT_NAME,DESTINATION,VESSEL_TYPE,TIMEZONE,STATUS_NAME,YEAR_BUILT,AREA_CODE,SPEED,ETA_UPDATED,DISTANCE_TO_GO,CURRENT_PORT) VALUES (435572,'WDC6082','WIZARD','USA','SEATTLE','SEATTLE','Fishing',-7,'Stopped',1945,'USWC - US West Coast',0.0,NULL,0,'SEATTLE');
   INSERT INTO Vessels(SHIP_ID,CALLSIGN,SHIPNAME,COUNTRY,NEXT_PORT_NAME,DESTINATION,VESSEL_TYPE,TIMEZONE,STATUS_NAME,YEAR_BUILT,AREA_CODE,SPEED,ETA_UPDATED,DISTANCE_TO_GO,CURRENT_PORT) VALUES (442329,'WDE5199','NORTHWESTERN','USA','SHILSHOLE','SHILSHOLE','Fishing',-7,'Moored',1977,'USWC - US West Coast',0.0,NULL,0,'SEATTLE');
   INSERT INTO Vessels(SHIP_ID,CALLSIGN,SHIPNAME,COUNTRY,NEXT_PORT_NAME,DESTINATION,VESSEL_TYPE,TIMEZONE,STATUS_NAME,YEAR_BUILT,AREA_CODE,SPEED,ETA_UPDATED,DISTANCE_TO_GO,CURRENT_PORT) VALUES (429068,'WYR4481','PAUL R TREGURTHA','USA','ST CLAIR','ST CLAIR','Cargo',-4,'Moored',1981,'GLAKES - Great Lakes',0.0,NULL,0,'ST CLAIR');
   INSERT INTO Vessels(SHIP_ID,CALLSIGN,SHIPNAME,COUNTRY,NEXT_PORT_NAME,DESTINATION,VESSEL_TYPE,TIMEZONE,STATUS_NAME,YEAR_BUILT,AREA_CODE,SPEED,ETA_UPDATED,DISTANCE_TO_GO,CURRENT_PORT) VALUES (159196,'OYGR2','EMMA MAERSK','Denmark','SHANGHAI','CNNBO>CNYSN','Cargo',8,'Underway using Engine',2006,'CCHINA - Central China',8.2,'2022-05-27 10:55:00',143,NULL);
   `;

    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("CreateVessels");
    dataSources.EnterQuery(tableCreateQuery);
    agHelper.FocusElement(locator._codeMirrorTextArea);
    //agHelper.VerifyEvaluatedValue(tableCreateQuery); //failing sometimes!

    dataSources.RunQueryNVerifyResponseViews();
    agHelper.ActionContextMenuWithInPane("Delete");

    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(ee._entityNameInExplorer("public.vessels"));
  });

  it("5. Validate Select record from Postgress datasource & verify query response", () => {
    ee.ActionTemplateMenuByEntityName("public.vessels", "SELECT");
    dataSources.RunQueryNVerifyResponseViews(10);
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("371681");
    });
    dataSources.ReadQueryTableResponse(6).then(($cellData) => {
      expect($cellData).to.eq("Passenger");
    });
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("6. Verify Generate CRUD for the new table & Verify Deploy mode for table - Vessels", () => {
    dataSources.NavigateFromActiveDS(dsName, false);
    agHelper.ValidateNetworkStatus("@getDatasourceStructure");
    agHelper.GetNClick(dataSources._selectTableDropdown);
    agHelper.GetNClickByContains(dataSources._dropdownOption, "vessels");
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.ValidateToastMessage("Successfully generated a page");
    agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.ValidateNetworkStatus("@getActions", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@updateLayout", 200);

    agHelper.GetNClick(dataSources._visibleTextSpan("GOT IT"));
    deployMode.DeployApp();

    //Validating loaded table
    agHelper.AssertElementExist(dataSources._selectedRow);
    table.ReadTableRowColumnData(0, 2, 2000).then(($cellData) => {
      expect($cellData).to.eq("EMMA MAERSK");
    });
    table.ReadTableRowColumnData(1, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("ECLIPSE");
    });
    table.ReadTableRowColumnData(2, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("QUEEN ELIZABETH");
    });
    table.ReadTableRowColumnData(3, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("QUEEN MARY 2");
    });
    table.ReadTableRowColumnData(4, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("OASIS OF THE SEAS");
    });
    table.ReadTableRowColumnData(5, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("TIME BANDIT");
    });
    table.ReadTableRowColumnData(6, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("PAUL R TREGURTHA");
    });
    table.ReadTableRowColumnData(7, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("WIZARD");
    });
    table.ReadTableRowColumnData(8, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("NORTHWESTERN");
    });
    table.ReadTableRowColumnData(9, 2, 200).then(($cellData) => {
      expect($cellData).to.eq("EVER GIVEN");
    });

    //Validating loaded JSON form
    cy.xpath(locator._spanButton("Update")).then((selector) => {
      cy.wrap(selector)
        .invoke("attr", "class")
        .then((classes) => {
          //cy.log("classes are:" + classes);
          expect(classes).not.contain("bp3-disabled");
        });
    });

    dataSources.AssertJSONFormHeader(0, 0, "ship_id");

    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    // //Delete the test data
    // ee.ActionContextMenuByEntityName("Productlines", "Delete", "Are you sure?");
    // agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it("7. Update the UpdateQuery to update all columns from UI", () => {
    const updateQuery = `UPDATE public."vessels" SET
		"callsign" = UPPER('{{update_form.fieldState.callsign.isVisible ? update_form.formData.callsign : update_form.sourceData.callsign}}'),
		"shipname" = '{{update_form.fieldState.shipname.isVisible ? update_form.formData.shipname : update_form.sourceData.shipname}}',
    "country" = '{{update_form.fieldState.country.isVisible ? update_form.formData.country : update_form.sourceData.country}}',
		"next_port_name" = '{{update_form.fieldState.next_port_name.isVisible ? update_form.formData.next_port_name : update_form.sourceData.next_port_name}}',
		"destination" = '{{update_form.fieldState.destination.isVisible ? update_form.formData.destination : update_form.sourceData.destination}}',
		"vessel_type" = '{{update_form.fieldState.vessel_type.isVisible ? update_form.formData.vessel_type : update_form.sourceData.vessel_type}}',
		"timezone" = '{{update_form.fieldState.timezone.isVisible ? update_form.formData.timezone : update_form.sourceData.timezone}}',
		"status_name" = '{{update_form.fieldState.status_name.isVisible ? update_form.formData.status_name : update_form.sourceData.status_name}}',
		"year_built" = '{{update_form.fieldState.year_built.isVisible ? update_form.formData.year_built : update_form.sourceData.year_built}}',
		"area_code" = '{{update_form.fieldState.area_code.isVisible ? update_form.formData.area_code : update_form.sourceData.area_code}}',
		"speed" = '{{update_form.fieldState.speed.isVisible ? update_form.formData.speed : update_form.sourceData.speed}}',
		"eta_updated" = '{{update_form.fieldState.eta_updated.isVisible ? update_form.formData.eta_updated : update_form.sourceData.eta_updated}}',
		"distance_to_go" = '{{update_form.fieldState.distance_to_go.isVisible ? update_form.formData.distance_to_go : update_form.sourceData.distance_to_go}}',
		"current_port" = '{{update_form.fieldState.current_port.isVisible ? update_form.formData.current_port : update_form.sourceData.current_port}}'
	WHERE "ship_id" = {{data_table.selectedRow.ship_id}};`;

    ee.SelectEntityByName("UpdateQuery", "QUERIES/JS");
    dataSources.EnterQuery(updateQuery);
    agHelper.Escape();
    agHelper.AssertAutoSave();
    ee.ExpandCollapseEntity("QUERIES/JS", false);
    ee.SelectEntityByName("update_form", "WIDGETS");
    updatingVesselsJSONPropertyFileds();
  });

  it("8. Verify Update data from Deploy page - on Vessels - existing record", () => {
    deployMode.DeployApp();
    agHelper.Sleep(2000);
    table.SelectTableRow(0); //to make JSON form hidden
    agHelper.Sleep(2000); //Sleep time for tab to disappear!
    agHelper.AssertElementAbsence(locator._jsonFormWidget);
    table.SelectTableRow(5);
    agHelper.AssertElementVisible(locator._jsonFormWidget);
    dataSources.AssertJSONFormHeader(5, 0, "ship_id");
    generateCallsignInfo(5);
    cy.get("@Callsign").then(($callSign) => {
      newCallsign = $callSign;
      cy.log("newCallsign is : " + newCallsign);
      updateNVerify(5, 1, newCallsign as string);
    });

    //Checking Required field validations
    deployMode.ClearJSONFieldValue("Shipname");
    agHelper.AssertElementVisible(
      locator._visibleTextDiv("This field is required"),
    );
    cy.xpath(locator._spanButton("Update") + "/parent::div").should(
      "have.attr",
      "disabled",
    );
    deployMode.EnterJSONInputValue("Shipname", "DISNEY DREAM");

    deployMode.ClearJSONFieldValue("Country");
    deployMode.EnterJSONInputValue("Country", "France");

    deployMode.EnterJSONInputValue("Next Port Name", "SYDNEY");

    deployMode.ClearJSONFieldValue("Destination");
    deployMode.EnterJSONInputValue("Destination", "FR BAY");

    deployMode.SelectJsonFormDropDown("Pleasure Craft");

    deployMode.ClearJSONFieldValue("Timezone");
    deployMode.EnterJSONInputValue("Timezone", "-15");
    agHelper.AssertElementVisible(
      locator._visibleTextDiv("Not a valid timezone!"),
    );
    deployMode.ClearJSONFieldValue("Timezone");
    deployMode.EnterJSONInputValue("Timezone", "-7");

    deployMode.ClearJSONFieldValue("Status Name");
    deployMode.EnterJSONInputValue("Status Name", "Underway by Sail");

    deployMode.ClearJSONFieldValue("Year Built");
    deployMode.EnterJSONInputValue("Year Built", "2017");

    deployMode.ClearJSONFieldValue("Area Code");
    deployMode.EnterJSONInputValue("Area Code", "BSEA - Black Sea");

    deployMode.ClearJSONFieldValue("Speed");
    deployMode.EnterJSONInputValue("Speed", "17.6");

    agHelper.GetNClick(
      deployMode._jsonFormDatepickerFieldByName("Eta Updated"),
    );
    agHelper.GetNClick(locator._datePicker(23));

    deployMode.ClearJSONFieldValue("Distance To Go");
    deployMode.EnterJSONInputValue("Distance To Go", "303");

    deployMode.ClearJSONFieldValue("Current Port");
    deployMode.EnterJSONInputValue("Current Port", "BAYONNE");

  });

  it("9. Verify Update data from Deploy page - on Vessels - existing record", () => {

    updateNVerify(5, 2, "DISNEY DREAM");
    table.ReadTableRowColumnData(5, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("France");
    });
    table.ReadTableRowColumnData(5, 4, 100).then(($cellData) => {
      expect($cellData).to.eq("SYDNEY");
    });
    table.ReadTableRowColumnData(5, 5, 100).then(($cellData) => {
      expect($cellData).to.eq("FR BAY");
    });
    table.ReadTableRowColumnData(5, 6, 100).then(($cellData) => {
      expect($cellData).to.eq("Pleasure Craft");
    });
    table.ReadTableRowColumnData(5, 7, 100).then(($cellData) => {
      expect($cellData).to.eq("-7");
    });
    table.ReadTableRowColumnData(5, 8, 100).then(($cellData) => {
      expect($cellData).to.eq("Underway by Sail");
    });
    table.ReadTableRowColumnData(5, 9, 100).then(($cellData) => {
      expect($cellData).to.eq("2017");
    });
    table.ReadTableRowColumnData(5, 10, 100).then(($cellData) => {
      expect($cellData).to.eq("BSEA - Black Sea");
    });
    table.ReadTableRowColumnData(5, 11, 100).then(($cellData) => {
      expect($cellData).to.eq("17.6");
    });
    table.ReadTableRowColumnData(5, 12, 100).then(($cellData) => {
      expect($cellData).to.contain(23);
    });
    table.ReadTableRowColumnData(5, 13, 100).then(($cellData) => {
      expect($cellData).to.eq("303");
    });
    table.ReadTableRowColumnData(5, 14, 100).then(($cellData) => {
      expect($cellData).to.eq("BAYONNE");
    });
  });

  it("10. Verify Delete field data from Deploy page - on Vessels - existing record", () => {
    table.SelectTableRow(8);
    dataSources.AssertJSONFormHeader(8, 0, "ship_id");

    deployMode.ClearJSONFieldValue("Country");
    deployMode.ClearJSONFieldValue("Next Port Name");
    deployMode.ClearJSONFieldValue("Destination");

    agHelper.GetNClick(deployMode._clearDropdown);
    cy.get(deployMode._jsonSelectDropdown).click();

    deployMode.ClearJSONFieldValue("Timezone");
    deployMode.ClearJSONFieldValue("Status Name");
    deployMode.ClearJSONFieldValue("Year Built");
    deployMode.ClearJSONFieldValue("Area Code");
    deployMode.ClearJSONFieldValue("Speed");
    //deployMode.ClearJSONFieldValue("Eta Updated");
    deployMode.ClearJSONFieldValue("Current Port");

    agHelper.ClickButton("Update");
    agHelper.WaitUntilToastDisappear(
      `null value in column "vessel_type" violates not-null constraint`,
    );
    deployMode.SelectJsonFormDropDown("Passenger");

    deployMode.ClearJSONFieldValue("Distance To Go");
    agHelper.ClickButton("Update");
    agHelper.WaitUntilToastDisappear(
      `null value in column "distance_to_go" violates not-null constraint`,
    );
    deployMode.EnterJSONInputValue("Distance To Go", "7.4");

    updateNVerify(8, 3, "");
  });

  it("11. Verify Delete row from Deploy page - on Vessels - existing record", () => {
    table.SelectTableRow(1);
    dataSources.AssertJSONFormHeader(1, 0, "ship_id");
    agHelper.ClickButton("Delete", 1);
    agHelper.AssertElementVisible(locator._modal);
    agHelper.AssertElementVisible(
      dataSources._visibleTextSpan(
        "Are you sure you want to delete this item?",
      ),
    );
    agHelper.ClickButton("Cancel");
    dataSources.AssertJSONFormHeader(1, 0, "ship_id");
    agHelper.ClickButton("Delete", 1);
    agHelper.AssertElementVisible(locator._modal);
    agHelper.AssertElementVisible(
      dataSources._visibleTextSpan(
        "Are you sure you want to delete this item?",
      ),
    );
    agHelper.ClickButton("Confirm");
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(2500); // for delete to take effect!
    table.AssertSelectedRow(0); //Control going back to 1st row in table
    dataSources.AssertJSONFormHeader(0, 0, "ship_id");
  });

  it("12. Verify Refresh table from Deploy page - on Vessels & verify all updates persists", () => {
    agHelper.GetNClick(dataSources._refreshIcon);

    //Store Address deletion remains
    table.ReadTableRowColumnData(7, 3, 2000).then(($cellData) => {
      expect($cellData).to.eq("");
    });
    table.ReadTableRowColumnData(7, 4, 200).then(($cellData) => {
      expect($cellData).to.eq("");
    });

    table.ReadTableRowColumnData(1, 0, 200).then(($cellData) => {
      expect($cellData).not.eq("371584"); //Deleted record ship_id should not be present anymore!
    });

    table.NavigateToNextPage(); //page 2
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitForTableEmpty(); //page 2
    agHelper.AssertElementAbsence(locator._jsonFormWidget); //JSON form also should not be present

    //Try to add via to Insert Modal - JSON fields not showing correct fields, Open bug 14122

    table.NavigateToPreviousPage();
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitUntilTableLoad();
  });

  it("13. Update the InsertQuery to insert all columns from UI", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    const insertQuery = `INSERT INTO public."vessels" (
      "ship_id",
      "callsign",
      "shipname",
      "country",
      "next_port_name",
      "destination",
      "vessel_type",
      "timezone",
      "status_name",
      "year_built",
      "area_code",
      "speed",
      "eta_updated",
      "distance_to_go",
      "current_port"
    )
    VALUES (
      '{{insert_form.formData.ship_id}}',
      UPPER('{{insert_form.formData.callsign}}'),
      '{{insert_form.formData.shipname}}',
      '{{insert_form.formData.country}}',
      '{{insert_form.formData.next_port_name}}',
      '{{insert_form.formData.destination}}',
      '{{insert_form.formData.vessel_type}}',
      '{{insert_form.formData.timezone}}',
      '{{insert_form.formData.status_name}}',
      '{{insert_form.formData.year_built}}',
      '{{insert_form.formData.area_code}}',
      '{{insert_form.formData.speed}}',
      '{{insert_form.formData.eta_updated}}',
      '{{insert_form.formData.distance_to_go}}',
      '{{insert_form.formData.current_port}}'
    );`;

    ee.SelectEntityByName("InsertQuery", "QUERIES/JS");
    dataSources.EnterQuery(insertQuery);
    agHelper.Escape();
    agHelper.AssertAutoSave();
    ee.ExpandCollapseEntity("QUERIES/JS", false);
  });

  it("14. Update JSON fields with placeholds for Addition - on Vessels", () => {
    testTimeout(seconds(600));
    ee.ExpandCollapseEntity("WIDGETS");
    ee.ExpandCollapseEntity("Insert_Modal");
    ee.SelectEntityByName("insert_form");
    agHelper.Sleep(2000);

    //Removing Default values & setting placeholder!
    propPane.UpdateJSONFormWithPlaceholders();

    //Updating JSON field properties similar to Update JSON!
    updatingVesselsJSONPropertyFileds();
  });

  it("15. Verify Add/Insert from Deploy page - on Vessels - new record - few validations", () => {
    deployMode.DeployApp();
    table.AssertSelectedRow(0);

    agHelper.GetNClick(dataSources._addIcon);
    agHelper.Sleep();
    //agHelper.AssertElementVisible(locator._jsonFormWidget, 1); //Insert Modal
    agHelper.AssertElementVisible(locator._visibleTextDiv("Insert Row"));

    //Checking Required field validations
    cy.xpath(locator._spanButton("Submit") + "/parent::div").should(
      "have.attr",
      "disabled",
    );
    deployMode.EnterJSONInputValue("Shipname", "MALTESE FALCON", 1);
    cy.xpath(locator._spanButton("Submit") + "/parent::div").should(
      "not.have.attr",
      "disabled",
    );

    //Checking Primary Key validation error toast
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage(
      `null value in column "ship_id" violates not-null constraint`,
    );
    deployMode.EnterJSONInputValue("Ship Id", "159196");
  });

  it("16. Verify Add/Insert from Deploy page - on Vessels - new record", () => {
    deployMode.EnterJSONInputValue("Callsign", "9HUQ9", 1);

    deployMode.EnterJSONInputValue("Country", "Malta", 1);

    deployMode.EnterJSONInputValue("Next Port Name", "CORFU", 1);

    deployMode.EnterJSONInputValue("Destination", "CORFU", 1);

    deployMode.SelectJsonFormDropDown("Special Craft", 1);

    deployMode.EnterJSONInputValue("Timezone", "-12", 1);
    agHelper.AssertElementVisible(
      locator._visibleTextDiv("Not a valid timezone!"),
    );
    deployMode.ClearJSONFieldValue("Timezone", 1);
    deployMode.EnterJSONInputValue("Timezone", "-2", 1);

    deployMode.EnterJSONInputValue("Status Name", "Moored", 1);

    deployMode.EnterJSONInputValue("Year Built", "1967", 1);

    deployMode.EnterJSONInputValue("Area Code", "USG - Gulf of Mexico", 1);

    deployMode.EnterJSONInputValue("Speed", "0.6", 1);

    agHelper.GetNClick(
      deployMode._jsonFormDatepickerFieldByName("Eta Updated"),
      1,
    );
    agHelper.GetNClick(locator._datePicker(2));

    deployMode.EnterJSONInputValue("Distance To Go", "18.1", 1);

    deployMode.EnterJSONInputValue("Current Port", "GALVESTON", 1);

    cy.xpath(deployMode._jsonFormFieldByName("Callsign", true))
      .eq(1)
      .invoke("attr", "type")
      .should("eq", "password");

    deployMode.ClearJSONFieldValue("Shipname", 1);
    agHelper.AssertElementVisible(
      locator._visibleTextDiv("This field is required"),
    );
    cy.xpath(locator._spanButton("Submit") + "/parent::div").should(
      "have.attr",
      "disabled",
    );
    deployMode.EnterJSONInputValue("Shipname", "MALTESE FALCON", 1);

    agHelper.ClickButton("Submit");
    agHelper.WaitUntilToastDisappear(
      `duplicate key value violates unique constraint "vessels_pkey"`,
    );

    deployMode.ClearJSONFieldValue("Ship Id");
    deployMode.EnterJSONInputValue("Ship Id", "159180");
    agHelper.ClickButton("Submit");

    //asserting only Update JSON form is present, &  Insert Modal is closed
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(3000); //for Insert to reflect!
    // agHelper
    //   .GetElementLength(locator._jsonFormWidget)
    //   .then(($len) => expect($len).to.eq(1));
  });

  it("17. Verify Update fields/Delete from Deploy page - on Vessels - newly inserted record", () => {
    table.SelectTableRow(0);

    //validating update happened fine!
    dataSources.AssertJSONFormHeader(0, 0, "ship_id", "159180"); //Validaing new record got inserted in 1st position due to id used

    deployMode.ClearJSONFieldValue("Shipname");
    deployMode.EnterJSONInputValue("Shipname", "MAJESTIC MAERSK");

    deployMode.ClearJSONFieldValue("Next Port Name");

    updateNVerify(0, 2, "MAJESTIC MAERSK");

    table.NavigateToNextPage(); //page 2
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitForTableEmpty(); //page 2
    agHelper.AssertElementAbsence(locator._jsonFormWidget); //JSON form should be present

    table.NavigateToPreviousPage();
    agHelper.Sleep(3000); //wait for table navigation to take effect!
    table.WaitUntilTableLoad();

    dataSources.AssertJSONFormHeader(0, 0, "ship_id", "159180");
    agHelper.ClickButton("Delete", 0);
    agHelper.AssertElementVisible(locator._modal);
    agHelper.AssertElementVisible(
      dataSources._visibleTextSpan(
        "Are you sure you want to delete this item?",
      ),
    );
    agHelper.ClickButton("Confirm");
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    table.AssertSelectedRow(0); //Control going back to 1st row in table

    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).not.eq("159180"); //Deleted record Store_ID
    });
  });

  it("18. Validate Deletion of the Newly Created Page - Vessels", () => {
    deployMode.NavigateBacktoEditor();
    table.WaitUntilTableLoad();
    //Delete the test data
    ee.ActionContextMenuByEntityName(
      "Public.vessels",
      "Delete",
      "Are you sure?",
    );
    agHelper.ValidateNetworkStatus("@deletePage", 200);
  });

  it("19. Validate Drop of the Newly Created - Vessels - Table from Postgres datasource", () => {
    const deleteTblQuery = "DROP TABLE Vessels;";
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("DropVessels");
    dataSources.EnterQuery(deleteTblQuery);
    agHelper.FocusElement(locator._codeMirrorTextArea);

    dataSources.RunQueryNVerifyResponseViews();
    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementAbsence(ee._entityNameInExplorer("public.vessels"));
  });

  it("20. Verify application does not break when user runs the query with wrong table name", function() {
    ee.SelectEntityByName("DropVessels", "QUERIES/JS");
    dataSources.RunQuery(false);
    agHelper
      .GetText(dataSources._queryError)
      .then(($errorText) =>
        expect($errorText).to.contain(`table "vessels" does not exist`),
      );
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("21. Verify Deletion of the datasource when Pages/Actions associated are not removed yet", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //ProductLines, Employees pages are still using this ds
  });

  function GenerateCRUDNValidateDeployPage(
    col1Text: string,
    col2Text: string,
    col3Text: string,
    jsonFromHeader: string,
  ) {
    agHelper.GetNClick(dataSources._generatePageBtn);
    agHelper.ValidateNetworkStatus("@replaceLayoutWithCRUDPage", 201);
    agHelper.ValidateToastMessage("Successfully generated a page");
    agHelper.ValidateNetworkStatus("@getActions", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@updateLayout", 200);

    agHelper.GetNClick(dataSources._visibleTextSpan("GOT IT"));
    deployMode.DeployApp();

    //Validating loaded table
    agHelper.AssertElementExist(dataSources._selectedRow);
    table.ReadTableRowColumnData(0, 1, 2000).then(($cellData) => {
      expect($cellData).to.eq(col1Text);
    });
    table.ReadTableRowColumnData(0, 3, 200).then(($cellData) => {
      expect($cellData).to.eq(col2Text);
    });
    table.ReadTableRowColumnData(0, 4, 200).then(($cellData) => {
      expect($cellData).to.eq(col3Text);
    });

    //Validating loaded JSON form
    cy.xpath(locator._spanButton("Update")).then((selector) => {
      cy.wrap(selector)
        .invoke("attr", "class")
        .then((classes) => {
          //cy.log("classes are:" + classes);
          expect(classes).not.contain("bp3-disabled");
        });
    });
    dataSources.AssertJSONFormHeader(0, 0, jsonFromHeader);
  }

  function generateCallsignInfo(rowIndex: number) {
    //let callSign: string = "";
    table.ReadTableRowColumnData(rowIndex, 9, 200).then(($yearBuilt: any) => {
      table.ReadTableRowColumnData(rowIndex, 11, 200).then(($areaCode: any) => {
        table.ReadTableRowColumnData(rowIndex, 3, 200).then(($country: any) => {
          const callSign =
            ($country as string).slice(0, 2) +
            ($areaCode as string).slice(0, 3) +
            ($yearBuilt as string).slice(0, 2); //(/(?<=\()).+?(?=\))/g)
          deployMode.ClearJSONFieldValue("Callsign");
          deployMode.EnterJSONInputValue("Callsign", callSign);
          cy.xpath(deployMode._jsonFormFieldByName("Callsign", true))
            .invoke("attr", "type")
            .should("eq", "password");
          cy.wrap(callSign).as("Callsign");
        });
      });
    });
  }

  function updateNVerify(
    rowIndex: number,
    colIndex: number,
    expectedTableData: string,
  ) {
    agHelper.ClickButton("Update"); //Update does not work, Bug 14063
    agHelper.AssertElementAbsence(locator._toastMsg); //Validating fix for Bug 14063 - for common table columns
    agHelper.Sleep(2000); //for update to reflect!
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    table.AssertSelectedRow(rowIndex); //Validate Primary key column selection

    //validating update happened fine!
    table.ReadTableRowColumnData(rowIndex, colIndex, 200).then(($cellData) => {
      expect($cellData).to.eq(expectedTableData);
    });
  }

  function updatingVesselsJSONPropertyFileds() {
    propPane.ChangeJsonFormFieldType("Callsign", "Password Input");
    propPane.NavigateBackToPropertyPane();

    propPane.OpenJsonFormFieldSettings("Shipname");
    propPane.ToggleOnOrOff("Required");
    propPane.NavigateBackToPropertyPane();

    propPane.ChangeJsonFormFieldType("Vessel Type", "Select");
    propPane.UpdatePropertyFieldValue(
      "Options",
      `{{["Cargo", "Pleasure Craft", "Passenger", "Fishing", "Special Craft"].map(item=> {return {
        label: item,
        value: item
        }})}}`,
    );
    propPane.NavigateBackToPropertyPane();

    propPane.OpenJsonFormFieldSettings("Timezone");
    propPane.UpdatePropertyFieldValue("Min", "-10");
    propPane.UpdatePropertyFieldValue("Max", "10");
    propPane.UpdatePropertyFieldValue("Error Message", "Not a valid timezone!");
    propPane.NavigateBackToPropertyPane();

    propPane.ChangeJsonFormFieldType("Eta Updated", "Datepicker");
    propPane.ToggleOnOrOff("Close On Selection", "On");
    propPane.NavigateBackToPropertyPane();
  }
});

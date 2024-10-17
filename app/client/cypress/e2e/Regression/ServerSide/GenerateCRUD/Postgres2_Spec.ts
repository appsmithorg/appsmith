import {
  agHelper,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  locators,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let dsName: any, newCallsign: any;

describe(
  "Validate Postgres Generate CRUD with JSON Form",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    before("Create DS for generate CRUD template test", () => {
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
    });

    it("1. Create new CRUD Table 'Vessels' and populate & refresh Entity Explorer to find the new table", () => {
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

      dataSources.CreateQueryForDS(dsName, tableCreateQuery, "CreateVessels");
      agHelper.FocusElement(locators._codeMirrorTextArea);
      //agHelper.VerifyEvaluatedValue(tableCreateQuery); //failing sometimes!

      dataSources.RunQueryNVerifyResponseViews();
    });

    it("2. Validate Select record from Postgress datasource & verify query response", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.vessels",
        "Select",
      );
      dataSources.RunQueryNVerifyResponseViews(10);
      dataSources.AssertQueryTableResponse(0, "371681");
      dataSources.AssertQueryTableResponse(6, "Passenger");
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      EditorNavigation.SelectEntityByName("CreateVessels", EntityType.Query);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("3. Verify Generate CRUD for the new table & Verify Deploy mode for table - Vessels", () => {
      EditorNavigation.SelectEntityByName(dsName, EntityType.Datasource);
      dataSources.SelectTableFromPreviewSchemaList("public.vessels");
      agHelper.GetNClick(dataSources._datasourceCardGeneratePageBtn);
      agHelper.ValidateToastMessage("Successfully generated a page");
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      assertHelper.AssertNetworkStatus("@getActions", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));

      //Validating loaded table
      agHelper.AssertElementExist(dataSources._selectedRow);
      table.ReadTableRowColumnData(0, 2, "v2", 2000).then(($cellData) => {
        expect($cellData).to.eq("EMMA MAERSK");
      });
      table.ReadTableRowColumnData(1, 2, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("ECLIPSE");
      });
      table.ReadTableRowColumnData(2, 2, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("QUEEN ELIZABETH");
      });
      table.ReadTableRowColumnData(3, 2, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("QUEEN MARY 2");
      });
      table.ReadTableRowColumnData(4, 2, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("OASIS OF THE SEAS");
      });
      table.ReadTableRowColumnData(5, 2, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("TIME BANDIT");
      });
      table.ReadTableRowColumnData(6, 2, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("PAUL R TREGURTHA");
      });
      table.ReadTableRowColumnData(7, 2, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("WIZARD");
      });
      table.ReadTableRowColumnData(8, 2, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("NORTHWESTERN");
      });
      table.ReadTableRowColumnData(9, 2, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("EVER GIVEN");
      });

      //Validating loaded JSON form
      cy.xpath(locators._buttonByText("Update")).then((selector) => {
        cy.wrap(selector)
          .invoke("attr", "class")
          .then((classes) => {
            //cy.log("classes are:" + classes);
            expect(classes).not.contain("bp3-disabled");
          });
      });

      dataSources.AssertJSONFormHeader(0, 0, "ship_id");

      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");
      // //Delete the test data
      // entityExplorer.ActionContextMenuByEntityName("Productlines", "Delete", "Are you sure?");
      // assertHelper.AssertNetworkStatus("@deletePage" , 200);
    });

    it("4. Update the UpdateQuery to update all columns from UI", () => {
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

      EditorNavigation.SelectEntityByName("UpdateQuery", EntityType.Query);
      dataSources.EnterQuery(updateQuery);
      agHelper.PressEscape();
      agHelper.AssertAutoSave();
      EditorNavigation.SelectEntityByName("update_form", EntityType.Widget);
      UpdatingVesselsJSONPropertyFileds();
    });

    it("5. Verify Update data from Deploy page - on Vessels - existing record", () => {
      deployMode.DeployApp();
      agHelper.Sleep(2000);
      table.SelectTableRow(0, 0, false, "v2"); //to make JSON form hidden
      agHelper.Sleep(2000); //Sleep time for tab to disappear!
      agHelper.AssertElementAbsence(locators._jsonFormWidget);
      table.SelectTableRow(5, 0, true, "v2");
      agHelper.AssertElementVisibility(locators._jsonFormWidget);
      dataSources.AssertJSONFormHeader(5, 0, "ship_id");
      generateCallsignInfo(5);
      cy.get("@Callsign").then(($callSign) => {
        newCallsign = $callSign;
        cy.log("newCallsign is : " + newCallsign);
        UpdateNVerify(5, 1, newCallsign as string);
      });

      //Checking Required field validations
      deployMode.ClearJSONFieldValue("Shipname");
      agHelper.AssertElementVisibility(
        locators._visibleTextDiv("This field is required"),
      );
      cy.xpath(locators._buttonByText("Update") + "/parent::div").should(
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
      agHelper.AssertElementVisibility(
        locators._visibleTextDiv("Not a valid timezone!"),
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
      agHelper.GetNClick(locators._datePicker(23));
      agHelper.GetNClick(deployMode._jsonFieldName("Distance To Go"));

      deployMode.ClearJSONFieldValue("Distance To Go");
      deployMode.EnterJSONInputValue("Distance To Go", "303");

      deployMode.ClearJSONFieldValue("Current Port");
      deployMode.EnterJSONInputValue("Current Port", "BAYONNE");
    });

    it("6. Verify Update data from Deploy page - on Vessels - existing record", () => {
      UpdateNVerify(5, 2, "DISNEY DREAM");
      table.ReadTableRowColumnData(5, 3, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("France");
      });
      table.ReadTableRowColumnData(5, 4, "v2", 100).then(($cellData) => {
        expect($cellData).to.eq("SYDNEY");
      });
      table.ReadTableRowColumnData(5, 5, "v2", 100).then(($cellData) => {
        expect($cellData).to.eq("FR BAY");
      });
      table.ReadTableRowColumnData(5, 6, "v2", 100).then(($cellData) => {
        expect($cellData).to.eq("Pleasure Craft");
      });
      table.ReadTableRowColumnData(5, 7, "v2", 100).then(($cellData) => {
        expect($cellData).to.eq("-7");
      });
      table.ReadTableRowColumnData(5, 8, "v2", 100).then(($cellData) => {
        expect($cellData).to.eq("Underway by Sail");
      });
      table.ReadTableRowColumnData(5, 9, "v2", 100).then(($cellData) => {
        expect($cellData).to.eq("2017");
      });
      table.ReadTableRowColumnData(5, 10, "v2", 100).then(($cellData) => {
        expect($cellData).to.eq("BSEA - Black Sea");
      });
      table.ReadTableRowColumnData(5, 11, "v2", 100).then(($cellData) => {
        expect($cellData).to.eq("17.6");
      });
      table.ReadTableRowColumnData(5, 12, "v2", 100).then(($cellData) => {
        expect($cellData).to.contain(23);
      });
      table.ReadTableRowColumnData(5, 13, "v2", 100).then(($cellData) => {
        expect($cellData).to.eq("303");
      });
      table.ReadTableRowColumnData(5, 14, "v2", 100).then(($cellData) => {
        expect($cellData).to.eq("BAYONNE");
      });
    });

    it("7. Verify Delete field data from Deploy page - on Vessels - existing record", () => {
      table.SelectTableRow(8, 0, true, "v2");
      dataSources.AssertJSONFormHeader(8, 0, "ship_id");

      deployMode.ClearJSONFieldValue("Country");
      deployMode.ClearJSONFieldValue("Next Port Name");
      deployMode.ClearJSONFieldValue("Destination");

      agHelper.GetNClick(deployMode._clearDropdown);
      agHelper.GetNClick(deployMode._jsonSelectDropdown);

      deployMode.ClearJSONFieldValue("Timezone");
      deployMode.ClearJSONFieldValue("Status Name");
      deployMode.ClearJSONFieldValue("Year Built");
      deployMode.ClearJSONFieldValue("Area Code");
      deployMode.ClearJSONFieldValue("Speed");
      //deployMode.ClearJSONFieldValue("Eta Updated");
      deployMode.ClearJSONFieldValue("Current Port");

      agHelper.ClickButton("Update");
      cy.wait("@postExecute").then(({ response }) => {
        expect(response?.body.data.isExecutionSuccess).to.eq(false);
        expect(
          response?.body.data.pluginErrorDetails.downstreamErrorMessage,
        ).to.contains(
          'ERROR: null value in column "vessel_type" violates not-null constraint\n  Detail: Failing row contains (442329, WDE5199, NORTHWESTERN, , , , null, null, , null, , null, null, 0, ).',
        );
      });
      deployMode.SelectJsonFormDropDown("Passenger");

      deployMode.ClearJSONFieldValue("Distance To Go");
      agHelper.ClickButton("Update");
      cy.wait("@postExecute").then(({ response }) => {
        expect(response?.body.data.isExecutionSuccess).to.eq(false);
        expect(
          response?.body.data.pluginErrorDetails.downstreamErrorMessage,
        ).to.contains(
          'ERROR: null value in column "distance_to_go" violates not-null constraint\n  Detail: Failing row contains (442329, WDE5199, NORTHWESTERN, , , , Passenger, null, , null, , null, null, null, ).',
        );
      });
      deployMode.EnterJSONInputValue("Distance To Go", "7.4");
      agHelper.WaitUntilAllToastsDisappear(); //for previous case toasts for next Update to be Success!!

      UpdateNVerify(8, 3, "");
    });

    it("8. Verify Delete row from Deploy page - on Vessels - existing record", () => {
      table.SelectTableRow(1, 0, true, "v2");
      dataSources.AssertJSONFormHeader(1, 0, "ship_id");
      agHelper.ClickButton("Delete", 1);
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.AssertElementVisibility(
        dataSources._visibleTextSpan(
          "Are you sure you want to delete this item?",
        ),
      );
      agHelper.ClickButton("Cancel");
      dataSources.AssertJSONFormHeader(1, 0, "ship_id");
      agHelper.ClickButton("Delete", 1);
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.AssertElementVisibility(
        dataSources._visibleTextSpan(
          "Are you sure you want to delete this item?",
        ),
      );
      agHelper.ClickButton("Confirm");
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.Sleep(2500); // for delete to take effect!

      // Row is not getting highlighted in table v2, hence commenting this line
      // table.AssertSelectedRow(0); //Control going back to 1st row in table
      // dataSources.AssertJSONFormHeader(0, 0, "ship_id");
    });

    it("9. Verify Refresh table from Deploy page - on Vessels & verify all updates persists", () => {
      agHelper.GetNClick(dataSources._refreshIcon);

      //Store Address deletion remains
      table.ReadTableRowColumnData(7, 3, "v2", 2000).then(($cellData) => {
        expect($cellData).to.eq("");
      });
      table.ReadTableRowColumnData(7, 4, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq("");
      });

      table.ReadTableRowColumnData(1, 0, "v2", 200).then(($cellData) => {
        expect($cellData).not.eq("371584"); //Deleted record ship_id should not be present anymore!
      });

      table.NavigateToNextPage(true, "v2"); //page 2
      agHelper.Sleep(3000); //wait for table navigation to take effect!
      table.WaitForTableEmpty("v2"); //page 2

      // Row is not getting highlighted in table v2, hence commenting this line
      // agHelper.AssertElementAbsence(locators._jsonFormWidget); //JSON form also should not be present

      //Try to add via to Insert Modal - JSON fields not showing correct fields, Open bug 14122

      table.NavigateToPreviousPage(true, "v2");
      agHelper.Sleep(3000); //wait for table navigation to take effect!
      table.WaitUntilTableLoad(0, 0, "v2");
    });

    it("10. Update the InsertQuery to insert all columns from UI", () => {
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");
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

      EditorNavigation.SelectEntityByName("InsertQuery", EntityType.Query);
      dataSources.EnterQuery(insertQuery);
      agHelper.PressEscape();
      agHelper.AssertAutoSave();
    });

    it("11. Update JSON fields with placeholds for Addition - on Vessels", () => {
      EditorNavigation.SelectEntityByName(
        "insert_form",
        EntityType.Widget,
        {},
        ["Insert_Modal"],
      );
      agHelper.Sleep(2000);

      //Removing Default values & setting placeholder!
      //propPane.UpdateJSONFormWithPlaceholders();//Since cypress is hanging here sometimes in local run also commenting

      //Updating JSON field properties similar to Update JSON!
      UpdatingVesselsJSONPropertyFileds();
    });

    it("12. Verify Add/Insert from Deploy page - on Vessels - new record - few validations", () => {
      deployMode.DeployApp();
      table.AssertSelectedRow(0);

      agHelper.GetNClick(dataSources._addIcon);
      agHelper.Sleep();
      //agHelper.AssertElementVisibility(locators._jsonFormWidget, 1); //Insert Modal
      agHelper.AssertElementVisibility(locators._visibleTextDiv("Insert Row"));

      //Checking Required field validations
      deployMode.ClearJSONFieldValue("Shipname", 0);
      cy.xpath(locators._buttonByText("Submit") + "/parent::div").should(
        "have.attr",
        "disabled",
      );
      deployMode.EnterJSONInputValue("Shipname", "MALTESE FALCON", 0);
      cy.xpath(locators._buttonByText("Submit") + "/parent::div").should(
        "not.have.attr",
        "disabled",
      );

      //Checking Primary Key validation error toast
      deployMode.ClearJSONFieldValue("Ship Id");
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(
        `null value in column "ship_id" violates not-null constraint`,
      );
      deployMode.EnterJSONInputValue("Ship Id", "159196");
    });

    it("13. Verify Add/Insert from Deploy page - on Vessels - new record", () => {
      deployMode.ClearJSONFieldValue("Callsign", 0);
      deployMode.EnterJSONInputValue("Callsign", "9HUQ9", 0);

      deployMode.ClearJSONFieldValue("Country", 0);
      deployMode.EnterJSONInputValue("Country", "Malta", 0);

      deployMode.ClearJSONFieldValue("Next Port Name", 0);
      deployMode.EnterJSONInputValue("Next Port Name", "CORFU", 0);

      deployMode.ClearJSONFieldValue("Destination", 0);
      deployMode.EnterJSONInputValue("Destination", "CORFU", 0);

      deployMode.SelectJsonFormDropDown("Special Craft", 0);

      deployMode.ClearJSONFieldValue("Timezone", 0);
      deployMode.EnterJSONInputValue("Timezone", "-12", 0);
      agHelper.AssertElementVisibility(
        locators._visibleTextDiv("Not a valid timezone!"),
      );
      deployMode.ClearJSONFieldValue("Timezone", 0);
      deployMode.EnterJSONInputValue("Timezone", "-2", 0);

      deployMode.ClearJSONFieldValue("Status Name", 0);
      deployMode.EnterJSONInputValue("Status Name", "Moored", 0);

      deployMode.ClearJSONFieldValue("Year Built", 0);
      deployMode.EnterJSONInputValue("Year Built", "1967", 0);

      deployMode.ClearJSONFieldValue("Area Code", 0);
      deployMode.EnterJSONInputValue("Area Code", "USG - Gulf of Mexico", 0);

      deployMode.ClearJSONFieldValue("Speed", 0);
      deployMode.EnterJSONInputValue("Speed", "0.6", 0);

      agHelper.GetNClick(
        deployMode._jsonFormDatepickerFieldByName("Eta Updated"),
        0,
      );
      agHelper.GetNClick(locators._datePicker(2));
      agHelper.GetNClick(deployMode._jsonFieldName("Distance To Go"), 0);

      deployMode.ClearJSONFieldValue("Distance To Go", 0);
      deployMode.EnterJSONInputValue("Distance To Go", "18.1", 0);

      deployMode.ClearJSONFieldValue("Current Port", 0);
      deployMode.EnterJSONInputValue("Current Port", "GALVESTON", 0);

      cy.xpath(deployMode._jsonFormFieldByName("Callsign", true))
        .eq(1)
        .invoke("attr", "type")
        .should("eq", "password");

      deployMode.ClearJSONFieldValue("Shipname", 0);
      agHelper.AssertElementVisibility(
        locators._visibleTextDiv("This field is required"),
      );
      cy.xpath(locators._buttonByText("Submit") + "/parent::div").should(
        "have.attr",
        "disabled",
      );
      deployMode.EnterJSONInputValue("Shipname", "MALTESE FALCON", 0);

      agHelper.ClickButton("Submit");
      cy.wait("@postExecute").then(({ response }) => {
        expect(response?.body.data.isExecutionSuccess).to.eq(false);
        expect(
          response?.body.data.pluginErrorDetails.downstreamErrorMessage,
        ).to.contains(
          'ERROR: duplicate key value violates unique constraint "vessels_pkey"\n  Detail: Key (ship_id)=(159196) already exists.',
        );
      });

      deployMode.ClearJSONFieldValue("Ship Id");
      deployMode.EnterJSONInputValue("Ship Id", "159180");
      agHelper.ClickButton("Submit");

      //asserting only Update JSON form is present, &  Insert Modal is closed
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.Sleep(3000); //for Insert to reflect!
      // agHelper
      //   .GetElementLength(locators._jsonFormWidget)
      //   .then(($len) => expect($len).to.eq(1));
    });

    it("14. Verify Update fields/Delete from Deploy page - on Vessels - newly inserted record", () => {
      table.SelectTableRow(0, 0, true, "v2");
      agHelper.Sleep(2000); //since table taking time to display JSON form

      //validating update happened fine!
      dataSources.AssertJSONFormHeader(0, 0, "ship_id", "159180"); //Validaing new record got inserted in 1st position due to id used

      deployMode.ClearJSONFieldValue("Shipname");
      deployMode.EnterJSONInputValue("Shipname", "MAJESTIC MAERSK");

      deployMode.ClearJSONFieldValue("Next Port Name");

      UpdateNVerify(0, 2, "MAJESTIC MAERSK");

      table.NavigateToNextPage(true, "v2"); //page 2
      agHelper.Sleep(3000); //wait for table navigation to take effect!
      table.WaitForTableEmpty("v2"); //page 2

      // Row is not getting highlighted in table v2, hence commenting this line
      // agHelper.AssertElementAbsence(locators._jsonFormWidget); //JSON form should be present

      table.NavigateToPreviousPage(true, "v2");
      agHelper.Sleep(3000); //wait for table navigation to take effect!
      table.WaitUntilTableLoad(0, 0, "v2");

      // Row is not getting highlighted in table v2, hence commenting this line
      // dataSources.AssertJSONFormHeader(0, 0, "ship_id", "159180");
      agHelper.ClickButton("Delete", 0);
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.AssertElementVisibility(
        dataSources._visibleTextSpan(
          "Are you sure you want to delete this item?",
        ),
      );
      agHelper.ClickButton("Confirm");
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);

      // Row is not getting highlighted in table v2, hence commenting this line
      // table.AssertSelectedRow(0); //Control going back to 1st row in table

      table.ReadTableRowColumnData(0, 0, "v2", 2000).then(($cellData) => {
        expect($cellData).not.eq("159180"); //Deleted record Store_ID
      });
      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad(0, 0, "v2");
    });

    it("15. Validate Drop of the Newly Created - Vessels - Table from Postgres datasource", () => {
      const deleteTblQuery = "DROP TABLE Vessels;";
      dataSources.CreateQueryForDS(dsName, deleteTblQuery, "DropVessels");
      agHelper.FocusElement(locators._codeMirrorTextArea);

      dataSources.RunQueryNVerifyResponseViews();
      dataSources.AssertTableInVirtuosoList(dsName, "public.vessels", false);
    });

    it("16. Verify application does not break when user runs the query with wrong table name", function () {
      EditorNavigation.SelectEntityByName("DropVessels", EntityType.Query);
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait("@postExecute").then(({ response }) => {
        expect(response?.body.data.isExecutionSuccess).to.eq(false);
        expect(
          response?.body.data.pluginErrorDetails.downstreamErrorMessage,
        ).to.contains(`table "vessels" does not exist`);
      });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("17. Verify Deletion of the datasource when Pages/Actions associated are not removed yet", () => {
      deployMode.DeployApp();
      deployMode.NavigateBacktoEditor();
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409);
    });

    function generateCallsignInfo(rowIndex: number) {
      //let callSign: string = "";
      table
        .ReadTableRowColumnData(rowIndex, 9, "v2", 200)
        .then(($yearBuilt: any) => {
          table
            .ReadTableRowColumnData(rowIndex, 11, "v2", 200)
            .then(($areaCode: any) => {
              table
                .ReadTableRowColumnData(rowIndex, 3, "v2", 200)
                .then(($country: any) => {
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

    function UpdateNVerify(
      rowIndex: number,
      colIndex: number,
      expectedTableData: string,
    ) {
      agHelper.ClickButton("Update"); //Update does not work, Bug 14063
      agHelper.AssertElementAbsence(locators._toastMsg); //Validating fix for Bug 14063 - for common table columns
      agHelper.AssertElementAbsence(locators._btnSpinner, 10000); //10 secs for update to reflect!
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);

      // Row is not getting highlighted in table v2, hence commenting this line
      // table.AssertSelectedRow(rowIndex); //Validate Primary key column selection

      //validating update happened fine!
      table
        .ReadTableRowColumnData(rowIndex, colIndex, "v2", 200)
        .then(($cellData) => {
          expect($cellData).to.eq(expectedTableData);
        });
    }

    function UpdatingVesselsJSONPropertyFileds() {
      propPane.ChangeJsonFormFieldType("Callsign", "Password Input");
      propPane.NavigateBackToPropertyPane();

      propPane.OpenJsonFormFieldSettings("Shipname");
      propPane.TogglePropertyState("Required", "On");
      propPane.NavigateBackToPropertyPane();

      propPane.ChangeJsonFormFieldType("Vessel Type", "Select");
      propPane.UpdatePropertyFieldValue(
        "Options",
        `{{["Cargo", "Pleasure Craft", "Passenger", "Fishing", "Special Craft"].map(item=> {return {
        label: item,
        value: item
        }})}}`,
      );
      // {{[...new Set(["Cargo", "Pleasure Craft", "Passenger", "Passenger", "Fishing", "Special Craft"])].map(item=> {return {
      // 	label: item,
      // 	value: item
      // }})}}
      propPane.NavigateBackToPropertyPane();

      propPane.OpenJsonFormFieldSettings("Timezone");
      propPane.UpdatePropertyFieldValue("Min", "-10");
      propPane.UpdatePropertyFieldValue("Max", "10");
      propPane.UpdatePropertyFieldValue(
        "Error message",
        "Not a valid timezone!",
      );
      propPane.NavigateBackToPropertyPane();

      propPane.ChangeJsonFormFieldType("Eta Updated", "Datepicker");
      propPane.TogglePropertyState("Close On Selection", "On");
      propPane.NavigateBackToPropertyPane();
    }
  },
);

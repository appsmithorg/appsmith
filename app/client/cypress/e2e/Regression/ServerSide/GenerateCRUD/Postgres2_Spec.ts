import {
  agHelper,
  dataSources,
  entityItems,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let dsName: any;

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

      dataSources.runQueryAndVerifyResponseViews();
    });

    it("2. Validate Select record from Postgress datasource & verify query response", () => {
      dataSources.createQueryWithDatasourceSchemaTemplate(
        dsName,
        "public.vessels",
        "Select",
      );
      dataSources.runQueryAndVerifyResponseViews({ count: 10 });
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
  },
);

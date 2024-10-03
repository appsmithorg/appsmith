import {
  agHelper,
  assertHelper,
  dataManager,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  locators,
  propPane,
  table,
} from "../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../support/Pages/DataSources";
import oneClickBindingLocator from "../../../locators/OneClickBindingLocator";
import { OneClickBinding } from "../../Regression/ClientSide/OneClickBinding/spec_utility";
import EditorNavigation, {
  EntityType,
} from "../../../support/Pages/EditorNavigation";
import PageList from "../../../support/Pages/PageList";

const oneClickBinding = new OneClickBinding();

describe(
  "Validate MsSQL connection & basic querying with UI flows",
  { tags: ["@tag.Datasource", "@tag.Sanity"] },
  () => {
    let dsName: any,
      query: string,
      containerName = "mssqldb";

    before("Create MsSql container & adding data into it", () => {
      dataSources.StartContainerNVerify("MsSql", containerName);

      dataSources.CreateDataSource("MsSql");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateQueryAfterDSSaved(
          "Create database fakeapi;",
          "MsSQL_queries",
        );
        dataSources.RunQuery();

        query = "USE fakeapi;";
        dataSources.EnterQuery(query);
        dataSources.RunQuery();

        query = `CREATE TABLE amazon_sales(
        uniq_id                                    VARCHAR(32) NOT NULL PRIMARY KEY
       ,product_name                               VARCHAR(536) NOT NULL
       ,manufacturer                               VARCHAR(48)
       ,price                                      VARCHAR(19)
       ,number_available_in_stock                  VARCHAR(13)
       ,number_of_reviews                          VARCHAR(5)
       ,number_of_answered_questions               INTEGER
       ,average_review_rating                      VARCHAR(18)
       ,amazon_category_and_sub_category           VARCHAR(120)
       ,customers_who_bought_this_item_also_bought VARCHAR(932)
     );
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('eac7efa5dbd3d667f26eb3d3ab504464','Hornby 2014 Catalogue','Hornby','£3.42','5 new','15',1,'4.9 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','https://www.appsmith.com/Hornby-R8150-Catalogue-2015/dp/B00S9SUUBE | https://www.appsmith.com/Hornby-Book-Model-Railways-Edition/dp/1844860957 | https://www.appsmith.com/Hornby-Book-Scenic-Railway-Modelling/dp/1844861120 | https://www.appsmith.com/Peco-60-Plans-Book/dp/B002QVL16I | https://www.appsmith.com/Hornby-Gloucester | https://www.appsmith.com/Airfix-5014429781902');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('b17540ef7e86e461d37f3ae58b7b72ac','FunkyBuys® Large Christmas Holiday Express Festive Train Set (SI-TY1017) Toy Light / Sounds / Battery Operated & Smoke','FunkyBuys','£16.99',NULL,'2',1,'4.5 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','https://www.appsmith.com/Christmas-Holiday-Express-Festive-Train-Set-Toy/dp/B009R8S8AA | https://www.appsmith.com/Goldlok-Holiday-Express-Operated-Multi-Colour/dp/B009R8PAO2 | https://www.appsmith.com/FunkyBuys%C2%AE-Christmas-SI-TY1017-Ornaments-Operated/dp/B01437QMHA | https://www.appsmith.com/Holiday-Express-Christmas-Ornament-Decoration | https://www.appsmith.com/Seasonal-Vision-Christmas-Tree-Train/dp/B0044ZC1W2 | https://www.appsmith.com/Coca-Cola-Santa-Express-Train-Set/dp/B004BYSNU0');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('348f344247b0c1a935b1223072ef9d8a','CLASSIC TOY TRAIN SET TRACK CARRIAGES LIGHT ENGINE BOXED BOYS KIDS BATTERY','ccf','£9.99','2 new','17',2,'3.9 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','https://www.appsmith.com/Classic-Train-Lights-Battery-Operated/dp/B0041L9OHE | https://www.appsmith.com/Train-With-Tracks-Battery-Operated-x/dp/B009P540O8 | https://www.appsmith.com/13-Piece-Train-Set-Ideal/dp/B0173N6E4W | https://www.appsmith.com/Train-Flash-Electric-Sound-Europe/dp/B008D7CEH4 | https://www.appsmith.com/Train-Ultimate-Sticker-Book-Stickers/dp/1405314516 | https://www.appsmith.com/Train-Stickers-Dover-Little-Activity/dp/0486403106');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('e12b92dbb8eaee78b22965d2a9bbbd9f','HORNBY Coach R4410A BR Hawksworth Corridor 3rd','Hornby','£39.99',NULL,'1',2,'5.0 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains',NULL);
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('e33a9adeed5f36840ccc227db4682a36','Hornby 00 Gauge 0-4-0 Gildenlow Salt Co. Steam Locomotive Model','Hornby','£32.19',NULL,'3',2,'4.7 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','https://www.appsmith.com/Hornby-R6367-RailRoad-Gauge-Rolling/dp/B000WDWSD2 | https://www.appsmith.com/Hornby-R3064-RailRoad-Smokey-Locomotive | https://www.appsmith.com/Hornby-R8222-Gauge-Track-Extension/dp/B000RK3FZK | https://www.appsmith.com/Hornby-R6371-RailRoad-Petrol-Tanker/dp/B000WDS002 | https://www.appsmith.com/Hornby-R076-00-Gauge-Footbridge | https://www.appsmith.com/Hornby-R6368-RailRoad-Gauge-Brake/dp/B000WDWT22');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('cb34f0a84102c1ebc3ef6892d7444d36','20pcs Model Garden Light Double Heads Lamppost Scale 1:100','Generic','£6.99',NULL,'2',1,'5.0 out of 5 stars','Hobbies > Model Trains & Railway Sets > Lighting & Signal Engineering > Lamps & Lighting','https://www.appsmith.com/Single-Head-Garden-Lights-Lamppost-Layout/dp/B008XCSHCA | https://www.appsmith.com/douself-100Pcs-OO-Scale-Passenger/dp/B00GRUD8W4 | https://www.appsmith.com/Hornby-Digital-Electric-Point-Track/dp/B00105UJ14 | https://www.appsmith.com/20Pcs-Scenery-Landscape-Train-Flowers/dp/B00C1843MA | https://www.appsmith.com/Scenery-Landscape-100-Made-Plastic-Cement/dp/B007UYIJ48');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('f74b562470571dfb689324adf236f82c','Hornby 00 Gauge 230mm BR Bogie Passenger Brake Coach Model (Red)','Hornby','£24.99',NULL,'2',1,'4.5 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','https://www.appsmith.com/Hornby-R4388-RailRoad-Composite-Gauge/dp/B00260GEXO | https://www.appsmith.com/Hornby-R1138-Passenger-Freight-Electric/dp/B006ZL6976');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('87bbb472ef9d90dcef140a551665c929','Hornby Santa''s Express Train Set','Hornby','£69.93','3 new','36',7,'4.3 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','https://www.appsmith.com/Hornby-R8221-Gauge-Track-Extension/dp/B000PVFYZ0 | https://www.appsmith.com/Hornby-R8222-Gauge-Track-Extension/dp/B000RK3FZK | https://www.appsmith.com/Hornby-R6368-RailRoad-Gauge-Brake/dp/B000WDWT22 | https://www.appsmith.com/Hornby-R6370-RailRoad-Tredegar-Gauge/dp/B000WDZH58 | https://www.appsmith.com/Hornby-R044-Passing-Contact-Switch/dp/B000H5V0RK | https://www.appsmith.com/Hornby-Gauge-Logan-Plank-Wagon/dp/B00SWV6RAG');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('7e2aa2b4596a39ba852449718413d7cc','Hornby Gauge Western Express Digital Train Set with eLink and TTS Loco Train Set','Hornby','£235.58','4 new','1',1,'5.0 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','https://www.appsmith.com/Hornby-Western-Master-E-Link-Electric/dp/B00BUKPXS8 | https://www.appsmith.com/Hornby-Gloucester | https://www.appsmith.com/Hornby-Majestic-E-Link-Gauge-Electric/dp/B00BUKPXU6 | https://www.appsmith.com/Hornby-Gauge-Master-Glens/dp/B00TQNJIIW | https://www.appsmith.com/Hornby-Gauge-Eurostar-2014-Train/dp/B00TQNJIIC | https://www.appsmith.com/HORNBY-Digital-Train-Layout-Track/dp/B006BRH55Y');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('5afbaf65680c9f378af5b3a3ae22427e','Learning Curve Chuggington Interactive Chatsworth','Chuggington',NULL,'1 new','8',1,'4.8 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','https://www.appsmith.com/Learning-Curve-Chuggington | https://www.appsmith.com/Chuggington | https://www.appsmith.com/Learning-Curve-Chuggington | https://www.appsmith.com/Learning-Chuggington');`;
        dataSources.EnterQuery(query);
        dataSources.RunQuery();

        query = `CREATE TABLE Simpsons(
        id               INT NOT NULL IDENTITY PRIMARY KEY
       ,episode_id       VARCHAR(7)
       ,season           INTEGER  NOT NULL
       ,episode          INTEGER  NOT NULL
       ,number_in_series INTEGER  NOT NULL
       ,title            VARCHAR(83) NOT NULL
       ,summary          VARCHAR(577) NOT NULL
       ,air_date         DATE  NOT NULL
       ,episode_image    VARCHAR(164) NOT NULL
       ,rating           NUMERIC(3,1)
       ,votes            INTEGER
     );
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E1',1,1,1,'Simpsons Roasting on an Open Fire','The family is forced to spend all of their savings to get Bart''s new tattoo removed, and with no money for Christmas, Homer is forced to become a store Santa.','1989-12-17','https://m.media-amazon.com/images/M/MV5BZjJjMzMwOTctODk5ZC00NWM4LTgyNjAtNjNmN2I1OTc5OTAyXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_ALjpg',8.1,5499);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E2',1,2,2,'Bart the Genius','Bart ends up at a school for gifted children after cheating on an IQ test.','1990-01-14','https://m.media-amazon.com/images/M/MV5BOTA0MTk3ZjktZGFhMi00ODcxLTlkYzgtZTJiMTQ5Y2I4MzhiXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_ALjpg',7.8,3456);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E3',1,3,3,'Homer''s Odyssey','After losing his job, Homer contemplates ending it all, until he discovers a new life path as a safety advocate.','1990-01-21','https://m.media-amazon.com/images/M/MV5BMzQ3M2M1YjQtNTkzNS00MDlhLWFiY2QtOWJiODZhNGJlZWMxXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_ALjpg',7.4,3034);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E4',1,4,4,'There''s No Disgrace Like Home','After being embarrassed by the rest of the family at a company picnic, Homer becomes obsessed with improving their behavior towards each other.','1990-01-28','https://m.media-amazon.com/images/M/MV5BOTZmNmE1NDUtMmRhOC00ZTYyLTkzMTEtOTM5YTgwMTc5YmMxXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_ALjpg',7.7,2978);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E5',1,5,5,'Bart the General','After being beaten up by Nelson Muntz one too many times, Bart turns to Grampa for help, and soon leads a rebellion against the school bully.','1990-02-04','https://m.media-amazon.com/images/M/MV5BMzk4ZDU2OTMtZjM0NC00ZWIyLWFmNmQtMjcyZGQ1OWE0ZWMyXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_ALjpg',8.0,3023);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E6',1,6,6,'Moaning Lisa','A depressed Lisa''s spirit is lifted when she meets a jazz-man, Bleeding Gums Murphy.','1990-02-11','https://m.media-amazon.com/images/M/MV5BODI3ZmEzMmEtNjE2MS00MjMyLWI0MmEtMTdhMWE4YzUwMzkwXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_ALjpg',7.6,2903);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E7',1,7,7,'The Call of the Simpsons','Homer takes the family camping, but it soon becomes a misadventure when they lose their equipment and Homer is mistaken for Bigfoot.','1990-02-18','https://m.media-amazon.com/images/M/MV5BOTkxMzY3Y2QtMWMyMC00NDllLTkyMTctZTY4MDFjZGExYTc1XkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_ALjpg',7.8,2807);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E8',1,8,8,'The Telltale Head','Bart gets more than he bargained for when he saws the head off a statue of the town''s founder.','1990-02-25','https://m.media-amazon.com/images/M/MV5BMzhhNTM3ZDYtYWQ3OS00NDU2LTk4MGEtOGZmMWUwODlmMjQyXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_ALjpg',7.7,2733);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E9',1,9,9,'Life on the Fast Lane','Marge contemplates an affair with a handsome bowling instructor.','1990-03-18','https://m.media-amazon.com/images/M/MV5BNzcxYWExZWYtMzY1MC00YjhlLWFmZmUtOTQ3ODZhZTUwN2EzXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_ALjpg',7.5,2716);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E10',1,10,10,'Homer''s Night Out','After a photograph of Homer canoodling with an exotic dancer is distributed throughout Springfield, he finds himself kicked out of the house by Marge.','1990-03-25','https://m.media-amazon.com/images/M/MV5BMTQ4NzU0MjY1OF5BMl5BanBnXkFtZTgwNTE4NTQ2MjE@._V1_UX224_CR0,0,224,126_ALjpg',7.3,2624);`;
        dataSources.EnterQuery(query);
        dataSources.RunQuery();
      });
      //agHelper.ActionContextMenuWithInPane("Delete"); Since next case can continue in same template
      agHelper.RefreshPage();
    });

    it("1. Validate simple queries - Show all existing tables, Describe table & verify query responses", () => {
      runQueryNValidate(
        "SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE';",
        ["TABLE_CATALOG", "TABLE_SCHEMA", "TABLE_NAME", "TABLE_TYPE"],
      );
      runQueryNValidate("exec sp_columns Amazon_Sales;", [
        "TABLE_QUALIFIER",
        "TABLE_OWNER",
        "TABLE_NAME",
        "COLUMN_NAME",
        "DATA_TYPE",
        "TYPE_NAME",
        "PRECISION",
        "LENGTH",
        "SCALE",
        "RADIX",
        "NULLABLE",
        "REMARKS",
        "COLUMN_DEF",
        "SQL_DATA_TYPE",
        "SQL_DATETIME_SUB",
        "CHAR_OCTET_LENGTH",
        "ORDINAL_POSITION",
        "IS_NULLABLE",
        "SS_DATA_TYPE",
      ]);

      runQueryNValidateResponseData("SELECT COUNT(*) FROM Amazon_Sales;", "10");

      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    it("2. Run a Select query & Add Suggested widget - Table", () => {
      query = `Select * from Simpsons;`;
      dataSources.CreateQueryFromOverlay(dsName, query, "selectSimpsons"); //Creating query from EE overlay
      dataSources.RunQueryNVerifyResponseViews(10); //Could be 99 in CI, to check aft init load script is working

      dataSources.AddSuggestedWidget(Widgets.Table);
      agHelper.GetNClick(propPane._deleteWidget);

      EditorNavigation.SelectEntityByName("selectSimpsons", EntityType.Query);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });

    // TODO: This fails with `Invalid Object <tablename>` error. Looks like there needs to be a delay in query exectuion. Will debug and fix this in a different PR - Sangeeth
    it("3.One click binding - should check that queries are created and bound to table widget properly", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 450, 200);

      oneClickBinding.ChooseAndAssertForm(dsName, dsName, "Simpsons", {
        searchableColumn: "title",
      });

      agHelper.GetNClick(oneClickBindingLocator.connectData);

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(2000);

      [
        "id",
        "episode_id",
        "season",
        "episode",
        "number_in_series",
        "title",
        "summary",
        "air_date",
        "episode_image",
        "rating",
        "votes",
      ].forEach((column) => {
        agHelper.AssertElementExist(table._headerCell(column));
      });

      table.AddNewRow();

      table.EditTableCell(0, 1, "S01E01", false);

      table.UpdateTableCell(0, 2, "1");

      table.UpdateTableCell(0, 3, " 1");

      table.UpdateTableCell(0, 4, " 10");

      table.UpdateTableCell(0, 5, "Expanse");
      table.UpdateTableCell(0, 6, "Prime");

      table.UpdateTableCell(0, 7, "2016-06-22 19:10:25-07", false, true);
      agHelper.GetNClick(oneClickBindingLocator.dateInput, 0, true);
      agHelper.GetNClick(oneClickBindingLocator.dayViewFromDate, 0, true);
      table.UpdateTableCell(0, 8, "expanse.png", false, true);
      table.UpdateTableCell(0, 9, "5");
      table.UpdateTableCell(0, 10, "20");

      agHelper.GetNClick(table._saveNewRow, 0, true, 2000);

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.TypeText(table._searchInput, "Expanse");

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.AssertElementExist(table._bodyCell("Expanse"));

      agHelper.Sleep(1000);

      table.EditTableCell(0, 5, "Westworld");

      agHelper.Sleep(1000);

      (cy as any).AssertTableRowSavable(11, 0);

      (cy as any).saveTableRow(11, 0);
      agHelper.Sleep(2000);

      assertHelper.AssertNetworkStatus("@postExecute");

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(500);
      agHelper.ClearNType(table._searchInput, "Westworld");

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(2000);

      agHelper.AssertElementExist(table._bodyCell("Westworld"));

      agHelper.ClearNType(table._searchInput, "Expanse");

      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.Sleep(2000);

      agHelper.AssertElementAbsence(table._bodyCell("Expanse"));
    });

    it("4. MsSQL connection errors", () => {
      let dataSourceName: string;
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dataSources.CreatePlugIn("Microsoft SQL Server");
        dataSourceName = "MsSQL" + " " + uid;
        agHelper.RenameWithInPane(dataSourceName, false);

        dataSources.TestDatasource(false);
        agHelper.ValidateToastMessage("Missing endpoint.");
        agHelper.ValidateToastMessage("Missing username for authentication.");
        agHelper.ValidateToastMessage("Missing password for authentication.");
        agHelper.ClearTextField(dataSources._databaseName);
        dataSources.TestDatasource(false);
        agHelper.WaitUntilAllToastsDisappear();
        agHelper.ClearNType(
          dataSources._host(),
          dataManager.dsValues[dataManager.defaultEnviorment].mssql_host,
        );
        agHelper.ClearNType(
          dataSources._username,
          dataManager.dsValues[dataManager.defaultEnviorment].mssql_username,
        );
        agHelper.ClearNType(
          dataSources._password,
          dataManager.dsValues[dataManager.defaultEnviorment].mssql_password,
        );
        agHelper.GetNClick(locators._visibleTextSpan("Read only"));
        dataSources.ValidateNSelectDropdown(
          "SSL mode",
          "Enabled with no verify",
          "Disable",
        );
        dataSources.TestSaveDatasource();
        dataSources.AssertDataSourceInfo(["READ_ONLY", "host.docker.internal"]);
        dataSources.DeleteDSDirectly(200, false);
      });
    });

    it("5. Add new Page and generate CRUD template using created datasource", () => {
      PageList.AddNewPage();
      PageList.AddNewPage("Generate page with data");
      agHelper.GetNClick(dataSources._selectDatasourceDropdown);
      agHelper.GetNClickByContains(dataSources._dropdownOption, dsName);

      assertHelper.AssertNetworkStatus("@getDatasourceStructure"); //Making sure table dropdown is populated
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        "dbo.amazon_sales",
      );

      GenerateCRUDNValidateDeployPage(
        "348f344247b0c1a935b1223072ef9d8a",
        "CLASSIC TOY TRAIN SET TRACK CARRIAGES LIGHT" +
          " ENGINE BOXED BOYS KIDS BATTERY",
        "ccf",
        "uniq_id",
      );

      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
      //Delete the test data
      PageList.ShowList();
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Page2",
        action: "Delete",
        entityType: entityItems.Page,
      });

      //Should not be able to delete ds until app is published again
      //coz if app is published & shared then deleting ds may cause issue, So!
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409);
      agHelper.WaitUntilAllToastsDisappear();
      deployMode.DeployApp(locators._emptyPageTxt);
      agHelper.Sleep(3000);
      deployMode.NavigateBacktoEditor();
    });

    it("6. Generate CRUD page from datasource present in ACTIVE section", function () {
      EditorNavigation.SelectEntityByName(dsName, EntityType.Datasource);
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(
        dataSources._dropdownOption,
        "dbo.amazon_sales",
      );

      GenerateCRUDNValidateDeployPage(
        "348f344247b0c1a935b1223072ef9d8a",
        "CLASSIC TOY TRAIN SET TRACK CARRIAGES LIGHT" +
          " ENGINE BOXED BOYS KIDS BATTERY",
        "ccf",
        "uniq_id",
      );

      deployMode.NavigateBacktoEditor();
      table.WaitUntilTableLoad();
    });

    it("7. Verify the default port for the datasource", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Microsoft SQL Server");

      agHelper.AssertAttribute(dataSources._port, "value", "1433");
    });

    after("Verify Deletion of the datasource", () => {
      cy.intercept("DELETE", "/api/v1/datasources/*").as("deleteDatasource"); //Since intercept from before is not working
      dataSources.DeleteDatasourceFromWithinDS(dsName, 409); //since CRUD pages are still active
      //dataSources.StopNDeleteContainer(containerName); //commenting to check if MsSQL specific container deletion is causing issues
    });

    function GenerateCRUDNValidateDeployPage(
      col1Text: string,
      col2Text: string,
      col3Text: string,
      jsonFromHeader: string,
    ) {
      agHelper.GetNClick(dataSources._generatePageBtn);
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.AssertContains("Successfully generated a page");
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitUntilTableLoad();

      //Validating loaded table
      agHelper.AssertElementExist(dataSources._selectedRow);
      table.ReadTableRowColumnData(0, 0, "v2", 2000).then(($cellData) => {
        expect($cellData).to.eq(col1Text);
      });
      table.ReadTableRowColumnData(0, 1, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq(col2Text);
      });
      table.ReadTableRowColumnData(0, 2, "v2", 200).then(($cellData) => {
        expect($cellData).to.eq(col3Text);
      });

      // Validating loaded JSON form
      cy.xpath(locators._buttonByText("Update")).then((selector) => {
        cy.wrap(selector)
          .invoke("attr", "class")
          .then((classes) => {
            expect(classes).not.contain("bp3-disabled");
          });
      });
      dataSources.AssertJSONFormHeader(0, 0, jsonFromHeader);
    }

    function runQueryNValidate(query: string, columnHeaders: string[]) {
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryResponseHeaders(columnHeaders);
    }

    function runQueryNValidateResponseData(
      query: string,
      expectedResponse: string,
      index = 0,
    ) {
      dataSources.EnterQuery(query);
      dataSources.RunQuery();
      dataSources.AssertQueryTableResponse(index, expectedResponse);
    }
  },
);

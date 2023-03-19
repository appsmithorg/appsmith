import * as _ from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

let dsName: any, query: string;

describe("Validate MsSQL connection & basic querying with UI flows", () => {
  before("Create a new MySQL DS & adding data into it", () => {
    _.dataSources.CreateDataSource("MsSql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      _.dataSources.CreateQueryAfterDSSaved(
        "Create database fakeapi;",
        "MsSQL_queries",
      );
      _.dataSources.RunQuery();

      query = "USE fakeapi;";
      _.dataSources.EnterQuery(query);
      _.dataSources.RunQuery();

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
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('eac7efa5dbd3d667f26eb3d3ab504464','Hornby 2014 Catalogue','Hornby','£3.42','5 new','15',1,'4.9 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','http://www.amazon.co.uk/Hornby-R8150-Catalogue-2015/dp/B00S9SUUBE | http://www.amazon.co.uk/Hornby-Book-Model-Railways-Edition/dp/1844860957 | http://www.amazon.co.uk/Hornby-Book-Scenic-Railway-Modelling/dp/1844861120 | http://www.amazon.co.uk/Peco-60-Plans-Book/dp/B002QVL16I | http://www.amazon.co.uk/Hornby-Gloucester | http://www.amazon.co.uk/Airfix-5014429781902');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('b17540ef7e86e461d37f3ae58b7b72ac','FunkyBuys® Large Christmas Holiday Express Festive Train Set (SI-TY1017) Toy Light / Sounds / Battery Operated & Smoke','FunkyBuys','£16.99',NULL,'2',1,'4.5 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','http://www.amazon.co.uk/Christmas-Holiday-Express-Festive-Train-Set-Toy/dp/B009R8S8AA | http://www.amazon.co.uk/Goldlok-Holiday-Express-Operated-Multi-Colour/dp/B009R8PAO2 | http://www.amazon.co.uk/FunkyBuys%C2%AE-Christmas-SI-TY1017-Ornaments-Operated/dp/B01437QMHA | http://www.amazon.co.uk/Holiday-Express-Christmas-Ornament-Decoration | http://www.amazon.co.uk/Seasonal-Vision-Christmas-Tree-Train/dp/B0044ZC1W2 | http://www.amazon.co.uk/Coca-Cola-Santa-Express-Train-Set/dp/B004BYSNU0');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('348f344247b0c1a935b1223072ef9d8a','CLASSIC TOY TRAIN SET TRACK CARRIAGES LIGHT ENGINE BOXED BOYS KIDS BATTERY','ccf','£9.99','2 new','17',2,'3.9 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','http://www.amazon.co.uk/Classic-Train-Lights-Battery-Operated/dp/B0041L9OHE | http://www.amazon.co.uk/Train-With-Tracks-Battery-Operated-x/dp/B009P540O8 | http://www.amazon.co.uk/13-Piece-Train-Set-Ideal/dp/B0173N6E4W | http://www.amazon.co.uk/Train-Flash-Electric-Sound-Europe/dp/B008D7CEH4 | http://www.amazon.co.uk/Train-Ultimate-Sticker-Book-Stickers/dp/1405314516 | http://www.amazon.co.uk/Train-Stickers-Dover-Little-Activity/dp/0486403106');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('e12b92dbb8eaee78b22965d2a9bbbd9f','HORNBY Coach R4410A BR Hawksworth Corridor 3rd','Hornby','£39.99',NULL,'1',2,'5.0 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains',NULL);
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('e33a9adeed5f36840ccc227db4682a36','Hornby 00 Gauge 0-4-0 Gildenlow Salt Co. Steam Locomotive Model','Hornby','£32.19',NULL,'3',2,'4.7 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','http://www.amazon.co.uk/Hornby-R6367-RailRoad-Gauge-Rolling/dp/B000WDWSD2 | http://www.amazon.co.uk/Hornby-R3064-RailRoad-Smokey-Locomotive | http://www.amazon.co.uk/Hornby-R8222-Gauge-Track-Extension/dp/B000RK3FZK | http://www.amazon.co.uk/Hornby-R6371-RailRoad-Petrol-Tanker/dp/B000WDS002 | http://www.amazon.co.uk/Hornby-R076-00-Gauge-Footbridge | http://www.amazon.co.uk/Hornby-R6368-RailRoad-Gauge-Brake/dp/B000WDWT22');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('cb34f0a84102c1ebc3ef6892d7444d36','20pcs Model Garden Light Double Heads Lamppost Scale 1:100','Generic','£6.99',NULL,'2',1,'5.0 out of 5 stars','Hobbies > Model Trains & Railway Sets > Lighting & Signal Engineering > Lamps & Lighting','http://www.amazon.co.uk/Single-Head-Garden-Lights-Lamppost-Layout/dp/B008XCSHCA | http://www.amazon.co.uk/douself-100Pcs-OO-Scale-Passenger/dp/B00GRUD8W4 | http://www.amazon.co.uk/Hornby-Digital-Electric-Point-Track/dp/B00105UJ14 | http://www.amazon.co.uk/20Pcs-Scenery-Landscape-Train-Flowers/dp/B00C1843MA | http://www.amazon.co.uk/Scenery-Landscape-100-Made-Plastic-Cement/dp/B007UYIJ48');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('f74b562470571dfb689324adf236f82c','Hornby 00 Gauge 230mm BR Bogie Passenger Brake Coach Model (Red)','Hornby','£24.99',NULL,'2',1,'4.5 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','http://www.amazon.co.uk/Hornby-R4388-RailRoad-Composite-Gauge/dp/B00260GEXO | http://www.amazon.co.uk/Hornby-R1138-Passenger-Freight-Electric/dp/B006ZL6976');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('87bbb472ef9d90dcef140a551665c929','Hornby Santa''s Express Train Set','Hornby','£69.93','3 new','36',7,'4.3 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','http://www.amazon.co.uk/Hornby-R8221-Gauge-Track-Extension/dp/B000PVFYZ0 | http://www.amazon.co.uk/Hornby-R8222-Gauge-Track-Extension/dp/B000RK3FZK | http://www.amazon.co.uk/Hornby-R6368-RailRoad-Gauge-Brake/dp/B000WDWT22 | http://www.amazon.co.uk/Hornby-R6370-RailRoad-Tredegar-Gauge/dp/B000WDZH58 | http://www.amazon.co.uk/Hornby-R044-Passing-Contact-Switch/dp/B000H5V0RK | http://www.amazon.co.uk/Hornby-Gauge-Logan-Plank-Wagon/dp/B00SWV6RAG');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('7e2aa2b4596a39ba852449718413d7cc','Hornby Gauge Western Express Digital Train Set with eLink and TTS Loco Train Set','Hornby','£235.58','4 new','1',1,'5.0 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','http://www.amazon.co.uk/Hornby-Western-Master-E-Link-Electric/dp/B00BUKPXS8 | http://www.amazon.co.uk/Hornby-Gloucester | http://www.amazon.co.uk/Hornby-Majestic-E-Link-Gauge-Electric/dp/B00BUKPXU6 | http://www.amazon.co.uk/Hornby-Gauge-Master-Glens/dp/B00TQNJIIW | http://www.amazon.co.uk/Hornby-Gauge-Eurostar-2014-Train/dp/B00TQNJIIC | http://www.amazon.co.uk/HORNBY-Digital-Train-Layout-Track/dp/B006BRH55Y');
     INSERT INTO amazon_sales(uniq_id,product_name,manufacturer,price,number_available_in_stock,number_of_reviews,number_of_answered_questions,average_review_rating,amazon_category_and_sub_category,customers_who_bought_this_item_also_bought) VALUES ('5afbaf65680c9f378af5b3a3ae22427e','Learning Curve Chuggington Interactive Chatsworth','Chuggington',NULL,'1 new','8',1,'4.8 out of 5 stars','Hobbies > Model Trains & Railway Sets > Rail Vehicles > Trains','http://www.amazon.co.uk/Learning-Curve-Chuggington | http://www.amazon.co.uk/Chuggington | http://www.amazon.co.uk/Learning-Curve-Chuggington | http://www.amazon.co.uk/Learning-Chuggington');`;
      _.dataSources.EnterQuery(query);
      _.dataSources.RunQuery();

      query = `CREATE TABLE Simpsons(
        episode_id       VARCHAR(7) NOT NULL PRIMARY KEY
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
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E1',1,1,1,'Simpsons Roasting on an Open Fire','The family is forced to spend all of their savings to get Bart''s new tattoo removed, and with no money for Christmas, Homer is forced to become a store Santa.','1989-12-17','https://m.media-amazon.com/images/M/MV5BZjJjMzMwOTctODk5ZC00NWM4LTgyNjAtNjNmN2I1OTc5OTAyXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_AL_.jpg',8.1,5499);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E2',1,2,2,'Bart the Genius','Bart ends up at a school for gifted children after cheating on an IQ test.','1990-01-14','https://m.media-amazon.com/images/M/MV5BOTA0MTk3ZjktZGFhMi00ODcxLTlkYzgtZTJiMTQ5Y2I4MzhiXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_AL_.jpg',7.8,3456);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E3',1,3,3,'Homer''s Odyssey','After losing his job, Homer contemplates ending it all, until he discovers a new life path as a safety advocate.','1990-01-21','https://m.media-amazon.com/images/M/MV5BMzQ3M2M1YjQtNTkzNS00MDlhLWFiY2QtOWJiODZhNGJlZWMxXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_AL_.jpg',7.4,3034);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E4',1,4,4,'There''s No Disgrace Like Home','After being embarrassed by the rest of the family at a company picnic, Homer becomes obsessed with improving their behavior towards each other.','1990-01-28','https://m.media-amazon.com/images/M/MV5BOTZmNmE1NDUtMmRhOC00ZTYyLTkzMTEtOTM5YTgwMTc5YmMxXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_AL_.jpg',7.7,2978);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E5',1,5,5,'Bart the General','After being beaten up by Nelson Muntz one too many times, Bart turns to Grampa for help, and soon leads a rebellion against the school bully.','1990-02-04','https://m.media-amazon.com/images/M/MV5BMzk4ZDU2OTMtZjM0NC00ZWIyLWFmNmQtMjcyZGQ1OWE0ZWMyXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_AL_.jpg',8.0,3023);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E6',1,6,6,'Moaning Lisa','A depressed Lisa''s spirit is lifted when she meets a jazz-man, Bleeding Gums Murphy.','1990-02-11','https://m.media-amazon.com/images/M/MV5BODI3ZmEzMmEtNjE2MS00MjMyLWI0MmEtMTdhMWE4YzUwMzkwXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_AL_.jpg',7.6,2903);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E7',1,7,7,'The Call of the Simpsons','Homer takes the family camping, but it soon becomes a misadventure when they lose their equipment and Homer is mistaken for Bigfoot.','1990-02-18','https://m.media-amazon.com/images/M/MV5BOTkxMzY3Y2QtMWMyMC00NDllLTkyMTctZTY4MDFjZGExYTc1XkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_AL_.jpg',7.8,2807);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E8',1,8,8,'The Telltale Head','Bart gets more than he bargained for when he saws the head off a statue of the town''s founder.','1990-02-25','https://m.media-amazon.com/images/M/MV5BMzhhNTM3ZDYtYWQ3OS00NDU2LTk4MGEtOGZmMWUwODlmMjQyXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_AL_.jpg',7.7,2733);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E9',1,9,9,'Life on the Fast Lane','Marge contemplates an affair with a handsome bowling instructor.','1990-03-18','https://m.media-amazon.com/images/M/MV5BNzcxYWExZWYtMzY1MC00YjhlLWFmZmUtOTQ3ODZhZTUwN2EzXkEyXkFqcGdeQXVyNTAyODkwOQ@@._V1_UY126_UX224_AL_.jpg',7.5,2716);
     INSERT INTO Simpsons(episode_id,season,episode,number_in_series,title,summary,air_date,episode_image,rating,votes) VALUES ('S1-E10',1,10,10,'Homer''s Night Out','After a photograph of Homer canoodling with an exotic dancer is distributed throughout Springfield, he finds himself kicked out of the house by Marge.','1990-03-25','https://m.media-amazon.com/images/M/MV5BMTQ4NzU0MjY1OF5BMl5BanBnXkFtZTgwNTE4NTQ2MjE@._V1_UX224_CR0,0,224,126_AL_.jpg',7.3,2624);`;
      _.dataSources.EnterQuery(query);
      _.dataSources.RunQuery();
    });
    //_.agHelper.ActionContextMenuWithInPane("Delete"); Since next case can continue in same template
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
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("2. Run a Select query & Add Suggested widget - Table", () => {
    query = `Select * from Simpsons;`;
    _.dataSources.CreateQueryFromOverlay(dsName, query, "selectSimpsons"); //Creating query from EE overlay
    _.dataSources.RunQueryNVerifyResponseViews(10); //Could be 99 in CI, to check aft init load script is working

    _.dataSources.AddSuggesstedWidget(Widgets.Table);
    _.agHelper.GetNClick(_.propPane._deleteWidget);

    _.entityExplorer.SelectEntityByName("selectSimpsons", "Queries/JS");
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });

  after("Verify Deletion of the datasource", () => {
    _.entityExplorer.SelectEntityByName(dsName, "Datasources");
    _.entityExplorer.ActionContextMenuByEntityName(
      dsName,
      "Delete",
      "Are you sure?",
    );
    _.agHelper.ValidateNetworkStatus("@deleteDatasource", 200);
  });

  function runQueryNValidate(query: string, columnHeaders: string[]) {
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(columnHeaders);
  }
});

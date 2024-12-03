import { CURRENT_REPO, REPO } from "../../../fixtures/REPO";
import {
  agHelper,
  apiPage,
  dataManager,
  dataSources,
  draggableWidgets,
  entityExplorer,
  entityItems,
  homePage,
  propPane,
} from "../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../support/Pages/DataSources";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../support/Pages/EditorNavigation";

//FIXME: Running tests only for CE, since in EE repo, chrome crashes.
//TODO: This check can be removed if the issue no more occurs in EE runs
if (CURRENT_REPO == REPO.CE) {
  describe(
    "Validate Arango & CURL Import Datasources",
    {
      tags: [
        "@tag.Datasource",
        "@tag.Sanity",
        "@tag.Git",
        "@tag.AccessControl",
      ],
    },
    () => {
      let dsName: any,
        collectionName = "countries_places_to_visit",
        containerName = "arangodb";
      before("Create a new Arango DS", () => {
        dataSources.StartContainerNVerify("Arango", containerName, 20000);
        homePage.CreateNewWorkspace("ArangoDS", true);
        homePage.CreateAppInWorkspace("ArangoDS", "ArangoDSApp");
        dataSources.CreateDataSource("ArangoDB");
        cy.get("@dsName").then(($dsName) => {
          dsName = $dsName;
        });
      });

      it(`1. Create collection ${collectionName} into _system DB & Add data into it via curl`, () => {
        let curlCollectionCreate =
          `curl --request POST \
    --url http://` +
          dataManager.dsValues[dataManager.defaultEnviorment].arango_host +
          `:` +
          dataManager.dsValues[dataManager.defaultEnviorment].arango_port +
          `/_api/collection \
    --header 'authorization: Basic cm9vdDpBcmFuZ28=' \
    --header 'content-type: application/json' \
    --data '{
      "name": "` +
          collectionName +
          `",
      "type": 2,
      "keyOptions": {
          "type": "autoincrement",
          "allowUserKeys": false
      }
    }'`;
        apiPage.FillCurlNImport(curlCollectionCreate);
        agHelper.ActionContextMenuWithInPane({
          action: "Delete",
          entityType: entityItems.Api,
        });

        //Add data into this newly created collection
        let curlDataAdd =
          `curl --request POST --url http://` +
          dataManager.dsValues[dataManager.defaultEnviorment].arango_host +
          `:` +
          dataManager.dsValues[dataManager.defaultEnviorment].arango_port +
          `/_api/document/${collectionName} \
      --header 'authorization: Basic cm9vdDpBcmFuZ28=' \
      --header 'content-type: application/json' \
      --data '[
        {"country": "Japan",
        "places_to_visit": [{"name": "Tokyo Tower","type": "Landmark","location": {"latitude": 35.6586,"longitude": 139.7454 }},
        {"name": "Mount Fuji", "type": "Natural","location": {"latitude": 35.3606,"longitude": 138.7278 }},
        {"name": "Hiroshima Peace Memorial Park", "type": "Memorial","location": {"latitude": 34.3955,"longitude": 132.4536}}]
      },
      {
        "country": "France",
        "places_to_visit": [
          {
            "name": "Eiffel Tower",
            "type": "Landmark",
            "location": {
              "latitude": 48.8584,
              "longitude": 2.2945
            }
          },
          {
            "name": "Palace of Versailles",
            "type": "Landmark",
            "location": {
              "latitude": 48.8049,
              "longitude": 2.1204
            }
          },
          {
            "name": "Mont Saint-Michel",
            "type": "Natural",
            "location": {
              "latitude": 48.6361,
              "longitude": -1.5118
            }
          }
        ]
      },
      {
        "country": "USA",
        "places_to_visit": [
          {
            "name": "Statue of Liberty",
            "type": "Landmark",
            "location": {
              "latitude": 40.6892,
              "longitude": -74.0445
            }
          },
          {
            "name": "Grand Canyon",
            "type": "Natural",
            "location": {
              "latitude": 36.1069,
              "longitude": -112.1126
            }
          },
          {
            "name": "Disney World",
            "type": "Theme Park",
            "location": {
              "latitude": 28.3852,
              "longitude": -81.5639
            }
          }
        ]
      }
    ]'`;

        apiPage.FillCurlNImport(curlDataAdd);
        agHelper.ActionContextMenuWithInPane({
          action: "Delete",
          entityType: entityItems.Api,
        });
      });

      it("2. Run Select, Create, Update, Delete & few more queries on the created collection + Widget Binding", () => {
        entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2);
        propPane.UpdatePropertyFieldValue("Default value", "Brazil");
        //Create a select query
        dataSources.createQueryWithDatasourceSchemaTemplate(
          dsName,
          `${collectionName}`,
          "Select",
        );
        dataSources.RunQuery();
        dataSources.AssertQueryResponseHeaders([
          "_key",
          "_id",
          "_rev",
          "country",
          "places_to_visit",
        ]);
        dataSources.AssertQueryTableResponse(0, "1");

        //Filter by country & return specific columns
        let query = `FOR document IN ${collectionName}
    FILTER document.country == "Japan"
    RETURN { country: document.country, places_to_visit: document.places_to_visit }`;
        dataSources.EnterQuery(query);
        dataSources.RunQuery();
        dataSources.AssertQueryResponseHeaders(["country", "places_to_visit"]);
        dataSources.AssertQueryTableResponse(0, "Japan");

        //Insert a new place
        dataSources.createQueryWithDatasourceSchemaTemplate(
          dsName,
          `${collectionName}`,
          "Create",
        );

        query = `INSERT
    {
      "country": "{{Input1.text}}",
      "places_to_visit": [
        {
          "name": "Christ the Redeemer",
          "type": "Landmark",
          "location": {
            "latitude": -22.9519,
            "longitude": -43.2106
          }
        },
        {
          "name": "Iguazu Falls",
          "type": "Natural",
          "location": {
            "latitude": -25.6953,
            "longitude": -54.4367
          }
        },
        {
          "name": "Amazon Rainforest",
          "type": "Natural",
          "location": {
            "latitude": -3.4653,
            "longitude": -62.2159
          }
        }
      ]
    }
    INTO ${collectionName}`;
        dataSources.EnterQuery(query);
        dataSources.runQueryAndVerifyResponseViews();
        dataSources.AssertQueryResponseHeaders([
          "writesExecuted",
          "writesIgnored",
        ]);
        dataSources.AssertQueryTableResponse(0, "1"); //confirming write is successful

        //Filter for Array type & verify for the newly added place also
        query = `FOR doc IN ${collectionName}
    FOR place IN doc.places_to_visit
      FILTER place.type == "Natural"
        RETURN { country: doc.country, name: place.name }`;
        dataSources.EnterQuery(query);
        dataSources.runQueryAndVerifyResponseViews({ count: 5 }); //Verify all records are filtered
        dataSources.AssertQueryTableResponse(0, "Japan");
        dataSources.AssertQueryTableResponse(1, "Mount Fuji");
        dataSources.AssertQueryTableResponse(6, "Brazil"); //Widget binding is verified here
        dataSources.AssertQueryTableResponse(7, "Iguazu Falls"); //making sure new inserted record is also considered for filtering

        //Update Japan to Australia
        dataSources.createQueryWithDatasourceSchemaTemplate(
          dsName,
          `${collectionName}`,
          "Update",
        );

        query = `UPDATE
    {
        _key: "1"
    }
    WITH
    {
      "country": "Australia",
      "places_to_visit": [
        {
          "name": "Sydney Opera House",
          "type": "Landmark",
          "location": {
            "latitude": -33.8568,
            "longitude": 151.2153
          }
        }
        ]
    }
    IN ${collectionName}`;
        dataSources.EnterQuery(query);
        dataSources.runQueryAndVerifyResponseViews();

        dataSources.createQueryWithDatasourceSchemaTemplate(
          dsName,
          `${collectionName}`,
          "Select",
        );
        query = `FOR document IN ${collectionName}
    FILTER document._key == "1"
    RETURN document`;
        dataSources.EnterQuery(query);
        dataSources.runQueryAndVerifyResponseViews();
        dataSources.AssertQueryTableResponse(3, "Australia");

        //Delete record from collection
        dataSources.createQueryWithDatasourceSchemaTemplate(
          dsName,
          `${collectionName}`,
          "Delete",
        );
        query = `REMOVE "1" in ${collectionName}`;
        dataSources.EnterQuery(query);
        dataSources.runQueryAndVerifyResponseViews(); //Removing Australia

        //Verify no records return for the deleted key
        query = `FOR document IN ${collectionName}
    FILTER document._key == "1"
    RETURN document`;
        dataSources.createQueryWithDatasourceSchemaTemplate(
          dsName,
          `${collectionName}`,
          "Select",
        );
        dataSources.EnterQuery(query);
        dataSources.RunQuery();
        agHelper
          .GetText(dataSources._noRecordFound)
          .then(($noRecMsg) =>
            expect($noRecMsg).to.eq("No data records to show"),
          );

        //Verify other records returned fine from collection
        query = `FOR document IN ${collectionName}
      RETURN { country: document.country }`;

        dataSources.EnterQuery(query);
        dataSources.RunQuery();

        dataSources.AssertQueryTableResponse(0, "France");
        dataSources.AssertQueryTableResponse(1, "USA");
        dataSources.AssertQueryTableResponse(2, "Brazil");
        entityExplorer.DeleteWidgetFromEntityExplorer("Input1");
      });

      it("3. Arango Widget Binding - from Suggested widget, Schema filter for Arango DS", () => {
        agHelper.RefreshPage();
        entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
        propPane.AssertPropertiesDropDownCurrentValue(
          "Table data",
          "Connect data",
        );
        EditorNavigation.SelectEntityByName("Query6", EntityType.Query);
        //dataSources.FilterAndVerifyDatasourceSchemaBySearch("countries");
        dataSources.VerifyTableSchemaOnQueryEditor(collectionName);
        let query = `FOR document IN ${collectionName}
      RETURN { country: document.places_to_visit }`;
        dataSources.EnterQuery(query);
        dataSources.RunQuery();
        dataSources.AddSuggestedWidget(Widgets.Table); //Binding to new table from schema explorer
        propPane.AssertPropertiesDropDownCurrentValue("Table data", "Query6");

        EditorNavigation.SelectEntityByName("Query6", EntityType.Query);
        dataSources.AddSuggestedWidget(
          Widgets.Table,
          dataSources._addSuggestedExisting,
        );
        propPane.AssertPropertiesDropDownCurrentValue("Table data", "Query6");
      });

      //To add test for duplicate collection name

      after("Delete collection via curl & then data source", () => {
        //Deleting all queries created on this DB
        PageLeftPane.switchSegment(PagePaneSegment.Queries);
        entityExplorer.DeleteAllQueriesForDB(dsName);

        //Deleting collection via Curl
        //entityExplorer.CreateNewDsQuery("New cURL import", false); Script failing here, but manually working, to check
        let curlDeleteCol =
          `curl --request DELETE --url http://` +
          dataManager.dsValues[dataManager.defaultEnviorment].arango_host +
          `:` +
          dataManager.dsValues[dataManager.defaultEnviorment].arango_port +
          `/_db/_system/_api/collection/${collectionName} --header 'authorization: Basic cm9vdDpBcmFuZ28='`;
        //dataSources.ImportCurlNRun(curlDeleteCol);
        apiPage.FillCurlNImport(curlDeleteCol);
        agHelper.ActionContextMenuWithInPane({
          action: "Delete",
          entityType: entityItems.Api,
        }); //Deleting api created

        //Deleting datasource finally
        dataSources.DeleteDatasourceFromWithinDS(dsName);

        dataSources.StopNDeleteContainer(containerName);
      });
    },
  );
}

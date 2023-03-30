import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any,
  collectionName = "countries_places_to_visit";
const tedUrl = "http://localhost:5001/v1/parent/cmd";

describe("Validate Arango & CURL Import Datasources", () => {
  before("Create a new Arango DS", () => {
    // let ArangoDB =
    //   "mkdir -p `$PWD`/arangodb/bin/bash;
    //      docker run --name arangodb -e ARANGO_USERNAME=root -e ARANGO_ROOT_PASSWORD=Arango -p 8529:8529 -v  ~/arango/bin/bash:/arango/bin/bash -d arangodb";
    // cy.request({
    //   method: "GET",
    //   url: tedUrl,
    //   qs: {
    //     cmd: ArangoDB,
    //   },
    // }).then((res) => {
    //   cy.log("ContainerID", res.body.stdout);
    //   cy.log(res.body.stderr);
    //   expect(res.status).equal(200);
    // });

    // //Wait for the container to be up
    // _.agHelper.Sleep(10000);

    _.dataSources.CreateDataSource("Arango");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it(`1. Create collection ${collectionName} into _system DB & Add data into it via curl`, () => {
    cy.fixture("datasources").then((datasourceFormData) => {
      let curlCollectionCreate =
        `curl --request POST \
    --url http://` +
        datasourceFormData["arango-host"] +
        `:` +
        datasourceFormData["arango-port"] +
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
      _.dataSources.FillCurlNImport(curlCollectionCreate);
      _.entityExplorer.ExpandCollapseEntity("Datasources");
      _.entityExplorer.ExpandCollapseEntity(dsName);
      _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
      _.agHelper.AssertElementVisible(
        _.entityExplorer._entityNameInExplorer(collectionName),
      );
      _.agHelper.ActionContextMenuWithInPane("Delete");

      //Add data into this newly created collection
      let curlDataAdd =
        `curl --request POST --url http://` +
        datasourceFormData["arango-host"] +
        `:` +
        datasourceFormData["arango-port"] +
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

      _.dataSources.FillCurlNImport(curlDataAdd);
      _.entityExplorer.ExpandCollapseEntity(dsName);
      _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh"); //needed for the added data to reflect in template queries
      _.agHelper.ActionContextMenuWithInPane("Delete");
    });
  });

  it("2. Run Select, Create, Update, Delete & few more queries on the created collection", () => {
    //Select's own query
    _.entityExplorer.ActionTemplateMenuByEntityName(
      `${collectionName}`,
      "Select",
    );
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders([
      "_key",
      "_id",
      "_rev",
      "country",
      "places_to_visit",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("1");
    });

    //Filter by country & return specific columns
    let query = `FOR document IN ${collectionName}
    FILTER document.country == "Japan"
    RETURN { country: document.country, places_to_visit: document.places_to_visit }`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();
    _.dataSources.AssertQueryResponseHeaders(["country", "places_to_visit"]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("Japan");
    });

    //Insert a new place
    _.entityExplorer.ActionTemplateMenuByEntityName(
      `${collectionName}`,
      "Create",
    );

    query = `INSERT
    {
      "country": "Brazil",
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
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQueryNVerifyResponseViews();
    _.dataSources.AssertQueryResponseHeaders([
      "writesExecuted",
      "writesIgnored",
    ]);
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("1");
    }); //confirming write is successful

    //Filter for Array type & verify for the newly added place also
    query = `FOR doc IN ${collectionName}
    FOR place IN doc.places_to_visit
      FILTER place.type == "Natural"
        RETURN { country: doc.country, name: place.name }`;
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQueryNVerifyResponseViews(5); //Verify all records are filtered
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("Japan");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("Mount Fuji");
    });
    _.dataSources.ReadQueryTableResponse(6).then(($cellData) => {
      expect($cellData).to.eq("Brazil");
    });
    _.dataSources.ReadQueryTableResponse(7).then(($cellData) => {
      expect($cellData).to.eq("Iguazu Falls");
    }); //making sure new inserted record is also considered for filtering

    //Update Japan to Australia
    _.entityExplorer.ActionTemplateMenuByEntityName(
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
    _.dataSources.EnterQuery(query);
    _.dataSources.RunQueryNVerifyResponseViews();

    _.entityExplorer.ActionTemplateMenuByEntityName(
      `${collectionName}`,
      "Select",
    );
    _.dataSources.RunQueryNVerifyResponseViews(1);
    _.dataSources.ReadQueryTableResponse(3).then(($cellData) => {
      expect($cellData).to.eq("Australia");
    });

    //Delete record from collection
    _.entityExplorer.ActionTemplateMenuByEntityName(
      `${collectionName}`,
      "Delete",
    );
    _.dataSources.RunQueryNVerifyResponseViews(1); //Removing Australia

    //Verify no records return for the deleted key
    query = `FOR document IN ${collectionName}
    RETURN { country: document.country }`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      `${collectionName}`,
      "Select",
    );
    _.dataSources.RunQuery();
    _.agHelper
      .GetText(_.dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));

    //Verify other records returned fine from collection
    query = `FOR document IN ${collectionName}
      RETURN { country: document.country }`;

    _.dataSources.EnterQuery(query);
    _.dataSources.RunQuery();

    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("France");
    });
    _.dataSources.ReadQueryTableResponse(1).then(($cellData) => {
      expect($cellData).to.eq("USA");
    });
    _.dataSources.ReadQueryTableResponse(2).then(($cellData) => {
      expect($cellData).to.eq("Brazil");
    });
  });

  //To add test for duplicate collection name

  after("Delete collection via curl & then data source", () => {
    //Deleting all queries created on this DB
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.agHelper
      .GetElement(_.dataSources._allQueriesforDB(dsName))
      .each(($el) => {
        cy.wrap($el)
          .invoke("text")
          .then(($query) => {
            _.entityExplorer.ActionContextMenuByEntityName(
              $query,
              "Delete",
              "Are you sure?",
            );
          });
      });

    //Deleting collection via Curl
    _.entityExplorer.CreateNewDsQuery("New cURL Import", false);
    cy.fixture("datasources").then((datasourceFormData) => {
      let curlDeleteCol =
        `curl --request DELETE --url http://` +
        datasourceFormData["arango-host"] +
        `:` +
        datasourceFormData["arango-port"] +
        `/_db/_system/_api/collection/${collectionName} --header 'authorization: Basic cm9vdDpBcmFuZ28='
    `;
      _.dataSources.ImportCurlNRun(curlDeleteCol);
      _.entityExplorer.ExpandCollapseEntity(dsName);
      _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh"); //needed for the added data to reflect in template queries
      _.agHelper.AssertElementVisible(_.dataSources._noSchemaAvailable(dsName));
      _.agHelper.ActionContextMenuWithInPane("Delete"); //Deleting api created

      //Deleting datasource finally
      _.dataSources.DeleteDatasouceFromWinthinDS(dsName);
    });
  });
});

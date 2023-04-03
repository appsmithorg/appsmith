import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any, cities: any, losAngelesPath: any, insertedRecordId: any;
describe("Validate Firestore DS", () => {
  before("Create a new Firestore DS", () => {
    _.dataSources.CreateDataSource("Firestore");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Validate List/Create/Update/Get", () => {
    let createCity = `{
      "name": "Los Angeles",
      "state": "CA",
      "country": "USA",
      "capital": false,
      "population": 3900000,
      "regions": ["west_coast", "socal"]
    }`;
    _.dataSources.CreateQueryAfterDSSaved();

    //List all records
    _.dataSources.ValidateNSelectDropdown("Commands", "List Documents");

    _.agHelper.EnterValue("cities", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection Name",
    });
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      cities = JSON.parse(JSON.stringify(resObj.response.body.data.body));
      //cy.log(cities)
      cy.wrap(cities)
        .should("be.an", "array")
        .its(0)
        .should("have.property", "name", "San Francisco"); //making sure inserted record is returned
    });

    _.agHelper.TypeDynamicInputValueNValidate(
      "capital",
      _.dataSources._nestedWhereClauseKey(0),
    );
    _.agHelper.TypeDynamicInputValueNValidate(
      "true",
      _.dataSources._nestedWhereClauseValue(0),
    );
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      cities = JSON.stringify(resObj.response.body.data.body);
      cy.wrap(cities).should("deep.equal", "[]"); //validating no record is returned
    });

    _.agHelper.GetNClick(_.dataSources._whereDelete(0)); //removign where clause

    //Create
    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "List Documents",
      "Create Document",
    );

    _.agHelper.EnterValue(
      "cities/{{Math.random().toString(36).substring(2, 24)}}",
      {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Collection Name",
      },
    );

    _.agHelper.EnterValue(createCity, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Body",
    });

    _.dataSources.RunQuery(); //Create the document

    //Find the document id of the newly inserted record
    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Create Document",
      "List Documents",
    );
    _.agHelper.EnterValue("cities", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection Name",
    });
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      cities = JSON.parse(JSON.stringify(resObj.response.body.data.body));
      const losAngeles = cities.find(
        (city: { name: string }) => city.name === "Los Angeles",
      );
      losAngelesPath = losAngeles._ref.path;

      //Update Document
      _.dataSources.ValidateNSelectDropdown(
        "Commands",
        "List Documents",
        "Update Document",
      );

      _.agHelper.EnterValue(losAngelesPath, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Collection Name",
      });

      _.agHelper.EnterValue(
        `{
        "state": "LL"
        }`,
        {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Body",
        },
      );

      _.dataSources.RunQuery(); //Update the document

      //Find the document id of the newly inserted record
      _.dataSources.ValidateNSelectDropdown(
        "Commands",
        "Update Document",
        "List Documents",
      );
      _.agHelper.EnterValue("cities", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Collection Name",
      });
      _.dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        cities = JSON.parse(JSON.stringify(resObj.response.body.data.body));
        const losAngeles = cities.find(
          (city: { name: string }) => city.name === "Los Angeles",
        );
        expect(losAngeles.state).to.eq("LL"); //Verifying update is fine
      });

      //Get Document
      _.dataSources.ValidateNSelectDropdown(
        "Commands",
        "List Documents",
        "Get Document",
      );

      _.agHelper.EnterValue(losAngelesPath, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Collection/Document Path",
      });

      _.dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        cities = JSON.parse(JSON.stringify(resObj.response.body.data.body));
        cy.wrap(cities).should("have.property", "name", "Los Angeles"); //making sure inserted record is returned
      });
    });
  });

  it("2. Validate Upsert [Update & Insert]/Delete Documents", () => {
    //Validating Upsert
    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Get Document",
      "Upsert Document",
    );

    _.agHelper.EnterValue(losAngelesPath, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection/Document Path",
    });

    _.agHelper.EnterValue(
      `{
        "population": 4000000
       }`,
      {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Body",
      },
    );
    _.dataSources.RunQuery(); //Upsert the document

    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Upsert Document",
      "List Documents",
    );
    _.agHelper.EnterValue("cities", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection Name",
    });

    _.agHelper.EnterValue('["population"]', {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Order By",
    });

    _.dataSources.RunQuery();

    cy.get("@postExecute").then((resObj: any) => {
      cities = JSON.parse(JSON.stringify(resObj.response.body.data.body));
      const secondRecordFields = Object.keys(cities[1]);
      cy.log("secondRecordFields is " + secondRecordFields);
      const hasOnlyPopulation = () => {
        return (
          secondRecordFields.length == 2 &&
          secondRecordFields.includes("_ref") &&
          secondRecordFields.includes("population") &&
          !secondRecordFields.includes("name")
        );
      };
      expect(hasOnlyPopulation()).to.be.true; //Validating Upsert!
    });

    //Validating Delete
    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "List Documents",
      "Delete Document",
    );

    _.agHelper.EnterValue(losAngelesPath, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection/Document Path",
    });
    _.dataSources.RunQuery(); //Delete the record

    //Validate Deletion
    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Delete Document",
      "List Documents",
    );
    _.agHelper.EnterValue("cities", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Collection Name",
    });
    _.dataSources.RunQuery();

    cy.get("@postExecute").then((resObj: any) => {
      cities = JSON.parse(JSON.stringify(resObj.response.body.data.body));
      const hasOnlySanFran = () => {
        return Array.isArray(cities) && cities.length === 1;
      };
      expect(hasOnlySanFran()).to.be.true; //Validating Deletion!
    });
  });

  after("Delete the query & datasource", () => {
    _.agHelper.ActionContextMenuWithInPane("Delete");
    _.entityExplorer.SelectEntityByName(dsName, "Datasources");
    _.entityExplorer.ActionContextMenuByEntityName(
      dsName,
      "Delete",
      "Are you sure?",
    );
    _.agHelper.ValidateNetworkStatus("@deleteDatasource", 200);
  });
});

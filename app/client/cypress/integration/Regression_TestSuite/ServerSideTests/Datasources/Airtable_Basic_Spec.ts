import * as _ from "../../../../support/Objects/ObjectsCore";
import datasourceFormData from "../../../../fixtures/datasources.json";

let dsName: any, jsonSpecies: any;
describe("Validate Airtable Ds", () => {
  before("Create a new Airtable DS", () => {
    _.dataSources.CreateDataSource("Airtable", true, false);
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it.only("1. Validate List Records", () => {
    var specieslist = new Array();
    _.dataSources.CreateQueryAfterDSSaved();

    //List all records
    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "Please select an option.",
      "List Records",
    );

    _.agHelper.EnterValue(datasourceFormData.AirtableBase, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Base ID ",
    });
    _.agHelper.EnterValue(datasourceFormData.AirtableTable, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Table Name",
    });
    _.dataSources.RunQuery(false);
    cy.wait("@postExecute").then(({ response }) => {
      expect(response?.body.data.isExecutionSuccess).to.eq(true);
      jsonSpecies = JSON.parse(response?.body.data.body);
      jsonSpecies.records.forEach((record: { fields: any }) => {
        specieslist.push(record.fields.Species_ID);
      });
      expect(specieslist.length).eq(54); //making sure all fields are returned
    });

    //Filter by Species_ID, Species field only
    const allowedFields = ["Species_ID", "Species"];
    _.agHelper.EnterValue("fields%5B%5D=Species_ID&fields%5B%5D=Species", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Fields",
    });

    _.dataSources.RunQuery(false);
    _.agHelper.Sleep(2500); // for query to run complete
    cy.wait("@postExecute").then(({ response }) => {
      expect(response?.body.data.isExecutionSuccess).to.eq(true);
      jsonSpecies = JSON.parse(response?.body.data.body);
      const isValid = jsonSpecies.records.every((record: any) => {
        const fieldKeys = Object.keys(record.fields);
        return allowedFields.every((field) => fieldKeys.includes(field));
      });
      expect(isValid).to.be.true; //making sure all records have only allowedFields returned in results
    });

    //Validate Max records
    _.agHelper.EnterValue("10", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Max Records",
    });
    _.agHelper.EnterValue("", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Page Size",
    });
    _.dataSources.RunQuery(false);
    _.agHelper.Sleep(2500); // for query to run complete
    cy.wait("@postExecute").then(({ response }) => {
      expect(response?.body.data.isExecutionSuccess).to.eq(true);
      jsonSpecies = JSON.parse(response?.body.data.body);
      expect(jsonSpecies.records.length).to.eq(10); //making sure only 10 record fields are returned
    });

    //Validate Page Size
    _.agHelper.EnterValue("5", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Page Size",
    });
    _.dataSources.RunQuery(false);
    _.agHelper.Sleep(); // for query to run complete
    cy.wait("@postExecute").then(({ response }) => {
      expect(response?.body.data.isExecutionSuccess).to.eq(true);
      jsonSpecies = JSON.parse(response?.body.data.body);
      expect(jsonSpecies.records.length).to.eq(5); //making sure only 5 record fields are returned, honouring the PageSize
    });

    //Validate Sort - asc
    let asc_specieslist = new Array(); //emptying array, specieslist.length = 0 did not work!
    _.agHelper.EnterValue("", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Page Size",
    }); //Removing Page Size
    _.agHelper.EnterValue("sort%5B0%5D%5Bfield%5D=Species_ID", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Sort",
    }); //Sort by default ascending, descneding is thrown error, checking with Felix

    _.dataSources.RunQuery(false);
    _.agHelper.Sleep(2500); // for query to run complete
    cy.wait("@postExecute").then(({ response }) => {
      expect(response?.body.data.isExecutionSuccess).to.eq(true);
      jsonSpecies = JSON.parse(response?.body.data.body);
      const sorted = jsonSpecies.records.every(
        (record: { fields: { Species_ID: string } }, i: number) => {
          if (i === 0) {
            asc_specieslist.push(record.fields.Species_ID);
            return true;
          }
          if (
            record.fields.Species_ID >=
            jsonSpecies.records[i - 1].fields.Species_ID
          ) {
            asc_specieslist.push(record.fields.Species_ID);
            return true;
          }
          return false;
        },
      );
      cy.log("Sorted specieslist is :" + asc_specieslist);
      expect(sorted).to.be.true; //making records returned are Sorted by Species_ID - in ascending
    });

    //Validate Sort - desc
    let desc_specieslist = new Array(); //emptying array, specieslist.length = 0 did not work!
    _.agHelper.EnterValue(
      "sort%5B0%5D%5Bfield%5D=Species_ID&sort%5B0%5D%5Bdirection%5D=desc",
      {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Sort",
      },
    ); //Sort by descending

    _.dataSources.RunQuery(false);
    _.agHelper.Sleep(3000); // for query to run complete
    cy.wait("@postExecute").then(({ response }) => {
      expect(response?.body.data.isExecutionSuccess).to.eq(true);
      jsonSpecies = JSON.parse(response?.body.data.body);
      const sorted = jsonSpecies.records.every(
        (record: { fields: { Species_ID: string } }, i: number) => {
          if (i === 0) {
            desc_specieslist.push(record.fields.Species_ID);
            return true;
          }
          if (
            record.fields.Species_ID <=
            jsonSpecies.records[i - 1].fields.Species_ID
          ) {
            desc_specieslist.push(record.fields.Species_ID);
            return true;
          }
          return false;
        },
      );
      cy.log("Desc Sorted specieslist is :" + desc_specieslist);
      expect(sorted).to.be.true; //making records returned are Sorted by Species_ID - in descending
    });
    _.agHelper.ActionContextMenuWithInPane("Delete");

  });

  it("2. Validate sorting, pagination etc", () => {});

  after("Delete the datasource", () => {
    _.entityExplorer.SelectEntityByName(dsName, "Datasources");
    _.entityExplorer.ActionContextMenuByEntityName(
      dsName,
      "Delete",
      "Are you sure?",
    );
    _.agHelper.ValidateNetworkStatus("@deleteDatasource", 200);
  });
});

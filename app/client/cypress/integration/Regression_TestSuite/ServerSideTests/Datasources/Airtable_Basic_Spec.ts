import * as _ from "../../../../support/Objects/ObjectsCore";
import datasourceFormData from "../../../../fixtures/datasources.json";

let dsName: any, jsonSpecies: any, offset: any, insertedRecordId: any;
describe("Validate Airtable Ds", () => {
  before("Create a new Airtable DS", () => {
    _.dataSources.CreateDataSource("Airtable", true, false);
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Validate List Records", () => {
    let specieslist = new Array();
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

    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      jsonSpecies = JSON.parse(resObj.response.body.data.body);
      jsonSpecies.records.forEach((record: { fields: any }) => {
        specieslist.push(record.fields.Species_ID);
      });
      expect(specieslist.length).to.be.at.least(53); //making sure all fields are returned
    });

    //Filter Species_ID & Species fields only
    _.agHelper.EnterValue(
      "fields%5B%5D=Species_ID&fields%5B%5D=Species&fields%5B%5D=Taxa",
      {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Fields",
      },
    );

    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      jsonSpecies = JSON.parse(resObj.response.body.data.body);
      const hasOnlyAllowedKeys = jsonSpecies.records.every((record: any) => {
        const fieldKeys = Object.keys(record.fields);
        return (
          fieldKeys.includes("Species_ID") &&
          fieldKeys.includes("Species") &&
          fieldKeys.includes("Taxa") &&
          fieldKeys.length === 3
        );
      });
      expect(hasOnlyAllowedKeys).to.be.true; //making sure all records have only Filters fields returned in results
    });

    //Validate Max records
    _.agHelper.EnterValue("11", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Max Records",
    });
    _.agHelper.EnterValue("", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Page Size",
    });
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      jsonSpecies = JSON.parse(resObj.response.body.data.body);
      expect(jsonSpecies.records.length).to.eq(11); //making sure only 11 record fields are returned
    });

    //Validate Page Size
    _.agHelper.EnterValue("6", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Page Size",
    });
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      jsonSpecies = JSON.parse(resObj.response.body.data.body);
      expect(jsonSpecies.records.length).to.eq(6); //making sure only 6 record fields are returned, honouring the PageSize

      //Validating offset
      offset = jsonSpecies.offset;
      _.agHelper.EnterValue(offset, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Offset",
      });
      _.dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = JSON.parse(resObj.response.body.data.body);
        expect(jsonSpecies.records.length).to.eq(5); //making sure only remaining records are returned
      });
    });

    //Validate Filter by Formula
    //let asc_specieslist = new Array(); //emptying array, specieslist.length = 0 did not work!
    _.agHelper.EnterValue("", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Offset",
    }); //Removing Offset
    _.agHelper.EnterValue('NOT({Taxa} = "Rodent")', {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Filter by Formula",
    });
    _.dataSources.RunQuery();

    cy.get("@postExecute").then((resObj: any) => {
      jsonSpecies = JSON.parse(resObj.response.body.data.body);
      const allRecordsWithRodentTaxa = jsonSpecies.records.filter(
        (record: { fields: { Taxa: string } }) =>
          record.fields.Taxa === "Rodent",
      );
      expect(allRecordsWithRodentTaxa.length).to.eq(0);
    });

    //Validate Sort - asc
    let asc_specieslist = new Array(); //emptying array, specieslist.length = 0 did not work!
    _.agHelper.EnterValue("", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Page Size",
    }); //Removing Page Size
    _.agHelper.EnterValue("", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Filter by Formula",
    }); //Removing Filter by Formula
    _.agHelper.EnterValue("10", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Max Records",
    });
    _.agHelper.EnterValue("sort%5B0%5D%5Bfield%5D=Species_ID", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Sort",
    }); //Sort by default ascending, descneding is thrown error, checking with Felix

    _.dataSources.RunQuery();

    cy.get("@postExecute").then((resObj: any) => {
      jsonSpecies = JSON.parse(resObj.response.body.data.body);
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

    _.dataSources.RunQuery();

    cy.get("@postExecute").then((resObj: any) => {
      jsonSpecies = JSON.parse(resObj.response.body.data.body);
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

    //Validate View - desc
    let view_specieslist = new Array();
    const isValidSpeciesID = (id: string) => ["EO", "PE"].includes(id);
    _.agHelper.EnterValue("", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Sort",
    }); //Removing Sort

    _.agHelper.EnterValue("GridView_CI", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "View",
    });

    _.dataSources.RunQuery();

    cy.get("@postExecute").then((resObj: any) => {
      jsonSpecies = JSON.parse(resObj.response.body.data.body);
      const isJSONValid = jsonSpecies.records.every(
        (record: { fields: { Species_ID: any } }) => {
          const speciesID = record.fields.Species_ID;
          view_specieslist.push(record.fields.Species_ID);
          return isValidSpeciesID(speciesID);
        },
      );
      cy.log("View specieslist is :" + view_specieslist);
      expect(isJSONValid).to.be.true; //Verify if records Species_ID is part of View data
    });
  });

  it("2. Create/Retrieve/Update/Delete records", () => {
    let createReq = `[{"fields": {
      "Species_ID": "SF",
      "Genus": "Sigmodon",
      "Species": "fulviventer",
      "Taxa": "Rodent"
    }}]`;

    //Create
    _.dataSources.ValidateNSelectDropdown(
      "Commands",
      "List Records",
      "Create Records",
    );
    _.agHelper.EnterValue(createReq, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Records",
    });
    _.agHelper.Sleep(500); // for the Records field to settle

    _.dataSources.RunQuery();

    cy.get("@postExecute").then((resObj: any) => {
      jsonSpecies = JSON.parse(resObj.response.body.data.body);
      //cy.log("jsonSpecies is"+ jsonSpecies)
      expect(jsonSpecies.records.length).to.eq(1); //making sure only inserted record is returned

      //Retrieve a record
      insertedRecordId = jsonSpecies.records[0].id;
      _.dataSources.ValidateNSelectDropdown(
        "Commands",
        "Create Records",
        "Retrieve A Record",
      );
      _.agHelper.EnterValue(insertedRecordId, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Record ID ",
      });

      _.dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = JSON.parse(resObj.response.body.data.body);
        const hasOnlyInsertedRecord = () => {
          return (
            jsonSpecies.fields.Species_ID === "SF" &&
            jsonSpecies.fields.Genus === "Sigmodon" &&
            jsonSpecies.fields.Species === "fulviventer" &&
            jsonSpecies.fields.Taxa === "Rodent"
          );
        };
        expect(hasOnlyInsertedRecord()).to.be.true;
      });

      //Update Records
      _.dataSources.ValidateNSelectDropdown(
        "Commands",
        "Retrieve A Record",
        "Update Records",
      );
      _.agHelper.EnterValue(
        `[{ "id" : ${insertedRecordId},
        fields: {
          Species_ID: "SG",
          Genus: "Spizella",
          Species: "clarki",
          Taxa: "Bird",
        }}]`,
        {
          propFieldName: "",
          directInput: false,
          inputFieldName: "Records",
        },
      );

      _.dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = JSON.parse(resObj.response.body.data.body);
        const hasOnlyUpdatedRecord = () => {
          return (
            jsonSpecies.records[0].fields.Species_ID === "SG" &&
            jsonSpecies.records[0].fields.Genus === "Spizella" &&
            jsonSpecies.records[0].fields.Species === "clarki" &&
            jsonSpecies.records[0].fields.Taxa === "Bird"
          );
        };
        expect(hasOnlyUpdatedRecord()).to.be.true;
      });

      //Delete A record
      //insertedRecordId = jsonSpecies.id;
      _.dataSources.ValidateNSelectDropdown(
        "Commands",
        "Update Records",
        "Delete A Record",
      );

      _.dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        jsonSpecies = JSON.parse(resObj.response.body.data.body);
        expect(jsonSpecies.deleted).to.be.true;
      });
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

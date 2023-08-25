import {
  dataSources,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";

describe("Fix UQI query switching", function () {
  it(
    "excludeForAirgap",
    "1. The command of the Mongo query must be preserved and should not default to initial value after changed.",
    function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreateDataSource("Mongo", false, false);
      dataSources.CreateQueryAfterDSSaved("", "MongoQuery");
      dataSources.ValidateNSelectDropdown(
        "Commands",
        "Find document(s)",
        "Insert document(s)",
      );
      dataSources.NavigateToDSCreateNew();
      dataSources.CreateDataSource("Twilio", false, false);
      dataSources.CreateQueryAfterDSSaved("", "TwilioQuery");
      dataSources.ValidateNSelectDropdown("Commands", "", "Schedule message");
      entityExplorer.SelectEntityByName("MongoQuery", "Queries/JS");
      dataSources.ValidateNSelectDropdown("Commands", "Insert document(s)");

      entityExplorer.SelectEntityByName("TwilioQuery", "Queries/JS");
      dataSources.ValidateNSelectDropdown("Commands", "Schedule message");
    },
  );
});

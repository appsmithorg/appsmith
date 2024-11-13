import {
  dataSources,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Bug 26126: Fix DS button disability",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("ensures save button is correctly updated when DS required fields change", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("S3");
      dataSources.FillS3DSForm();
      dataSources.AssertSaveDSButtonDisability(false);
      dataSources.ValidateNSelectDropdown(
        "S3 service provider",
        "Amazon S3",
        "Upcloud",
      );
      dataSources.AssertSaveDSButtonDisability(true);
      dataSources.ValidateNSelectDropdown(
        "S3 service provider",
        "Upcloud",
        "Amazon S3",
      );

      dataSources.AssertSaveDSButtonDisability(false);
    });
  },
);

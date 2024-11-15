import { agHelper, dataSources } from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe(
  "Datasource structure schema preview data",
  {
    tags: [
      "@tag.Datasource",
      "@tag.excludeForAirgap",
      "@tag.Git",
      "@tag.AccessControl",
    ],
  },
  () => {
    before(() => {
      dataSources.CreateMockDB("Users");
    });

    it("1. Verify if the schema table accordions is collapsed in case of search", () => {
      agHelper.TypeText(
        dataSources._datasourceStructureSearchInput,
        "public.us",
      );
      agHelper.Sleep(1000);
      agHelper.AssertElementAbsence(
        `${dataSources._dsStructurePreviewMode} ${dataSources._datasourceSchemaColumn}`,
      );
    });
  },
);

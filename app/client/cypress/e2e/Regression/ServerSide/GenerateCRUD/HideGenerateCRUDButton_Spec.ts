import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { dataSources } from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Hide Generate CRUD button when drag and drop building block is enabled",
  { tags: ["@tag.Datasource"] },
  () => {
    it("1. should hide Generate CRUD button when drag and drop building block is enabled", () => {
      featureFlagIntercept({ release_drag_drop_building_blocks_enabled: true });
      dataSources.CreateDataSource("Postgres");
      AppSidebar.navigate(AppSidebarButton.Data);
    });
  },
);

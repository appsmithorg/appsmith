import {
  dataSources,
  autoLayout,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe.skip(
  "Handle Conversion for Generated/Imported Pages",
  { tags: ["@tag.Settings", "@tag.excludeForAirgap"] },
  () => {
    it("1. make sure the Generated CRUD apps is converted and all the canvases are converted to auto layout", () => {
      dataSources.GeneratePageWithMockDB();

      //Converting generated CRUD app to Auto Layout and verify the canvases
      autoLayout.ConvertToAutoLayoutAndVerify();
      autoLayout.VerifyCurrentWidgetIsAutolayout(draggableWidgets.CONTAINER);

      //Add Generated CRUD from within the Auto Layout and verify the canvases
      dataSources.GeneratePageWithMockDB();
      autoLayout.VerifyCurrentWidgetIsAutolayout(draggableWidgets.CONTAINER);
    });
  },
);

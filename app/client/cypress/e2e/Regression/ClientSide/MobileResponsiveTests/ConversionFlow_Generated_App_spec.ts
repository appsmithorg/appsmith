import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Handle Conversion for Generated/Imported Pages", () => {
  it("1. make sure the Generated CRUD apps is converted and all the canvases are converted to auto layout", () => {
    _.dataSources.GeneratePageWithMockDB();

    //Converting generated CRUD app to Auto Layout and verify the canvases
    _.autoLayout.ConvertToAutoLayoutAndVerify();
    _.autoLayout.VerifyCurrentWidgetIsAutolayout(_.draggableWidgets.CONTAINER);

    //Add Generated CRUD from within the Auto Layout and verify the canvases
    _.dataSources.GeneratePageWithMockDB();
    _.autoLayout.VerifyCurrentWidgetIsAutolayout(_.draggableWidgets.CONTAINER);
  });
});

import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dataSources = ObjectsRegistry.DataSources,
  autoLayout = ObjectsRegistry.AutoLayout;
describe("Handle Conversion for Generated/Imported Pages", () => {
  it("1. make sure the Generated CRUD apps is converted and all the canvases are converted to auto layout", () => {
    dataSources.GeneratePageWithMockDB();

    //Converting generated CRUD app to Auto Layout and verify the canvases
    autoLayout.convertToAutoLayoutAndVerify();
    autoLayout.verifyCurrentWidgetIsAutolayout("containerwidget");

    //Add Generated CRUD from within the Auto Layout and verify the canvases
    dataSources.GeneratePageWithMockDB();
    autoLayout.verifyCurrentWidgetIsAutolayout("containerwidget");
  });
});

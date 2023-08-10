import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Camera widget test", () => {
  before(() => {
    entityExplorer.DragNDropWidget(draggableWidgets.CAMERA);
  });
  it("1. should show default camera dropdown with default value as 'Back'", () => {
    agHelper.AssertElementExist(
      propPane._propertyControl("defaultmobilecamera"),
    );
    propPane.AssertPropertiesDropDownCurrentValue(
      "Default mobile camera",
      "Back (Rear)",
    );
  });
  it("2. should be able to change the default mobile camera option", () => {
    propPane.AssertPropertiesDropDownValues("Default mobile camera", [
      "Back (Rear)",
      "Front (Selfie)",
    ]);
    propPane.AssertPropertiesDropDownCurrentValue(
      "Default mobile camera",
      "Back (Rear)",
    );
    propPane.SelectPropertiesDropDown(
      "Default mobile camera",
      "Front (Selfie)",
    );
  });
});

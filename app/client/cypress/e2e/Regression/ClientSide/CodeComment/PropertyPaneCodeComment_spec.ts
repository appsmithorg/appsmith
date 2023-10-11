import {
  agHelper,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Property Pane Code Commenting", () => {
  before(() => {
    agHelper.AddDsl("buttondsl");
  });

  it("1. Should comment code in Property Pane", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "{{appsmith}}");
    propPane.ToggleCommentInTextField("Label");

    propPane.ValidatePropertyFieldValue("Label", "{{// appsmith}}");

    //Uncomment
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.TypeTextIntoField("Label", "{{// appsmith}}");
    propPane.ToggleCommentInTextField("Label");
    propPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
  });
});

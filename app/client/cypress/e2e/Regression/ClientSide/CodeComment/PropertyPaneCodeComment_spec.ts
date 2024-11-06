import { agHelper, propPane } from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Property Pane Code Commenting",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("buttondsl");
    });

    it("1. Should comment code in Property Pane", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.TypeTextIntoField("Label", "{{appsmith}}");
      propPane.ToggleCommentInTextField("Label");

      propPane.ValidatePropertyFieldValue("Label", "{{// appsmith}}");

      //Uncomment
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.TypeTextIntoField("Label", "{{// appsmith}}");
      propPane.ToggleCommentInTextField("Label");
      propPane.ValidatePropertyFieldValue("Label", "{{appsmith}}");
    });
  },
);

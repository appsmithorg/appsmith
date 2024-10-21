import * as _ from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Api execution results test cases",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    it("1. Check to see if API execution results are preserved after it is renamed", () => {
      const {
        agHelper,
        apiPage,
        dataManager,
        entityExplorer,
        jsEditor,
        propPane,
      } = _;
      // Drag and drop a button widget
      entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 200, 200);
      entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON, 400, 400);

      // Create a new API
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
      );

      apiPage.RunAPI();

      jsEditor.CreateJSObject(
        `export default {
            async func() {
                return Api1.data
            }
        }`,
        {
          paste: true,
          completeReplace: true,
          toRun: true,
          shouldCreateNewJSObj: true,
          prettify: true,
        },
      );

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      // Set the label to the button
      propPane.TypeTextIntoField(
        "label",
        "{{Api1.data ? 'Success 1' : 'Failed 1'}}",
      );

      propPane.ToggleJSMode("onClick", true);

      propPane.TypeTextIntoField("onClick", "{{showAlert('Successful')}}");

      agHelper.ClickButton("Success 1");

      agHelper.ValidateToastMessage("Successful");

      PageLeftPane.switchSegment(PagePaneSegment.Queries);

      entityExplorer.RenameEntityFromExplorer("Api1", "Api123");

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      agHelper.ClickButton("Success 1");

      agHelper.ValidateToastMessage("Successful");

      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);

      // Set the label to the button
      propPane.TypeTextIntoField(
        "label",
        "{{JSObject1.func.data ? 'Success 2' : 'Failed 2'}}",
      );

      propPane.ToggleJSMode("onClick", true);

      propPane.TypeTextIntoField("onClick", "{{showAlert('Successful')}}");

      agHelper.ClickButton("Success 2");

      agHelper.ValidateToastMessage("Successful");
      PageLeftPane.switchSegment(PagePaneSegment.JS);

      entityExplorer.RenameEntityFromExplorer("JSObject1", "JSObject123");

      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);

      agHelper.ClickButton("Success 2");

      agHelper.ValidateToastMessage("Successful");
    });
  },
);

import {
  agHelper,
  entityExplorer,
  jsEditor,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Tests js file are caught", () => {
  it.skip("3. Tests if fetch works with store value", function () {
    entityExplorer.NavigateToSwitcher("Widgets");
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 500, 200);
    entityExplorer.SelectEntityByName("Button1");
    propPane.TypeTextIntoField("Label", "getUserID");
    propPane.EnterJSContext(
      "onClick",
      `{{fetch('https://jsonplaceholder.typicode.com/todos/1')
    .then(res => res.json())
    .then(json => storeValue('userId', json.userId))
    .then(() => showAlert("UserId: " + appsmith.store.userId))}}`,
    );
    agHelper.Sleep(2000);
    agHelper.ClickButton("getUserID");
    agHelper.AssertContains("UserId: 1", "exist");
  });
});

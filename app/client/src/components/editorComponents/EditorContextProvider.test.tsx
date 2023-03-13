import React, { useContext } from "react";
import store from "store";
import TestRenderer from "react-test-renderer";
import { Provider } from "react-redux";

import EditorContextProvider, {
  EditorContext,
  EditorContextType,
} from "./EditorContextProvider";

type TestChildProps = {
  editorContext: EditorContextType;
};

const TestChild = (props: TestChildProps) => {
  return <div>{Object.keys(props)}</div>;
};

const TestParent = () => {
  const editorContext = useContext(EditorContext);

  return <TestChild editorContext={editorContext} />;
};

describe("EditorContextProvider", () => {
  it("it checks context methods in Edit mode", () => {
    const expectedProps = [
      "batchUpdateWidgetProperty",
      "executeAction",
      "getWidgetCache",
      "modifyMetaWidgets",
      "resetChildrenMetaProperty",
      "selectWidgetRequest",
      "setWidgetCache",
      "updateMetaWidgetProperty",
      "syncUpdateWidgetMetaProperty",
      "triggerEvalOnMetaUpdate",
      "deleteMetaWidgets",
      "deleteWidgetProperty",
      "disableDrag",
      "updateWidget",
      "updateWidgetProperty",
      "updateWidgetAutoHeight",
      "checkContainersForAutoHeight",
      "selectedWidgetAncestry",
    ].sort();

    const testRenderer = TestRenderer.create(
      <Provider store={store}>
        <EditorContextProvider renderMode="CANVAS">
          <TestParent />
        </EditorContextProvider>
      </Provider>,
    );
    const testInstance = testRenderer.root;
    const result = (
      Object.keys(testInstance.findByType(TestChild).props.editorContext) || []
    ).sort();

    expect(result).toEqual(expectedProps);
  });

  it("it checks context methods in View mode", () => {
    const expectedProps = [
      "batchUpdateWidgetProperty",
      "deleteMetaWidgets",
      "executeAction",
      "getWidgetCache",
      "modifyMetaWidgets",
      "resetChildrenMetaProperty",
      "selectWidgetRequest",
      "setWidgetCache",
      "updateMetaWidgetProperty",
      "syncUpdateWidgetMetaProperty",
      "triggerEvalOnMetaUpdate",
      "updateWidgetAutoHeight",
      "checkContainersForAutoHeight",
      "selectedWidgetAncestry",
    ].sort();

    const testRenderer = TestRenderer.create(
      <Provider store={store}>
        <EditorContextProvider renderMode="PAGE">
          <TestParent />
        </EditorContextProvider>
      </Provider>,
    );
    const testInstance = testRenderer.root;
    const result = (
      Object.keys(testInstance.findByType(TestChild).props.editorContext) || []
    ).sort();

    expect(result).toEqual(expectedProps);
  });
});

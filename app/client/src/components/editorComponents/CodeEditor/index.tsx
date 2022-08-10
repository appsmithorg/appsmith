import React from "react";
import { useSelector } from "react-redux";

import { useFocusable } from "navigation/FocusableElement";
import { getDataTreeForAutocomplete } from "selectors/dataTreeSelectors";
import CodeEditor, { CodeEditorExpected } from "./Editor";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { FieldEntityInformation } from "./EditorConfig";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";
import { isActionEntity, isWidgetEntity } from "./codeEditorUtils";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

export * from "./Editor";

const CodeEditorHOC = (props: any) => {
  const dynamicData = useSelector(getDataTreeForAutocomplete);
  const [focusedEditorState, setEditorFocus] = useFocusable("codeEditor");
  const entityInformation = getEntityInformation(
    props.dataTreePath,
    dynamicData,
    props.expected,
  );

  return (
    <CodeEditor
      {...props}
      dynamicData={dynamicData}
      entityInformation={entityInformation}
      focusedEditorState={
        focusedEditorState?.elementName === entityInformation.propertyPath
          ? focusedEditorState
          : undefined
      }
      setEditorFocus={setEditorFocus}
    />
  );
};

function getEntityInformation(
  dataTreePath: string | undefined,
  dynamicData: DataTree,
  expected: CodeEditorExpected | undefined,
): FieldEntityInformation {
  const entityInformation: FieldEntityInformation = {
    expectedType: expected?.autocompleteDataType,
  };

  if (dataTreePath) {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      dataTreePath,
    );
    entityInformation.entityName = entityName;
    const entity = dynamicData[entityName];

    if (entity) {
      if ("ENTITY_TYPE" in entity) {
        const entityType = entity.ENTITY_TYPE;
        if (
          entityType === ENTITY_TYPE.WIDGET ||
          entityType === ENTITY_TYPE.ACTION ||
          entityType === ENTITY_TYPE.JSACTION
        ) {
          entityInformation.entityType = entityType;
        }
      }
      if (isActionEntity(entity)) entityInformation.entityId = entity.actionId;
      if (isWidgetEntity(entity)) {
        const isTriggerPath = entity.triggerPaths[propertyPath];
        entityInformation.entityId = entity.widgetId;
        if (isTriggerPath)
          entityInformation.expectedType = AutocompleteDataType.FUNCTION;
      }
    }
    entityInformation.propertyPath = propertyPath;
  }
  return entityInformation;
}

export default CodeEditorHOC;

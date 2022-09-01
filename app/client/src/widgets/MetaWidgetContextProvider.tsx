import React, { useContext, useMemo } from "react";

import {
  EditorContext,
  EditorContextType,
} from "components/editorComponents/EditorContextProvider";

type MetaWidgetContextProviderProps = React.PropsWithChildren<
  EditorContextType
>;

function MetaWidgetContextProvider({
  children,
  ...metaEditorContextProps
}: MetaWidgetContextProviderProps) {
  const editorContextProps = useContext(EditorContext);

  if (!editorContextProps.executeAction) {
    throw new Error(
      "EditorContext not found - Use EditorContextProvider in a parent component.",
    );
  }

  const executeAction =
    metaEditorContextProps.executeAction ?? editorContextProps.executeAction;
  const updateWidget =
    metaEditorContextProps.updateWidget ?? editorContextProps.updateWidget;
  const updateWidgetProperty =
    metaEditorContextProps.updateWidgetProperty ??
    editorContextProps.updateWidgetProperty;
  const syncUpdateWidgetMetaProperty =
    metaEditorContextProps.syncUpdateWidgetMetaProperty ??
    editorContextProps.syncUpdateWidgetMetaProperty;
  const disableDrag =
    metaEditorContextProps.disableDrag ?? editorContextProps.disableDrag;
  const resetChildrenMetaProperty =
    metaEditorContextProps.resetChildrenMetaProperty ??
    editorContextProps.resetChildrenMetaProperty;
  const deleteWidgetProperty =
    metaEditorContextProps.deleteWidgetProperty ??
    editorContextProps.deleteWidgetProperty;
  const batchUpdateWidgetProperty =
    metaEditorContextProps.batchUpdateWidgetProperty ??
    editorContextProps.batchUpdateWidgetProperty;
  const triggerEvalOnMetaUpdate =
    metaEditorContextProps.triggerEvalOnMetaUpdate ??
    editorContextProps.triggerEvalOnMetaUpdate;
  const modifyMetaWidgets =
    metaEditorContextProps.modifyMetaWidgets ??
    editorContextProps.modifyMetaWidgets;

  const contextValue = useMemo(
    () => ({
      executeAction,
      updateWidget,
      updateWidgetProperty,
      syncUpdateWidgetMetaProperty,
      disableDrag,
      resetChildrenMetaProperty,
      deleteWidgetProperty,
      batchUpdateWidgetProperty,
      triggerEvalOnMetaUpdate,
      modifyMetaWidgets,
    }),
    [
      executeAction,
      updateWidget,
      updateWidgetProperty,
      syncUpdateWidgetMetaProperty,
      disableDrag,
      resetChildrenMetaProperty,
      deleteWidgetProperty,
      batchUpdateWidgetProperty,
      triggerEvalOnMetaUpdate,
      modifyMetaWidgets,
    ],
  );

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

export default MetaWidgetContextProvider;

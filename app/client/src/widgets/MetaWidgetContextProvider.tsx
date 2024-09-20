import React, { useContext, useMemo } from "react";

import type { EditorContextType } from "components/editorComponents/EditorContextProvider";
import { EditorContext } from "components/editorComponents/EditorContextProvider";

type MetaWidgetContextProviderProps =
  React.PropsWithChildren<EditorContextType>;

// TODO (Ashit) - Add test for this provider
// test to always returning the exact number of functions defined in the EditorContextProvider
// so that when a new function is introduced there, one does not misses adding it here as well.
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
  const syncBatchUpdateWidgetMetaProperties =
    metaEditorContextProps.syncBatchUpdateWidgetMetaProperties ??
    editorContextProps.syncBatchUpdateWidgetMetaProperties;
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

  const updateWidgetDimension =
    metaEditorContextProps.updateWidgetDimension ??
    editorContextProps.updateWidgetDimension;

  const setWidgetCache =
    metaEditorContextProps.setWidgetCache ?? editorContextProps.setWidgetCache;

  const getWidgetCache =
    metaEditorContextProps.getWidgetCache ?? editorContextProps.getWidgetCache;
  const deleteMetaWidgets =
    metaEditorContextProps.deleteMetaWidgets ??
    editorContextProps.deleteMetaWidgets;

  const updateMetaWidgetProperty =
    metaEditorContextProps.updateMetaWidgetProperty ??
    editorContextProps.updateMetaWidgetProperty;

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
      setWidgetCache,
      getWidgetCache,
      deleteMetaWidgets,
      updateMetaWidgetProperty,
      updateWidgetDimension,
      syncBatchUpdateWidgetMetaProperties,
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
      setWidgetCache,
      getWidgetCache,
      deleteMetaWidgets,
      updateMetaWidgetProperty,
      updateWidgetDimension,
      syncBatchUpdateWidgetMetaProperties,
    ],
  );

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

export default MetaWidgetContextProvider;

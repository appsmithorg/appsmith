import React, { useMemo } from "react";
import { useRouteMatch } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import JsEditorForm from "./Form";
import { getJSCollectionDataByBaseId } from "selectors/editorSelectors";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import Spinner from "components/editorComponents/Spinner";
import styled from "styled-components";
import EntityNotFoundPane from "../EntityNotFoundPane";
import AppJSEditorContextMenu from "./AppJSEditorContextMenu";
import { updateFunctionProperty } from "actions/jsPaneActions";
import type { OnUpdateSettingsProps } from "./JSEditorToolbar";
import { saveJSObjectName } from "actions/jsActionActions";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

function JSEditor() {
  const {
    params: { baseCollectionId },
  } = useRouteMatch<{ baseCollectionId: string }>();
  const dispatch = useDispatch();
  const jsCollectionData = useSelector((state) =>
    getJSCollectionDataByBaseId(state, baseCollectionId),
  );
  const { isCreating } = useSelector((state) => state.ui.jsPane);
  const jsCollection = jsCollectionData?.config;

  const contextMenu = useMemo(() => {
    if (!jsCollection) {
      return null;
    }

    return <AppJSEditorContextMenu jsCollection={jsCollection} />;
  }, [jsCollection]);

  if (isCreating) {
    return (
      <LoadingContainer>
        <Spinner size={30} />
      </LoadingContainer>
    );
  }

  const onUpdateSettings = (props: OnUpdateSettingsProps) => {
    dispatch(updateFunctionProperty(props));
  };

  if (!!jsCollection) {
    return (
      <JsEditorForm
        contextMenu={contextMenu}
        hideContextMenuOnEditor={Boolean(
          jsCollectionData?.config.isMainJSCollection,
        )}
        hideEditIconOnEditor={Boolean(
          jsCollectionData?.config.isMainJSCollection,
        )}
        jsCollectionData={jsCollectionData}
        onUpdateSettings={onUpdateSettings}
        saveJSObjectName={saveJSObjectName}
      />
    );
  }

  return <EntityNotFoundPane />;
}

export default JSEditor;

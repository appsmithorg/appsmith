import React, { useMemo } from "react";
import type { RouteComponentProps } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import JsEditorForm from "./Form";
import * as Sentry from "@sentry/react";
import { getJSCollectionDataById } from "selectors/editorSelectors";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import Spinner from "components/editorComponents/Spinner";
import styled from "styled-components";
import EntityNotFoundPane from "../EntityNotFoundPane";
import AppJSEditorContextMenu from "./AppJSEditorContextMenu";
import { updateFunctionProperty } from "actions/jsPaneActions";
import type { OnUpdateSettingsProps } from "./JSFunctionSettings";
import { saveJSObjectName } from "actions/jsActionActions";
import CloseEditor from "components/editorComponents/CloseEditor";
import { useIsEditorPaneSegmentsEnabled } from "../IDE/hooks";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

type Props = RouteComponentProps<{
  apiId: string;
  pageId: string;
  collectionId: string;
}>;

function JSEditor(props: Props) {
  const { collectionId, pageId } = props.match.params;
  const dispatch = useDispatch();
  const jsCollectionData = useSelector((state) =>
    getJSCollectionDataById(state, collectionId),
  );
  const { isCreating } = useSelector((state) => state.ui.jsPane);
  const isEditorPaneEnabled = useIsEditorPaneSegmentsEnabled();
  const jsCollection = jsCollectionData?.config;

  const contextMenu = useMemo(() => {
    if (!jsCollection) {
      return null;
    }

    return (
      <AppJSEditorContextMenu jsCollection={jsCollection} pageId={pageId} />
    );
  }, [jsCollection, pageId]);

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

  const backLink = <CloseEditor />;

  if (!!jsCollection) {
    return (
      <JsEditorForm
        backLink={isEditorPaneEnabled ? null : backLink}
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

export default Sentry.withProfiler(JSEditor);

import React from "react";
import { useParams } from "react-router";
import type { AppState } from "@appsmith/reducers";
import { useSelector } from "react-redux";
import * as Sentry from "@sentry/react";
import { getJSCollectionById } from "selectors/editorSelectors";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import Spinner from "components/editorComponents/Spinner";
import styled from "styled-components";
import JSEditorForm from "pages/Editor/JSEditor/IDEForm";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

function JSEditor() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const jsCollection = useSelector((state) =>
    getJSCollectionById(state, { match: { params: { collectionId } } }),
  );
  const isCreating = useSelector(
    (state: AppState) => state.ui.jsPane.isCreating,
  );

  if (isCreating) {
    return (
      <LoadingContainer>
        <Spinner size={30} />
      </LoadingContainer>
    );
  }

  if (!!jsCollection) {
    return <JSEditorForm jsCollection={jsCollection} />;
  }
  return <EntityNotFoundPane />;
}

export default Sentry.withProfiler(JSEditor);

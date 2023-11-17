import React, { useMemo } from "react";
import type { RouteComponentProps } from "react-router";
import type { JSCollection } from "entities/JSCollection";
import { useSelector } from "react-redux";
import JsEditorForm from "./Form";
import * as Sentry from "@sentry/react";
import { getJSCollectionById } from "selectors/editorSelectors";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import Spinner from "components/editorComponents/Spinner";
import styled from "styled-components";
import EntityNotFoundPane from "../EntityNotFoundPane";
import AppJSEditorContextMenu from "./AppJSEditorContextMenu";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;
interface ReduxStateProps {
  jsCollection: JSCollection | undefined;
  isCreating: boolean;
}

type Props = ReduxStateProps &
  RouteComponentProps<{ apiId: string; pageId: string }>;

function JSEditor(props: Props) {
  const { pageId } = props.match.params;
  const jsCollection = useSelector((state) =>
    getJSCollectionById(state, props),
  );
  const { isCreating } = useSelector((state) => state.ui.jsPane);

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

  if (!!jsCollection) {
    return (
      <JsEditorForm contextMenu={contextMenu} jsCollection={jsCollection} />
    );
  }
  return <EntityNotFoundPane />;
}

export default Sentry.withProfiler(JSEditor);

import React from "react";
import { Flex } from "design-system";
import styled from "styled-components";
import { Switch, useRouteMatch } from "react-router";

import {
  ADD_PATH,
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  QUERIES_EDITOR_ID_PATH,
} from "constants/routes";
import { SentryRoute } from "@appsmith/AppRouter";
import { AddQuery } from "./AddQuery";
import { ListQuery } from "./ListQuery";
import { useCurrentEditorState } from "../hooks";
import { EditorEntityTabState, EditorViewMode } from "entities/IDE/constants";
import { useSelector } from "react-redux";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import ApiEditor from "../../APIEditor";
import QueryEditor from "../../QueryEditor";
import { SAAS_EDITOR_API_ID_PATH } from "../../SaaSEditor/constants";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const QueriesSection = () => {
  const { path } = useRouteMatch();
  const { segmentMode } = useCurrentEditorState();
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);

  return (
    <QueriesContainer
      className="ide-pages-pane__content-queries"
      flexDirection="column"
      overflow="hidden"
    >
      <Switch>
        {isSideBySideEnabled &&
        segmentMode === EditorEntityTabState.Edit &&
        editorMode === EditorViewMode.HalfScreen ? (
          <>
            <SentryRoute
              component={QueryEditor}
              path={[
                BUILDER_PATH_DEPRECATED + SAAS_EDITOR_API_ID_PATH,
                BUILDER_PATH + SAAS_EDITOR_API_ID_PATH,
                BUILDER_CUSTOM_PATH + SAAS_EDITOR_API_ID_PATH,
                BUILDER_PATH_DEPRECATED + QUERIES_EDITOR_ID_PATH,
                BUILDER_PATH + QUERIES_EDITOR_ID_PATH,
                BUILDER_CUSTOM_PATH + QUERIES_EDITOR_ID_PATH,
              ]}
            />
            <SentryRoute
              component={ApiEditor}
              path={[
                BUILDER_PATH_DEPRECATED + API_EDITOR_ID_PATH,
                BUILDER_PATH + API_EDITOR_ID_PATH,
                BUILDER_CUSTOM_PATH + API_EDITOR_ID_PATH,
              ]}
            />
          </>
        ) : (
          <>
            <SentryRoute
              component={AddQuery}
              exact
              path={[`${path}${ADD_PATH}`, `${path}/:queryId/add`]}
            />
            <SentryRoute component={ListQuery} />
          </>
        )}
      </Switch>
    </QueriesContainer>
  );
};

export { QueriesSection };

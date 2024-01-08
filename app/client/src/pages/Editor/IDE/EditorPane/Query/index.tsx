import React from "react";
import { Flex } from "design-system";
import styled from "styled-components";
import { Switch, useRouteMatch } from "react-router";
import { useSelector } from "react-redux";

import { ADD_PATH, LIST_PATH } from "constants/routes";
import { SentryRoute } from "@appsmith/AppRouter";
import { EditorViewMode } from "entities/IDE/constants";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import ApiEditor from "pages/Editor/APIEditor";
import QueryEditor from "pages/Editor/QueryEditor";
import AddQuery from "./Add";
import ListQuery from "./List";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const QueriesSegment = () => {
  const { path } = useRouteMatch();
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);

  return (
    <QueriesContainer
      className="ide-editor-left-pane__content-queries"
      flexDirection="column"
      overflow="hidden"
    >
      <Switch>
        {isSideBySideEnabled && editorMode === EditorViewMode.SplitScreen ? (
          <>
            <SentryRoute
              component={QueryEditor}
              path={[
                path + "/api/:apiId", // SAAS path
                path + "/:queryId",
              ]}
            />
            <SentryRoute component={ApiEditor} path={[path + "/:apiId"]} />
          </>
        ) : (
          <>
            <SentryRoute
              component={AddQuery}
              exact
              path={[`${path}${ADD_PATH}`, `${path}/:queryId${ADD_PATH}`]}
            />
            <SentryRoute
              component={ListQuery}
              exact
              path={[
                path + "/api/:apiId", // SAAS path
                path + "/:queryId",
                path + "/:apiId",
                `${path}${LIST_PATH}`,
                path + "/api/:apiId" + LIST_PATH, // SAAS path
                path + "/:queryId" + LIST_PATH,
                path + "/:apiId" + LIST_PATH,
              ]}
            />
          </>
        )}
      </Switch>
    </QueriesContainer>
  );
};

export default QueriesSegment;

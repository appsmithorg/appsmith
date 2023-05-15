import type { AppState } from "@appsmith/reducers";
import { redirectAuthorizationCode } from "actions/datasourceActions";
import type { CalloutKind } from "design-system";
import { Callout } from "design-system";
import type { Datasource } from "entities/Datasource";
import { ActionType } from "entities/Datasource";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPluginTypeFromDatasourceId } from "selectors/entitiesSelector";
import styled from "styled-components";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { createMessage } from "design-system-old/build/constants/messages";
import {
  GOOGLE_SHEETS_AUTHORIZE_DATASOURCE,
  GOOGLE_SHEETS_LEARN_MORE,
} from "@appsmith/constants/messages";

const StyledAuthMessage = styled.div`
  width: fit-content;
  margin-bottom: var(--ads-v2-spaces-4);
  margin-top: var(--ads-v2-spaces-7);
`;

type AuthMessageProps = {
  // We can handle for other action types as well eg. save, delete etc.
  actionType?: string;
  datasource: Datasource;
  description: string;
  pageId?: string;
  style?: any;
  calloutType?: CalloutKind;
};

export default function AuthMessage(props: AuthMessageProps) {
  const {
    actionType,
    calloutType = "error",
    datasource,
    description,
    pageId,
    style = {},
  } = props;
  const dispatch = useDispatch();
  const pluginType = useSelector((state: AppState) =>
    getPluginTypeFromDatasourceId(state, datasource.id),
  );
  const handleOauthAuthorization: any = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!pluginType || !pageId) return;
    dispatch(redirectAuthorizationCode(pageId, datasource.id, pluginType));
  };
  const handleDocumentationClick: any = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const query = "Google Sheets";
    dispatch(setGlobalSearchQuery(query));
    dispatch(toggleShowGlobalSearchModal());
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "DATASOURCE_DOCUMENTATION_CLICK",
      query,
    });
  };

  return (
    <StyledAuthMessage style={style}>
      <Callout
        kind={calloutType}
        links={
          actionType === ActionType.AUTHORIZE
            ? [
                {
                  children: createMessage(GOOGLE_SHEETS_AUTHORIZE_DATASOURCE),
                  onClick: handleOauthAuthorization,
                },
              ]
            : actionType === ActionType.DOCUMENTATION
            ? [
                {
                  children: createMessage(GOOGLE_SHEETS_LEARN_MORE),
                  onClick: handleDocumentationClick,
                },
              ]
            : undefined
        }
      >
        {description}
      </Callout>
    </StyledAuthMessage>
  );
}

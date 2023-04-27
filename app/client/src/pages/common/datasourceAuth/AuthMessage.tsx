import type { AppState } from "@appsmith/reducers";
import { redirectAuthorizationCode } from "actions/datasourceActions";
import { CalloutV2 } from "design-system-old";
import type { CalloutType } from "design-system-old";
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
  margin-bottom: 16px;
  padding: 0 20px;
  & > div {
    margin: 0;
  }
`;

type AuthMessageProps = {
  // We can handle for other action types as well eg. save, delete etc.
  actionType?: string;
  datasource: Datasource;
  description: string;
  pageId?: string;
  style?: any;
  calloutType?: CalloutType;
};

export default function AuthMessage(props: AuthMessageProps) {
  const {
    actionType,
    calloutType = "Warning",
    datasource,
    description,
    pageId,
    style = {},
  } = props;
  const dispatch = useDispatch();
  const pluginType = useSelector((state: AppState) =>
    getPluginTypeFromDatasourceId(state, datasource.id),
  );
  const handleOauthAuthorization: any = () => {
    if (!pluginType || !pageId) return;
    dispatch(redirectAuthorizationCode(pageId, datasource.id, pluginType));
  };

  const handleDocumentationClick: any = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = "Google Sheets";
    dispatch(setGlobalSearchQuery(query));
    dispatch(toggleShowGlobalSearchModal());
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "DATASOURCE_DOCUMENTATION_CLICK",
      query,
    });
  };

  const extraInfo: Partial<React.ComponentProps<typeof CalloutV2>> = {};

  switch (actionType) {
    case ActionType.AUTHORIZE: {
      extraInfo.actionLabel = createMessage(GOOGLE_SHEETS_AUTHORIZE_DATASOURCE);
      extraInfo.onClick = handleOauthAuthorization;
      break;
    }
    case ActionType.DOCUMENTATION: {
      extraInfo.actionLabel = createMessage(GOOGLE_SHEETS_LEARN_MORE);
      extraInfo.onClick = handleDocumentationClick;
      break;
    }
    default:
      break;
  }

  return (
    <StyledAuthMessage style={style}>
      <CalloutV2 desc={description} type={calloutType} {...extraInfo} />
    </StyledAuthMessage>
  );
}

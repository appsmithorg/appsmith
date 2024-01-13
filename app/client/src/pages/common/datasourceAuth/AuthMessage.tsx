import type { AppState } from "@appsmith/reducers";
import { redirectAuthorizationCode } from "actions/datasourceActions";
import type { CalloutKind } from "design-system";
import { Callout } from "design-system";
import type { Datasource } from "entities/Datasource";
import { ActionType } from "entities/Datasource";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getPlugin,
  getPluginTypeFromDatasourceId,
} from "@appsmith/selectors/entitiesSelector";
import styled from "styled-components";
import {
  GOOGLE_SHEETS_AUTHORIZE_DATASOURCE,
  GOOGLE_SHEETS_LEARN_MORE,
  createMessage,
  GOOGLE_SHEETS_ASK_FOR_SUPPORT,
  DATASOURCE_INTERCOM_TEXT,
} from "@appsmith/constants/messages";
import { getAppsmithConfigs } from "@appsmith/configs";
import { DocsLink, openDoc } from "constants/DocumentationLinks";
import type { Plugin } from "api/PluginApi";
const { intercomAppID } = getAppsmithConfigs();

const StyledAuthMessage = styled.div<{ isInViewMode: boolean }>`
  width: fit-content;
  ${(props) =>
    !props.isInViewMode &&
    `margin-top: var(--ads-v2-spaces-5);margin-bottom: var(--ads-v2-spaces-4);`}
`;

interface AuthMessageProps {
  // We can handle for other action types as well eg. save, delete etc.
  actionType?: string;
  datasource: Datasource;
  description: string;
  pageId?: string;
  style?: any;
  calloutType?: CalloutKind;
  isInViewMode?: boolean;
}

export default function AuthMessage(props: AuthMessageProps) {
  const {
    actionType,
    calloutType = "error",
    datasource,
    description,
    isInViewMode = false,
    pageId,
    style = {},
  } = props;
  const dispatch = useDispatch();
  const pluginType = useSelector((state: AppState) =>
    getPluginTypeFromDatasourceId(state, datasource.id),
  );
  const pluginId: string = props?.datasource?.pluginId || "";
  const plugin: Plugin | undefined = useSelector((state) =>
    getPlugin(state, pluginId),
  );
  const handleOauthAuthorization: any = () => {
    if (!pluginType || !pageId) return;
    dispatch(redirectAuthorizationCode(pageId, datasource.id, pluginType));
  };
  const handleDocumentationClick: any = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDoc(DocsLink.QUERY, plugin?.documentationLink, plugin?.name);
  };

  const getCallOutLinks = () => {
    switch (actionType) {
      case ActionType.AUTHORIZE:
        return [
          {
            children: createMessage(GOOGLE_SHEETS_AUTHORIZE_DATASOURCE),
            onClick: handleOauthAuthorization,
          },
          {
            children: createMessage(GOOGLE_SHEETS_ASK_FOR_SUPPORT),
            onClick: () => {
              // Triggering intercom here, to understand what exact
              // problem user is facing while creating google sheets datasource
              if (intercomAppID && window.Intercom) {
                window.Intercom(
                  "showNewMessage",
                  createMessage(DATASOURCE_INTERCOM_TEXT),
                );
              }
            },
          },
        ];
      case ActionType.DOCUMENTATION:
        return [
          {
            children: createMessage(GOOGLE_SHEETS_LEARN_MORE),
            onClick: handleDocumentationClick,
          },
        ];
      default:
        return undefined;
    }
  };

  return (
    <StyledAuthMessage isInViewMode={isInViewMode} style={style}>
      <Callout kind={calloutType} links={getCallOutLinks()}>
        {description}
      </Callout>
    </StyledAuthMessage>
  );
}

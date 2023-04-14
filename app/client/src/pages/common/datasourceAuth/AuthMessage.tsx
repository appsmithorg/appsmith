import type { AppState } from "@appsmith/reducers";
import { redirectAuthorizationCode } from "actions/datasourceActions";
import { Callout } from "design-system";
import type { Datasource } from "entities/Datasource";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPluginTypeFromDatasourceId } from "selectors/entitiesSelector";
import styled from "styled-components";

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
  actionType?: "authorize";
  datasource: Datasource;
  description: string;
  pageId?: string;
  style?: any;
};

export default function AuthMessage(props: AuthMessageProps) {
  const { actionType, datasource, description, pageId, style = {} } = props;
  const dispatch = useDispatch();
  const pluginType = useSelector((state: AppState) =>
    getPluginTypeFromDatasourceId(state, datasource.id),
  );
  const handleOauthAuthorization: any = () => {
    if (!pluginType || !pageId) return;
    dispatch(redirectAuthorizationCode(pageId, datasource.id, pluginType));
  };

  return (
    <StyledAuthMessage style={style}>
      <Callout
        kind="error"
        links={
          actionType === "authorize"
            ? [
                {
                  children: "Authorize Datasource",
                  onClick: handleOauthAuthorization,
                  to: "",
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

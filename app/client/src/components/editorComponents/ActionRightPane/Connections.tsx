import React from "react";
import { Collapsible } from ".";
import Icon, { IconSize } from "components/ads/Icon";
import styled from "styled-components";
import LongArrowSVG from "assets/images/long-arrow-bottom.svg";
import { useEntityLink } from "../Debugger/hooks/debuggerHooks";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import { getTypographyByKey } from "constants/DefaultTheme";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  INCOMING_ENTITIES,
  NO_INCOMING_ENTITIES,
  NO_OUTGOING_ENTITIES,
  OUTGOING_ENTITIES,
} from "@appsmith/constants/messages";
import { Connection } from "../Debugger/EntityDependecies";

const ConnectionType = styled.span`
  span:nth-child(2) {
    padding-left: ${(props) => props.theme.spaces[2] - 1}px;
  }
  padding-bottom: ${(props) => props.theme.spaces[2]}px;
`;

const NoConnections = styled.div`
  width: 100%;
  background-color: ${(props) =>
    props.theme.colors.actionSidePane.noConnections};
  padding: ${(props) => props.theme.spaces[4] + 1}px
    ${(props) => props.theme.spaces[3]}px;

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.actionSidePane.noConnectionsText};
  }
`;

const ConnectionFlow = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;

  img {
    padding-top: ${(props) => props.theme.spaces[1]}px;
    padding-bottom: ${(props) => props.theme.spaces[2] + 1}px;
  }
`;

const ConnectionsContainer = styled.span`
  width: 100%;
  background-color: ${(props) =>
    props.theme.colors.actionSidePane.noConnections};
  display: flex;
  flex-wrap: wrap;
  padding: ${(props) => props.theme.spaces[2] + 1}px;
  .connection {
    border: 1px solid
      ${(props) => props.theme.colors.actionSidePane.connectionBorder};
    padding: ${(props) => props.theme.spaces[0] + 2}px
      ${(props) => props.theme.spaces[1]}px;
    ${(props) => getTypographyByKey(props, "p3")}
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;

    :hover {
      border: 1px solid
        ${(props) => props.theme.colors.actionSidePane.connectionHover};
      color: ${(props) => props.theme.colors.actionSidePane.connectionHover};
    }
  }
`;

function Dependencies(props: any) {
  const { navigateToEntity } = useEntityLink();

  const onClick = (entityName: string, entityType: string) => {
    navigateToEntity(entityName);
    AnalyticsUtil.logEvent("ASSOCIATED_ENTITY_CLICK", {
      source: "INTEGRATION",
      entityType: entityType,
    });
  };

  return props.dependencies.length ? (
    <ConnectionsContainer>
      {props.dependencies.map((entityName: string) => {
        return (
          <Connection
            entityName={entityName}
            key={entityName}
            onClick={onClick}
          />
        );
      })}
    </ConnectionsContainer>
  ) : (
    <NoConnections>
      <Text type={TextType.P1}>{props.placeholder}</Text>
    </NoConnections>
  );
}

type ConnectionsProps = {
  actionName: string;
  entityDependencies: {
    inverseDependencies: string[];
    directDependencies: string[];
  } | null;
};

function Connections(props: ConnectionsProps) {
  return (
    <Collapsible label="Relationships">
      <ConnectionType className="icon-text">
        <Icon keepColors name="trending-flat" size={IconSize.MEDIUM} />
        <span className="connection-type">
          {createMessage(INCOMING_ENTITIES)}
        </span>
      </ConnectionType>
      {/* Direct Dependencies */}
      <Dependencies
        dependencies={props.entityDependencies?.directDependencies ?? []}
        placeholder={createMessage(NO_INCOMING_ENTITIES)}
      />
      <ConnectionFlow>
        <img height="32" src={LongArrowSVG} />
        {props.actionName}
        <img height="32" src={LongArrowSVG} />
      </ConnectionFlow>
      <ConnectionType className="icon-text">
        <span className="connection-type">
          {createMessage(OUTGOING_ENTITIES)}
        </span>
        <Icon keepColors name="trending-flat" size={IconSize.MEDIUM} />
      </ConnectionType>
      {/* Inverse dependencies */}
      <Dependencies
        dependencies={props.entityDependencies?.inverseDependencies ?? []}
        placeholder={createMessage(NO_OUTGOING_ENTITIES)}
      />
    </Collapsible>
  );
}

export default Connections;

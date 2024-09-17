import React from "react";
import { Text, TextType } from "@appsmith/ads-old";
import styled from "styled-components";
import LongArrowSVG from "assets/images/long-arrow-bottom.svg";
import { useEntityLink } from "../Debugger/hooks/debuggerHooks";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  createMessage,
  INCOMING_ENTITIES,
  NO_INCOMING_ENTITIES,
  NO_OUTGOING_ENTITIES,
  OUTGOING_ENTITIES,
} from "ee/constants/messages";
import { Connection } from "../Debugger/EntityDependecies";
import { Icon } from "@appsmith/ads";
import Collapsible from "components/common/Collapsible";

const ConnectionType = styled.span`
  span:nth-child(2) {
    padding-left: ${(props) => props.theme.spaces[2] - 1}px;
  }
  padding-bottom: ${(props) => props.theme.spaces[2]}px;
`;

const NoConnections = styled.div`
  width: 100%;
  padding: ${(props) => props.theme.spaces[4] + 1}px
    ${(props) => props.theme.spaces[3]}px;
  background-color: var(--ads-v2-color-bg);
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border);
  color: var(--ads-v2-color-fg);
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
  display: flex;
  flex-wrap: wrap;
  padding: ${(props) => props.theme.spaces[2] + 1}px;

  background-color: var(--ads-v2-color-bg);
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border);
  color: var(--ads-v2-color-fg);
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

interface ConnectionsProps {
  actionName: string;
  entityDependencies: {
    inverseDependencies: string[];
    directDependencies: string[];
  } | null;
}

function Connections(props: ConnectionsProps) {
  return (
    <Collapsible label="Relationships">
      <ConnectionType className="icon-text">
        <Icon name="arrow-right-line" size="md" />
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
        <Icon name="arrow-right-line" size="md" />
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

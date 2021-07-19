import React from "react";
import { Collapsible } from ".";
import Icon, { IconSize } from "components/ads/Icon";
import styled from "styled-components";
import LongArrowSVG from "assets/images/long-arrow.svg";
import { useEntityLink } from "../Debugger/hooks";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import { getTypographyByKey } from "constants/DefaultTheme";

const ConnectionType = styled.span`
  span:nth-child(2) {
    padding-left: ${(props) => props.theme.spaces[2] - 1}px;
  }
  padding-bottom: ${(props) => props.theme.spaces[2]}px;
`;

const ConnectionWrapper = styled.span`
  margin: ${(props) => props.theme.spaces[1]}px
    ${(props) => props.theme.spaces[0] + 2}px;
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

  return props.dependencies.length ? (
    <ConnectionsContainer>
      {props.dependencies.map((e: any) => {
        return (
          <ConnectionWrapper key={e}>
            <span className="connection" onClick={() => navigateToEntity(e)}>
              {e}
            </span>
          </ConnectionWrapper>
        );
      })}
    </ConnectionsContainer>
  ) : (
    <NoConnections>
      <Text type={TextType.P1}>No incoming connections</Text>
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
      <span className="description">See all connected entities</span>
      <ConnectionType className="icon-text">
        <Icon keepColors name="trending-flat" size={IconSize.MEDIUM} />
        <span className="connection-type">Incoming entities</span>
      </ConnectionType>
      {/* Direct Dependencies */}
      <Dependencies
        dependencies={props.entityDependencies?.directDependencies ?? []}
        placeholder="No incoming entities"
      />
      <ConnectionFlow>
        <img src={LongArrowSVG} />
        {props.actionName}
        <img src={LongArrowSVG} />
      </ConnectionFlow>
      <ConnectionType className="icon-text">
        <span className="connection-type">Outgoing entities</span>
        <Icon keepColors name="trending-flat" size={IconSize.MEDIUM} />
      </ConnectionType>
      {/* Inverse dependencies */}
      <Dependencies
        dependencies={props.entityDependencies?.inverseDependencies ?? []}
        placeholder="No outgoing entities"
      />
    </Collapsible>
  );
}

export default Connections;

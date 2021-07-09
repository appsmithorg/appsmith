import React from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getDependenciesFromInverseDependencies } from "../Debugger/helpers";
import { Collapsible } from ".";
import Icon, { IconSize } from "components/ads/Icon";
import styled from "styled-components";
import LongArrowSVG from "assets/images/long-arrow.svg";
import { useEntityLink } from "../Debugger/hooks";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";

const ConnectionType = styled.span`
  span:nth-child(2) {
    padding-left: 5px;
  }
  padding-bottom: 6px;
`;

const ConnectionWrapper = styled.span`
  margin: 2px 0px;
`;

const NoConnections = styled.div`
  width: 100%;
  background-color: #f0f0f0;
  padding: 11px 8px;

  .${Classes.TEXT} {
    color: #e0dede;
  }
`;

const ConnectionFlow = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;

  img {
    padding-top: 4px;
    padding-bottom: 7px;
  }
`;

const ConnectionsContainer = styled.span`
  width: 100%;
  background-color: #f0f0f0;
  display: flex;
  flex-wrap: wrap;
  padding: 9.5px 4px;
  .connection {
    border: 1px solid rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;

    :hover {
      border: 1px solid #6a86ce;
      color: #6a86ce;
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
  expand: boolean;
};

function Connections(props: ConnectionsProps) {
  const deps = useSelector((state: AppState) => state.evaluations.dependencies);
  const entityDependencies = getDependenciesFromInverseDependencies(
    deps.inverseDependencyMap,
    props.actionName,
  );

  return (
    <Collapsible expand={props.expand} label="Relationship">
      <span className="description">See all entities connected</span>
      <ConnectionType className="icon-text">
        <Icon keepColors name="trending-flat" size={IconSize.MEDIUM} />
        <span className="connection-type">Incoming Connections</span>
      </ConnectionType>
      {/* Direct Dependencies */}
      <Dependencies
        dependencies={entityDependencies?.directDependencies ?? []}
        placeholder="No incoming connections"
      />
      <ConnectionFlow>
        <img src={LongArrowSVG} />
        {props.actionName}
        <img src={LongArrowSVG} />
      </ConnectionFlow>
      <ConnectionType className="icon-text">
        <span className="connection-type">Outgoing Connections</span>
        <Icon keepColors name="trending-flat" size={IconSize.MEDIUM} />
      </ConnectionType>
      {/* Inverse dependencies */}
      <Dependencies
        dependencies={entityDependencies?.inverseDependencies ?? []}
        placeholder="No outgoing connections"
      />
    </Collapsible>
  );
}

export default Connections;

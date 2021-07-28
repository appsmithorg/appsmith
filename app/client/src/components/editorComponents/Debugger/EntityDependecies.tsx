/* eslint-disable prefer-const */
import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import InspectElement from "assets/images/InspectElement.svg";
import { ReactComponent as LongArrowSVG } from "assets/images/long-arrow-right.svg";
import {
  createMessage,
  INCOMING_ENTITIES,
  INSPECT_ENTITY_BLANK_STATE,
  NO_INCOMING_ENTITIES,
  NO_OUTGOING_ENTITIES,
  OUTGOING_ENTITIES,
} from "constants/messages";
import { getDependenciesFromInverseDependencies } from "./helpers";
import { useEntityLink, useSelectedEntity } from "./hooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getTypographyByKey } from "constants/DefaultTheme";
import { getDataTree } from "selectors/dataTreeSelectors";
import { isAction, isWidget } from "workers/evaluationUtils";
import Tooltip from "components/ads/Tooltip";
import Text, { TextType } from "components/ads/Text";

const ConnectionType = styled.span`
  span:nth-child(2) {
    padding-left: ${(props) => props.theme.spaces[2] - 1}px;
  }
  padding-bottom: ${(props) => props.theme.spaces[2]}px;
`;

const ConnectionWrapper = styled.div`
  margin: ${(props) => props.theme.spaces[1]}px
    ${(props) => props.theme.spaces[0] + 2}px;
`;

const ConnectionsContainer = styled.span`
  background-color: ${(props) =>
    props.theme.colors.actionSidePane.noConnections};
  display: flex;
  flex-wrap: wrap;
  padding: ${(props) => props.theme.spaces[2] + 1.5}px
    ${(props) => props.theme.spaces[2] + 1}px;
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

const NoConnections = styled.div`
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
  margin-top: 24px;

  svg {
    margin: 0px 4px;
  }

  span {
    margin: 0px 4px;
  }
`;

const Wrapper = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 0px 100px;
  .icon-text {
    display: flex;
    margin-left: ${(props) => props.theme.spaces[2] + 1}px;

    .connection-type {
      ${(props) => getTypographyByKey(props, "p1")}
    }
  }

  .icon-text:nth-child(2) {
    padding-top: ${(props) => props.theme.spaces[7]}px;
  }
`;

const BlankStateContainer = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  flex-direction: column;
  color: ${(props) => props.theme.colors.debugger.blankState.color};

  span {
    margin-top: ${(props) => props.theme.spaces[9] + 1}px;
  }
`;

const ConnectionContainer = styled.div`
  width: 100%;
`;

type ConnectionsProps = {
  entityName: string;
  entityDependencies: {
    inverseDependencies: string[];
    directDependencies: string[];
  } | null;
};

const useGetEntityType = () => {
  const dataTree = useSelector(getDataTree);

  const getEntityType = useCallback((name) => {
    if (isWidget(dataTree[name])) {
      return "widget";
    } else if (isAction(dataTree[name])) {
      return "integration";
    }
  }, []);

  return getEntityType;
};

function BlankState() {
  return (
    <BlankStateContainer>
      <img src={InspectElement} />
      <span>{createMessage(INSPECT_ENTITY_BLANK_STATE)}</span>
    </BlankStateContainer>
  );
}

function Dependencies(props: any) {
  const { navigateToEntity } = useEntityLink();
  const getEntityType = useGetEntityType();

  const onClick = (entityName: string) => {
    navigateToEntity(entityName);
    AnalyticsUtil.logEvent("ASSOCIATED_ENTITY_CLICK", {
      source: "DEBUGGER",
    });
  };

  return props.dependencies.length ? (
    <ConnectionsContainer>
      {props.dependencies.map((entityName: string) => {
        const entityType = getEntityType(entityName);

        return (
          <Tooltip
            content={`Open ${entityType}`}
            disabled={!entityType}
            hoverOpenDelay={1000}
            key={entityName}
          >
            <ConnectionWrapper className="t--dependencies-item">
              <span className="connection" onClick={() => onClick(entityName)}>
                {entityName}
              </span>
            </ConnectionWrapper>
          </Tooltip>
        );
      })}
    </ConnectionsContainer>
  ) : (
    <NoConnections>
      <Text type={TextType.P1}>{props.placeholder}</Text>
    </NoConnections>
  );
}

function EntityDeps(props: ConnectionsProps) {
  return (
    <Wrapper>
      <ConnectionContainer>
        <ConnectionType className="icon-text">
          <Icon keepColors name="trending-flat" size={IconSize.MEDIUM} />
          <span className="connection-type">
            {createMessage(INCOMING_ENTITIES)}
          </span>
        </ConnectionType>
        <Dependencies
          dependencies={props.entityDependencies?.directDependencies ?? []}
          placeholder={createMessage(NO_INCOMING_ENTITIES)}
        />
      </ConnectionContainer>
      <ConnectionFlow>
        <LongArrowSVG />
        <span>{props.entityName}</span>
        <LongArrowSVG />
      </ConnectionFlow>
      <ConnectionContainer>
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
      </ConnectionContainer>
    </Wrapper>
  );
}

function InspectEntity() {
  const deps = useSelector((state: AppState) => state.evaluations.dependencies);
  const selectedEntity = useSelectedEntity();
  const entityDependencies = useMemo(
    () =>
      getDependenciesFromInverseDependencies(
        deps.inverseDependencyMap,
        selectedEntity?.name ?? "",
      ),
    [selectedEntity?.name, deps.inverseDependencyMap],
  );

  if (!selectedEntity || !entityDependencies) return <BlankState />;

  return (
    <EntityDeps
      entityDependencies={entityDependencies}
      entityName={selectedEntity?.name ?? ""}
    />
  );
}

export default InspectEntity;

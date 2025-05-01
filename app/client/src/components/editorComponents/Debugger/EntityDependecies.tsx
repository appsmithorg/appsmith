/* eslint-disable prefer-const */
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import type { DefaultRootState } from "react-redux";
import styled from "styled-components";
import { Classes, getTypographyByKey, Text, TextType } from "@appsmith/ads-old";
import InspectElement from "assets/images/InspectElement.svg";
import {
  createMessage,
  INCOMING_ENTITIES,
  INSPECT_ENTITY_BLANK_STATE,
  NO_INCOMING_ENTITIES,
  NO_OUTGOING_ENTITIES,
  OUTGOING_ENTITIES,
} from "ee/constants/messages";
import { getDependenciesFromInverseDependencies } from "./helpers";
import { useSelectedEntity, useEntityLink } from "./hooks/debuggerHooks";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { thinScrollbar } from "constants/DefaultTheme";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { useGetEntityInfo } from "./hooks/useGetEntityInfo";
import { Button, Icon, Tooltip } from "@appsmith/ads";
import { importSvg } from "@appsmith/ads-old";

const LongArrowSVG = importSvg(
  async () => import("assets/images/long-arrow-right.svg"),
);

const ConnectionType = styled.span`
  span:nth-child(2) {
    padding-left: ${(props) => props.theme.spaces[2] - 1}px;
  }
  padding-bottom: ${(props) => props.theme.spaces[2]}px;
`;

const ConnectionWrapper = styled(Button)`
  margin: ${(props) => props.theme.spaces[1]}px
    ${(props) => props.theme.spaces[0] + 2}px;
  && {
    min-width: auto;
    .ads-v2-button__content-children {
      display: block;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  }
`;

const ConnectionsContainer = styled.span`
  background-color: var(--ads-v2-color-bg);
  display: flex;
  flex-wrap: wrap;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  padding: ${(props) => props.theme.spaces[2] + 1.5}px
    ${(props) => props.theme.spaces[2] + 1}px;
  }
`;

const NoConnections = styled.div`
  background-color: var(--ads-v2-color-bg);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  padding: ${(props) => props.theme.spaces[4] + 1}px
    ${(props) => props.theme.spaces[3]}px;

  .${Classes.TEXT} {
    color: var(--ads-v2-color-fg);
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
  ${thinScrollbar};
  align-items: center;
  justify-content: center;
  padding: 0px 100px;
  .icon-text {
    display: flex;
    margin-left: ${(props) => props.theme.spaces[2] + 1}px;

    .connection-type {
      ${getTypographyByKey("p1")}
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
  color: var(--ads-v2-color-fg);
  overflow-y: auto;
  padding: 8px 16px;
  span {
    margin-top: ${(props) => props.theme.spaces[9] + 1}px;
  }
`;

const ConnectionContainer = styled.div`
  width: 100%;
`;

interface ConnectionsProps {
  entityName: string;
  entityDependencies: {
    inverseDependencies: string[];
    directDependencies: string[];
  } | null;
}

interface ConnectionProps {
  entityName: string;
  onClick: (entityName: string, entityType: string) => void;
}

const getEntityDescription = (entityType?: ENTITY_TYPE) => {
  if (entityType === ENTITY_TYPE.WIDGET) {
    return "widget";
  } else if (entityType === ENTITY_TYPE.ACTION) {
    return "integration";
  } else {
    return "";
  }
};

function BlankState() {
  return (
    <BlankStateContainer>
      <img src={InspectElement} />
      <span>{createMessage(INSPECT_ENTITY_BLANK_STATE)}</span>
    </BlankStateContainer>
  );
}

export function Connection(props: ConnectionProps) {
  const getEntityInfo = useGetEntityInfo(props.entityName);
  const entityInfo = getEntityInfo();
  const entityDescription = getEntityDescription(entityInfo?.type);

  return (
    <Tooltip
      content={`Open ${entityDescription}`}
      isDisabled={!entityDescription}
      key={props.entityName}
    >
      <ConnectionWrapper
        className="t--dependencies-item connection"
        kind="secondary"
        onClick={() =>
          props.onClick(props.entityName, entityInfo?.entityType ?? "")
        }
        size="sm"
      >
        {props.entityName}
      </ConnectionWrapper>
    </Tooltip>
  );
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Dependencies(props: any) {
  const { navigateToEntity } = useEntityLink();

  const onClick = (entityName: string, entityType: string) => {
    navigateToEntity(entityName);
    AnalyticsUtil.logEvent("ASSOCIATED_ENTITY_CLICK", {
      source: "DEBUGGER",
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

function EntityDeps(props: ConnectionsProps) {
  return (
    <Wrapper>
      <ConnectionContainer>
        <ConnectionType className="icon-text">
          <Icon name="arrow-right-line" size="md" />
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
          <Icon name="arrow-right-line" size="md" />
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
  const deps = useSelector(
    (state: DefaultRootState) => state.evaluations.dependencies,
  );
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

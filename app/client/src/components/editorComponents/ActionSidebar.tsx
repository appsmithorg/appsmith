import React from "react";
import styled from "styled-components";
import { Collapse, Classes as BPClasses } from "@blueprintjs/core";
import Icon, { IconSize } from "components/ads/Icon";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import { useState } from "react";
import LongArrowSVG from "assets/images/long-arrow.svg";
import { getDependenciesFromInverseDependencies } from "./Debugger/helpers";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { useEntityLink } from "./Debugger/hooks";
import { getTypographyByKey } from "constants/DefaultTheme";

const SideBar = styled.div`
  padding: 16px 8px;

  .icon-text {
    display: flex;
    margin-left: 7px;

    .connection-type {
      ${(props) => getTypographyByKey(props, "p1")}
    }
  }

  .icon-text:nth-child(2) {
    padding-top: 16px;
  }

  .description {
    ${(props) => getTypographyByKey(props, "p1")}
    margin-left: 7px;
    padding-bottom: 16px;
  }
`;

const Label = styled.span`
  cursor: pointer;
`;

const NoConnections = styled.div`
  width: 100%;
  background-color: #f0f0f0;
  padding: 11px 8px;

  .${Classes.TEXT} {
    color: #e0dede;
  }
`;

const Connections = styled.span`
  width: 100%;
  background-color: #f0f0f0;
  display: flex;
  flex-wrap: wrap;
  padding: 9.5px 4px;
  .connection {
    border: 1px solid rgba(0, 0, 0, 0.5);
    padding: 2px;
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

const ConnectionFlow = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;

  img {
    padding-top: 4px;
    padding-bottom: 7px;
  }
`;

const CollapsibleWrapper = styled.div<{ isOpen: boolean }>`
  .${BPClasses.COLLAPSE_BODY} {
    padding-top: 8px;
  }

  & > .icon-text:first-child {
    color: #090707;
    ${(props) => getTypographyByKey(props, "h4")}
    cursor: pointer;
    .${Classes.ICON} {
      ${(props) => !props.isOpen && `transform: rotate(-90deg);`}
    }

    .label {
      padding-left: 5px;
    }
  }
`;

const ConnectionType = styled.span`
  span:nth-child(2) {
    padding-left: 5px;
  }
  padding-bottom: 6px;
`;

const ConnectionWrapper = styled.span`
  padding: 2px 2px;
`;

function Collapsible(props: any) {
  const [expand, setExpand] = useState(true);

  return (
    <CollapsibleWrapper isOpen={expand}>
      <Label className="icon-text" onClick={() => setExpand(!expand)}>
        <Icon name="downArrow" size={IconSize.XXS} />
        <span className="label">{props.label}</span>
      </Label>
      <Collapse isOpen={expand} keepChildrenMounted>
        {props.children}
      </Collapse>
    </CollapsibleWrapper>
  );
}

function Dependencies(props: any) {
  const { navigateToEntity } = useEntityLink();

  return props.dependencies.length ? (
    <Connections>
      {props.dependencies.map((e: any) => {
        return (
          <ConnectionWrapper key={e}>
            <span className="connection" onClick={() => navigateToEntity(e)}>
              {e}
            </span>
          </ConnectionWrapper>
        );
      })}
    </Connections>
  ) : (
    <NoConnections>
      <Text type={TextType.P1}>No incoming connections</Text>
    </NoConnections>
  );
}

function ActionSidebar(props: any) {
  const deps = useSelector((state: AppState) => state.evaluations.dependencies);
  const entityDependencies = getDependenciesFromInverseDependencies(
    deps.inverseDependencyMap,
    props.actionName,
  );

  console.log(entityDependencies, "entityDependencies");

  return (
    <SideBar>
      <Collapsible label="Relationship">
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
    </SideBar>
  );
}

export default ActionSidebar;

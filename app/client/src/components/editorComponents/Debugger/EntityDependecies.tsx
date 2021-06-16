/* eslint-disable prefer-const */
import { Collapse } from "@blueprintjs/core";
import React, { memo, ReactNode, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import InspectElement from "assets/images/InspectElement.svg";
import { SourceEntity } from "entities/AppsmithConsole";
import { createMessage, INSPECT_ENTITY_BLANK_STATE } from "constants/messages";
import { getDependenciesFromInverseDependencies } from "./helpers";
import { useEntityLink, useSelectedEntity } from "./hooks";

const CollapsibleWrapper = styled.div<{ step: number; isOpen: boolean }>`
  margin-left: ${(props) => props.step * 10}px;
  padding-top: ${(props) => props.theme.spaces[3]}px;

  .label-wrapper {
    display: flex;
    flex-direction: row;
    font-weight: ${(props) => props.theme.fontWeights[2]};

    span {
      margin-left: ${(props) => props.theme.spaces[3] - 1}px;
    }
  }

  .${Classes.ICON} {
    ${(props) => !props.isOpen && `transform: rotate(-90deg);`}
  }
`;

const DependenciesWrapper = styled.div`
  padding: ${(props) => props.theme.spaces[7]}px
    ${(props) => props.theme.spaces[13] + 1}px;
  color: ${(props) => props.theme.colors.debugger.inspectElement.color};

  .no-dependencies {
    margin-left: ${(props) => props.theme.spaces[4]}px;
  }
`;

const StyledSpan = styled.div<{ step: number }>`
  padding-top: ${(props) => props.theme.spaces[3]}px;
  padding-left: ${(props) => props.theme.spaces[6] + 1}px;
  margin-left: ${(props) => props.theme.spaces[4]}px;
  border-left: solid 1px rgba(147, 144, 144, 0.7);
  text-decoration-line: underline;
  cursor: pointer;
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

function EntityDeps() {
  const deps = useSelector((state: AppState) => state.evaluations.dependencies);
  const selectedEntity = useSelectedEntity();

  const entityDependencies: {
    directDependencies: string[];
    inverseDependencies: string[];
  } | null = useMemo(
    () =>
      getDependenciesFromInverseDependencies(
        deps.inverseDependencyMap,
        selectedEntity ? selectedEntity.name : null,
      ),
    [selectedEntity, deps.inverseDependencyMap],
  );

  if (!selectedEntity || !entityDependencies) return <BlankState />;

  return (
    <div>
      <MemoizedDependencyHierarchy
        dependencies={entityDependencies.directDependencies}
        entityName={`Dependencies of ${selectedEntity.name}`}
        selectedEntity={selectedEntity}
        type="dependencies"
      />
      <MemoizedDependencyHierarchy
        dependencies={entityDependencies.inverseDependencies}
        entityName={`References of ${selectedEntity.name}`}
        selectedEntity={selectedEntity}
        type="references"
      />
    </div>
  );
}

function BlankState() {
  return (
    <BlankStateContainer>
      <img src={InspectElement} />
      <span>{createMessage(INSPECT_ENTITY_BLANK_STATE)}</span>
    </BlankStateContainer>
  );
}

function DependencyHierarchy(props: {
  dependencies: string[];
  entityName: string;
  selectedEntity: SourceEntity;
  type: string;
}) {
  const { navigateToEntity } = useEntityLink();
  const label = props.dependencies.length
    ? props.entityName
    : `No ${props.type} exist for ${props.selectedEntity.name}`;

  return (
    <DependenciesWrapper>
      {props.dependencies.length ? (
        <Collapsible label={label} step={0}>
          {props.dependencies.map((item) => {
            return (
              <StyledSpan
                className={`t--${props.type}-item`}
                key={`${props.selectedEntity.id}-${item}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToEntity(item);
                }}
                step={2}
              >
                {item}
              </StyledSpan>
            );
          })}
        </Collapsible>
      ) : (
        <span className="no-dependencies">{label}</span>
      )}
    </DependenciesWrapper>
  );
}
const MemoizedDependencyHierarchy = memo(DependencyHierarchy);

function Collapsible(props: {
  label: string;
  step: number;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <CollapsibleWrapper
      isOpen={isOpen}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      step={props.step}
    >
      <div className="label-wrapper">
        <Icon name={"downArrow"} size={IconSize.XXS} />
        <span>{props.label}</span>
      </div>
      <Collapse isOpen={isOpen}>{props.children}</Collapse>
    </CollapsibleWrapper>
  );
}

export default EntityDeps;

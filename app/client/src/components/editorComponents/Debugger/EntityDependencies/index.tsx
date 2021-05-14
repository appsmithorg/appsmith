/* eslint-disable prefer-const */
import { Collapse } from "@blueprintjs/core";
import React, { memo, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import InspectElement from "assets/images/InspectElement.svg";
import useSelectedEntity from "./useSelectedEntity";
import { SourceEntity } from "entities/AppsmithConsole";
import { useEntityLink } from "./EntityLink";

const CollapsibleWrapper = styled.div<{ step: number; isOpen: boolean }>`
  margin-left: ${(props) => props.step * 10}px;
  padding-top: 8px;

  .label-wrapper {
    display: flex;
    flex-direction: row;

    span {
      margin-left: 7px;
    }
  }

  .${Classes.ICON} {
    ${(props) => !props.isOpen && `transform: rotate(-90deg);`}
  }
`;

const DependenciesWrapper = styled.div`
  padding: 16px 31px;

  .no-dependencies {
    margin-left: 10px;
  }
`;

const StyledSpan = styled.div<{ step: number }>`
  padding-top: 8px;
  padding-left: 15px;
  margin-left: 10px;
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

  span {
    margin-top: 21px;
  }
`;

function EntityDeps() {
  const deps = useSelector((state: AppState) => state.evaluations.dependencies);
  const selectedEntity = useSelectedEntity();
  console.log(selectedEntity, "selectedEntity");

  const entityDependencies: {
    directDependencies: string[];
    inverseDependencies: string[];
  } | null = useMemo(
    () =>
      getDependencies(
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
      <span>Select an element to inspect</span>
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

function Collapsible(props: any) {
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

function getDependencies(deps: any, entityName: string | null) {
  if (!entityName) return null;

  let directDependencies = new Set<string>();
  let inverseDependencies = new Set<string>();

  Object.entries(deps).forEach(([dependant, dependencies]) => {
    (dependencies as any).map((dependency: any) => {
      if (!dependant.includes(entityName) && dependency.includes(entityName)) {
        const entity = dependant
          .split(".")
          .slice(0, 1)
          .join("");

        directDependencies.add(entity);
      } else if (
        dependant.includes(entityName) &&
        !dependency.includes(entityName)
      ) {
        const entity = dependency
          .split(".")
          .slice(0, 1)
          .join("");

        inverseDependencies.add(entity);
      }
    });
  });

  return {
    inverseDependencies: Array.from(inverseDependencies),
    directDependencies: Array.from(directDependencies),
  };
}

export default EntityDeps;

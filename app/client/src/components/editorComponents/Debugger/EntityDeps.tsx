/* eslint-disable prefer-const */
import { Collapse } from "@blueprintjs/core";
import React, { memo, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { getWidget } from "sagas/selectors";
import { WidgetProps } from "widgets/BaseWidget";
import { Classes } from "components/ads/common";
import { getCurrentWidgetId } from "selectors/propertyPaneSelectors";
import InspectElement from "assets/images/InspectElement.svg";

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
`;

const StyledSpan = styled.div<{ step: number }>`
  padding-top: 8px;
  margin-left: calc(${(props) => props.step * 12}px + 7px);
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
  const selectedWidget = useSelector(getCurrentWidgetId);
  const widget: WidgetProps | null = useSelector((state: AppState) => {
    return selectedWidget ? getWidget(state, selectedWidget) : null;
  });
  const entityDependencies: {
    directDependencies: string[];
    inverseDependencies: string[];
  } | null = useMemo(
    () =>
      getDependencies(
        deps.inverseDependencyMap,
        widget ? widget.widgetName : null,
      ),
    [selectedWidget, deps.inverseDependencyMap],
  );

  if (!widget || !entityDependencies) return <BlankState />;

  return (
    <div>
      <MemoizedDependencyHierarchy
        dependencies={entityDependencies.directDependencies}
        entityName={`Dependencies of ${widget.widgetName}`}
      />
      <MemoizedDependencyHierarchy
        dependencies={entityDependencies.inverseDependencies}
        entityName={`References of ${widget.widgetName}`}
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
}) {
  return (
    <DependenciesWrapper>
      <Collapsible label={props.entityName} step={0}>
        {props.dependencies.map((item) => {
          return (
            <StyledSpan key={item} step={2}>
              {item}
            </StyledSpan>
          );
        })}
      </Collapsible>
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

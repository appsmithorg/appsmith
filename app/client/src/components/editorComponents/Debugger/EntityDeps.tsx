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

function EntityDeps() {
  const deps = useSelector((state: AppState) => state.evaluations.dependencies);
  const selectedWidget = useSelector(getCurrentWidgetId);
  const widget: WidgetProps | null = useSelector((state: AppState) => {
    return selectedWidget ? getWidget(state, selectedWidget) : null;
  });
  const entityDependencies: {
    directDependencies: Record<string, string[]>;
    inverseDependencies: Record<string, string[]>;
  } | null = useMemo(
    () =>
      getDependencies(
        deps.inverseDependencyMap,
        widget ? widget.widgetName : null,
      ),
    [selectedWidget, deps.inverseDependencyMap],
  );

  if (!widget || !entityDependencies) return null;

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

function DependencyHierarchy(props: {
  dependencies: Record<string, string[]>;
  entityName: string;
}) {
  return (
    <DependenciesWrapper>
      <Collapsible label={props.entityName} step={0}>
        {Object.entries(props.dependencies as any).map((item) => {
          const [key, values] = item;
          return (
            <Collapsible key={key} label={key} step={1}>
              {(values as any).map((e: any) => {
                return (
                  <StyledSpan key={e} step={2}>
                    {e}
                  </StyledSpan>
                );
              })}
            </Collapsible>
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

  let directDependencies: Record<string, string[]> = {};
  let inverseDependencies: Record<string, string[]> = {};

  Object.entries(deps).forEach(([dependant, dependencies]) => {
    let dependantSplits = dependant.split(".");
    dependantSplits.shift();
    const widgetProperty = dependantSplits.join(".");

    (dependencies as any).map((dependency: any) => {
      console.log("calasdasdasdasac");
      if (!dependant.includes(entityName) && dependency.includes(entityName)) {
        const splits = dependency.split(".");
        splits.shift();
        const key = splits.join(".");

        const directDependencyValues = directDependencies[key] || [];
        directDependencyValues.push(dependant);
        directDependencies[key] = directDependencyValues;
      } else if (
        dependant.includes(entityName) &&
        !dependency.includes(entityName)
      ) {
        const inverseDependencyValues =
          inverseDependencies[widgetProperty] || [];
        inverseDependencyValues.push(dependency);
        inverseDependencies[widgetProperty] = inverseDependencyValues;
      }
    });
  });

  return {
    inverseDependencies,
    directDependencies,
  };
}

export default EntityDeps;

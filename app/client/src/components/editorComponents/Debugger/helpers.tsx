import { Log, Severity } from "entities/AppsmithConsole";
import React from "react";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import {
  createMessage,
  OPEN_THE_DEBUGGER,
  PRESS,
} from "@appsmith/constants/messages";
import { DependencyMap } from "utils/DynamicBindingUtils";
import {
  matchBuilderPath,
  matchApiPath,
  matchQueryPath,
} from "constants/routes";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";
import { isMac } from "utils/helpers";

const BlankStateWrapper = styled.div`
  overflow: auto;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${(props) => props.theme.colors.debugger.blankState.color};
  ${(props) => getTypographyByKey(props, "p1")}

  .debugger-shortcut {
    color: ${(props) => props.theme.colors.debugger.blankState.shortcut};
    ${(props) => getTypographyByKey(props, "h5")}
  }
`;

export function BlankState(props: {
  placeholderText?: string;
  hasShortCut?: boolean;
}) {
  const shortcut = isMac() ? "Cmd + D" : "Ctrl + D";

  return (
    <BlankStateWrapper>
      {props.hasShortCut ? (
        <span>
          {createMessage(PRESS)}
          <span className="debugger-shortcut">{shortcut}</span>
          {createMessage(OPEN_THE_DEBUGGER)}
        </span>
      ) : (
        <span>{props.placeholderText}</span>
      )}
    </BlankStateWrapper>
  );
}

export enum DEBUGGER_TAB_KEYS {
  ERROR_TAB = "ERROR",
  LOGS_TAB = "LOGS_TAB",
  INSPECT_TAB = "INSPECT_TAB",
}

export const SeverityIcon: Record<Severity, string> = {
  [Severity.INFO]: "success",
  [Severity.ERROR]: "error",
  [Severity.WARNING]: "warning",
};

export function getDependenciesFromInverseDependencies(
  deps: DependencyMap,
  entityName: string | null,
) {
  if (!entityName) return null;

  const directDependencies = new Set<string>();
  const inverseDependencies = new Set<string>();

  Object.entries(deps).forEach(([dependant, dependencies]) => {
    const { entityName: entity } = getEntityNameAndPropertyPath(dependant);
    (dependencies as any).map((dependency: any) => {
      const { entityName: entityDependency } = getEntityNameAndPropertyPath(
        dependency,
      );
      if (entity !== entityName && entityDependency === entityName) {
        directDependencies.add(entity);
      } else if (entity === entityName && entityDependency !== entityName) {
        inverseDependencies.add(entityDependency);
      }
    });
  });

  return {
    inverseDependencies: Array.from(inverseDependencies),
    directDependencies: Array.from(directDependencies),
  };
}

// Recursively find out dependency chain from
// the inverse dependency map
export function getDependencyChain(
  propertyPath: string,
  inverseMap: DependencyMap,
) {
  let currentChain: string[] = [];
  const dependents = inverseMap[propertyPath];

  if (!dependents) return currentChain;

  const dependentInfo = getEntityNameAndPropertyPath(propertyPath);

  dependents.map((e) => {
    if (!e.includes(dependentInfo.entityName)) {
      currentChain.push(e);
    }

    if (e !== dependentInfo.entityName) {
      currentChain = currentChain.concat(getDependencyChain(e, inverseMap));
    }
  });
  return currentChain;
}

export const doesEntityHaveErrors = (
  entityId: string,
  debuggerErrors: Record<string, Log>,
) => {
  const ids = Object.keys(debuggerErrors);

  return ids.some((e: string) => e.includes(entityId));
};

export const onApiEditor = () => {
  return matchApiPath(window.location.pathname);
};

export const onQueryEditor = () => {
  return matchQueryPath(window.location.pathname);
};

export const onCanvas = () => {
  return matchBuilderPath(window.location.pathname);
};

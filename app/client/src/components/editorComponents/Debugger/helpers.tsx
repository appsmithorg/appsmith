import { Severity } from "entities/AppsmithConsole";
import React from "react";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import {
  createMessage,
  NO_LOGS,
  OPEN_THE_DEBUGGER,
  PRESS,
} from "constants/messages";
import { DependencyMap } from "utils/DynamicBindingUtils";
import {
  API_EDITOR_URL,
  QUERIES_EDITOR_URL,
  BUILDER_PAGE_URL,
} from "constants/routes";
import { getEntityNameAndPropertyPath } from "workers/evaluationUtils";

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

export function BlankState(props: { hasShortCut?: boolean }) {
  return (
    <BlankStateWrapper>
      {props.hasShortCut ? (
        <span>
          {createMessage(PRESS)}
          <span className="debugger-shortcut">Cmd + D</span>
          {createMessage(OPEN_THE_DEBUGGER)}
        </span>
      ) : (
        <span>{createMessage(NO_LOGS)}</span>
      )}
    </BlankStateWrapper>
  );
}

export const SeverityIcon: Record<Severity, string> = {
  [Severity.INFO]: "success",
  [Severity.ERROR]: "error",
  [Severity.WARNING]: "warning",
};

export const SeverityIconColor: Record<Severity, string> = {
  [Severity.INFO]: "#03B365",
  [Severity.ERROR]: "#F22B2B",
  [Severity.WARNING]: "rgb(224, 179, 14)",
};

export function getDependenciesFromInverseDependencies(
  deps: DependencyMap,
  entityName: string | null,
) {
  if (!entityName) return null;

  const directDependencies = new Set<string>();
  const inverseDependencies = new Set<string>();

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

  dependents.map((e: any) => {
    if (!e.includes(dependentInfo.entityName)) {
      currentChain.push(e);
      currentChain = currentChain.concat(getDependencyChain(e, inverseMap));
    }
  });
  return currentChain;
}

export const onApiEditor = (
  applicationId: string | undefined,
  currentPageId: string | undefined,
) => {
  return (
    window.location.pathname.indexOf(
      API_EDITOR_URL(applicationId, currentPageId),
    ) > -1
  );
};

export const onQueryEditor = (
  applicationId: string | undefined,
  currentPageId: string | undefined,
) => {
  return (
    window.location.pathname.indexOf(
      QUERIES_EDITOR_URL(applicationId, currentPageId),
    ) > -1
  );
};

export const onCanvas = (
  applicationId: string | undefined,
  currentPageId: string | undefined,
) => {
  return (
    window.location.pathname.indexOf(
      BUILDER_PAGE_URL(applicationId, currentPageId),
    ) > -1
  );
};

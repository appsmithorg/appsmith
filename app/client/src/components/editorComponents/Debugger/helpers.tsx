import type { Log } from "entities/AppsmithConsole";
import { LOG_CATEGORY, Severity } from "entities/AppsmithConsole";
import React from "react";
import styled from "styled-components";
import { getTypographyByKey } from "@appsmith/ads-old";
import { createMessage, OPEN_THE_DEBUGGER, PRESS } from "ee/constants/messages";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import { isChildPropertyPath } from "utils/DynamicBindingUtils";
import {
  matchBuilderPath,
  matchApiPath,
  matchQueryPath,
} from "constants/routes";
import { getEntityNameAndPropertyPath } from "ee/workers/Evaluation/evaluationUtils";
import { modText } from "utils/helpers";
import { union } from "lodash";

const BlankStateWrapper = styled.div`
  overflow: auto;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--ads-v2-color-fg);
  ${getTypographyByKey("p1")}

  .debugger-shortcut {
    color: var(--ads-v2-color-fg);
    ${getTypographyByKey("h5")}
  }
`;

export function BlankState(props: {
  placeholderText?: string;
  hasShortCut?: boolean;
}) {
  const shortcut = <>{modText()} D</>;

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
  SCHEMA_TAB = "schema",
  RESPONSE_TAB = "response",
  HEADER_TAB = "headers",
  ERROR_TAB = "ERROR",
  LOGS_TAB = "LOGS_TAB",
  INSPECT_TAB = "INSPECT_TAB",
}

export const SeverityIcon: Record<Severity, string> = {
  [Severity.INFO]: "success",
  [Severity.ERROR]: "close-circle",
  [Severity.WARNING]: "warning",
};

const truncate = (input: string, suffix = "", truncLen = 100) => {
  try {
    if (!!input) {
      return input.length > truncLen
        ? `${input.substring(0, truncLen)}...${suffix}`
        : input;
    } else {
      return "";
    }
  } catch (error) {
    return `Invalid log: ${JSON.stringify(error)}`;
  }
};

// Converts the data from the log object to a string
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLogTitleString(data: any[]) {
  try {
    // convert mixed array to string
    return data.reduce((acc, curr) => {
      // curr can be a string or an object
      if (typeof curr === "boolean") {
        return `${acc} ${curr}`;
      }
      if (curr === null || curr === undefined) {
        return `${acc} undefined`;
      }
      if (curr instanceof Promise) {
        return `${acc} Promise ${curr.constructor.name}`;
      }
      if (typeof curr === "string") {
        return `${acc} ${truncate(curr)}`;
      }
      if (typeof curr === "number") {
        return `${acc} ${truncate(curr.toString())}`;
      }
      if (typeof curr === "function") {
        return `${acc} func() ${curr.name}`;
      }
      if (typeof curr === "object") {
        let suffix = "}";
        if (Array.isArray(curr)) {
          suffix = "]";
        }
        return `${acc} ${truncate(JSON.stringify(curr, null, "\t"), suffix)}`;
      }
      acc = `${acc} -`;
    }, "");
  } catch (error) {
    return `Error in parsing log: ${JSON.stringify(error)}`;
  }
}

export const getLogIcon = (log: Log) => {
  if (log.severity === Severity.ERROR) {
    return SeverityIcon[log.severity];
  }

  if (log.category === LOG_CATEGORY.PLATFORM_GENERATED) {
    return "desktop";
  }

  if (log.category === LOG_CATEGORY.USER_GENERATED) {
    return "user-2";
  }

  return SeverityIcon[log.severity];
};

export function getDependenciesFromInverseDependencies(
  deps: DependencyMap,
  entityName: string | null,
) {
  if (!entityName || !deps) return null;

  const directDependencies = new Set<string>();
  const inverseDependencies = new Set<string>();

  Object.entries(deps).forEach(([dependant, dependencies]) => {
    const { entityName: entity } = getEntityNameAndPropertyPath(dependant);
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dependencies as any).map((dependency: any) => {
      const { entityName: entityDependency } =
        getEntityNameAndPropertyPath(dependency);

      /**
       * Remove appsmith from the entity dropdown, under the property pane.
       * We need to add a separate entity page like we have for queries and api calls
       * to list all the values under the appsmith entity.
       */
      if (entity !== "appsmith") {
        if (entity !== entityName && entityDependency === entityName) {
          directDependencies.add(entity);
        } else if (entity === entityName && entityDependency !== entityName) {
          inverseDependencies.add(entityDependency);
        }
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
  const visited = new Set<string>();

  return getDependencyChainHelper(propertyPath);

  function getDependencyChainHelper(propertyPath: string): string[] {
    let currentChain: string[] = [];
    const dependents = inverseMap[propertyPath];

    if (!dependents || !dependents.length) return currentChain;

    if (visited.has(propertyPath)) return currentChain;

    const { entityName } = getEntityNameAndPropertyPath(propertyPath);

    visited.add(propertyPath);

    for (const dependentPath of dependents) {
      if (!isChildPropertyPath(entityName, dependentPath)) {
        currentChain.push(dependentPath);
      }
      if (dependentPath !== entityName) {
        currentChain = union(
          currentChain,
          getDependencyChain(dependentPath, inverseMap),
        );
      }
    }
    return currentChain;
  }
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

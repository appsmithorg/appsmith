import React, { useMemo } from "react";
import styled from "styled-components";
import { getTypographyByKey } from "@appsmith/ads-old";
import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { getDependenciesFromInverseDependencies } from "../Debugger/helpers";
import {
  CollapsibleGroup,
  CollapsibleGroupContainer,
} from "components/common/Collapsible";

const SideBar = styled.div`
  height: 100%;
  width: 100%;

  & > a {
    margin-top: 0;
    margin-left: 0;
  }

  .icon-text {
    display: flex;

    .connection-type {
      ${getTypographyByKey("p1")}
    }
  }

  .icon-text:nth-child(2) {
    padding-top: ${(props) => props.theme.spaces[7]}px;
  }

  .description {
    ${getTypographyByKey("p1")}
    margin-left: ${(props) => props.theme.spaces[2] + 1}px;
    padding-bottom: ${(props) => props.theme.spaces[7]}px;
  }

  @-webkit-keyframes slide-left {
    0% {
      -webkit-transform: translateX(100%);
      transform: translateX(100%);
    }
    100% {
      -webkit-transform: translateX(0);
      transform: translateX(0);
    }
  }
  @keyframes slide-left {
    0% {
      -webkit-transform: translateX(100%);
      transform: translateX(100%);
    }
    100% {
      -webkit-transform: translateX(0);
      transform: translateX(0);
    }
  }
`;

const Wrapper = styled.div`
  border-left: 1px solid var(--ads-v2-color-border);
  padding: 0 var(--ads-v2-spaces-7) var(--ads-v2-spaces-4);
  overflow: hidden;
  border-bottom: 0;
  display: flex;
  width: ${(props) => props.theme.actionSidePane.width}px;
  margin-top: 10px;
  /* margin-left: var(--ads-v2-spaces-7); */
`;

export function useEntityDependencies(actionName: string) {
  const deps = useSelector((state: AppState) => state.evaluations.dependencies);
  const entityDependencies = useMemo(
    () =>
      getDependenciesFromInverseDependencies(
        deps.inverseDependencyMap,
        actionName,
      ),
    [actionName, deps.inverseDependencyMap],
  );
  const hasDependencies =
    entityDependencies &&
    (entityDependencies?.directDependencies.length > 0 ||
      entityDependencies?.inverseDependencies.length > 0);

  return {
    hasDependencies,
    entityDependencies,
  };
}

function ActionSidebar({
  additionalSections,
}: {
  additionalSections?: React.ReactNode;
}) {
  if (!additionalSections) {
    return null;
  }

  return (
    <Wrapper>
      <SideBar>
        <CollapsibleGroupContainer>
          {additionalSections && (
            <CollapsibleGroup height={"100%"}>
              {additionalSections}
            </CollapsibleGroup>
          )}
        </CollapsibleGroupContainer>
      </SideBar>
    </Wrapper>
  );
}

export default ActionSidebar;

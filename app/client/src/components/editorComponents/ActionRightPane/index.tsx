import React, { useCallback, useMemo } from "react";
import styled from "styled-components";
import { Collapse, Classes as BPClasses } from "@blueprintjs/core";
import {
  Button,
  Category,
  Classes,
  getTypographyByKey,
  Icon,
  IconSize,
  Size,
  Text,
  TextType,
  Variant,
} from "design-system";
import { useState } from "react";
import history from "utils/history";
import Connections from "./Connections";
import SuggestedWidgets from "./SuggestedWidgets";
import { ReactNode } from "react";
import { useEffect } from "react";
import { bindDataOnCanvas } from "actions/pluginActionActions";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { AppState } from "@appsmith/reducers";
import { getDependenciesFromInverseDependencies } from "../Debugger/helpers";
import {
  BACK_TO_CANVAS,
  createMessage,
  NO_CONNECTIONS,
} from "@appsmith/constants/messages";
import {
  SuggestedWidget,
  SuggestedWidget as SuggestedWidgetsType,
} from "api/ActionAPI";
import { Colors } from "constants/Colors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { builderURL } from "RouteBuilder";
import { hasManagePagePermission } from "@appsmith/utils/permissionHelpers";

const SideBar = styled.div`
  padding: ${(props) => props.theme.spaces[0]}px
    ${(props) => props.theme.spaces[3]}px ${(props) => props.theme.spaces[4]}px;
  overflow: auto;
  height: 100%;
  width: 100%;
  -webkit-animation: slide-left 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  animation: slide-left 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;

  & > div {
    margin-top: ${(props) => props.theme.spaces[11]}px;
  }

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

const Label = styled.span`
  cursor: pointer;
`;

const CollapsibleWrapper = styled.div<{ isOpen: boolean }>`
  .${BPClasses.COLLAPSE_BODY} {
    padding-top: ${(props) => props.theme.spaces[3]}px;
  }

  & > .icon-text:first-child {
    color: ${(props) => props.theme.colors.actionSidePane.collapsibleIcon};
    ${getTypographyByKey("h4")}
    cursor: pointer;
    .${Classes.ICON} {
      ${(props) => !props.isOpen && `transform: rotate(-90deg);`}
    }

    .label {
      padding-left: ${(props) => props.theme.spaces[1] + 1}px;
    }
  }
`;

const SnipingWrapper = styled.div`
  ${getTypographyByKey("p1")}
  margin-left: ${(props) => props.theme.spaces[2] + 1}px;

  img {
    max-width: 100%;
  }

  .image-wrapper {
    position: relative;
    margin-top: ${(props) => props.theme.spaces[1]}px;
  }

  .widget:hover {
    cursor: pointer;
  }
`;
const Placeholder = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  height: 100%;
  padding: ${(props) => props.theme.spaces[8]}px;
  text-align: center;
`;

const BackButton = styled.div`
  display: flex;
  cursor: pointer;
  margin-left: ${(props) => props.theme.spaces[1] + 1}px;
  .${Classes.TEXT} {
    margin-left: ${(props) => props.theme.spaces[3]}px;
    letter-spacing: 0;
  }
`;

type CollapsibleProps = {
  expand?: boolean;
  children: ReactNode;
  label: string;
};

export function Collapsible({
  children,
  expand = true,
  label,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(!!expand);

  useEffect(() => {
    setIsOpen(expand);
  }, [expand]);

  return (
    <CollapsibleWrapper isOpen={isOpen}>
      <Label className="icon-text" onClick={() => setIsOpen(!isOpen)}>
        <Icon keepColors name="down-arrow" size={IconSize.XXXL} />
        <span className="label">{label}</span>
      </Label>
      <Collapse isOpen={isOpen} keepChildrenMounted>
        {children}
      </Collapse>
    </CollapsibleWrapper>
  );
}

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
  actionName,
  entityDependencies,
  hasConnections,
  hasResponse,
  suggestedWidgets,
}: {
  actionName: string;
  hasResponse: boolean;
  hasConnections: boolean | null;
  suggestedWidgets?: SuggestedWidgetsType[];
  entityDependencies: {
    directDependencies: string[];
    inverseDependencies: string[];
  } | null;
}) {
  const dispatch = useDispatch();
  const widgets = useSelector(getWidgets);
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const params = useParams<{
    pageId: string;
    apiId?: string;
    queryId?: string;
  }>();
  const handleBindData = () => {
    AnalyticsUtil.logEvent("SELECT_IN_CANVAS_CLICK", {
      actionName: actionName,
      apiId: params.apiId || params.queryId,
      appId: applicationId,
    });
    dispatch(
      bindDataOnCanvas({
        queryId: (params.apiId || params.queryId) as string,
        applicationId: applicationId as string,
        pageId: params.pageId,
      }),
    );
  };
  const navigateToCanvas = useCallback(() => {
    history.push(builderURL({ pageId }));
  }, [pageId]);
  const hasWidgets = Object.keys(widgets).length > 1;

  const pagePermissions = useSelector(getPagePermissions);

  const canEditPage = hasManagePagePermission(pagePermissions);

  const showSuggestedWidgets =
    canEditPage && hasResponse && suggestedWidgets && !!suggestedWidgets.length;
  const showSnipingMode = hasResponse && hasWidgets;

  if (!hasConnections && !showSuggestedWidgets && !showSnipingMode) {
    return <Placeholder>{createMessage(NO_CONNECTIONS)}</Placeholder>;
  }

  return (
    <SideBar>
      <BackButton onClick={navigateToCanvas}>
        <Icon
          fillColor={Colors.DOVE_GRAY}
          keepColors
          name="chevron-left"
          size={IconSize.XS}
        />
        <Text type={TextType.H6}>{createMessage(BACK_TO_CANVAS)}</Text>
      </BackButton>

      {hasConnections && (
        <Connections
          actionName={actionName}
          entityDependencies={entityDependencies}
        />
      )}
      {canEditPage && hasResponse && Object.keys(widgets).length > 1 && (
        <Collapsible label="Connect Widget">
          {/*<div className="description">Go to canvas and select widgets</div>*/}
          <SnipingWrapper>
            <Button
              category={Category.secondary}
              className={"t--select-in-canvas"}
              onClick={handleBindData}
              size={Size.medium}
              tag="button"
              text="Select Widget"
              type="button"
              variant={Variant.info}
            />
          </SnipingWrapper>
        </Collapsible>
      )}
      {showSuggestedWidgets && (
        <SuggestedWidgets
          actionName={actionName}
          hasWidgets={hasWidgets}
          suggestedWidgets={suggestedWidgets as SuggestedWidget[]}
        />
      )}
    </SideBar>
  );
}

export default ActionSidebar;

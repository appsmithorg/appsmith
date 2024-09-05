import React, { memo, useMemo, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import type { AppState } from "ee/reducers";
import { useDispatch, useSelector } from "react-redux";
import { getDataTree } from "selectors/dataTreeSelectors";
import { isAction, isWidget } from "ee/workers/Evaluation/evaluationUtils";
import { useEntityLink } from "components/editorComponents/Debugger/hooks/debuggerHooks";
import { useGetEntityInfo } from "components/editorComponents/Debugger/hooks/useGetEntityInfo";
import {
  doesEntityHaveErrors,
  getDependenciesFromInverseDependencies,
} from "components/editorComponents/Debugger/helpers";
import { getFilteredErrors } from "selectors/debuggerSelectors";
import type { Log } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { DebugButton } from "components/editorComponents/Debugger/DebugCTA";
import { showDebugger } from "actions/debuggerActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { InteractionAnalyticsEventDetail } from "utils/AppsmithUtils";
import {
  interactionAnalyticsEvent,
  INTERACTION_ANALYTICS_EVENT,
} from "utils/AppsmithUtils";
import equal from "fast-deep-equal";
import { mapValues, pick } from "lodash";
import { createSelector } from "reselect";
import type { TooltipPlacement } from "@appsmith/ads";
import {
  Button,
  Menu,
  MenuContent,
  MenuTrigger,
  MenuItem,
  MenuSeparator,
  Text,
  Tooltip,
} from "@appsmith/ads";

interface DropdownOption {
  label?: string;
  value?: string;
  id?: string;
}

const TopLayer = styled.div`
  display: flex;
  flex: 1;
  justify-content: space-between;
  padding: 0 1rem;
`;

const OptionWrapper = styled.div<{ hasError: boolean; fillIconColor: boolean }>`
  display: flex;
  flex-direction: column;
  /* align-items: center; */
  width: 100%;
  overflow: hidden;
`;

const OptionContentWrapper = styled.div<{
  hasError: boolean;
  isSelected: boolean;
}>`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 10px;
`;

interface PropertyPaneConnectionsProps {
  widgetName: string;
  widgetType: string;
}

interface TriggerNodeProps {
  entityCount: number;
  iconAlignment: "LEFT" | "RIGHT";
  connectionType: "INCOMING" | "OUTGOING";
  hasError: boolean;
  justifyContent: string;
  tooltipPosition?: TooltipPlacement;
  disabled?: boolean;
}

const doConnectionsHaveErrors = (
  options: DropdownOption[],
  debuggerErrors: Record<string, Log>,
) => {
  return options.some((option) =>
    doesEntityHaveErrors(option.value as string, debuggerErrors),
  );
};

const getDataTreeWithOnlyIds = createSelector(getDataTree, (tree) =>
  mapValues(tree, (x) => pick(x, ["ENTITY_TYPE", "widgetId", "actionId"])),
);

const useDependencyList = (name: string) => {
  const dataTree = useSelector(getDataTreeWithOnlyIds, equal);
  const inverseDependencyMap = useSelector(
    (state: AppState) => state.evaluations.dependencies.inverseDependencyMap,
    equal,
  );

  const getEntityId = useCallback(
    (name) => {
      const entity = dataTree[name];

      if (isWidget(entity)) {
        return entity.widgetId;
      } else if (isAction(entity)) {
        return entity.actionId;
      }
    },
    [dataTree],
  );

  const entityDependencies = useMemo(() => {
    return getDependenciesFromInverseDependencies(inverseDependencyMap, name);
  }, [name, inverseDependencyMap]);

  const dependencyOptions = useMemo(
    () =>
      entityDependencies?.directDependencies.map((e) => ({
        label: e,
        value: getEntityId(e) ?? e,
      })) ?? [],
    [entityDependencies?.directDependencies, getEntityId],
  );
  const inverseDependencyOptions = useMemo(
    () =>
      entityDependencies?.inverseDependencies.map((e) => ({
        label: e,
        value: getEntityId(e),
      })) ?? [],
    [entityDependencies?.inverseDependencies, getEntityId],
  );

  return {
    dependencyOptions,
    inverseDependencyOptions,
  };
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OptionNode(props: any) {
  const getEntityInfo = useGetEntityInfo(props.option.label);
  const entityInfo = getEntityInfo();
  const dispatch = useDispatch();
  const { navigateToEntity } = useEntityLink();

  const onClick = () => {
    if (entityInfo?.hasError) {
      if (entityInfo?.type === ENTITY_TYPE.WIDGET) {
        dispatch(showDebugger(true));
      }
    }
    navigateToEntity(props.option.label);
    AnalyticsUtil.logEvent("ASSOCIATED_ENTITY_CLICK", {
      source: "PROPERTY_PANE",
      entityType: entityInfo?.entityType,
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!props.isSelectedNode && !props.isHighlighted) return;
    if (
      (props.isSelectedNode || props.isHighlighted) &&
      (e.key === " " || e.key === "Enter")
    )
      onClick();
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [props.isSelectedNode, props.isHighlighted]);

  return (
    <MenuItem>
      <OptionWrapper
        className={`t--dropdown-option`}
        fillIconColor={!entityInfo?.datasourceName}
        hasError={!!entityInfo?.hasError}
      >
        <OptionContentWrapper
          className={`${props.isHighlighted ? "highlighted" : ""}`}
          hasError={!!entityInfo?.hasError}
          isSelected={props.isSelectedNode}
          onClick={onClick}
        >
          {entityInfo?.icon}

          <Text>
            {props.option.label}
            {entityInfo?.datasourceName &&
              ` from ${entityInfo?.datasourceName}`}
          </Text>
        </OptionContentWrapper>
        {!!entityInfo?.hasError && (
          <DebugButton className="debug ml-6" onClick={onClick} />
        )}
      </OptionWrapper>
    </MenuItem>
  );
}

const TriggerNode = (props: TriggerNodeProps) => {
  const ENTITY = props.entityCount > 1 ? "entities" : "entity";
  const tooltipText = !!props.entityCount
    ? `See ${props.connectionType.toLowerCase()} connections`
    : `No ${props.connectionType.toLowerCase()} connections`;

  const onClick = () => {
    AnalyticsUtil.logEvent("ASSOCIATED_ENTITY_DROPDOWN_CLICK");
  };

  return (
    <Tooltip
      content={tooltipText}
      isDisabled={props.disabled}
      placement={props.tooltipPosition}
    >
      <Button
        className={props.hasError ? "t--connection-error" : "t--connection"}
        endIcon={props.iconAlignment === "RIGHT" ? "right-arrow" : ""}
        isDisabled={props.disabled}
        kind={props.hasError ? "error" : "tertiary"}
        onClick={onClick}
        size="sm"
        startIcon={props.iconAlignment === "LEFT" ? "right-arrow" : ""}
      >
        {props.entityCount ? `${props.entityCount} ${ENTITY}` : "No entity"}
      </Button>
    </Tooltip>
  );
};

TriggerNode.displayName = "TriggerNode";

function PropertyPaneConnections(props: PropertyPaneConnectionsProps) {
  const dependencies = useDependencyList(props.widgetName);
  // const { navigateToEntity } = useEntityLink();
  const debuggerErrors = useSelector(getFilteredErrors);
  const topLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topLayerRef.current?.addEventListener(
      INTERACTION_ANALYTICS_EVENT,
      handleKbdEvent,
    );
    return () => {
      topLayerRef.current?.removeEventListener(
        INTERACTION_ANALYTICS_EVENT,
        handleKbdEvent,
      );
    };
  }, []);

  const handleKbdEvent = (e: Event) => {
    const event = e as CustomEvent<InteractionAnalyticsEventDetail>;
    if (!event.detail?.propertyName) {
      e.stopPropagation();
      topLayerRef.current?.dispatchEvent(
        interactionAnalyticsEvent({
          key: event.detail.key,
          propertyType: "PROPERTY_PANE_CONNECTION",
          propertyName: "propertyPaneConnections",
          widgetType: props.widgetType,
        }),
      );
    }
  };

  const errorIncomingConnections = useMemo(() => {
    return doConnectionsHaveErrors(
      dependencies.dependencyOptions,
      debuggerErrors,
    );
  }, [dependencies.dependencyOptions, debuggerErrors]);

  const errorOutgoingConnections = useMemo(() => {
    return doConnectionsHaveErrors(
      dependencies.inverseDependencyOptions,
      debuggerErrors,
    );
  }, [dependencies.inverseDependencyOptions, debuggerErrors]);

  return (
    <TopLayer ref={topLayerRef}>
      <Menu>
        <MenuTrigger disabled={!dependencies.dependencyOptions.length}>
          <div>
            <TriggerNode
              connectionType="INCOMING"
              disabled={!dependencies.dependencyOptions.length}
              entityCount={dependencies.dependencyOptions.length}
              hasError={errorIncomingConnections}
              iconAlignment={"LEFT"}
              justifyContent={"flex-start"}
              tooltipPosition="bottomLeft"
            />
          </div>
        </MenuTrigger>
        <MenuContent align="start" style={{ width: "250px" }}>
          <MenuItem className="menuitem-nohover">Incoming connections</MenuItem>
          <MenuSeparator />
          {dependencies.dependencyOptions.map((option, key) => (
            <OptionNode key={key} option={option} />
          ))}
        </MenuContent>
      </Menu>

      <Menu>
        <MenuTrigger disabled={!dependencies.inverseDependencyOptions.length}>
          <div>
            <TriggerNode
              connectionType="OUTGOING"
              disabled={!dependencies.inverseDependencyOptions.length}
              entityCount={dependencies.inverseDependencyOptions.length}
              hasError={errorOutgoingConnections}
              iconAlignment={"RIGHT"}
              justifyContent={"flex-end"}
              tooltipPosition="bottomRight"
            />
          </div>
        </MenuTrigger>
        <MenuContent align="end" style={{ width: "250px" }}>
          <MenuItem className="menuitem-nohover">Outgoing connections</MenuItem>
          <MenuSeparator />
          {dependencies.inverseDependencyOptions.map((option, key) => (
            <OptionNode key={key} option={option} />
          ))}
        </MenuContent>
      </Menu>
    </TopLayer>
  );
}

export default memo(PropertyPaneConnections);

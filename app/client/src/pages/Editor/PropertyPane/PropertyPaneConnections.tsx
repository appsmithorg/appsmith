import React, { memo, useMemo, useCallback } from "react";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import Dropdown, {
  DefaultDropDownValueNodeProps,
  DropdownOption,
} from "components/ads/Dropdown";
import Tooltip from "components/ads/Tooltip";
import { AppState } from "reducers";
import { useDispatch, useSelector } from "react-redux";
import { getDataTree } from "selectors/dataTreeSelectors";
import { isAction, isWidget } from "workers/evaluationUtils";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import { useEntityLink } from "components/editorComponents/Debugger/hooks/debuggerHooks";
import { useGetEntityInfo } from "components/editorComponents/Debugger/hooks/useGetEntityInfo";
import {
  DEBUGGER_TAB_KEYS,
  doesEntityHaveErrors,
  getDependenciesFromInverseDependencies,
} from "components/editorComponents/Debugger/helpers";
import { getFilteredErrors } from "selectors/debuggerSelectors";
import { ENTITY_TYPE, Log } from "entities/AppsmithConsole";
import { DebugButton } from "components/editorComponents/Debugger/DebugCTA";
import { setCurrentTab, showDebugger } from "actions/debuggerActions";
import { getTypographyByKey } from "constants/DefaultTheme";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Colors } from "constants/Colors";

const CONNECTION_WIDTH = 113;
const CONNECTION_HEIGHT = 28;

const TopLayer = styled.div`
  display: flex;
  flex: 1;
  justify-content: space-between;
  background-color: ${Colors.GREY_1};

  .connection-dropdown {
    box-shadow: none;
    border: none;
    background-color: ${Colors.GREY_1};
  }
  .error {
    border: 1px solid
      ${(props) => props.theme.colors.propertyPane.connections.error};
    border-bottom: none;
  }
`;

const SelectedNodeWrapper = styled.div<{
  entityCount: number;
  hasError: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) =>
    props.hasError
      ? props.theme.colors.propertyPane.connections.error
      : props.theme.colors.propertyPane.connections.connectionsCount};
  ${(props) => getTypographyByKey(props, "p3")}
  width: 113px;
  opacity: ${(props) => (!!props.entityCount ? 1 : 0.5)};

  & > *:nth-child(2) {
    padding: 0 4px;
  }

  .${Classes.ICON} {
    margin-top: 1px;

    ${(props) =>
      props.hasError &&
      `
    svg {
      path {
        fill: ${props.theme.colors.propertyPane.connections.error}
      }
    }
    `}
  }
`;

const OptionWrapper = styled.div<{ hasError: boolean; fillIconColor: boolean }>`
  display: flex;
  width: 100%;
  overflow: hidden;

  .debug {
    height: ${CONNECTION_HEIGHT}px;
    margin-top: 0px;
    display: none;
  }

  ${(props) =>
    props.fillIconColor &&
    `&:not(:hover) {
    svg {
      path {
        fill: #6a86ce;
      }
    }
  }`}

  &:hover {
    .debug {
      display: flex;
    }

    background-color: ${(props) =>
      props.hasError && props.theme.colors.propertyPane.connections.optionBg}};

    &&& svg {
      rect {
        fill: ${(props) => props.theme.colors.textOnDarkBG};
      }
    }
  }
`;

const OptionContentWrapper = styled.div<{
  hasError: boolean;
}>`
  padding: ${(props) => props.theme.spaces[2] + 1}px
    ${(props) => props.theme.spaces[5]}px;
  cursor: pointer;
  display: flex;
  align-items: center;
  line-height: 8px;
  flex: 1;
  min-width: 0;

  span:first-child {
    font-size: 10px;
    font-weight: normal;
  }

  .${Classes.TEXT} {
    margin-left: 6px;
    letter-spacing: 0px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: ${(props) =>
      props.hasError
        ? props.theme.colors.propertyPane.connections.error
        : props.theme.colors.propertyPane.label};
  }

  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[5]}px;
  }

  &:hover {
    background-color: ${(props) =>
      !props.hasError && props.theme.colors.dropdown.hovered.bg};

    .${Classes.TEXT} {
      color: ${(props) =>
        props.hasError
          ? props.theme.colors.propertyPane.connections.error
          : props.theme.colors.textOnDarkBG};
    }
  }
`;

type PropertyPaneConnectionsProps = {
  widgetName: string;
};

type TriggerNodeProps = DefaultDropDownValueNodeProps & {
  entityCount: number;
  iconAlignment: "LEFT" | "RIGHT";
  connectionType: "INCOMING" | "OUTGOING";
  hasError: boolean;
};

const doConnectionsHaveErrors = (
  options: DropdownOption[],
  debuggerErrors: Record<string, Log>,
) => {
  return options.some((option) =>
    doesEntityHaveErrors(option.value as string, debuggerErrors),
  );
};

const useDependencyList = (name: string) => {
  const dataTree = useSelector(getDataTree);
  const deps = useSelector((state: AppState) => state.evaluations.dependencies);

  const getEntityId = useCallback((name) => {
    const entity = dataTree[name];

    if (isWidget(entity)) {
      return entity.widgetId;
    } else if (isAction(entity)) {
      return entity.actionId;
    }
  }, []);

  const entityDependencies = useMemo(() => {
    return getDependenciesFromInverseDependencies(
      deps.inverseDependencyMap,
      name,
    );
  }, [name, deps.inverseDependencyMap]);

  const dependencyOptions =
    entityDependencies?.directDependencies.map((e) => ({
      label: e,
      value: getEntityId(e),
    })) ?? [];
  const inverseDependencyOptions =
    entityDependencies?.inverseDependencies.map((e) => ({
      label: e,
      value: getEntityId(e),
    })) ?? [];

  return {
    dependencyOptions,
    inverseDependencyOptions,
  };
};

function OptionNode(props: any) {
  const getEntityInfo = useGetEntityInfo(props.option.label);
  const entityInfo = getEntityInfo();
  const dispatch = useDispatch();
  const { navigateToEntity } = useEntityLink();

  const onClick = () => {
    if (entityInfo?.hasError) {
      if (entityInfo?.type === ENTITY_TYPE.WIDGET) {
        dispatch(showDebugger(true));
      } else {
        dispatch(setCurrentTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
      }
    }
    navigateToEntity(props.option.label);
    AnalyticsUtil.logEvent("ASSOCIATED_ENTITY_CLICK", {
      source: "PROPERTY_PANE",
      entityType: entityInfo?.entityType,
    });
  };

  return (
    <OptionWrapper
      fillIconColor={!entityInfo?.datasourceName}
      hasError={!!entityInfo?.hasError}
    >
      <OptionContentWrapper hasError={!!entityInfo?.hasError} onClick={onClick}>
        <span>{entityInfo?.icon}</span>
        <Text type={TextType.H6}>
          {props.option.label}{" "}
          {entityInfo?.datasourceName && (
            <span>from {entityInfo?.datasourceName}</span>
          )}
        </Text>
      </OptionContentWrapper>
      {!!entityInfo?.hasError && (
        <DebugButton className="debug" onClick={onClick} />
      )}
    </OptionWrapper>
  );
}

const TriggerNode = memo((props: TriggerNodeProps) => {
  const ENTITY = props.entityCount > 1 ? "entities" : "entity";
  const tooltipText = !!props.entityCount
    ? `See ${props.connectionType.toLowerCase()} connections`
    : `No ${props.connectionType.toLowerCase()} connections`;
  const iconColor = props.hasError ? "#f22b2b" : "";

  const onClick = () => {
    AnalyticsUtil.logEvent("ASSOCIATED_ENTITY_DROPDOWN_CLICK");
  };

  return (
    <SelectedNodeWrapper
      className={props.hasError ? "t--connection-error" : "t--connection"}
      entityCount={props.entityCount}
      hasError={props.hasError}
      onClick={onClick}
    >
      {props.iconAlignment === "LEFT" && (
        <Icon
          fillColor={iconColor}
          keepColors={!props.hasError}
          name="trending-flat"
          size={IconSize.MEDIUM}
        />
      )}
      <span>
        <Tooltip content={tooltipText} disabled={props.isOpen}>
          {props.entityCount ? `${props.entityCount} ${ENTITY}` : "No Entity"}
        </Tooltip>
      </span>
      {props.iconAlignment === "RIGHT" && (
        <Icon
          fillColor={iconColor}
          keepColors={!props.hasError}
          name="trending-flat"
          size={IconSize.MEDIUM}
        />
      )}
      <Icon keepColors name="expand-more" size={IconSize.XS} />
    </SelectedNodeWrapper>
  );
});

TriggerNode.displayName = "TriggerNode";

function PropertyPaneConnections(props: PropertyPaneConnectionsProps) {
  const dependencies = useDependencyList(props.widgetName);
  const { navigateToEntity } = useEntityLink();
  const debuggerErrors = useSelector(getFilteredErrors);

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
    <TopLayer>
      <Dropdown
        SelectedValueNode={(selectedValueProps) => (
          <TriggerNode
            iconAlignment={"LEFT"}
            {...selectedValueProps}
            connectionType="INCOMING"
            entityCount={dependencies.dependencyOptions.length}
            hasError={errorIncomingConnections}
          />
        )}
        className={`connection-dropdown ${
          errorIncomingConnections ? "error" : ""
        }`}
        disabled={!dependencies.dependencyOptions.length}
        headerLabel="Incoming connections"
        height={`${CONNECTION_HEIGHT}px`}
        options={dependencies.dependencyOptions}
        renderOption={(optionProps) => {
          return <OptionNode option={optionProps.option} />;
        }}
        selected={{ label: "", value: "" }}
        showDropIcon={false}
        showLabelOnly
        width={`${CONNECTION_WIDTH}px`}
      />
      {/* <PopperDragHandle /> */}
      <Dropdown
        SelectedValueNode={(selectedValueProps) => (
          <TriggerNode
            iconAlignment={"RIGHT"}
            {...selectedValueProps}
            connectionType="OUTGOING"
            entityCount={dependencies.inverseDependencyOptions.length}
            hasError={errorOutgoingConnections}
          />
        )}
        className={`connection-dropdown ${
          errorOutgoingConnections ? "error" : ""
        }`}
        disabled={!dependencies.inverseDependencyOptions.length}
        headerLabel="Outgoing connections"
        height={`${CONNECTION_HEIGHT}px`}
        onSelect={navigateToEntity}
        options={dependencies.inverseDependencyOptions}
        renderOption={(optionProps) => {
          return <OptionNode option={optionProps.option} />;
        }}
        selected={{ label: "", value: "" }}
        showDropIcon={false}
        showLabelOnly
        width={`${CONNECTION_WIDTH}px`}
      />
    </TopLayer>
  );
}

export default memo(PropertyPaneConnections);

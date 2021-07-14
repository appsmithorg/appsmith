import React, { memo, useMemo } from "react";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import Dropdown, {
  DefaultDropDownValueNodeProps,
  DropdownOption,
} from "components/ads/Dropdown";
import Tooltip from "components/ads/Tooltip";
import { AppState } from "reducers";
import { useSelector } from "react-redux";
import { getDataTree } from "selectors/dataTreeSelectors";
import { isAction, isWidget } from "workers/evaluationUtils";
import { getPluginIcon, getWidgetIcon } from "../Explorer/ExplorerIcons";
import { getAction, getDatasource } from "selectors/entitiesSelector";
import { keyBy } from "lodash";
import { isStoredDatasource } from "entities/Action";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import { useEntityLink } from "components/editorComponents/Debugger/hooks";
import { getDependenciesFromInverseDependencies } from "components/editorComponents/Debugger/helpers";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import { Message } from "entities/AppsmithConsole";
import { DebugButton } from "components/editorComponents/Debugger/DebugCTA";
import { useCallback } from "react";

const TopLayer = styled.div`
  display: flex;
  flex: 1;
  justify-content: space-between;
  border-bottom: 0.5px solid #e0dede;

  .connection-dropdown {
    box-shadow: none;
    background-color: ${(props) => props.theme.colors.propertyPane.bg};
    border: none;
  }
  .error {
    border: 1px solid #f22b2b;
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
  color: ${(props) => (props.hasError ? "#f22b2b" : "#090707")};
  font-size: 12px;
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
        fill: #f22b2b
      }
    }
    `}
  }
`;

const OptionWrapper = styled.div`
  display: flex;
  width: 100%;
  overflow: hidden;

  .property-pane-connection {
    height: 28px;
    margin-top: 0px;
  }
`;

const OptionContentWrapper = styled.div<{
  hasError: boolean;
  fillIconColor: boolean;
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
    color: ${(props) => props.theme.colors.propertyPane.label};
  }

  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[5]}px;
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
    background-color: ${(props) =>
      props.hasError
        ? "rgba(246,71,71, 0.2)"
        : props.theme.colors.dropdown.hovered.bg};

    &&& svg {
      rect {
        fill: ${(props) => props.theme.colors.textOnDarkBG};
      }
    }

    .${Classes.TEXT} {
      color: ${(props) =>
        props.hasError ? "#F22B2B" : props.theme.colors.textOnDarkBG};
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

const doesEntityHaveErrors = (
  entityId: string,
  debuggerErrors: Record<string, Message>,
) => {
  const ids = Object.keys(debuggerErrors);

  return ids.some((e: string) => e.includes(entityId));
};

const doConnectionsHaveErrors = (
  options: DropdownOption[],
  debuggerErrors: Record<string, Message>,
) => {
  return options.some((option) =>
    doesEntityHaveErrors(option.value as string, debuggerErrors),
  );
};

const useGetEntityInfo = (name: string) => {
  const dataTree = useSelector(getDataTree);
  const debuggerErrors: Record<string, Message> = useSelector(
    getDebuggerErrors,
  );

  const entity = dataTree[name];
  const action = useSelector((state: AppState) =>
    isAction(entity) ? getAction(state, entity.actionId) : undefined,
  );

  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon = action && getPluginIcon(pluginGroups[action.pluginId]);
  const datasource = useSelector((state: AppState) =>
    action && isStoredDatasource(action.datasource)
      ? getDatasource(state, action.datasource.id)
      : undefined,
  );

  if (isWidget(entity)) {
    const icon = getWidgetIcon(entity.type);
    const hasError = doesEntityHaveErrors(entity.widgetId, debuggerErrors);

    return {
      name,
      icon,
      hasError,
    };
  } else if (isAction(entity)) {
    const hasError = doesEntityHaveErrors(entity.actionId, debuggerErrors);

    return {
      name,
      icon,
      datasourceName: datasource?.name ?? "",
      hasError,
    };
  }
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
  const entityInfo = useGetEntityInfo(props.option.label);

  return (
    <OptionWrapper>
      <OptionContentWrapper
        fillIconColor={!entityInfo?.datasourceName}
        hasError={!!entityInfo?.hasError}
        onClick={props.optionClickHandler}
      >
        <span>{entityInfo?.icon}</span>
        <Text type={TextType.H6}>
          {props.option.label}{" "}
          {entityInfo?.datasourceName && (
            <span>from {entityInfo?.datasourceName}</span>
          )}
        </Text>
      </OptionContentWrapper>
      {!!entityInfo?.hasError && (
        <DebugButton
          className="property-pane-connection"
          onClick={() => null}
        />
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

  return (
    <SelectedNodeWrapper
      entityCount={props.entityCount}
      hasError={props.hasError}
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
  const debuggerErrors = useSelector(getDebuggerErrors);
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
        height="28px"
        options={dependencies.dependencyOptions}
        renderOption={(optionProps) => {
          return (
            <OptionNode
              option={optionProps.option}
              optionClickHandler={() =>
                navigateToEntity(optionProps.option.value)
              }
            />
          );
        }}
        selected={{ label: "", value: "" }}
        showDropIcon={false}
        showLabelOnly
        width="113px"
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
        height="28px"
        onSelect={navigateToEntity}
        options={dependencies.inverseDependencyOptions}
        renderOption={(optionProps) => {
          return (
            <OptionNode
              option={optionProps.option}
              optionClickHandler={() =>
                navigateToEntity(optionProps.option.value)
              }
            />
          );
        }}
        selected={{ label: "", value: "" }}
        showDropIcon={false}
        showLabelOnly
        width="113px"
      />
    </TopLayer>
  );
}

export default memo(PropertyPaneConnections);

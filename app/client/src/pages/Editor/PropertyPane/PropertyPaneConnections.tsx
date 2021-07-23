import { Classes } from "components/ads/common";
import Dropdown, {
  DefaultDropDownValueNodeProps,
} from "components/ads/Dropdown";
import Icon, { IconSize } from "components/ads/Icon";
import Text, { TextType } from "components/ads/Text";
import Tooltip from "components/ads/Tooltip";
import { useEntityLink } from "components/editorComponents/Debugger/hooks";
import { isStoredDatasource } from "entities/Action";
import { isEqual, keyBy } from "lodash";
import React, { memo, useMemo } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { getAction, getDatasource } from "selectors/entitiesSelector";
import { getSelectorEntityDependenciesFromName } from "selectors/propertyPaneSelectors";
import styled from "styled-components";
import { isAction, isWidget } from "workers/evaluationUtils";
import { getPluginIcon, getWidgetIcon } from "../Explorer/ExplorerIcons";

const TopLayer = styled.div`
  display: flex;
  flex: 1;
  justify-content: space-between;
  border-bottom: 0.5px solid #e0dede;

  .layout-control {
    border: none;
    box-shadow: none;
    background-color: ${(props) => props.theme.colors.propertyPane.bg};
  }
`;

const SelectedNodeWrapper = styled.div<{ entityCount: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #090707;
  font-size: 12px;
  width: 114px;
  opacity: ${(props) => (!!props.entityCount ? 1 : 0.5)};

  & > *:nth-child(2) {
    padding: 0 4px;
  }

  .${Classes.ICON} {
    margin-top: 1px;
  }
`;

const OptionWrapper = styled.div`
  padding: ${(props) => props.theme.spaces[2] + 1}px
    ${(props) => props.theme.spaces[5]}px;
  cursor: pointer;
  display: flex;
  align-items: center;
  line-height: 8px;

  span:first-child {
    font-size: 10px;
    font-weight: normal;
  }

  .${Classes.TEXT} {
    margin-left: 6px;
    letter-spacing: 0px;
    overflow: hidden;
    white-space: initial;
    text-overflow: ellipsis;
    color: ${(props) => props.theme.colors.propertyPane.label};
  }

  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[5]}px;
  }

  &:not(:hover) {
    svg {
      path {
        fill: #6a86ce;
      }
    }
  }

  &:hover {
    background-color: ${(props) => props.theme.colors.dropdown.hovered.bg};

    &&& svg {
      rect {
        fill: ${(props) => props.theme.colors.textOnDarkBG};
      }
    }

    .${Classes.TEXT} {
      color: ${(props) => props.theme.colors.textOnDarkBG};
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
};

const useGetEntityInfo = (name: string) => {
  const entity = useSelector((state: AppState) => state.evaluations.tree[name]);
  const action = useSelector((state: AppState) =>
    isAction(entity) ? getAction(state, entity.actionId) : undefined,
  );

  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  }, isEqual);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon = action && getPluginIcon(pluginGroups[action.pluginId]);
  const datasource = useSelector((state: AppState) =>
    action && isStoredDatasource(action.datasource)
      ? getDatasource(state, action.datasource.id)
      : undefined,
  );

  if (isWidget(entity)) {
    const icon = getWidgetIcon(entity.type);

    return {
      name,
      icon,
    };
  } else if (isAction(entity)) {
    return {
      name,
      icon,
      datasourceName: datasource?.name ?? "",
    };
  }
};

const useDependencyList = (name: string) => {
  const entityDependenciesSelector = getSelectorEntityDependenciesFromName(
    name,
  );
  const entityDependencies = useSelector(entityDependenciesSelector, isEqual);
  return useMemo(() => {
    const dependencyOptions =
      entityDependencies?.directDependencies.map((e) => ({
        label: e,
        value: e,
      })) ?? [];
    const inverseDependencyOptions =
      entityDependencies?.inverseDependencies.map((e) => ({
        label: e,
        value: e,
      })) ?? [];

    return {
      dependencyOptions,
      inverseDependencyOptions,
    };
  }, [entityDependencies]);
};

function OptionNode(props: any) {
  const entityInfo = useGetEntityInfo(props.option.value);

  return (
    <OptionWrapper onClick={props.optionClickHandler}>
      <span>{entityInfo?.icon}</span>
      <Text type={TextType.H6}>
        {props.option.label}{" "}
        {entityInfo?.datasourceName && (
          <span>from {entityInfo?.datasourceName}</span>
        )}
      </Text>
    </OptionWrapper>
  );
}

const TriggerNode = memo((props: TriggerNodeProps) => {
  const ENTITY = props.entityCount > 1 ? "entities" : "entity";
  const tooltipText = !!props.entityCount
    ? `See ${props.connectionType.toLowerCase()} connections`
    : `No ${props.connectionType.toLowerCase()} connections`;

  return (
    <SelectedNodeWrapper entityCount={props.entityCount}>
      {props.iconAlignment === "LEFT" && (
        <Icon keepColors name="trending-flat" size={IconSize.MEDIUM} />
      )}
      <span>
        <Tooltip content={tooltipText} disabled={props.isOpen}>
          {props.entityCount ? `${props.entityCount} ${ENTITY}` : "No Entity"}
        </Tooltip>
      </span>
      {props.iconAlignment === "RIGHT" && (
        <Icon keepColors name="trending-flat" size={IconSize.MEDIUM} />
      )}
      <Icon keepColors name="expand-more" size={IconSize.XS} />
    </SelectedNodeWrapper>
  );
});
TriggerNode.displayName = "TriggerNode";

function PropertyPaneConnections(props: PropertyPaneConnectionsProps) {
  const dependencies = useDependencyList(props.widgetName);
  const { navigateToEntity } = useEntityLink();
  return (
    <TopLayer>
      <Dropdown
        SelectedValueNode={(selectedValueProps) => (
          <TriggerNode
            iconAlignment={"LEFT"}
            {...selectedValueProps}
            connectionType="INCOMING"
            entityCount={dependencies.dependencyOptions.length}
          />
        )}
        className="layout-control"
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
        width="114px"
      />
      {/* <PopperDragHandle /> */}
      <Dropdown
        SelectedValueNode={(selectedValueProps) => (
          <TriggerNode
            iconAlignment={"RIGHT"}
            {...selectedValueProps}
            connectionType="OUTGOING"
            entityCount={dependencies.inverseDependencyOptions.length}
          />
        )}
        className="layout-control"
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
        width="114px"
      />
    </TopLayer>
  );
}

export default memo(PropertyPaneConnections);

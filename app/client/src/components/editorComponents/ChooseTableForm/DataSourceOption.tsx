import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import { getPluginImages } from "selectors/entitiesSelector";
import {
  Classes,
  DropdownOption,
  RenderDropdownOptionType,
  Text,
  TextType,
  TooltipComponent,
} from "design-system";
import { FormIcons } from "icons/FormIcons";
import _ from "lodash";

// ---------- Helpers and constants ----------

export const CONNECT_NEW_DATASOURCE_OPTION_ID = _.uniqueId();

//  ---------- Styles ----------

const OptionWrapper = styled.div<{
  disabled?: boolean;
  selected?: boolean;
  width?: string;
}>`
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[5]}px`};
  ${(props) => (!props.disabled ? "cursor: pointer" : "")};
  display: flex;
  align-items: center;
  user-select: none;
  width: 100%;

  &&& svg {
    rect {
      fill: ${(props) => props.theme.colors.dropdownIconBg};
    }
  }

  .${Classes.TEXT} {
    color: ${(props) =>
      props.disabled ? Colors.GRAY2 : props.theme.colors.propertyPane.label};
  }

  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[5]}px;
    svg {
      path {
        ${(props) => `fill: ${props.theme.colors.dropdown.icon}`};
      }
    }
  }

  &:hover,
  &.highlight-option {
    background-color: ${Colors.GALLERY_1};

    &&& svg {
      rect {
        fill: ${(props) => props.theme.colors.textOnDarkBG};
      }
    }

    .${Classes.ICON} {
      svg {
        path {
          fill: ${(props) => props.theme.colors.dropdown.hovered.icon};
        }
      }
    }
  }
`;

const CreateIconWrapper = styled.div`
  margin: 0px 8px 0px 0px;
  cursor: pointer;
`;

const ImageWrapper = styled.div`
  height: 20px;
  width: auto;
  display: flex;
  align-items: center;
  margin: 0px 8px 0px 0px;
`;

const DatasourceImage = styled.img`
  height: 20px;
  width: auto;
`;

interface DataSourceOptionType extends RenderDropdownOptionType {
  cypressSelector: string;
  optionWidth: string;
}

function DataSourceOption({
  cypressSelector,
  extraProps,
  isHighlighted,
  isSelectedNode,
  option: dropdownOption,
  optionClickHandler,
  optionWidth,
}: DataSourceOptionType) {
  const { label } = dropdownOption as DropdownOption;
  const { routeToCreateNewDatasource = () => null } = extraProps;
  const pluginImages = useSelector(getPluginImages);
  const isConnectNewDataSourceBtn =
    CONNECT_NEW_DATASOURCE_OPTION_ID === (dropdownOption as DropdownOption).id;

  const isSupportedForTemplate = (dropdownOption as DropdownOption).data
    .isSupportedForTemplate;
  const isNotSupportedDatasource =
    !isSupportedForTemplate && !isSelectedNode && !isConnectNewDataSourceBtn;

  const optionCypressSelector = isConnectNewDataSourceBtn
    ? ".t--connectNewDatasource-option"
    : isSelectedNode
    ? ""
    : cypressSelector;
  return (
    <TooltipComponent
      content="Not supported for template generation"
      disabled={
        isSupportedForTemplate || isSelectedNode || isConnectNewDataSourceBtn
      }
      styles={{
        width: "100%",
      }}
    >
      <OptionWrapper
        className={`t--dropdown-option ${
          isHighlighted ? "highlight-option" : ""
        }`}
        data-cy={optionCypressSelector}
        disabled={isNotSupportedDatasource}
        key={(dropdownOption as DropdownOption).id}
        onClick={() => {
          if (isNotSupportedDatasource) {
            return;
          }
          if (isConnectNewDataSourceBtn) {
            routeToCreateNewDatasource(dropdownOption);
          } else if (optionClickHandler) {
            optionClickHandler(dropdownOption as DropdownOption);
          }
        }}
        selected={isSelectedNode}
        width={optionWidth}
      >
        {isConnectNewDataSourceBtn ? (
          <CreateIconWrapper>
            <FormIcons.CREATE_NEW_ICON
              color={Colors.GRAY2}
              height={20}
              width={20}
            />
          </CreateIconWrapper>
        ) : pluginImages[(dropdownOption as DropdownOption).data.pluginId] ? (
          <ImageWrapper>
            <DatasourceImage
              alt=""
              className="dataSourceImage"
              src={
                pluginImages[(dropdownOption as DropdownOption).data.pluginId]
              }
            />
          </ImageWrapper>
        ) : null}

        <Text type={TextType.P1}>{label}</Text>
      </OptionWrapper>
    </TooltipComponent>
  );
}

export default DataSourceOption;

import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { RenderDropdownOptionType } from "components/ads/Dropdown";
import { useSelector } from "react-redux";
import { getPluginImages } from "../../../../selectors/entitiesSelector";
import { Classes } from "../../../../components/ads/common";
import Text, { TextType } from "components/ads/Text";
import { FormIcons } from "icons/FormIcons";
import _ from "lodash";
import TooltipComponent from "components/ads/Tooltip";

// ---------- Helpers and constants ----------

export const CONNECT_NEW_DATASOURCE_OPTION_ID = _.uniqueId();

//  ---------- Styles ----------

const OptionWrapper = styled.div<{ disabled?: boolean; selected?: boolean }>`
  padding: ${(props) =>
    props.selected
      ? `${props.theme.spaces[1]}px 0px`
      : `${props.theme.spaces[3]}px ${props.theme.spaces[5]}px`};
  ${(props) => (!props.disabled ? "cursor: pointer" : "")};
  display: flex;
  align-items: center;
  user-select: none;

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

  &:hover {
    background-color: ${Colors.Gallery};

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

function DataSourceOption({
  extraProps,
  isSelectedNode,
  option: dropdownOption,
  optionClickHandler,
}: RenderDropdownOptionType) {
  const { label } = dropdownOption;
  const { routeToCreateNewDatasource = () => null } = extraProps;
  const pluginImages = useSelector(getPluginImages);
  const isConnectNewDataSourceBtn =
    CONNECT_NEW_DATASOURCE_OPTION_ID === dropdownOption.id;

  const isSupportedForTemplate = dropdownOption.data.isSupportedForTemplate;
  return (
    <TooltipComponent
      content="Not supported for template generation"
      disabled={
        isSupportedForTemplate || isSelectedNode || isConnectNewDataSourceBtn
      }
    >
      <OptionWrapper
        className="t--dropdown-option"
        disabled={
          !isSupportedForTemplate &&
          !isSelectedNode &&
          !isConnectNewDataSourceBtn
        }
        key={dropdownOption.id}
        onClick={() => {
          if (!isSupportedForTemplate) {
            return;
          }
          if (isConnectNewDataSourceBtn) {
            routeToCreateNewDatasource(dropdownOption);
          } else if (optionClickHandler) {
            optionClickHandler(dropdownOption);
          }
        }}
        selected={isSelectedNode}
      >
        {isConnectNewDataSourceBtn ? (
          <CreateIconWrapper>
            <FormIcons.CREATE_NEW_ICON
              color={Colors.GRAY2}
              height={20}
              width={20}
            />
          </CreateIconWrapper>
        ) : pluginImages[dropdownOption.data.pluginId] ? (
          <ImageWrapper>
            <DatasourceImage
              alt=""
              className="dataSourceImage"
              src={pluginImages[dropdownOption.data.pluginId]}
            />
          </ImageWrapper>
        ) : null}

        <Text type={TextType.P1}>{label}</Text>
      </OptionWrapper>
    </TooltipComponent>
  );
}

export default DataSourceOption;

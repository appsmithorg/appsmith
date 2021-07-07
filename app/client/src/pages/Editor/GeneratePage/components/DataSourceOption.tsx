import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { RenderDropdownOptionType } from "components/ads/Dropdown";
import { useSelector } from "react-redux";
import { getPluginImages } from "../../../../selectors/entitiesSelector";
import { Classes } from "../../../../components/ads/common";
import Text, { TextType } from "components/ads/Text";
import { FormIcons } from "icons/FormIcons";

// ---------- Helpers and constants ----------

const getUniqueId = () => {
  return `id--${Math.random()
    .toString(16)
    .slice(2)}`;
};

export const CONNECT_NEW_DATASOURCE_OPTION_ID = getUniqueId();

//  ---------- Styles ----------

const OptionWrapper = styled.div<{ clickable?: boolean; selected?: boolean }>`
  padding: ${(props) =>
    props.selected
      ? `${props.theme.spaces[1]}px ${props.theme.spaces[5]}px`
      : `${props.theme.spaces[3]}px ${props.theme.spaces[5]}px`};
  ${(props) => (props.clickable ? "cursor: pointer" : "")};
  display: flex;
  align-items: center;
  user-select: none;

  &&& svg {
    rect {
      fill: ${(props) => props.theme.colors.dropdownIconBg};
    }
  }

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.propertyPane.label};
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
    background-color: ${(props) => (props.clickable ? Colors.Gallery : "")};

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
  margin: 0px 8px;
`;

const ImageWrapper = styled.div`
  height: 24px;
  width: auto;
  display: flex;
  align-items: center;
  margin: 0px 8px;
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
  // const isNotDatasourceOption = isConnectNewDataSourceBtn || isSelectedNode;
  return (
    <OptionWrapper
      className="t--dropdown-option"
      clickable
      key={dropdownOption.id}
      onClick={() => {
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
      ) : (
        <ImageWrapper>
          <DatasourceImage
            alt=""
            className="dataSourceImage"
            src={pluginImages[dropdownOption.data.pluginId]}
          />
        </ImageWrapper>
      )}

      <Text type={TextType.P1}>{label}</Text>
    </OptionWrapper>
  );
}

export default DataSourceOption;

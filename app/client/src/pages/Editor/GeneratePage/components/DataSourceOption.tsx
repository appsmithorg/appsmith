import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { getPluginImages } from "ee/selectors/entitiesSelector";
import type {
  DropdownOption,
  RenderDropdownOptionType,
} from "@appsmith/ads-old";
import { Classes, Text, TextType } from "@appsmith/ads-old";
import _ from "lodash";
import { Tooltip, Icon } from "@appsmith/ads";
import { getAssetUrl } from "ee/utils/airgapHelpers";

// ---------- Helpers and constants ----------

export const CONNECT_NEW_DATASOURCE_OPTION_ID = _.uniqueId();

//  ---------- Styles ----------

const OptionWrapper = styled.div<{
  disabled?: boolean;
  selected?: boolean;
  width?: string;
}>`
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
      props.disabled
        ? "var(--ads-v2-color-fg-muted)"
        : "var(--ads-v2-color-fg)"};
  }

  .${Classes.ICON} {
    margin-right: ${(props) => props.theme.spaces[5]}px;
    svg {
      path {
        ${(props) => `fill: ${props.theme.colors.dropdown.icon}`};
      }
    }
  }
`;

const ImageWrapper = styled.div`
  height: 16px;
  width: auto;
  display: flex;
  align-items: center;
  margin: 0px 8px 0px 0px;
`;

export const DatasourceImage = styled.img`
  height: 16px;
  width: 16px;
`;

const CreateIconWrapper = styled.div`
  margin: 0px 8px 0px 0px;
  cursor: pointer;
  height: 16px;
`;

interface DataSourceOptionType extends RenderDropdownOptionType {
  dataTestid: string;
  optionWidth: string;
}
function DataSourceOption({
  dataTestid,
  isHighlighted,
  isSelectedNode,
  option: dropdownOption,
  optionClickHandler,
  optionWidth,
}: DataSourceOptionType) {
  const { label } = dropdownOption as DropdownOption;
  const pluginImages = useSelector(getPluginImages);
  const isConnectNewDataSourceBtn =
    CONNECT_NEW_DATASOURCE_OPTION_ID === (dropdownOption as DropdownOption).id;

  const isSupportedForTemplate = (dropdownOption as DropdownOption)?.data
    ?.isSupportedForTemplate;
  const isNotSupportedDatasource =
    !isSupportedForTemplate && !isSelectedNode && !isConnectNewDataSourceBtn;

  const optionCypressSelector = isConnectNewDataSourceBtn
    ? ".t--connectNewDatasource-option"
    : isSelectedNode
      ? ""
      : dataTestid;
  return (
    <Tooltip
      content="Not supported for template generation"
      isDisabled={
        isSupportedForTemplate || isSelectedNode || isConnectNewDataSourceBtn
      }
    >
      <OptionWrapper
        className={`t--dropdown-option ${
          isHighlighted ? "highlight-option" : ""
        }`}
        data-testid={optionCypressSelector}
        disabled={isNotSupportedDatasource}
        key={(dropdownOption as DropdownOption).id}
        onClick={() => {
          if (isNotSupportedDatasource) {
            return;
          }
          if (optionClickHandler) {
            optionClickHandler(dropdownOption as DropdownOption);
          }
        }}
        selected={isSelectedNode}
        width={optionWidth}
      >
        {isConnectNewDataSourceBtn ? (
          <CreateIconWrapper>
            <Icon name="plus" size="md" />
          </CreateIconWrapper>
        ) : pluginImages[(dropdownOption as DropdownOption)?.data?.pluginId] ? (
          <ImageWrapper>
            <DatasourceImage
              alt=""
              className="dataSourceImage"
              src={getAssetUrl(
                pluginImages[
                  (dropdownOption as DropdownOption)?.data?.pluginId
                ],
              )}
            />
          </ImageWrapper>
        ) : null}

        <Text type={TextType.P1}>{label}</Text>
      </OptionWrapper>
    </Tooltip>
  );
}

export default DataSourceOption;

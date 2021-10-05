import React from "react";
import styled, { css } from "styled-components";
import { storeAsDatasource } from "actions/datasourceActions";
import { useDispatch } from "react-redux";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";

export const DatasourceIcon = styled.div<{ enable?: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-left: 10px;
  height: 100%;
  min-height: 37px;
  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.apiPane.settings.textColor};
  }
  .${Classes.ICON} {
    margin-right: 5px;
    path {
      fill: ${(props) => props.theme.colors.icon.hover};
    }
  }
  ${(props) => (props.enable ? "" : disabled)}
`;

const disabled = css`
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.7;
`;

type storeDataSourceProps = {
  enable: boolean;
};

function StoreAsDatasource(props: storeDataSourceProps) {
  const dispatch = useDispatch();

  return (
    <DatasourceIcon
      className="t--store-as-datasource"
      enable={props.enable}
      onClick={() => dispatch(storeAsDatasource())}
    >
      <Icon name="datasource" size={IconSize.LARGE} />
      <Text type={TextType.P1}>Save As Datasource</Text>
    </DatasourceIcon>
  );
}

export default StoreAsDatasource;

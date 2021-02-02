import React from "react";
import styled from "styled-components";
import { storeAsDatasource } from "actions/datasourceActions";
import { useDispatch } from "react-redux";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";

export const DatasourceIcon = styled.div`
  position: absolute;
  right: -155px;
  top: 7px;
  display: flex;
  align-items: center;
  cursor: pointer;
  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.text.heading};
  }
  .${Classes.ICON} {
    margin-right: 5px;
    path {
      fill: ${(props) => props.theme.colors.icon.hover};
    }
  }
`;

const StoreAsDatasource = () => {
  const dispatch = useDispatch();

  return (
    <DatasourceIcon
      className="t--store-as-datasource"
      onClick={() => dispatch(storeAsDatasource())}
    >
      <Icon name="datasource" size={IconSize.LARGE} />
      <Text type={TextType.P1}>Save As Datasource</Text>
    </DatasourceIcon>
  );
};

export default StoreAsDatasource;

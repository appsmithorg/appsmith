import React, { Suspense, lazy } from "react";
import NoDataImage from "assets/images/no_data.png";
import { Skin } from "constants/DefaultTheme";
import styled from "constants/DefaultTheme";
import { retryPromise } from "utils/AppsmithUtils";
const LightningMenu = lazy(() =>
  retryPromise(() => import("components/editorComponents/LightningMenu")),
);

const ConnectBtn = styled.div`
  background: #768896;
  border-radius: 4px;
  height: 32px;
  line-height: 32px;
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: #ffffff;
  display: flex;
  justify-content: center;
  width: 146px;
  margin-top: 12px;
  > span:first-of-type {
    width: 20px;
    position: relative;
    left: 0px;
    top: 5px;
    height: 20px;
  }
`;

const TableColumnEmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  img {
    width: 156px;
    margin-top: 16px;
  }
  .no-data-title {
    font-weight: 500;
    font-size: 14px;
    line-height: 16px;
    letter-spacing: 0.04em;
    color: #ffffff;
    margin-top: 23px;
  }
`;

const EmptyDataState = () => {
  return (
    <TableColumnEmptyWrapper>
      <img alt="No data" src={NoDataImage} />
      <div className="no-data-title">No data found</div>
      <ConnectBtn>
        {/* <Suspense fallback={<div />}>
          <LightningMenu
            skin={Skin.DARK}
            isFocused
            isOpened
            updateDynamicInputValue={() => {}}
            onOpenLightningMenu={() => {}}
            onCloseLightningMenu={() => {}}
          />
        </Suspense> */}
        Connect to data
      </ConnectBtn>
    </TableColumnEmptyWrapper>
  );
};

export default EmptyDataState;

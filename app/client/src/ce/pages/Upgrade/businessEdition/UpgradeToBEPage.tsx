import React from "react";
import styled from "styled-components";
import UpgradeToBusinessEdition from "assets/images/upgrade/be-cta/upgrade-to-be.png";
import {
  createMessage,
  MOVE_TO_BUSINESS_EDITION,
} from "@appsmith/constants/messages";
import { FooterComponent } from "../Footer";

export const UpgradeToBEPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  footer {
    height: 86px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 40px;
  }
`;

export const UpgradeToBEPage = () => {
  return (
    <UpgradeToBEPageWrapper>
      <img
        alt="Upgrade to Business Edition"
        key="upgrade-to-business-edition"
        src={UpgradeToBusinessEdition}
      />
      <FooterComponent
        message={createMessage(MOVE_TO_BUSINESS_EDITION, "?")}
        onClick={() =>
          window.open("https://www.appsmith.com/pricing", "_blank")
        }
        showHeading={false}
      />
    </UpgradeToBEPageWrapper>
  );
};

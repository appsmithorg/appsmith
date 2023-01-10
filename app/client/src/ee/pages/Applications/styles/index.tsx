import { Colors } from "constants/Colors";
import styled from "styled-components";

export const BannerWrapper = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-width: 800px;
  background: linear-gradient(
    90deg,
    hsl(39.2, 43.3%, 88.2%) 29%,
    hsl(35.3, 100%, 96.7%) 100%
  );
  border-radius: 4px;
  border: 1px solid var(--appsmith-color-orange-100);
  height: 128px;
  padding: 20px;
  box-shadow: 0px 4px 4px var(--appsmith-color-orange-50);
`;

export const BannerContentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-basis: 60%;
  width: 100%;
  gap: 20px;
  img {
    position: relative;
    margin-left: 10px;
    top: -10px;
  }
`;

export const BannerTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  .main-text {
    font-size: 24px;
    color: ${Colors.CTA_PURPLE};
  }
  .sub-text {
    font-size: 20px;
    font-weight: 500;
    span {
      color: var(--appsmith-color-orange-500);
      font-weight: 700;
      font-size: 24px;
    }
  }
`;

export const BannerCtaWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  align-items: center;
  .close-button {
    background: transparent;
    border: 1px solid var(--appsmith-color-black-800);
  }
`;

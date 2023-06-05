import { Callout } from "design-system";
import styled from "styled-components";

// TODO: Since there is no DS component yet to support upgrade banner, we are using Callout component with custom CSS
export const StyledCallout = styled(Callout)`
  > div:first-child {
    display: none;
  }
  > div:nth-child(2) {
    width: 100%;
  }
`;

export const BannerWrapper = styled.div`
  display: flex;
  position: relative;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-width: 800px;
  padding: 12px;
`;

export const BannerContentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-basis: 70%;
  width: 100%;
  gap: 30px;
  img {
    height: 76px;
    width: 92px;
  }
`;

export const BannerTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  .sub-text {
    span {
      color: var(--ads-v2-color-fg-brand);
      font-weight: 700;
      font-size: 22px;
    }
  }
`;

export const BannerCtaWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
`;

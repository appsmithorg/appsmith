import styled from "styled-components";

export const TooltipWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: -3px;
`;

export const DeployedKeyContainer = styled.div<{ $marginTop: number }>`
  margin-top: ${(props) => `${props.theme.spaces[props.$marginTop]}px`};
  margin-bottom: 8px;
  height: 35px;
  width: calc(100% - 39px);
  border: 1px solid var(--ads-v2-color-border);
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[4]}px`};
  box-sizing: border-box;
  border-radius: var(--ads-v2-border-radius);
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 3px;
`;

export const ConfirmRegeneration = styled(FlexRow)`
  margin-top: 16.5px;
  justify-content: space-between;
`;

export const ConfirmRegenerationActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 5px;
`;

export const KeyType = styled.span`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--ads-v2-color-fg);
`;

export const KeyText = styled.span`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  flex: 1;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--ads-v2-color-fg);
  direction: rtl;
  margin-right: 8px;
`;

export const MoreMenuWrapper = styled.div`
  align-items: center;
  margin-top: 3px;
`;

export const IconContainer = styled.div`
  margin-top: -3px;
`;

export const NotificationBannerContainer = styled.div`
  max-width: calc(100% - 39px);
`;

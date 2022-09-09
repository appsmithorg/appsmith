import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Text } from "design-system";

export const TooltipWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const DeployedKeyContainer = styled.div<{ $marginTop: number }>`
  margin-top: ${(props) => `${props.theme.spaces[props.$marginTop]}px`};
  margin-bottom: 8px;
  height: 35px;
  width: calc(100% - 30px);
  border: 1px solid ${Colors.ALTO_3};
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[4]}px`};
  box-sizing: border-box;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

export const ConfirmRegeneration = styled(FlexRow)`
  margin-top: 16.5px;
  justify-content: space-between;
`;

export const KeyType = styled.span<{ keyType: string }>`
  width: ${(props) => (props.keyType === "ECDSA" ? "30%" : "15%")};
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--appsmith-color-black-900);
`;

export const KeyText = styled.span<{ keyType: string }>`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: ${(props) => (props.keyType === "ECDSA" ? "60%" : "100%")};
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--appsmith-color-black-900);
  direction: rtl;
  margin-right: 8px;
`;

export const MoreMenuWrapper = styled.div`
  padding: 8px;
  align-items: center;
  position: absolute;
  right: -6px;
  top: 8px;
`;

export const MoreOptionsContainer = styled.div`
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ConfirmMenuItem = styled.div`
  padding: 16px 12px;
`;

export const NotificationBannerContainer = styled.div`
  max-width: calc(100% - 30px);
`;

export const RegenerateOptionsHeader = styled.div`
  align-items: center;
  display: flex;
  margin: 0;
  padding: 0 14px;
  font-size: 16px;
  height: 38px;
  width: calc(100% - 30px);
`;

export const StyledTextBlock = styled(Text)`
  display: block;
`;

import { Colors } from "constants/Colors";
import { Button } from "design-system";
import styled, { createGlobalStyle } from "styled-components";
import { DROPDOWN_TRIGGER_DIMENSION } from "./constants";

export const Wrapper = styled.div``;

export const SelectWrapper = styled.div`
  display: inline-block;
  margin: 5px 0 2px;
  max-width: ${DROPDOWN_TRIGGER_DIMENSION.WIDTH};
  width: 100%;
`;

export const Label = styled.p`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Bold = styled.span`
  font-weight: 500;
`;

export const Section = styled.div``;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

export const RowHeading = styled.p`
  margin-right: 10px;
`;

export const StyledButton = styled(Button)`
  &&& {
    width: 100%;
  }
`;

export const CreateIconWrapper = styled.div`
  margin: 0px 8px 0px 0px;
  cursor: pointer;
`;

export const ImageWrapper = styled.div`
  height: 20px;
  width: auto;
  display: flex;
  align-items: center;
  margin: 0px 8px 0px 0px;
`;

export const DatasourceImage = styled.img`
  height: 16px;
  width: auto;
`;

export const GlobalStyles = createGlobalStyle`
  .one-click-binding-datasource-dropdown {
    height: 300px;

    .rc-select-item-option-disabled {
      opacity: 1 !important;
    }

    .rc-virtual-list-holder {
      max-height: 290px !important;
    }

    .has-seperator {
      border-top: 1px solid ${Colors.GREY_4};
      border-radius: 0;
      margin-top: 10px;
      padding-top: 15px;
    }
  }
`;

export const Binding = styled.div`
  display: flex;
  font-size: 12px;
  font-weight: 700;
  position: relative;
  left: 1px;
  top: -1px;
  color: var(--ads-v2-color-fg);
`;

export const ErrorMessage = styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: var(--ads-v2-color-fg-error);
`;

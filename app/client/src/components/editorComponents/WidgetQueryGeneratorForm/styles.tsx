import { Button } from "@appsmith/ads";
import styled from "styled-components";
import { DROPDOWN_TRIGGER_DIMENSION } from "./constants";

export const Wrapper = styled.div``;

export const SelectWrapper = styled.div`
  display: inline-block;
  margin: 0 0 2px;
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

export const ErrorMessage = styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: var(--ads-v2-color-fg-error);
  margin-top: 5px;
`;

export const Placeholder = styled.div`
  color: var(--ads-v2-color-fg-subtle);
`;

export const LabelWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const EditFieldsButton = styled(Button)`
  cursor: pointer;

  span,
  svg {
    color: var(--ads-v2-color-fg-brand) !important;
  }
`;

export const FieldHint = styled.div`
  font-size: 12px;
  line-height: 14px;
  color: var(--ads-v2-color-fg-subtle);
  margin-top: 5px;
`;

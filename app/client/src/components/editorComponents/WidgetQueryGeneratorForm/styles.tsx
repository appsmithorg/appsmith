import { Button, getTypographyByKey } from "design-system-old";
import styled from "styled-components";
import { DROPDOWN_TRIGGER_DIMENSION } from "./constants";

export const Wrapper = styled.div``;

export const SelectWrapper = styled.div`
  display: inline-block;
  margin: 5px 0 10px;
  max-width: ${DROPDOWN_TRIGGER_DIMENSION.WIDTH};
  width: 100%;
`;

export const Label = styled.p`
  flex: 1;
  ${getTypographyByKey("p1")};
  white-space: nowrap;
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

export const TooltipWrapper = styled.div`
  margin-top: 2px;
`;

export const RowHeading = styled.p`
  ${getTypographyByKey("p1")};
  margin-right: 10px;
`;

export const StyledButton = styled(Button)`
  padding: 15px 0px;
  margin: 10px 0px;
  width: 100%;
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
  height: 20px;
  width: auto;
`;

import styled from "styled-components";
import { TemplateLayout } from "./index";

const LargeTemplate = styled(TemplateLayout)`
  border: 1px solid #e7e7e7;
  flex: 1;
  max-width: 50%;
  transition: all 1s ease-out;
  cursor: pointer;
  &:hover {
    box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.1),
      0px 8px 8px -4px rgba(16, 24, 40, 0.04);
  }
`;
export default LargeTemplate;

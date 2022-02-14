import styled from "styled-components";
import { TemplateLayout } from "./index";

const LargeTemplate = styled(TemplateLayout)`
  border: 1px solid #e7e7e7;
  flex: 1;
  max-width: 50%;
  cursor: pointer;
  &:hover {
    box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.1),
      0px 8px 8px -4px rgba(16, 24, 40, 0.04);
  }

  .image-wrapper {
    padding: 20px 24px 0px;
    transition: all 1s ease-out;
    width: 100%;
    min-height: 250px;
  }
`;

export default LargeTemplate;

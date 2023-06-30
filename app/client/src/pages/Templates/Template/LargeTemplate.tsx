import { getTypographyByKey } from "design-system-old";
import styled from "styled-components";
import { TemplateLayout } from "./index";

const LargeTemplate = styled(TemplateLayout)`
  border: 1px solid var(--ads-v2-color-border);
  display: flex;
  flex: 1;
  flex-direction: column;
  cursor: pointer;
  &:hover {
    border-color: var(--ads-v2-color-border-emphasis);
  }

  && {
    .title {
      ${getTypographyByKey("h1")}
    }
    .categories {
      ${getTypographyByKey("h4")}
      font-weight: normal;
    }
    .description {
      ${getTypographyByKey("p1")}
      flex: 1;
    }
  }

  .image-wrapper {
    transition: all 1s ease-out;
    width: 100%;
    height: 270px;
  }
`;

export default LargeTemplate;

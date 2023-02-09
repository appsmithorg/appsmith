import { Colors } from "constants/Colors";
import { getTypographyByKey } from "design-system-old";
import styled from "styled-components";
import { TemplateLayout } from "./index";

const LargeTemplate = styled(TemplateLayout)`
  border: 1px solid ${Colors.GEYSER_LIGHT};
  display: flex;
  flex: 1;
  flex-direction: column;
  cursor: pointer;
  &:hover {
    box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.1),
      0px 8px 8px -4px rgba(16, 24, 40, 0.04);
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

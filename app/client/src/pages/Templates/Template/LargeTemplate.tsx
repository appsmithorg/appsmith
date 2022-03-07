import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";
import styled from "styled-components";
import { TemplateLayout } from "./index";

const LargeTemplate = styled(TemplateLayout)`
  border: 1px solid ${Colors.GEYSER_LIGHT};
  display: flex;
  flex: 1;
  flex-direction: column;
  max-width: 50%;
  cursor: pointer;
  &:hover {
    box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.1),
      0px 8px 8px -4px rgba(16, 24, 40, 0.04);
  }

  && {
    .title {
      ${(props) => getTypographyByKey(props, "h1")}
    }
    .categories {
      ${(props) => getTypographyByKey(props, "h4")}
      font-weight: normal;
    }
    .description {
      ${(props) => getTypographyByKey(props, "p1")}
      flex: 1;
    }
  }

  .image-wrapper {
    padding: ${(props) =>
      `${props.theme.spaces[9]}px ${props.theme.spaces[11]}px ${props.theme.spaces[0]}px`};
    transition: all 1s ease-out;
    width: 100%;
    height: 270px;
  }

  .fork-button {
    height: 38px;
    width: 38px;

    svg {
      height: 18px;
      width: 18px;
    }
  }
`;

export default LargeTemplate;

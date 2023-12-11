import styled from "styled-components";
import { TemplateLayout } from "./index";

const FixedHeightTemplate = styled(TemplateLayout)`
  && {
    .title {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1; /* Limit to 1 line */
      -webkit-box-orient: vertical;
    }
    .categories {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1; /* Limit to 1 line */
      -webkit-box-orient: vertical;
    }
    .description {
      height: 85px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 4; /* Limit to 4 lines */
      -webkit-box-orient: vertical;
    }
  }

  .image-wrapper {
    & > img {
      object-position: top;
      height: 180px;
    }
  }
`;

export default FixedHeightTemplate;

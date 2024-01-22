import styled from "styled-components";
import { TemplateLayout } from "./index";

const FixedHeightTemplate = styled(TemplateLayout)`
  && {
    .title {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }
    .categories {
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }
    .description {
      height: 85px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 4;
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

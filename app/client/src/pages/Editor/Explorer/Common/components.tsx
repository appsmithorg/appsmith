import styled from "styled-components";
import Entity, { EntityClassNames } from "../Entity";

export const MIN_PAGES_HEIGHT = 60;

export const RelativeContainer = styled.div`
  position: relative;
`;

export const StyledEntity = styled(Entity)<{ entitySize?: number }>`
  &.page.fullWidth {
    width: 100%;
  }
  &.pages > div:not(.t--entity-item) > div > div {
      max-height: 40vh;
      min-height: ${({ entitySize }) =>
        entitySize && entitySize > MIN_PAGES_HEIGHT
          ? MIN_PAGES_HEIGHT
          : entitySize}px;
      height: ${({ entitySize }) =>
        entitySize && entitySize > 128 ? 128 : entitySize}px;
      overflow-y: auto;
    }
  }

  &.page .${EntityClassNames.PRE_RIGHT_ICON} {
    width: 20px;
    right: 0;
  }

  &.page:hover {
    & .${EntityClassNames.PRE_RIGHT_ICON} {
      display: none;
    }
  }
`;

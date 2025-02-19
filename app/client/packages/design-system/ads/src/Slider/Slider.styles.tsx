import styled from "styled-components";
import { SliderFocusVisibleClassName } from "./Slider.constants";

export const StyledSlider = styled.div<{
  disabled?: boolean;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  touch-action: none;
  width: 100%;
  padding: 0 calc(var(--ads-v2-spaces-5) / 2) calc(var(--ads-v2-spaces-5) / 2);

  ${({ disabled }) =>
    disabled &&
    `
      opacity: 0.6;
      cursor: not-allowed !important;
    `}

  ${"." + SliderFocusVisibleClassName} {
    --ads-v2-offset-outline: 1px;

    outline: var(--ads-v2-border-width-outline) solid
      var(--ads-v2-color-outline);
    outline-offset: var(--ads-v2-offset-outline);
  }
`;

export const SliderLabel = styled.div`
  display: flex;
  align-self: stretch;
  justify-content: space-between;
  margin: 0 calc(var(--ads-v2-spaces-5) / 2 * -1) var(--ads-v2-spaces-3);

  span {
    flex-grow: 1;
    text-align: end;
  }
`;

export const Thumb = styled.div`
  position: absolute;
  transform: translateX(-50%);
  width: var(--ads-v2-spaces-5);
  height: var(--ads-v2-spaces-5);
  border-radius: 50%;
  box-sizing: border-box;
  background-color: var(--ads-v2-color-bg-brand-secondary);
  cursor: pointer;
  top: 0;

  &:hover {
    background-color: var(--ads-v2-color-bg-brand-secondary-emphasis);
  }
  &:active {
    background-color: var(--ads-v2-color-bg-brand-secondary-emphasis-plus);
  }
`;

export const Rail = styled.div`
  position: absolute;
  background-color: var(--ads-v2-color-bg-emphasis);
  height: var(--ads-v2-spaces-1);
  transform: translateY(-50%);
  width: calc(100% + var(--ads-v2-spaces-5));
  margin-inline-start: calc(var(--ads-v2-spaces-5) / 2 * -1);
`;

export const FilledRail = styled.div`
  position: absolute;
  height: var(--ads-v2-spaces-2);
  background-color: var(--ads-v2-color-bg-emphasis-plus);
  transform: translateY(-50%);
  left: 0;
  margin-inline-start: calc(var(--ads-v2-spaces-5) / 2 * -1);
`;

export const TrackContainer = styled.div`
  position: relative;
  width: 100%;
  height: 0;
`;

export const Track = styled.div`
  position: relative;
  height: var(--ads-v2-spaces-4);
  width: 100%;
`;

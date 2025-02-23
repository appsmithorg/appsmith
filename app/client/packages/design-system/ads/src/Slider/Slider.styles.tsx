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
  padding: 0 calc(var(--ads-v2-spaces-5) / 2) var(--ads-v2-spaces-4);

  ${({ disabled }) =>
    disabled &&
    `
      opacity: var(--ads-v2-opacity-disabled);
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
  width: var(--ads-v2-spaces-5);
  height: var(--ads-v2-spaces-5);
  border-radius: 50%;
  box-sizing: border-box;
  background-color: var(--ads-v2-color-bg);
  border: 1px solid var(--ads-v2-color-border);
  cursor: pointer;
  top: 0;

  ${StyledSlider}:hover:not([disabled]) & {
    box-shadow: 0 1px var(--ads-v2-spaces-2) 0 rgba(76, 86, 100, 0.18);
  }
`;

export const Rail = styled.div`
  position: absolute;
  background-color: var(--ads-v2-color-border);
  height: var(--ads-v2-spaces-1);
  transform: translateY(-50%);
  width: calc(100% + var(--ads-v2-spaces-5));
  margin-inline-start: calc(var(--ads-v2-spaces-5) / 2 * -1);
  border-radius: var(--ads-v2-border-width-outline);

  ${StyledSlider}:hover:not([disabled]) & {
    background-color: var(--ads-v2-color-border-emphasis);
  }
`;

export const FilledRail = styled.div`
  position: absolute;
  height: var(--ads-v2-spaces-2);
  background-color: var(--ads-v2-color-border-brand-secondary);
  transform: translateY(-50%);
  left: 0;
  margin-inline-start: calc(var(--ads-v2-spaces-5) / 2 * -1);
  border-radius: var(--ads-v2-border-width-outline) 0 0
    var(--ads-v2-border-width-outline);

  ${StyledSlider}:hover:not([disabled]) & {
    background-color: var(--ads-v2-color-border-brand-secondary-emphasis);
  }
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

import { Alignment, Classes } from "@blueprintjs/core";
import type { LabelPosition } from "components/constants";
import { Colors } from "constants/Colors";
import { css } from "styled-components";

export const BlueprintControlTransform = css`
  && {
    .${Classes.CONTROL}.${Classes.DISABLED} {
      color: ${Colors.GREY_8};
    }
    .${Classes.CONTROL} {
      & input:checked ~ .${Classes.CONTROL_INDICATOR} {
        background: ${(props) => props.theme.colors.primaryOld};
        box-shadow: none;
        border: 1px solid ${(props) => props.theme.colors.primaryOld};
      }

      &
        input:invalid:not(:disabled):not(:checked)
        ~ .${Classes.CONTROL_INDICATOR} {
        border: 1px solid var(--wds-color-border-danger);
      }

      &:hover
        input:invalid:not(:disabled):not(:checked)
        ~ .${Classes.CONTROL_INDICATOR} {
        border: 1px solid var(--wds-color-border-danger-hover) !important;
      }

      & input:disabled:not(:checked) ~ .${Classes.CONTROL_INDICATOR} {
        background-color: var(--wds-color-bg-disabled) !important;
        border: 1px solid var(--wds-color-border-disabled) !important;
      }

      & input:disabled:checked ~ .${Classes.CONTROL_INDICATOR} {
        background-color: var(--wds-color-bg-disabled) !important;
        border: 1px solid var(--wds-color-border-disabled) !important;
      }

      &:hover input:not(:checked):not(:disabled) ~ .bp3-control-indicator,
      & input:not(:checked):not(:disabled):focus ~ .bp3-control-indicator {
        border: 1px solid var(--wds-color-bg-disabled-strong) !important;
      }
    }

    .${Classes.SWITCH} {
      & input ~ .${Classes.CONTROL_INDICATOR} {
        transition: none;

        &::before {
          box-shadow: none;
        }
      }
      input:checked ~ .${Classes.CONTROL_INDICATOR} {
        &::before {
          left: calc(105% - 1em);
        }
      }
      input:not(:checked) ~ .${Classes.CONTROL_INDICATOR} {
        background: var(--wds-color-bg-strong);
        border: 1px solid var(--wds-color-border);
      }

      input:disabled ~ .${Classes.CONTROL_INDICATOR} {
        background: var(--wds-color-bg-disabled) !important;
        &::before {
          background: var(--wds-color-bg-disabled-strong);
        }
      }

      &:hover input:not(:checked):not(:disabled) ~ .bp3-control-indicator,
      input:not(:checked):not(:disabled):focus ~ .bp3-control-indicator {
        background: var(--wds-color-bg-strong-hover);
        border: 1px solid var(--wds-color-border-hover) !important;
      }
    }

    .${Classes.CONTROL_INDICATOR} {
      &::before {
        position: absolute;
        left: -1px;
        top: -1px;
      }
    }
  }
`;

export const BlueprintRadioSwitchGroupTransform = css<{
  alignment: Alignment;
  height?: number;
  inline: boolean;
  labelPosition?: LabelPosition;
  optionCount: number;
}>`
  width: 100%;
  height: 100%;

  ${({ inline, optionCount }) => `
  display: ${inline ? "inline-flex" : "flex"};
    flex-direction: ${inline ? "row" : "column"};
    align-items: ${inline ? "center" : "flex-start"};
    ${inline && "flex-wrap: wrap"};
    justify-content: ${
      optionCount > 1 ? `space-between` : inline ? `flex-start` : `center`
    };
    gap: 10px;
    flex-grow: 1;
  `}

  ${BlueprintControlTransform};
  .${Classes.CONTROL} {
    display: ${({ alignment, inline }) => {
      if (alignment === Alignment.RIGHT) {
        return inline ? "inline-block" : "block";
      }
      return "flex";
    }};
    width: ${({ alignment, inline }) => {
      if (alignment === Alignment.RIGHT) {
        return inline ? "auto" : "100%";
      }
      return "auto";
    }};
    align-items: center;
    border: 1px solid transparent;
    color: ${Colors.GREY_10};
    line-height: 16px;

    .bp3-control-indicator {
      margin-top: 0;
      border: 1px solid ${Colors.GREY_5};
      box-shadow: none;
      background-image: none;
      background-color: white;
    }
  }
`;

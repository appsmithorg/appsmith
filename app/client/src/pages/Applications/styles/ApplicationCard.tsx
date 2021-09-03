import React from "react";
import styled from "styled-components";
import { Card, Classes, HTMLDivProps, ICardProps } from "@blueprintjs/core";
import { omit } from "lodash";
import { Classes as CsClasses } from "components/ads/common";
import { getColorWithOpacity } from "constants/DefaultTheme";
import Button from "components/ads/Button";

type NameWrapperProps = {
  hasReadPermission: boolean;
  showOverlay: boolean;
  isMenuOpen: boolean;
};

export const NameWrapper = styled((props: HTMLDivProps & NameWrapperProps) => (
  <div {...omit(props, ["hasReadPermission", "showOverlay", "isMenuOpen"])} />
))`
  .bp3-card {
    border-radius: 0;
    box-shadow: none;
  }
  ${(props) =>
    props.showOverlay &&
    `
      {
        background-color: ${props.theme.colors.card.hoverBorder}};
        justify-content: center;
        align-items: center;

        .overlay {
          ${props.hasReadPermission &&
            `text-decoration: none;
             &:after {
                left: 0;
                top: 0;
                content: "";
                position: absolute;
                height: 100%;
                width: 100%;
              }
              & .control {
                display: block;
                z-index: 1;
              }`}

          & div.image-container {
            background: ${
              props.hasReadPermission && !props.isMenuOpen
                ? getColorWithOpacity(
                    props.theme.colors.card.hoverBG,
                    props.theme.colors.card.hoverBGOpacity,
                  )
                : null
            }
          }
        }
      }
   `}
  overflow: hidden;
`;

export const Wrapper = styled(
  (
    props: ICardProps & {
      hasReadPermission?: boolean;
      backgroundColor: string;
    },
  ) => <Card {...omit(props, ["hasReadPermission", "backgroundColor"])} />,
)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: ${(props) => props.theme.card.minWidth}px;
  height: ${(props) => props.theme.card.minHeight}px;
  position: relative;
  background-color: ${(props) => props.backgroundColor};
  margin: ${(props) => props.theme.spaces[5]}px;
  .overlay {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    ${(props) => !props.hasReadPermission && `pointer-events: none;`}
  }
  .bp3-card {
    border-radius: 0;
  }
  .${CsClasses.APP_ICON} {
    margin: 0 auto;
    svg {
      path {
        fill: #fff;
      }
    }
  }
`;

export const ApplicationImage = styled.div`
  && {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    & {
      .control {
        button {
          span {
            font-weight: ${(props) => props.theme.fontWeights[3]};
            color: white;
          }
        }
      }
    }
  }
`;

export const Control = styled.div<{ fixed?: boolean }>`
  outline: none;
  border: none;
  cursor: pointer;

  .${Classes.BUTTON} {
    margin-top: 7px;

    div {
      width: auto;
      height: auto;
    }
  }

  .${Classes.BUTTON_TEXT} {
    font-size: 12px;
    color: white;
  }

  .more {
    position: absolute;
    right: ${(props) => props.theme.spaces[6]}px;
    top: ${(props) => props.theme.spaces[4]}px;
  }
`;

export const MoreOptionsContainer = styled.div`
  width: 22px;
  height: 22px;
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const AppNameWrapper = styled.div<{ isFetching: boolean }>`
  padding: 12px;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 12px;
  ${(props) =>
    props.isFetching
      ? `
    width: 119px;
    height: 16px;
    margin-left: 10px;
  `
      : null};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* number of lines to show */
  -webkit-box-orient: vertical;
  word-break: break-word;
  color: ${(props) => props.theme.colors.text.heading};
`;

export const EditButton = styled(Button)`
  margin-bottom: 8px;
`;

export const ContextDropdownWrapper = styled.div`
  position: absolute;
  top: -6px;
  right: -3px;

  .${Classes.POPOVER_TARGET} {
    span {
      svg {
        path {
          fill: ${(props) => props.theme.colors.card.iconColor};
        }
      }
    }
  }
`;

import type { ForwardedRef } from "react";
import React, { useState } from "react";
import clsx from "classnames";

import type {
  AvatarGroupAvatarProps,
  AvatarGroupProps,
  AvatarProps,
} from "./Avatar.types";
import {
  AvatarEmail,
  AvatarMenuItem,
  StyledAvatar,
  StyledAvatarGroup,
} from "./Avatar.styles";
import { Icon } from "../Icon";
import {
  AvatarClassName,
  AvatarImageClassName,
  AvatarSvgClassName,
  AvatarLetterClassName,
  AvatarGroupClassName,
  AvatarGroupShowMoreClassName,
} from "./Avatar.constants";
import type { TooltipPlacement } from "../Tooltip";
import { Tooltip } from "../Tooltip";
import { Menu, MenuItem, MenuTrigger } from "../Menu";
import { MenuContent } from "../Menu";

const Avatar = React.forwardRef(
  (props: AvatarProps, ref: ForwardedRef<HTMLSpanElement>) => {
    const {
      className,
      firstLetter,
      image,
      isTooltipEnabled = true,
      label,
      size = "md",
      svgIconName = "user-3-line",
      tooltipPlacement = "bottom",
      ...rest
    } = props;
    const [hasErrorLoadingImage, setHasErrorLoadingImage] = useState(false);
    const shouldRenderImage = image && !hasErrorLoadingImage;

    let tooltipProps: {
      content: string | React.ReactNode;
      placement: TooltipPlacement;
      visible?: boolean;
    } = {
      content: label,
      placement: tooltipPlacement,
    };

    if (!isTooltipEnabled) {
      tooltipProps = {
        ...tooltipProps,
        visible: false,
      };
    }

    return (
      <Tooltip {...tooltipProps}>
        <StyledAvatar
          aria-label={label}
          className={clsx(AvatarClassName, className)}
          size={size}
          {...rest}
          ref={ref}
        >
          {image && !hasErrorLoadingImage && (
            <img
              alt={`${label}'s profile picture`}
              className={AvatarImageClassName}
              onError={() => setHasErrorLoadingImage(true)}
              onLoad={() => setHasErrorLoadingImage(false)}
              src={image}
            />
          )}
          {!shouldRenderImage && firstLetter && (
            <span className={AvatarSvgClassName}>
              {firstLetter.slice(0, 2)}
            </span>
          )}
          {!shouldRenderImage && !firstLetter && label && (
            <span className={AvatarSvgClassName}>{label.slice(0, 1)}</span>
          )}
          {!shouldRenderImage && !firstLetter && !label && (
            <Icon
              className={AvatarLetterClassName}
              name={svgIconName}
              size={size}
            />
          )}
        </StyledAvatar>
      </Tooltip>
    );
  },
);

Avatar.displayName = "Avatar";

Avatar.defaultProps = {};

function AvatarGroup(props: AvatarGroupProps) {
  const {
    avatars,
    className,
    maxAvatars = 3,
    size = "md",
    tooltipPlacement = "bottom",
  } = props;
  const mainAvatars = avatars.slice(0, maxAvatars);
  const restAvatars = avatars.slice(maxAvatars);

  return (
    <StyledAvatarGroup className={clsx(AvatarGroupClassName, className)}>
      {mainAvatars.map((avatar: AvatarGroupAvatarProps, index: number) => {
        return (
          <Avatar
            className={avatar.className}
            firstLetter={avatar.firstLetter}
            image={avatar.image}
            key={index.toString()}
            label={avatar.label}
            size={size}
            svgIconName={avatar.svgIconName}
            tooltipPlacement={tooltipPlacement}
          />
        );
      })}
      {restAvatars.length > 1 && (
        <Menu>
          <MenuTrigger>
            <Avatar
              className={clsx(AvatarClassName, AvatarGroupShowMoreClassName)}
              firstLetter={`${
                restAvatars.length > 9 ? 9 : restAvatars.length
              }+`}
              label="Show More"
              size={size}
              tooltipPlacement={tooltipPlacement}
            />
          </MenuTrigger>
          <MenuContent loop>
            {restAvatars.map(
              (avatar: AvatarGroupAvatarProps, index: number) => {
                return (
                  <MenuItem key={index.toString()} size={size}>
                    <AvatarMenuItem>
                      <Avatar
                        className={avatar.className}
                        firstLetter={avatar.firstLetter}
                        image={avatar.image}
                        label={avatar.label}
                        size={size}
                        svgIconName={avatar.svgIconName}
                        tooltipPlacement={tooltipPlacement}
                      />
                      <AvatarEmail>{avatar.label}</AvatarEmail>
                    </AvatarMenuItem>
                  </MenuItem>
                );
              },
            )}
          </MenuContent>
        </Menu>
      )}
    </StyledAvatarGroup>
  );
}

export { Avatar, AvatarGroup };

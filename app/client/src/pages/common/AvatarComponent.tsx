import React from "react";
import { Avatar } from "@appsmith/ads";

export interface AvatarProps {
  className?: string;
  commonName?: string;
  userName?: string;
  size: string;
  source?: string;
  label?: string;
  isTooltipEnabled?: boolean;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AvatarComponent(props: any) {
  const getInitials = (name: string) => {
    const names = name.split(" ");
    let initials = names[0].substring(0, 1).toUpperCase();

    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }

    return initials;
  };

  return (
    <Avatar
      className={props.className}
      firstLetter={getInitials(props.commonName || props.userName)}
      image={props.source}
      isTooltipEnabled={props.isTooltipEnabled}
      label={props.label}
      size={props.size}
    />
  );
}

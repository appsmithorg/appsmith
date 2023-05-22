import React from "react";
import { Avatar } from "design-system";

export type AvatarProps = {
  className?: string;
  commonName?: string;
  userName?: string;
  size: string;
  source?: string;
  label?: string;
};

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
      label={props.label}
      size={props.size}
    />
  );
}

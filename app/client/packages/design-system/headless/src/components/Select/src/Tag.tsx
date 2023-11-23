import React from "react";
import type { DOMAttributes, MouseEvent } from "react";
import type { FocusableElement } from "@react-types/shared";

export type Props = DOMAttributes<FocusableElement> & {
  label: string;
  type?: any;
  size?: any;
  onRemove?: (event: MouseEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  ellipsis?: boolean;
  noWrap?: boolean;
  tabIndex?: number;
};

export const Tag = ({ label, onRemove, tabIndex, ...rest }: Props) => {
  return (
    <div {...rest} tabIndex={tabIndex}>
      <div>{label}</div>

      {Boolean(onRemove) && (
        <div onClickCapture={onRemove} role="button" tabIndex={-1}>
          x
        </div>
      )}
    </div>
  );
};

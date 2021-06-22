import * as React from "react";
import {
  Alignment,
  Button,
  ButtonGroup,
  IButtonProps,
} from "@blueprintjs/core";

import BaseControl, { ControlProps } from "./BaseControl";
import { ControlIcons } from "icons/ControlIcons";
import { ThemeProp } from "components/ads/common";

export interface IconAlignControlProps extends ControlProps {
  propertyValue: Alignment | undefined;
  onChange: (align: Alignment) => void;
}

class IconAlignControl extends BaseControl<IconAlignControlProps> {
  constructor(props: IconAlignControlProps) {
    super(props);
  }

  static getControlType() {
    return "ICON_ALIGN";
  }

  public render() {
    const { propertyValue } = this.props;

    return (
      <ButtonGroup fill>
        <Button
          active={propertyValue === Alignment.LEFT || undefined}
          css={`
            border: ${(props: ThemeProp & IButtonProps) =>
              props.active ? `1px solid #6A86CE` : `none`};
            &.bp3-active {
              background-color: transparent !important;
            }
          `}
          icon={<ControlIcons.ICON_ALIGN_LEFT color="#979797" />}
          onClick={() => this.handleAlign(Alignment.LEFT)}
        />
        <Button
          active={propertyValue === Alignment.RIGHT}
          css={`
            border: ${(props: ThemeProp & IButtonProps) =>
              props.active ? `1px solid #6A86CE` : `none`};
            &.bp3-active {
              background-color: transparent !important;
            }
          `}
          icon={<ControlIcons.ICON_ALIGN_RIGHT color="#979797" />}
          onClick={() => this.handleAlign(Alignment.RIGHT)}
        />
      </ButtonGroup>
    );
  }

  private handleAlign = (align: Alignment) => {
    this.updateProperty(this.props.propertyName, align);
  };
}

export default IconAlignControl;

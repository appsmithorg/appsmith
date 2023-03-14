import { WidgetProps } from "widgets/BaseWidget";
import { Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import { ButtonPlacement } from "components/constants";

export interface CodeScannerWidgetProps extends WidgetProps {
  label: string;
  isDisabled: boolean;
  tooltip?: string;
  onCodeDetected?: string;
  buttonColor: string;
  borderRadius: string;
  boxShadow?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  placement?: ButtonPlacement;
  scannerLayout: ScannerLayout;
}

export enum ScannerLayout {
  ALWAYS_ON = "ALWAYS_ON",
  CLICK_TO_SCAN = "CLICK_TO_SCAN",
}

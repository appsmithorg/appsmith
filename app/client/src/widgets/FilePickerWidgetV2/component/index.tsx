import React, { useMemo, useCallback } from "react";
import { ComponentProps } from "widgets/BaseComponent";
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import "@uppy/webcam/dist/style.css";
import { BaseButton } from "widgets/ButtonWidget/component";
import { Colors } from "constants/Colors";
import { FALLBACK_COLORS } from "constants/ThemeConstants";

function FilePickerComponent(props: FilePickerComponentProps) {
  const label = useMemo(() => {
    let computedLabel = props.label;

    if (props.files && props.files.length) {
      computedLabel = `${props.files.length} files selected`;
    }

    return computedLabel;
  }, [props.label, props.files]);

  /**
   * opens modal
   */
  const openModal = useCallback(() => {
    props.uppy.getPlugin("Dashboard").openModal();
  }, [props.uppy, props.isDisabled]);

  return (
    <BaseButton
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      buttonColor={props.backgroundColor}
      disabled={props.isDisabled}
      loading={props.isLoading}
      onClick={openModal}
      text={label}
    />
  );
}

FilePickerComponent.defaultProps = {
  backgroundColor: FALLBACK_COLORS.backgroundColor,
};

export interface FilePickerComponentProps extends ComponentProps {
  label: string;
  uppy: any;
  isLoading: boolean;
  files?: any[];
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
}

FilePickerComponent.defaultProps = {
  backgroundColor: Colors.GREEN,
};

export default FilePickerComponent;

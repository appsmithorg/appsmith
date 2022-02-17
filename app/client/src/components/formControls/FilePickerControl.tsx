import * as React from "react";
import { useState } from "react";
import styled from "styled-components";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import { BaseButton } from "components/designSystems/appsmith/BaseButton";
import { ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";
import FilePickerV2 from "components/ads/FilePickerV2";
import { FileType, SetProgress } from "components/ads/FilePicker";
import {
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import DialogComponent from "components/ads/DialogComponent";
import { useEffect, useCallback } from "react";
import { replayHighlightClass } from "globalStyles/portals";

const StyledDiv = styled.div`
  flex: 1;
  border: 1px solid #d3dee3;
  border-right: none;
  padding: 6px 12px;
  font-size: 14px;
  color: #768896;
`;

const SelectButton = styled(BaseButton)`
  &&&& {
    max-width: 59px;
    margin: 0 0px;
    min-height: 32px;
    border-radius: 0px;
    font-weight: bold;
    background-color: #fff;
    border-color: ${Colors.PRIMARY_ORANGE} !important;
    font-size: 14px;
    &.bp3-button {
      padding: 0px 0px;
    }
    span {
      color: ${Colors.PRIMARY_ORANGE} !important;
      font-weight: 400;
    }
    &:hover:enabled,
    &:active:enabled {
      background: rgba(248, 106, 43, 0.1) !important;
    }
  }
`;

const FilePickerWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

type RenderFilePickerProps = FilePickerControlProps & {
  input?: WrappedFieldInputProps;
  meta?: WrappedFieldMetaProps;
  disabled?: boolean;
  onChange: (event: any) => void;
};

function RenderFilePicker(props: RenderFilePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [appFileToBeUploaded, setAppFileToBeUploaded] = useState<{
    file: File;
    setProgress: SetProgress;
  } | null>(null);

  const FileUploader = useCallback(
    async (file: File, setProgress: SetProgress) => {
      if (!!file) {
        setAppFileToBeUploaded({
          file,
          setProgress,
        });
      } else {
        setAppFileToBeUploaded(null);
      }
    },
    [],
  );

  const onRemoveFile = useCallback(() => setAppFileToBeUploaded(null), []);

  useEffect(() => {
    if (appFileToBeUploaded?.file) {
      const reader = new FileReader();
      reader.readAsDataURL(appFileToBeUploaded?.file);
      reader.onloadend = () => {
        const base64data = reader.result;
        props.input?.onChange({
          name: appFileToBeUploaded?.file.name,
          base64Content: base64data,
        });
      };
    }
  }, [appFileToBeUploaded]);

  return (
    <>
      <div
        className={replayHighlightClass}
        style={{ flexDirection: "row", display: "flex", width: "20vw" }}
      >
        <StyledDiv>{props?.input?.value?.name}</StyledDiv>
        <SelectButton
          buttonStyle="PRIMARY"
          buttonVariant={ButtonVariantTypes.SECONDARY}
          disabled={props.disabled}
          onClick={() => {
            setIsOpen(true);
          }}
          text={"Select"}
        />
      </div>
      {isOpen ? (
        <DialogComponent
          canOutsideClickClose
          isOpen={isOpen}
          maxHeight={"540px"}
          setModalClose={() => setIsOpen(false)}
        >
          <FilePickerWrapper>
            <FilePickerV2
              delayedUpload
              fileType={FileType.ANY}
              fileUploader={FileUploader}
              onFileRemoved={onRemoveFile}
            />
          </FilePickerWrapper>
        </DialogComponent>
      ) : null}
    </>
  );
}
class FilePickerControl extends BaseControl<FilePickerControlProps> {
  constructor(props: FilePickerControlProps) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  render() {
    const { configProperty, disabled } = this.props;
    return (
      <Field
        component={RenderFilePicker}
        disabled={disabled}
        name={configProperty}
      />
    );
  }

  getControlType(): ControlType {
    return "FILE_PICKER";
  }
}

export interface FilePickerComponentState {
  isOpen: boolean;
}

export type FilePickerControlProps = ControlProps;

export default FilePickerControl;

import React, { useState } from "react";
import { ComponentProps } from "widgets/BaseComponent";
import { BaseButton } from "widgets/ButtonWidget/component";
import { Colors } from "constants/Colors";
import Modal from "react-modal";
import { QrReader } from "react-qr-reader";
import { ViewFinder } from "./ViewFinder";
import { createGlobalStyle } from "styled-components";
import CloseIcon from "assets/icons/ads/cross.svg";

const QRScannerGlobalStyles = createGlobalStyle<{
  borderRadius?: string;
  boxShadow?: string;
}>`
  .qr-scanner-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2000;
    height: 90%;
    max-height: 500px;
    width: 90%;
    max-width: 500px;
    border-radius: ${({ borderRadius }) => borderRadius};
    box-shadow: ${({ boxShadow }) => boxShadow};
    background-color: white;
  }

  .qr-scanner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(16, 22, 26, 0.7);
    z-index: 3;
  }

  .qr-scanner-close {
    background-color: white;
    width: 32px;
    height: 32px;
    text-align: center;
    position: absolute;
    top: -36px;
    right: -2px;
    border-radius: ${({ borderRadius }) => borderRadius};
    background-image: url(${CloseIcon});
    background-repeat: no-repeat;
    background-position: center;
  }

  @media only screen and (min-width: 820px) {
    .qr-scanner-close {
      right: -36px;
    }
  }

  .qr-camera-container {
    border-radius: ${({ borderRadius }) => borderRadius};
    overflow: hidden;
    height: 100%;
  }

  .qr-camera {
    height: 100%;
  }
`;

// Make sure to bind modal to your appElement (https://reactcommunity.org/react-modal/accessibility/)
Modal.setAppElement("#root");

function QRScannerComponent(props: QRScannerComponentProps) {
  const [modalIsOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <>
      <BaseButton
        borderRadius={props.borderRadius}
        boxShadow={props.boxShadow}
        buttonColor={props.buttonColor}
        disabled={props.isDisabled}
        onClick={openModal}
        text={props.label}
      />

      <QRScannerGlobalStyles
        borderRadius={props.borderRadius}
        boxShadow={props.boxShadow}
      />

      <Modal
        className="qr-scanner-content"
        isOpen={modalIsOpen}
        overlayClassName="qr-scanner-overlay"
      >
        {modalIsOpen && (
          <div className="qr-camera-container">
            <QrReader
              ViewFinder={ViewFinder}
              className="qr-camera"
              constraints={{ facingMode: "environment" }}
              onResult={(result, error) => {
                if (!!result) {
                  setIsOpen(false);
                  props.updateValue(result.getText());
                }

                if (!!error) {
                  console.info(error);
                }
              }}
              videoContainerStyle={{ height: "100%" }}
              videoStyle={{ objectFit: "cover" }}
            />
          </div>
        )}
        <button className="qr-scanner-close" onClick={closeModal} />
      </Modal>
    </>
  );
}
export interface QRScannerComponentProps extends ComponentProps {
  label: string;
  buttonColor: string;
  borderRadius: string;
  boxShadow?: string;
  updateValue: (value: any) => void;
}

QRScannerComponent.defaultProps = {
  backgroundColor: Colors.GREEN,
};

export default QRScannerComponent;

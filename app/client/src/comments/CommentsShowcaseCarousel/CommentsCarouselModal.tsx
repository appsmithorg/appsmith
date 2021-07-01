import React from "react";
import ModalComponent from "components/designSystems/blueprint/ModalComponent";
import { Layers } from "constants/Layers";

function ShowcaseCarouselModal({ children }: { children: React.ReactNode }) {
  return (
    <ModalComponent
      bottom={25}
      canEscapeKeyClose
      canOutsideClickClose
      data-cy={"help-modal"}
      hasBackDrop={false}
      isOpen
      left={25}
      onClose={() => {
        console.log("handle close");
      }}
      overlayClassName="comments-onboarding-carousel"
      portalClassName="comments-onboarding-carousel-portal"
      scrollContents
      width={325}
      zIndex={Layers.appComments}
    >
      {children}
    </ModalComponent>
  );
}

export default ShowcaseCarouselModal;

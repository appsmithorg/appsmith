import React from "react";
import { Layers } from "constants/Layers";
import ModalComponent from "components/designSystems/appsmith/ModalComponent";

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
        // TODO (rishabh) handle close
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

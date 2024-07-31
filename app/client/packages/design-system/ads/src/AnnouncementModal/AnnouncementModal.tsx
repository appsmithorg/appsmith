import React from "react";
import { Modal } from "../Modal";

import type { AnnouncementModalProps } from "./AnnouncementModal.types";
import {
  StyledModalContent,
  BannerImage,
  BannerContent,
  BannerData,
  BannerTitle,
  BannerFooter,
} from "./AnnouncementModal.styles";
import { Text } from "../Text";
import { Tag } from "../Tag";
import {
  AnnouncementModalBannerClassName,
  AnnouncementModalClassName,
  AnnouncementModalContentClassName,
  AnnouncementModalContentDataClassName,
  AnnouncementModalContentFooterClassName,
} from "./AnnouncementModal.constants";

function AnnouncementModal({
  banner,
  description,
  footer,
  isBeta,
  isOpen,
  title,
}: AnnouncementModalProps) {
  return (
    <Modal open={isOpen}>
      <StyledModalContent className={AnnouncementModalClassName}>
        <BannerImage
          className={AnnouncementModalBannerClassName}
          url={banner}
        />
        <BannerContent className={AnnouncementModalContentClassName}>
          <BannerData className={AnnouncementModalContentDataClassName}>
            <BannerTitle>
              <Text kind="heading-m">{title}</Text>
              {isBeta ? (
                <Tag isClosable={false} size="md">
                  Beta
                </Tag>
              ) : null}
            </BannerTitle>
            <Text kind="body-m">{description}</Text>
          </BannerData>
          <BannerFooter className={AnnouncementModalContentFooterClassName}>
            {footer}
          </BannerFooter>
        </BannerContent>
      </StyledModalContent>
    </Modal>
  );
}

AnnouncementModal.displayName = "AnnouncementModal";

export { AnnouncementModal };

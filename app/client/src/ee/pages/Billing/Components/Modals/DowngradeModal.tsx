import { showDowngradeLicenseModal } from "@appsmith/actions/tenantActions";
import {
  DOWNGRADE_CALLOUT_SUBTEXT_1,
  DOWNGRADE_CALLOUT_SUBTEXT_2,
  CONFIRM,
  CANCEL,
  createMessage,
  LEARN_MORE,
  DOWNGRADE_CALLOUT_TEXT,
  DOWNGRADE,
} from "@appsmith/constants/messages";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Callout,
  Button,
  Link,
  Text,
} from "design-system";
import React from "react";
import { useDispatch } from "react-redux";

export interface DowngradeModalProps {
  isOpen?: boolean;
  onUpdateLicenseClick?: () => void;
  isExpired?: boolean;
}

export default function DowngradeModal(props: DowngradeModalProps) {
  const dispatch = useDispatch();

  return (
    <Modal
      onOpenChange={(open: boolean) =>
        dispatch(showDowngradeLicenseModal(open))
      }
      open={props.isOpen}
    >
      <ModalContent style={{ width: "640px" }}>
        <ModalHeader>{createMessage(DOWNGRADE)}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div>
              {!props.isExpired && (
                <Callout data-testid="t--downgrade-callout" kind="info">
                  {createMessage(DOWNGRADE_CALLOUT_TEXT)}
                </Callout>
              )}
            </div>
            <div>
              <Text
                color="var(--ads-v2-color-bg-brand-secondary)"
                data-testid="t--downgrade-main-text"
                kind="body-m"
              >
                {createMessage(DOWNGRADE_CALLOUT_SUBTEXT_1)}
              </Text>
            </div>
            <div>
              <Text
                color="var(--ads-v2-color-bg-brand-secondary)"
                kind="body-m"
              >
                {createMessage(DOWNGRADE_CALLOUT_SUBTEXT_2)}
              </Text>
            </div>
            <div>
              <Link endIcon="share-2" to={DOCS_BASE_URL}>
                {createMessage(LEARN_MORE)}
              </Link>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                className="downgrade-license-btn-cancel"
                kind="secondary"
                onClick={() => dispatch(showDowngradeLicenseModal(false))}
                size="md"
              >
                {createMessage(CANCEL)}
              </Button>
              <Button
                className="downgrade-license-btn-confirm"
                kind="error"
                onClick={() => {
                  if (props.onUpdateLicenseClick) props.onUpdateLicenseClick();
                }}
                size="md"
              >
                {createMessage(CONFIRM)}
              </Button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

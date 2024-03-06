import { showDowngradeLicenseModal } from "@appsmith/actions/tenantActions";
import { DOWNGRADE_DOC } from "@appsmith/constants/BillingConstants";
import {
  DOWNGRADE_CALLOUT_SUBTEXT_2,
  CONFIRM,
  CANCEL,
  createMessage,
  DOWNGRADE_CALLOUT_TEXT,
  DOWNGRADE,
  DOWNGRADE_CALLOUT_SUBTEXT_1_EXPIRED,
  DOWNGRADE_CALLOUT_SUBTEXT_1_ACTIVE,
  VISIT_DOCS,
} from "@appsmith/constants/messages";
import {
  getIsFormLoginEnabled,
  isLicenseValidating,
} from "@appsmith/selectors/tenantSelectors";
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
import { useDispatch, useSelector } from "react-redux";

export interface DowngradeModalProps {
  isOpen?: boolean;
  onUpdateLicenseClick?: () => void;
  isExpired?: boolean;
}

export default function DowngradeModal(props: DowngradeModalProps) {
  const dispatch = useDispatch();
  const isValidating = useSelector(isLicenseValidating);
  const isFormLoginEnabled = useSelector(getIsFormLoginEnabled);

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
            {!props.isExpired && (
              <div>
                <Callout data-testid="t--downgrade-callout" kind="info">
                  {createMessage(DOWNGRADE_CALLOUT_TEXT)}
                </Callout>
              </div>
            )}

            <div>
              <Text
                color="var(--ads-v2-color-bg-brand-secondary)"
                data-testid="t--downgrade-main-text"
                kind="body-m"
              >
                {props.isExpired
                  ? createMessage(DOWNGRADE_CALLOUT_SUBTEXT_1_EXPIRED)
                  : createMessage(DOWNGRADE_CALLOUT_SUBTEXT_1_ACTIVE)}
                <Link className="!inline-flex ml-1" to={DOWNGRADE_DOC}>
                  {createMessage(VISIT_DOCS)}
                </Link>
              </Text>
            </div>
            {!isFormLoginEnabled && (
              <div>
                <Text
                  color="var(--ads-v2-color-bg-brand-secondary)"
                  kind="body-m"
                >
                  {createMessage(DOWNGRADE_CALLOUT_SUBTEXT_2)}
                </Text>
              </div>
            )}
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
                isLoading={isValidating}
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

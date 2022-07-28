import React from "react";
import { SupportedKeyType } from "./SupportedKeyTypeList";
import MenuItem from "components/ads/MenuItem";
import { Icon, IconSize } from "components/ads";

/**
 * getMenuItems returns a list of options of SSH keys to generate
 * @param supportedKeys {SupportedKeyType[]}
 * @param setShowConfirmation {(value: ((prevState: boolean) => boolean) | boolean) => void}
 * @param setNewKeyType {(value: ((prevState: string) => string) | string) => void}
 * @return {JSX.Element}
 */
export function getMenuItems(
  supportedKeys: SupportedKeyType[],
  setShowConfirmation: (
    value: ((prevState: boolean) => boolean) | boolean,
  ) => void,
  setNewKeyType: (value: ((prevState: string) => string) | string) => void,
) {
  return supportedKeys.map((supportedKey: SupportedKeyType) => {
    return (
      <MenuItem
        cypressSelector={`t--regenerate-sshkey-${supportedKey.protocolName}`}
        key={`supported-key-${supportedKey.protocolName}-menu-item`}
        label={
          supportedKey.generated && (
            <Icon name="check-line" size={IconSize.XXXL} />
          )
        }
        onSelect={() => {
          setShowConfirmation(true);
          setNewKeyType(supportedKey.protocolName);
        }}
        text={supportedKey.text}
      />
    );
  });
}

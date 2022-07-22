import { SSHKeyType } from "actions/gitSyncActions";
export type SupportedKeyType = SSHKeyType & {
  text: string;
  generated: boolean;
};

/**
 * supportedKeyTypeList returns list of supported key types and releated data
 * @param keys {SSHKeyType[]}
 * @param generatedKeyType {string}
 * @returns {SupportedKeyType[]}
 */
export function supportedKeyTypeList(
  keys: SSHKeyType[],
  generatedKeyType: string,
): SupportedKeyType[] {
  return keys
    .sort((a, b) => a.protocolName.localeCompare(b.protocolName))
    .map((key: SSHKeyType) => ({
      ...key,
      text: `${key.protocolName} ${key.keySize}`,
      generated: key.protocolName === generatedKeyType,
    }));
}

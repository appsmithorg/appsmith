let isMac: boolean | undefined = undefined;
export function isMacOS(): boolean {
  if (isMac === undefined) {
    isMac = /^mac/i.test(window.navigator.platform);
  }
  return isMac;
}

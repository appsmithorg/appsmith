export const getFitPageChatHeight = (
  canvasHeight: number,
  isEmbed: boolean,
) => {
  if (isEmbed) return `calc(${canvasHeight}px`;

  return `calc(${canvasHeight}px - (var(--outer-spacing-4) * 2)`;
};

/** In case when sandbox is disabled in the admin settings, we just don't pass any sandbox permissions
 *
 * @param isSandboxDisabled - boolean - The value comes from the admin settings..
 */
export const getSandboxPermissions = (isSandboxDisabled: boolean) => {
  if (isSandboxDisabled) return undefined;

  return "allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-scripts";
};

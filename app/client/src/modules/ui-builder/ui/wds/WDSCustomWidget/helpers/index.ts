/**
 * Our canvas has some padding around it, so we need to subtract that padding from the canvas height to get the actual height of the widget.
 * If the widget is in embed mode, we don't need to subtract the padding since the canvas is not padded.
 *
 * @param canvasHeight - number - The height of the canvas. We calculate it in the widget's useLayoutEffect hook.
 * @param isEmbed - boolean - Whether the widget is in embed mode. This is derived from the query params.
 */
export const getFitPageChatHeight = (
  canvasHeight: number,
  isEmbed: boolean,
) => {
  if (isEmbed) return `calc(${canvasHeight}px`;

  return `calc(${canvasHeight}px - (var(--outer-spacing-4) * 2)`;
};

/**
 * In case when sandbox is disabled in the admin settings, we just don't pass any sandbox permissions.
 *
 * @param isSandboxDisabled - boolean - The value comes from the admin settings..
 */
export const getSandboxPermissions = (isSandboxDisabled: boolean) => {
  if (isSandboxDisabled) return undefined;

  return "allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-scripts";
};

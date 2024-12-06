export const getFitPageChatHeight = (
  canvasHeight: number,
  isEmbed: boolean,
) => {
  if (isEmbed) return `calc(${canvasHeight}px`;

  return `calc(${canvasHeight}px - (var(--outer-spacing-4) * 2)`;
};

export const getSandboxPermissions = (isSandboxDisabled: boolean) => {
  if (isSandboxDisabled) return undefined;

  return "allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-scripts";
};

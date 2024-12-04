export const getFitPageChatHeight = (
  canvasHeight: number,
  isEmbed: boolean,
) => {
  if (isEmbed) return `calc(${canvasHeight}px`;

  return `calc(${canvasHeight}px - (var(--outer-spacing-4) * 2) - var(--outer-spacing-3) * 2)`;
};

export const resetAnvilDnDListener = (
  anvilDnDListener: HTMLDivElement | null,
) => {
  if (anvilDnDListener) {
    anvilDnDListener.style.backgroundColor = "unset";
    anvilDnDListener.style.color = "unset";
    anvilDnDListener.innerText = "";
  }
};

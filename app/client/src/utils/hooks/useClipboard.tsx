import { MutableRefObject } from "react";

const writeToClipboard = async (
  text: string,
  el: HTMLElement,
  ref: MutableRefObject<HTMLElement | null>,
) => {
  if ("clipboard" in navigator) {
    try {
      await navigator.clipboard.writeText(text);
      el.childNodes[0].textContent = "Copied to clipboard!";
      el.classList.add("success");
      ref.current && ref.current.append(el);
    } catch (e) {
      el.childNodes[0].textContent = "Failed!";
      el.classList.add("error");
      ref.current && ref.current.append(el);
    }
    setTimeout(() => {
      ref.current?.removeChild(el);
    }, 1000);
  }
};

/* How it works:
    This hook takes a ref object as a paramter.
    
    Success in copying:
    It appends a div with the class .clipboard-message.success with text "Binding Copied!"
    to the element which the passed ref refers

    Error in copying:
    It appends a div with the class .clipboard-message.error with text "Failed!"
    to the element which the passed ref refers

    The component which implements the hook needs to add the appropriate styles
    to the clipboard success and error message div

    Messages get removed in 2 seconds. Not customizable at the moment.

    TODO(abhinav): Enhance this hook to make it more customizable.
*/
const useClipboard = (ref: MutableRefObject<HTMLElement | null>) => {
  const write = (text: string) => {
    const el = document.createElement("div");
    const content = document.createTextNode("");
    el.classList.add("clipboard-message");
    el.appendChild(content);
    writeToClipboard(text, el, ref);
  };
  return write;
};

export default useClipboard;

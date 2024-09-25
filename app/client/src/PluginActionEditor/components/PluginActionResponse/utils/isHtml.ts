import log from "loglevel";

const isHtml = (str: string): boolean => {
  try {
    const doc = new DOMParser().parseFromString(str, "text/html");

    // Check for parsing errors
    const parseError = doc.querySelector("parsererror");

    if (parseError) {
      return false;
    }

    // Check for at least one element node in the body
    return Array.from(doc.body.childNodes).some(
      (node: ChildNode) => node.nodeType === 1,
    );
  } catch (error) {
    log.error("Error parsing HTML:", error);

    return false;
  }
};

export default isHtml;

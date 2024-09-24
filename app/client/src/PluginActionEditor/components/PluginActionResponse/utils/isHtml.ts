const isHtml = (str: string) => {
  const doc = new DOMParser().parseFromString(str, "text/html");

  return Array.from(doc.body.childNodes).some(
    (node: ChildNode) => node.nodeType === 1,
  );
};

export default isHtml;

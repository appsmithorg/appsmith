// This is a hard-coded list of DOM APIs that linkedom provides. We’re hardcoding it instead of deriving it
// from documentMock because domApiNames are used in the main thread, and deriving them from linkedom
// will keep linkedom in the main thread’s bundle.
const DOM_API_NAMES = [
  "Attr",
  "CharacterData",
  "Comment",
  "CustomEvent",
  "DOMParser",
  "Document",
  "DocumentFragment",
  "DocumentType",
  "Element",
  "Event",
  "EventTarget",
  "Facades",
  "HTMLAnchorElement",
  "HTMLAreaElement",
  "HTMLAudioElement",
  "HTMLBRElement",
  "HTMLBaseElement",
  "HTMLBodyElement",
  "HTMLButtonElement",
  "HTMLCanvasElement",
  "HTMLClasses",
  "HTMLDListElement",
  "HTMLDataElement",
  "HTMLDataListElement",
  "HTMLDetailsElement",
  "HTMLDirectoryElement",
  "HTMLDivElement",
  "HTMLElement",
  "HTMLEmbedElement",
  "HTMLFieldSetElement",
  "HTMLFontElement",
  "HTMLFormElement",
  "HTMLFrameElement",
  "HTMLFrameSetElement",
  "HTMLHRElement",
  "HTMLHeadElement",
  "HTMLHeadingElement",
  "HTMLHtmlElement",
  "HTMLIFrameElement",
  "HTMLImageElement",
  "HTMLInputElement",
  "HTMLLIElement",
  "HTMLLabelElement",
  "HTMLLegendElement",
  "HTMLLinkElement",
  "HTMLMapElement",
  "HTMLMarqueeElement",
  "HTMLMediaElement",
  "HTMLMenuElement",
  "HTMLMetaElement",
  "HTMLMeterElement",
  "HTMLModElement",
  "HTMLOListElement",
  "HTMLObjectElement",
  "HTMLOptGroupElement",
  "HTMLOptionElement",
  "HTMLOutputElement",
  "HTMLParagraphElement",
  "HTMLParamElement",
  "HTMLPictureElement",
  "HTMLPreElement",
  "HTMLProgressElement",
  "HTMLQuoteElement",
  "HTMLScriptElement",
  "HTMLSelectElement",
  "HTMLSlotElement",
  "HTMLSourceElement",
  "HTMLSpanElement",
  "HTMLStyleElement",
  "HTMLTableCaptionElement",
  "HTMLTableCellElement",
  "HTMLTableElement",
  "HTMLTableRowElement",
  "HTMLTemplateElement",
  "HTMLTextAreaElement",
  "HTMLTimeElement",
  "HTMLTitleElement",
  "HTMLTrackElement",
  "HTMLUListElement",
  "HTMLUnknownElement",
  "HTMLVideoElement",
  "InputEvent",
  "Node",
  "NodeFilter",
  "NodeList",
  "SVGElement",
  "ShadowRoot",
  "Text",
  "illegalConstructor",
  "parseHTML",
  "parseJSON",
  "toJSON",
] as const;

const DOM_APIS = DOM_API_NAMES.reduce(
  (acc, key) => {
    acc[key] = true;

    return acc;
  },
  {} as Record<string, true | undefined>,
);

export default DOM_APIS;

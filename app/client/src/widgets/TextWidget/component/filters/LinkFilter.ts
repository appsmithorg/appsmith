import { Filter } from "interweave";
import { addHttpIfMissing } from "../helpers";

class LinkFilter extends Filter {
  attribute(name: string, value: string): string {
    if (name === "href") {
      return addHttpIfMissing(value);
    }

    return value;
  }

  node(name: string, node: HTMLElement): HTMLElement {
    if (name === "a") {
      node.setAttribute("target", "_blank");
    }

    return node;
  }
}

export default LinkFilter;

import { Filter } from "interweave";
import { addHttpIfMissing } from "../helpers";

class LinkFilter extends Filter {
  attribute(name: string, value: string): string {
    if (name === "href") {
      return addHttpIfMissing(value);
    }

    return value;
  }
}

export default LinkFilter;

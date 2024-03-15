import type { DropdownOption } from "design-system-old";
import type { JSAction } from "entities/JSCollection";

export interface JSActionDropdownOption extends DropdownOption {
  data: JSAction | null;
}

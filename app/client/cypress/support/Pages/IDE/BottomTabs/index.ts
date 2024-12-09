import { Response } from "./Response";

class BottomTabs {
  public readonly response: Response;

  constructor() {
    this.response = new Response();
  }
}

export default new BottomTabs();

import { Response } from "./Response";

class BottomPane {
  public readonly response: Response;

  constructor() {
    this.response = new Response();
  }
}

export default new BottomPane();

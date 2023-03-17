import { ApplicationVersion } from "actions/applicationActions";
import { APP_MODE } from "entities/App";
import DefaultURLRedirect from "./DefaultURLRedirect";
import { SlugURLRedirect } from "./SlugURLRedirect";

const registeredURLGenerators = {
  [ApplicationVersion.DEFAULT]: DefaultURLRedirect,
  [ApplicationVersion.SLUG_URL]: SlugURLRedirect,
};

export default class URLGeneratorFactory {
  static create(type: keyof typeof registeredURLGenerators, mode: APP_MODE) {
    return new registeredURLGenerators[type](mode);
  }
}

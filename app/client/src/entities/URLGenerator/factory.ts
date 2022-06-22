import { ApplicationVersion } from "actions/applicationActions";
import { APP_MODE } from "entities/App";
import DefaultURLGenerator from "./DefaultURLGenerator";
import { SlugURLGenerator } from "./SlugURLGenerator";

const registeredURLGenerators = {
  [ApplicationVersion.DEFAULT]: DefaultURLGenerator,
  [ApplicationVersion.SLUG_URL]: SlugURLGenerator,
};

export default class URLGeneratorFactory {
  static create(type: keyof typeof registeredURLGenerators, mode: APP_MODE) {
    return new registeredURLGenerators[type](mode);
  }
}

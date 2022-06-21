import { ApplicationVersion } from "actions/applicationActions";
import { APP_MODE } from "entities/App";
import DefaultURLGenerator from "./DefaultURLGenerator";
import { SlugURLGenerator } from "./SlugURLGenerator";

export default class URLGeneratorFactory {
  static create(applicationVersion: ApplicationVersion, mode: APP_MODE) {
    if (applicationVersion === ApplicationVersion.SLUG_URL)
      return new SlugURLGenerator(applicationVersion, mode);
    return new DefaultURLGenerator(applicationVersion, mode);
  }
}

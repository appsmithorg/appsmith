import { faker } from "@faker-js/faker";

type imageTypes = "abstract" | "animals";

export class FakerHelper {
  public GetCatImage() {
    return faker.image.cats();
  }

  public GetRandomText(textLength = 10) {
    return faker.random.alphaNumeric(textLength, { casing: "upper" });
  }

  public GetUSPhoneNumber() {
    return faker.phone.number("(###) ###-####");
  }

  public GetRandomNumber(length = 6) {
    return faker.random.numeric(length, {allowLeadingZeros: true});
  }
}

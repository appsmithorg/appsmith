import { faker } from "@faker-js/faker";

type imageTypes = "abstract" | "animals";

export class FakerHelper {
  public GetCatImage() {
    return faker.image.cats();
  }

  public GetRandomImage() {
    return faker.image.imageUrl();
  }

  public GetRandomText(textLength = 10, casing : "upper" | "lower" | "mixed" = "mixed") {
    return faker.random.alphaNumeric(textLength, { casing: casing });
  }

  public GetUSPhoneNumber() {
    return faker.phone.number("(###) ###-####");
  }

  public GetRandomNumber(length = 6) {
    return faker.random.numeric(length, {allowLeadingZeros: true});
  }
}

import { faker } from "@faker-js/faker";

type imageTypes = "abstract" | "animals";

export class FakerHelper {
  public GetCatImage() {
    return faker.image.url();
  }

  public GetRandomImage() {
    return faker.image.url();
  }

  public GetRandomText(
    textLength = 10,
    casing: "upper" | "lower" | "mixed" = "mixed",
  ) {
    return faker.string.alphanumeric({ length: textLength, casing });
  }

  public GetUSPhoneNumber() {
    const digits = faker.string.numeric({
      allowLeadingZeros: true,
      length: 10,
    });

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  public GetRandomNumber(length = 6) {
    return faker.string.numeric({ allowLeadingZeros: true, length });
  }
}

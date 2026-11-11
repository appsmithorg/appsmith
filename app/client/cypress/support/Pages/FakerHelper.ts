type imageTypes = "abstract" | "animals";

const ALPHANUMERIC_CHARACTERS = {
  lower: "0123456789abcdefghijklmnopqrstuvwxyz",
  mixed: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  upper: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
};

const NUMERIC_CHARACTERS = "0123456789";

function randomString(length: number, characters: string) {
  return Array.from(
    { length },
    () => characters[Math.floor(Math.random() * characters.length)],
  ).join("");
}

export class FakerHelper {
  public GetCatImage() {
    return this.GetRandomImage();
  }

  public GetRandomImage() {
    return `https://picsum.photos/640/480?random=${this.GetRandomNumber()}`;
  }

  public GetRandomText(
    textLength = 10,
    casing: "upper" | "lower" | "mixed" = "mixed",
  ) {
    return randomString(textLength, ALPHANUMERIC_CHARACTERS[casing]);
  }

  public GetUSPhoneNumber() {
    const digits = randomString(10, NUMERIC_CHARACTERS);

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  public GetRandomNumber(length = 6) {
    return randomString(length, NUMERIC_CHARACTERS);
  }
}

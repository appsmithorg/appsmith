import { ISDCodeOptions } from "constants/ISDCodes_v2";
import { ISDCodeDropdownOptions } from "./ISDCodeDropdown";
import {
  countryCodeDisplayedForDialCode,
  countryToFlag,
  findCountryByDialCode,
  resolveDisplayedPhoneCountry,
  resolvePhoneCountry,
} from "./utilities";

describe("Utilities - ", () => {
  it("should test countryToFlag", () => {
    [
      ["IN", "🇮🇳"],
      ["US", "🇺🇸"],
      ["", ""],
    ].forEach((d) => {
      expect(countryToFlag(d[0])).toBe(d[1]);
    });
  });

  it("gives each country that shares a dial code its own flag", () => {
    expect(countryToFlag("GB")).not.toBe(countryToFlag("GG"));
    expect(countryToFlag("FI")).not.toBe(countryToFlag("AX"));
  });

  it("resolves a shared dial code to the primary country", () => {
    expect(findCountryByDialCode("+44")?.code).toBe("GB");
    expect(findCountryByDialCode("+358")?.code).toBe("FI");
    expect(findCountryByDialCode("+595")?.code).toBe("PY");
    expect(findCountryByDialCode("+592")?.code).toBe("GY");
    expect(findCountryByDialCode("+39")?.code).toBe("IT");
    expect(findCountryByDialCode("+61")?.code).toBe("AU");
    expect(findCountryByDialCode("+672")?.code).toBe("NF");
  });

  it("keeps an explicit country when it shares a dial code", () => {
    expect(resolvePhoneCountry("+44", "GG")?.code).toBe("GG");
    expect(resolvePhoneCountry("+44", "GB")?.name).toBe("United Kingdom");
    expect(resolvePhoneCountry("+44")?.code).toBe("GB");
    expect(resolvePhoneCountry("+39", "VA")?.code).toBe("VA");
    expect(findCountryByDialCode("+379")?.code).toBe("VA");
    expect(findCountryByDialCode("+ 345")?.code).toBe("KY");
  });

  it("follows the dial code when it no longer matches the country", () => {
    expect(resolvePhoneCountry("+91", "GG")?.code).toBe("IN");
  });

  it("follows a bound country code when the dial code is not itself bound", () => {
    const country = resolveDisplayedPhoneCountry("+1", "au", {
      preferCountry: true,
    });

    expect(country?.code).toBe("AU");
    expect(country?.dial_code).toBe("+61");
    expect(
      resolveDisplayedPhoneCountry("+44", undefined, { preferCountry: true })
        ?.code,
    ).toBe("GB");
    expect(
      resolveDisplayedPhoneCountry("+91", "AU", { preferCountry: false })?.code,
    ).toBe("IN");
  });

  it("shows the primary country when an older field stored only a dial code", () => {
    expect(
      countryCodeDisplayedForDialCode(
        { defaultDialCode: "+44" },
        "defaultCountryCode",
      ),
    ).toBe("GB");
    expect(
      countryCodeDisplayedForDialCode(
        {
          schema: {
            phone: { dialCode: "+358" },
          },
        },
        "schema.phone.countryCode",
      ),
    ).toBe("FI");
    expect(
      countryCodeDisplayedForDialCode(
        { defaultDialCode: "{{appsmith.store.phone}}" },
        "defaultCountryCode",
      ),
    ).toBeUndefined();
  });

  it("uses a distinct dropdown value for every country", () => {
    const values = ISDCodeDropdownOptions.map((option) => option.value);

    expect(new Set(values).size).toBe(values.length);
    expect(
      ISDCodeDropdownOptions.find((option) => option.value === "GB")?.id,
    ).toBe("+44");
    expect(
      ISDCodeDropdownOptions.find((option) => option.value === "GG")?.id,
    ).toBe("+44");
    expect(
      ISDCodeOptions.find((country) => country.code === "GY")?.dial_code,
    ).toBe("+592");
    expect(
      ISDCodeOptions.find((country) => country.code === "KY")?.dial_code,
    ).toBe("+1345");
    expect(
      ISDCodeOptions.find((country) => country.code === "VA")?.dial_code,
    ).toBe("+39");
  });
});

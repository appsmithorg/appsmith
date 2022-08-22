// Copyright 2018 The Lighthouse Authors. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

import { DEFAULT_LOCALE, LOCALES } from "./locales";
import { RegisteredFileStrings } from "./localized-string-set";

export type UIStrings = Record<string, string>;
export type LocalizedMessages = Record<string, { message: string }>;

/**
 * Encapsulates the global state of the i18n runtime.
 */
export class I18n {
  readonly supportedLocales: ReadonlySet<Intl.UnicodeBCP47LocaleIdentifier>;

  private localeData = new Map<
    Intl.UnicodeBCP47LocaleIdentifier,
    LocalizedMessages
  >();
  readonly defaultLocale;

  constructor(
    supportedLocales: readonly Intl.UnicodeBCP47LocaleIdentifier[] = LOCALES,
    defaultLocale = DEFAULT_LOCALE,
  ) {
    this.defaultLocale = defaultLocale;

    this.supportedLocales = new Set(supportedLocales);
  }

  registerLocaleData(
    locale: Intl.UnicodeBCP47LocaleIdentifier,
    messages: LocalizedMessages,
  ): void {
    this.localeData.set(locale, messages);
  }

  registerFileStrings(
    filename: string,
    stringStructure: UIStrings,
  ): RegisteredFileStrings {
    return new RegisteredFileStrings(
      filename,
      stringStructure,
      this.localeData,
    );
  }

  /**
   * Look up the best available locale for the requested language through these fall backs:
   * - exact match
   * - progressively shorter prefixes (`de-CH-1996` -> `de-CH` -> `de`)
   * - the default locale if no match is found
   */
  lookupClosestSupportedLocale(
    locale: Intl.UnicodeBCP47LocaleIdentifier,
  ): Intl.UnicodeBCP47LocaleIdentifier {
    // @ts-expect-error https://github.com/microsoft/TypeScript/issues/29129
    const canonicalLocale: string = Intl.getCanonicalLocales(locale)[0];

    const localeParts = canonicalLocale.split("-");
    while (localeParts.length) {
      const candidate = localeParts.join("-");
      if (this.supportedLocales.has(candidate)) {
        return candidate;
      }
      localeParts.pop();
    }
    return this.defaultLocale;
  }
}

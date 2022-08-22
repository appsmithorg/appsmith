/* eslint-disable prettier/prettier */
// Copyright 2018 The Lighthouse Authors. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

import { type LocalizedMessages, type UIStrings } from './i18n-impl';

import * as IntlMessageFormat from '../intl-messageformat/intl-messageformat';

const EMPTY_VALUES_OBJECT = {};

/**
 * This class is usually created at module instantiation time and
 * holds the filename, the UIStrings object and a reference to
 * all the localization data.
 *
 * Later, once needed, users can request a `LocalizedStringSet` that represents
 * all the translated strings, in a given locale for the specific file and
 * UIStrings object.
 *
 * Please note that this class is implemented with invariant in mind that the
 * DevTools locale never changes. Otherwise we would have to use a Map as
 * the cache. For performance reasons, we store the single possible map entry
 * as a property directly.
 *
 * The DevTools locale CANNOT be passed via the constructor. When instances
 * of `RegisteredFileStrings` are created, the DevTools locale has not yet
 * been determined.
 */
export class RegisteredFileStrings {
  private localizedStringSet?: LocalizedStringSet;

  constructor(private filename: string, private stringStructure: UIStrings, private localizedMessages: Map<Intl.UnicodeBCP47LocaleIdentifier, LocalizedMessages>) {
  }

  getLocalizedStringSetFor(locale: Intl.UnicodeBCP47LocaleIdentifier): LocalizedStringSet {
    if (this.localizedStringSet) {
      return this.localizedStringSet;
    }

    const localeData = this.localizedMessages.get(locale);
    if (!localeData) {
      throw new Error(`No locale data registered for '${locale}'`);
    }

    this.localizedStringSet = new LocalizedStringSet(this.filename, this.stringStructure, locale, localeData);
    return this.localizedStringSet;
  }
}

export type Values = Record<string, string|number|boolean>;

/**
 * A set of translated strings for a single file in a specific locale.
 *
 * The class is a wrapper around `IntlMessageFormat#format` plus a cache
 * to speed up consecutive lookups of the same message.
 */
export class LocalizedStringSet {
  private readonly cachedSimpleStrings = new Map<string, string>();
  private readonly cachedMessageFormatters = new Map<string, IntlMessageFormat.IntlMessageFormat>();

  /** For pseudo locales, use 'de-DE' for number formatting */
  private readonly localeForFormatter: Intl.UnicodeBCP47LocaleIdentifier;

  constructor(private filename: string, private stringStructure: UIStrings, locale: Intl.UnicodeBCP47LocaleIdentifier, private localizedMessages: LocalizedMessages) {
    this.localeForFormatter = (locale === 'en-XA' || locale === 'en-XL') ? 'de-DE' : locale;
  }

  getLocalizedString(message: string, values: Values = EMPTY_VALUES_OBJECT): string {
    if (values === EMPTY_VALUES_OBJECT || Object.keys(values).length === 0) {
      return this.getSimpleLocalizedString(message);
    }
    return this.getFormattedLocalizedString(message, values);
  }

  getMessageFormatterFor(message: string): IntlMessageFormat.IntlMessageFormat {
    const keyname = Object.keys(this.stringStructure).find(key => this.stringStructure[key] === message);
    if (!keyname) {
      throw new Error(`Unable to locate '${message}' in UIStrings object`);
    }
    const i18nId = `${this.filename} | ${keyname}`;
    const localeMessage = this.localizedMessages[i18nId];

    // The requested string might not yet have been collected into en-US.json or
    // been translated yet. Fall back to the original TypeScript UIStrings message.
    const messageToTranslate = localeMessage ? localeMessage.message : message;
    return new IntlMessageFormat.IntlMessageFormat(messageToTranslate, this.localeForFormatter, undefined, {ignoreTag: true});
  }

  private getSimpleLocalizedString(message: string): string {
    const cachedSimpleString = this.cachedSimpleStrings.get(message);
    if (cachedSimpleString) {
      return cachedSimpleString;
    }

    const formatter = this.getMessageFormatterFor(message);
    const translatedString = formatter.format() as string;
    this.cachedSimpleStrings.set(message, translatedString);
    return translatedString;
  }

  private getFormattedLocalizedString(message: string, values: Values): string {
    let formatter = this.cachedMessageFormatters.get(message);
    if (!formatter) {
      formatter = this.getMessageFormatterFor(message);
      this.cachedMessageFormatters.set(message, formatter);
    }

    return formatter.format(values) as string;
  }
}

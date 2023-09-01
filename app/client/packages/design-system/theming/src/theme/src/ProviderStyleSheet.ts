import { StyleSheet } from "@emotion/sheet";
import kebabCase from "lodash/kebabCase";
import { createTypographyStringMap } from "../../typography";
import { cssRule } from "../../utils/cssRule";
import { SheetTypes } from "./types";

import type { RootUnit, ThemeToken } from "../../token";
import type { FontFamily, Typography } from "../../typography";

export class ProviderStyleSheet {
  private sheets = new Map<string, StyleSheet>();

  createSheets = (key: string) => {
    Object.values(SheetTypes).map((type) => {
      const sheetKey = `${key}-${type}`;
      this.sheets.set(sheetKey, this.createSheet(sheetKey));
    });
  };

  global = (key: string, styles: string) => {
    const sheet = new StyleSheet({
      key,
      container: document.head,
    });
    sheet.insert(styles);
  };

  flush = (key: string) => {
    Object.values(SheetTypes).map((type) => {
      this.sheets.get(`${key}-${type}`)?.flush();
    });
  };

  borderRadius = (key: string, token: ThemeToken) => {
    this.updateSheet(`${key}-borderRadius`, cssRule(`.${key}`, token));
  };

  borderWidth = (key: string, token: ThemeToken) => {
    this.updateSheet(`${key}-borderWidth`, cssRule(`.${key}`, token));
  };

  boxShadow = (key: string, token: ThemeToken) => {
    this.updateSheet(`${key}-boxShadow`, cssRule(`.${key}`, token));
  };

  color = (key: string, token: ThemeToken) => {
    this.updateSheet(`${key}-color`, cssRule(`.${key}`, token));
  };

  opacity = (key: string, token: ThemeToken) => {
    this.updateSheet(`${key}-opacity`, cssRule(`.${key}`, token));
  };

  sizing = (key: string, token: ThemeToken) => {
    this.updateSheet(`${key}-sizing`, cssRule(`.${key}`, token));
  };

  spacing = (key: string, token: ThemeToken) => {
    this.updateSheet(`${key}-spacing`, cssRule(`.${key}`, token));
  };

  zIndex = (key: string, token: ThemeToken) => {
    this.updateSheet(`${key}-zIndex`, cssRule(`.${key}`, token));
  };

  rootUnit = (key: string, rootUnit: RootUnit) => {
    const styles = `.${key} {--root-unit: ${rootUnit}}`;
    this.updateSheet(`${key}-rootUnit`, styles);
  };

  fontFamily = (key: string, fontFamily: FontFamily) => {
    const styles = `.${key} {font-family: ${fontFamily}}`;
    this.updateSheet(`${key}-fontFamily`, styles);
  };

  typography = (
    key: string,
    typography: Typography,
    fontFamily?: FontFamily,
  ) => {
    this.updateSheet(
      `${key}-typography`,
      createTypographyStringMap(typography, key, fontFamily),
    );

    if (fontFamily) {
      this.updateSheet(
        `${key}-fontFamily`,
        `.${key} {font-family: ${fontFamily}}`,
      );
    }
  };

  private createSheet = (providerKey: string) => {
    return new StyleSheet({
      key: `${kebabCase(providerKey)}`,
      container: document.head,
    });
  };

  private updateSheet = (providerKey: string, styles: string) => {
    this.sheets.get(`${providerKey}`)?.flush();
    this.sheets.get(`${providerKey}`)?.insert(styles);
  };
}

import { StyleSheet } from "@emotion/sheet";
import kebabCase from "lodash/kebabCase";
import { createTypographyStringMap } from "../../typography";
import { cssRule } from "../../utils/cssRule";
import { SheetTypes } from "./types";

import type { RootUnit, ThemeToken } from "../../token";
import type { FontFamily, Typography } from "../../typography";

export class ProviderStyleSheet {
  private sheets = new Map<string, StyleSheet>();
  private providerKey = "wds-provider-";

  createSheets = (key: string) => {
    this.providerKey = key;
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

  borderRadius = (token: ThemeToken) => {
    this.updateSheet("borderRadius", cssRule(`.${this.providerKey}`, token));
  };

  borderWidth = (token: ThemeToken) => {
    this.updateSheet("borderWidth", cssRule(`.${this.providerKey}`, token));
  };

  boxShadow = (token: ThemeToken) => {
    this.updateSheet("boxShadow", cssRule(`.${this.providerKey}`, token));
  };

  color = (token: ThemeToken) => {
    this.updateSheet("color", cssRule(`.${this.providerKey}`, token));
  };

  opacity = (token: ThemeToken) => {
    this.updateSheet("opacity", cssRule(`.${this.providerKey}`, token));
  };

  sizing = (token: ThemeToken) => {
    this.updateSheet("sizing", cssRule(`.${this.providerKey}`, token));
  };

  spacing = (token: ThemeToken) => {
    this.updateSheet("spacing", cssRule(`.${this.providerKey}`, token));
  };

  zIndex = (token: ThemeToken) => {
    this.updateSheet("zIndex", cssRule(`.${this.providerKey}`, token));
  };

  rootUnit = (rootUnit: RootUnit) => {
    const styles = `.${this.providerKey} {--root-unit: ${rootUnit}}`;
    this.updateSheet("rootUnit", styles);
  };

  fontFace = (fontFace: string) => {
    this.updateSheet("fontFace", fontFace);
  };

  fontFamily = (fontFamily: FontFamily) => {
    const styles = `.${this.providerKey} {font-family: ${fontFamily}}`;
    this.updateSheet("fontFamily", styles);
  };

  typography = (typography: Typography, fontFamily?: FontFamily) => {
    this.updateSheet(
      "typography",
      createTypographyStringMap(typography, this.providerKey, fontFamily),
    );

    if (fontFamily) {
      this.updateSheet(
        "fontFamily",
        `.${this.providerKey} {font-family: ${fontFamily}}`,
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
    this.sheets.get(`${this.providerKey}-${providerKey}`)?.flush();
    this.sheets.get(`${this.providerKey}-${providerKey}`)?.insert(styles);
  };
}

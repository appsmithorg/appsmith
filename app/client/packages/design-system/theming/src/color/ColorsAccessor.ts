import Color from "colorjs.io";

import type { ColorTypes } from "colorjs.io/types/src/color";

export class ColorsAccessor {
  color: Color;

  constructor(color: ColorTypes) {
    this.color = new Color(color);

    return this;
  }

  /* Lightness */
  get isVeryDark() {
    return this.color.oklch.l < 0.3;
  }

  get isVeryLight() {
    return this.color.oklch.l > 0.93;
  }

  /* Chroma */
  get isAchromatic() {
    return this.color.oklch.c < 0.04;
  }

  get isColorful() {
    return this.color.oklch.c > 0.136;
  }

  /* Hue */
  get isCold() {
    return this.color.oklch.h >= 120 && this.color.oklch.h <= 300;
  }

  get isBlue() {
    return this.color.oklch.h >= 230 && this.color.oklch.h <= 270;
  }

  get isGreen() {
    return this.color.oklch.h >= 116 && this.color.oklch.h <= 165;
  }

  get isYellow() {
    return this.color.oklch.h >= 60 && this.color.oklch.h <= 115;
  }

  get isRed() {
    return this.color.oklch.h >= 5 && this.color.oklch.h <= 49;
  }

  get lightness() {
    return this.color.oklch.l;
  }

  get chroma() {
    return this.color.oklch.c;
  }

  get hue() {
    return this.color.oklch.h;
  }
}

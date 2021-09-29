class PreloadImageClass {
  static images: Record<string, any> = {};

  loadImage = (imageSrc: string) => {
    const img = new Image();
    img.src = imageSrc;
    // keep a reference to the image
    PreloadImageClass.images[imageSrc] = img;
  };

  getLoadedImage = (imageSrc: string) => {
    return PreloadImageClass.images[imageSrc];
  };

  removeLoadedImage = (imageSrc: string) => {
    delete PreloadImageClass.images[imageSrc];
  };
}

export const preloadImage = new PreloadImageClass();

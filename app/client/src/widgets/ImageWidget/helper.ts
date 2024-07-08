import { Buffer } from "buffer";
export const urlToBase64 = async (url: string) => {
  if (!url) return "";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type");
    const base64String = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64String}`;
  } catch (error) {
    console.error("Failed to fetch image for download", error);
    return "";
  }
};

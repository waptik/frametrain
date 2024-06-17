"use server";

export async function fetchCover(url: string) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const bufferData = Buffer.from(buffer);
  const imageData = "data:image/jpeg;base64," + bufferData.toString("base64");

  return imageData;
}

export type LoadedImage = {
  element: HTMLImageElement;
  width: number;
  height: number;
};

export function loadImageFromFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const element = new Image();
    const objectUrl = URL.createObjectURL(file);
    element.onload = () => {
      resolve({ element, width: element.naturalWidth, height: element.naturalHeight });
    };
    element.onerror = () => {
      reject(new Error("无法解码这张图片。"));
    };
    element.src = objectUrl;
  });
}

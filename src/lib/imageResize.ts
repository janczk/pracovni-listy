/**
 * Zmenšení obrázku v prohlížeči před OCR.
 * Sníží velikost souboru a zrychlí OCR; velké fotky učitelů se zmenší na čitelný formát.
 * Vše probíhá lokálně, bez odesílání na server.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.88;
/** Kontrast před OCR: zvýší rozdíl mezi textem a pozadím, fotografie méně ruší. */
const CONTRAST_FACTOR = 1.4;

/**
 * Vrátí zmenšený obrázek jako Blob (JPEG). Delší strana max MAX_DIMENSION px.
 * Pokud je obrázek už menší, vrátí původní (nebo jeho kopii).
 */
export function resizeImageForOcr(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      let targetWidth = width;
      let targetHeight = height;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          targetWidth = MAX_DIMENSION;
          targetHeight = Math.round((height * MAX_DIMENSION) / width);
        } else {
          targetHeight = MAX_DIMENSION;
          targetWidth = Math.round((width * MAX_DIMENSION) / height);
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Předzpracování obrázku pro OCR: šedá + zvýšení kontrastu.
 * Fotografie a ilustrace se zjemní, text zůstane ostrý a lépe rozpoznatelný.
 */
export function preprocessImageForOcr(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const mid = 128;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        const c = Math.min(255, Math.max(0, (gray - mid) * CONTRAST_FACTOR + mid));
        data[i] = data[i + 1] = data[i + 2] = c;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(
        (outBlob) => {
          if (outBlob) resolve(outBlob);
          else reject(new Error("Failed to create blob"));
        },
        "image/png",
        1
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

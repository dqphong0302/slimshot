/**
 * SlimShot - High Performance Client-Side Image Compression & Conversion Engine
 * Designed by Quoc-Phong Dang, M.Sc. (phongdang.io.vn)
 */

export const LIMITS = {
  maxFiles: 30,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  totalBatchSize: 200 * 1024 * 1024, // 200MB
  megaPixels: 60 * 1e6 // 60 MP safety limit
};

/**
 * Helper to convert file to ImageBitmap with EXIF orientation auto-baked
 */
async function fileToBitmap(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (err) {
    throw new Error('Không thể giải mã hình ảnh này. File có thể bị hỏng hoặc định dạng không hợp lệ.');
  }
}

/**
 * Draws bitmap to canvas with optional smart max-width resizing
 */
function drawToCanvas(bitmap, maxW, doResize) {
  let w = bitmap.width;
  let h = bitmap.height;
  const origW = w;
  const origH = h;

  if (doResize && maxW > 0 && w > maxW) {
    h = Math.round((h * maxW) / w);
    w = maxW;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: true });

  // Use high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return { canvas, w, h, origW, origH };
}

/**
 * Encodes canvas to Blob
 */
function encodeCanvas(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Mã hóa điểm ảnh thất bại.'));
      },
      mime,
      mime === 'image/png' ? undefined : quality
    );
  });
}

/**
 * Optimizes a single image file according to options
 * @param {File} file 
 * @param {Object} options - { format: 'auto'|'keep'|'webp'|'jpeg'|'png', quality: 0.4-0.95, resize: boolean, maxw: number }
 */
export async function optimizeImage(file, options = {}) {
  const format = options.format || 'auto';
  const quality = typeof options.quality === 'number' ? options.quality : 0.75;
  const doResize = Boolean(options.resize);
  const maxW = options.maxw || 2000;

  const origSize = file.size;
  const srcType = file.type;

  const bitmap = await fileToBitmap(file);
  const { canvas, w, h, origW, origH } = drawToCanvas(bitmap, maxW, doResize);

  const candidates = [];

  async function tryWebp() {
    try {
      const blob = await encodeCanvas(canvas, 'image/webp', quality);
      candidates.push({ blob, type: 'image/webp', ext: 'webp' });
    } catch {}
  }

  async function tryJpeg() {
    try {
      const blob = await encodeCanvas(canvas, 'image/jpeg', quality);
      candidates.push({ blob, type: 'image/jpeg', ext: 'jpg' });
    } catch {}
  }

  async function tryPng() {
    try {
      const blob = await encodeCanvas(canvas, 'image/png');
      candidates.push({ blob, type: 'image/png', ext: 'png' });
    } catch {}
  }

  if (format === 'webp') {
    await tryWebp();
  } else if (format === 'jpeg') {
    await tryJpeg();
  } else if (format === 'png') {
    await tryPng();
  } else if (format === 'keep') {
    if (srcType === 'image/png') await tryPng();
    else if (srcType === 'image/webp') await tryWebp();
    else await tryJpeg();
  } else {
    // 'auto' mode: test WebP and the source format, then pick the smallest one
    await tryWebp();
    if (srcType === 'image/png') {
      await tryPng();
    } else {
      await tryJpeg();
    }
  }

  if (candidates.length === 0) {
    throw new Error('Không tạo được ứng viên nén nào phù hợp.');
  }

  // Sort candidate blobs by size ascending
  candidates.sort((a, b) => a.blob.size - b.blob.size);
  let best = candidates[0];

  // Safeguard: if the optimized file is larger than original and we didn't explicitly request format conversion, keep original
  let kept = false;
  if (best.blob.size >= origSize && (format === 'auto' || format === 'keep')) {
    best = {
      blob: file,
      type: srcType,
      ext: srcType === 'image/png' ? 'png' : srcType === 'image/webp' ? 'webp' : 'jpg'
    };
    kept = true;
  }

  const newSize = best.blob.size;
  const savedBytes = Math.max(0, origSize - newSize);
  const percentSaved = origSize > 0 ? Math.max(0, Math.round(((origSize - newSize) / origSize) * 100)) : 0;

  return {
    bestBlob: best.blob,
    bestType: best.type,
    bestExt: best.ext,
    origSize,
    newSize,
    w,
    h,
    origW,
    origH,
    kept,
    savedBytes,
    percentSaved,
    srcType
  };
}

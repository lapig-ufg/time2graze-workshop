/**
 * The profile photograph, from the file a person picked to the bytes the
 * script stores.
 *
 * The specification allows one image of up to 10 MB. Ten megabytes is not a
 * head-and-shoulders portrait, it is whatever a phone camera produced, and
 * sending it whole would push a base64 payload of over thirteen megabytes
 * through a hotel connection into an Apps Script POST. So the file is accepted
 * at the stated size and **resized in the browser before it is sent**: the
 * long edge comes down to `MAX_EDGE` and the result is re-encoded as JPEG,
 * which a directory portrait loses nothing by.
 *
 * Two things this deliberately does not do. It does not silently accept a file
 * it could not decode — an iPhone handing over HEIC that canvas cannot read is
 * told to choose a JPEG or PNG, rather than having an empty image saved under
 * their name. And it does not strip the choice from the reader: the preview it
 * returns is what will be stored, so nobody finds out afterwards that they
 * uploaded the wrong picture.
 */

import { DIRECTORY_LIMITS } from '../data/directory';
import type { DirectoryPhoto } from './directory';

/** The long edge of the stored image. A directory portrait needs no more. */
const MAX_EDGE = 1000;
const QUALITY = 0.85;
const TYPE = 'image/jpeg';

export type PhotoError = 'type' | 'size' | 'unreadable';

export type PreparedPhoto = {
  photo: DirectoryPhoto;
  /** A `data:` URL of exactly what will be stored, for the preview. */
  preview: string;
  /** Bytes after resizing, so the form can say what it is about to send. */
  bytes: number;
};

/** A result rather than a thrown value: every failure here is expected. */
export type PhotoResult =
  | { ok: true; photo: PreparedPhoto }
  | { ok: false; reason: PhotoError };

/** `Uint8Array` to base64 without blowing the argument limit on a big image. */
function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function scaled(width: number, height: number) {
  const edge = Math.max(width, height);
  if (edge <= MAX_EDGE) return { width, height };
  const ratio = MAX_EDGE / edge;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/**
 * Decodes, resizes and re-encodes the picked file. Every failure is one the
 * form has something to say about, so they come back as results rather than
 * as exceptions.
 */
export async function preparePhoto(file: File): Promise<PhotoResult> {
  if (!file.type.startsWith('image/')) return { ok: false, reason: 'type' };
  if (file.size > DIRECTORY_LIMITS.photoBytes) return { ok: false, reason: 'size' };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // HEIC, a corrupt file, or an SVG the decoder refuses. All of them are the
    // same answer to the reader: this one cannot be used, pick another.
    return { ok: false, reason: 'unreadable' };
  }

  const size = scaled(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return { ok: false, reason: 'unreadable' };
  }
  // JPEG has no transparency: a PNG with a cut-out background would otherwise
  // come out on black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, TYPE, QUALITY),
  );
  if (!blob) return { ok: false, reason: 'unreadable' };

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const data = toBase64(bytes);

  return {
    ok: true,
    photo: {
      photo: { name: photoName(file.name), type: TYPE, data },
      preview: `data:${TYPE};base64,${data}`,
      bytes: bytes.length,
    },
  };
}

/** The original name, kept recognisable, with the extension it now has. */
function photoName(original: string) {
  const stem = original.replace(/\.[^.]+$/, '').trim() || 'photo';
  return `${stem.slice(0, 60)}.jpg`;
}

/**
 * Konstanta dan utilitas untuk validasi upload file OCR (Print Media OCR)
 * 
 * CATATAN PENTING: 
 * - Validasi ini HANYA berlaku untuk fitur OCR (Print Media OCR)
 * - Fitur upload lainnya (Broadcast Media, Model Management, dll) memiliki 
 *   batasan dan validasi sendiri yang akan diurus oleh programmer masing-masing
 */
export const OCR_UPLOAD_LIMITS = {
  MAX_FILE_SIZE_MB: 50,
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 52428800
  MAX_FILES_PER_BATCH: 50,
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ],
} as const;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

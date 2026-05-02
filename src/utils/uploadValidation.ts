/**
 * Validasi upload file untuk OCR (Print Media OCR)
 * 
 * CATATAN PENTING:
 * - Fungsi ini HANYA untuk validasi upload file OCR
 * - Fitur upload lainnya memiliki validasi sendiri yang akan diurus oleh programmer masing-masing
 */
import { OCR_UPLOAD_LIMITS, formatFileSize } from '@/constants/upload';

/**
 * Validasi single file untuk OCR
 * @param file File yang akan divalidasi
 * @returns Object dengan status valid dan pesan error jika ada
 */
export function validateOcrFile(file: File): { valid: boolean; error?: string } {
  // Cek tipe file
  const fileName = file.name.toLowerCase();
  const ext = '.' + fileName.split('.').pop();
  const allowedExtensions = OCR_UPLOAD_LIMITS.ALLOWED_EXTENSIONS as readonly string[];
  if (!allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File "${file.name}" tidak didukung. Hanya PDF, JPG, PNG yang diperbolehkan.`,
    };
  }

  // Cek ukuran file (4.5 MB per file)
  if (file.size > OCR_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" melebihi batas ${OCR_UPLOAD_LIMITS.MAX_FILE_SIZE_MB} MB per file. Ukuran: ${formatFileSize(file.size)}.`,
    };
  }

  return { valid: true };
}

/**
 * Validasi batch files untuk OCR
 * @param files Array of files yang akan divalidasi
 * @returns Object dengan status valid dan array pesan error jika ada
 */
export function validateOcrBatchFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Cek jumlah file
  if (files.length === 0) {
    errors.push('Pilih minimal 1 file.');
    return { valid: false, errors };
  }

  if (files.length > OCR_UPLOAD_LIMITS.MAX_FILES_PER_BATCH) {
    errors.push(`Maksimal ${OCR_UPLOAD_LIMITS.MAX_FILES_PER_BATCH} file per upload.`);
    return { valid: false, errors };
  }

  // Cek setiap file
  for (const file of files) {
    const result = validateOcrFile(file);
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

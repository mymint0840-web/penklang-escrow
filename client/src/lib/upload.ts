import axios from 'axios';

/**
 * อัปโหลดไฟล์ไปยังเซิร์ฟเวอร์
 * @param file - ไฟล์ที่ต้องการอัปโหลด
 * @param onProgress - callback สำหรับแสดงความคืบหน้า
 * @returns URL ของไฟล์ที่อัปโหลด
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('token');

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(progress);
          }
        },
      }
    );

    return response.data.url;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.response?.data?.message || 'ไม่สามารถอัปโหลดไฟล์ได้');
  }
}

/**
 * อัปโหลดหลายไฟล์พร้อมกัน
 * @param files - อาร์เรย์ของไฟล์ที่ต้องการอัปโหลด
 * @param onProgress - callback สำหรับแสดงความคืบหน้า
 * @returns อาร์เรย์ของ URL ของไฟล์ที่อัปโหลด
 */
export async function uploadMultipleFiles(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadFile(file, onProgress));
  return Promise.all(uploadPromises);
}

/**
 * อัปโหลดไฟล์ไปยัง Cloudinary (ถ้ามีการตั้งค่า)
 * @param file - ไฟล์ที่ต้องการอัปโหลด
 * @param onProgress - callback สำหรับแสดงความคืบหน้า
 * @returns URL และ public ID ของไฟล์ที่อัปโหลด
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(progress);
          }
        },
      }
    );

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error('ไม่สามารถอัปโหลดไฟล์ไปยัง Cloudinary ได้');
  }
}

/**
 * สร้าง URL ของรูปภาพจาก Cloudinary พร้อมการปรับแต่ง
 * @param publicId - Public ID ของรูปภาพใน Cloudinary
 * @param options - ตัวเลือกในการปรับแต่งรูปภาพ
 * @returns URL ของรูปภาพที่ปรับแต่งแล้ว
 */
export function getImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  }
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    return publicId; // Return original URL if Cloudinary is not configured
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options || {};

  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);

  const transformString = transformations.join(',');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
}

/**
 * ตรวจสอบประเภทไฟล์
 * @param file - ไฟล์ที่ต้องการตรวจสอบ
 * @param allowedTypes - ประเภทไฟล์ที่อนุญาต
 * @returns true ถ้าประเภทไฟล์ถูกต้อง
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const mainType = type.split('/')[0];
      return file.type.startsWith(mainType + '/');
    }
    return file.type === type;
  });
}

/**
 * ตรวจสอบขนาดไฟล์
 * @param file - ไฟล์ที่ต้องการตรวจสอบ
 * @param maxSizeMB - ขนาดไฟล์สูงสุดใน MB
 * @returns true ถ้าขนาดไฟล์ไม่เกินที่กำหนด
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * แปลงไฟล์เป็น Base64
 * @param file - ไฟล์ที่ต้องการแปลง
 * @returns Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * บีบอัดรูปภาพก่อนอัปโหลด
 * @param file - ไฟล์รูปภาพที่ต้องการบีบอัด
 * @param maxWidth - ความกว้างสูงสุด
 * @param maxHeight - ความสูงสูงสุด
 * @param quality - คุณภาพ (0-1)
 * @returns ไฟล์ที่บีบอัดแล้ว
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // คำนวณขนาดใหม่
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('ไม่สามารถบีบอัดรูปภาพได้'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้'));
    };

    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
  });
}

/**
 * ลบไฟล์จากเซิร์ฟเวอร์
 * @param url - URL ของไฟล์ที่ต้องการลบ
 */
export async function deleteFile(url: string): Promise<void> {
  const token = localStorage.getItem('token');

  try {
    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { url },
    });
  } catch (error: any) {
    console.error('Delete file error:', error);
    throw new Error(error.response?.data?.message || 'ไม่สามารถลบไฟล์ได้');
  }
}

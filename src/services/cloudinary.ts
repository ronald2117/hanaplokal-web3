const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

/**
 * Upload a file to Cloudinary using an unsigned upload preset.
 * Supports images (max 10MB) and videos (max 50MB).
 * Returns the secure URL of the uploaded file.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  if (!isCloudinaryConfigured || !CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file.');
  }

  const isVideo = file.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'hanaplokal/posts');

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as { error?: { message?: string } }).error?.message ?? 'Upload failed';
    throw new Error(message);
  }

  const data = await response.json() as { secure_url: string };
  return data.secure_url;
}

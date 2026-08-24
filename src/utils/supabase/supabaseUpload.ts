import { createClient } from '@/utils/supabase/client';
import { Zone } from '@/types/customization';

// Helper: Convert base64 dataUrl to Blob
const dataURItoBlob = (dataURI: string): Blob => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

export const uploadImageToSupabase = async (
  dataUrl: string,
  zone: Zone,
  bucketName: string = 'shirt-designs'
): Promise<string> => {
  // If already a hosted URL, return as-is
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }

  const supabase = createClient();
  const blob = dataURItoBlob(dataUrl);
  
  // Store inside the custom-orders folder seen in your bucket screenshot
  const filePath = `custom-orders/${zone}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.png`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, blob, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    console.error('Supabase upload error detail:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Generate public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};
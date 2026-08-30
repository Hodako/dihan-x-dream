const IMGBB_API_KEY = "04c0280a69c2c685602a6996bcf038c2";

export interface ImgbbUploadResult {
  success: boolean;
  url?: string;
  deleteUrl?: string;
  error?: string;
}

export async function uploadToImgbb(file: File): Promise<ImgbbUploadResult> {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });
    
    const data = await res.json();
    if (!data.success) {
      return {
        success: false,
        error: data?.error?.message || "Image upload failed",
      };
    }
    return { 
      success: true,
      url: data.data.url, 
      deleteUrl: data.data.delete_url 
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error uploading image",
    };
  }
}

// src/fal-service.ts
import { fal } from "@fal-ai/client";

// Configure fal with your API key
fal.config({
  credentials: import.meta.env.VITE_FAL_KEY,
});

export interface GenerateImageParams {
  imageUrls: string[];
  prompt: string;
  size?: "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9";
  quality?: string;
}

export interface GenerateImageResult {
  imageUrl: string;
  success: boolean;
  error?: string;
}

// Image editing using Gemini 2.5 Flash
export async function generateProductImage(
  params: GenerateImageParams
): Promise<GenerateImageResult> {
  console.log('🚀 Starting Gemini Edit with params:', params);
  console.log('🔑 API Key:', import.meta.env.VITE_FAL_KEY);
  console.log('📸 Image URLs:', params.imageUrls);
  console.log('📝 Prompt:', params.prompt);
  
  try {
    console.log('📡 Attempting to call fal.subscribe...');
    
    // Try the exact endpoint as you specified
    const result = await fal.subscribe("fal-ai/gemini-25-flash-image/edit", {
      input: {
        image_urls: params.imageUrls,
        prompt: params.prompt,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('📊 Queue update:', update);
      },
    });

    console.log('✅ API call successful!');
    console.log('📦 Full result:', JSON.stringify(result, null, 2));
    console.log('📦 Result.data:', result.data);
    
    // Try to find the image URL in different possible locations
    let imageUrl = null;
    
    if (result.data.images?.[0]?.url) {
      imageUrl = result.data.images[0].url;
      console.log('✅ Found image at result.data.images[0].url');
    }
    
    if (!imageUrl) {
      console.error('❌ Could not find image URL in response');
      return {
        imageUrl: "",
        success: false,
        error: "No image URL found in response",
      };
    }
    
    return {
      imageUrl: imageUrl,
      success: true,
    };
  } catch (err: unknown) {
    const error = err as {
      name?: string;
      message?: string;
      stack?: string;
      body?: { detail?: string };
      response?: unknown;
    };
    console.error('❌ FULL ERROR:', error);
    console.error('❌ Error name:', error?.name);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    
    if (error?.body) {
      console.error('❌ Error body:', error.body);
    }
    
    if (error?.response) {
      console.error('❌ Error response:', error.response);
    }
    
    let errorMessage = "Unknown error";
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.body?.detail) {
      errorMessage = error.body.detail;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    
    return {
      imageUrl: "",
      success: false,
      error: errorMessage,
    };
  }
}

// Background removal
export async function removeBackground(
  imageUrl: string
): Promise<GenerateImageResult> {
  try {
    const result = await fal.subscribe("fal-ai/imageutils/rembg", {
      input: {
        image_url: imageUrl,
      },
    });

    return {
      imageUrl: result.data.image.url,
      success: true,
    };
  } catch (error) {
    console.error("Error removing background:", error);
    return {
      imageUrl: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Upscale image
export async function upscaleImage(
  imageUrl: string,
  scaleFactor: number = 2
): Promise<GenerateImageResult> {
  try {
    const result = await fal.subscribe("fal-ai/clarity-upscaler", {
      input: {
        image_url: imageUrl,
        upscale_factor: scaleFactor,
      },
    });

    return {
      imageUrl: result.data.image.url,
      success: true,
    };
  } catch (error) {
    console.error("Error upscaling image:", error);
    return {
      imageUrl: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
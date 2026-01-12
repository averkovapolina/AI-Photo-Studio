import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { ChevronDown, Download, ArrowLeft, Wallpaper, Loader2 } from 'lucide-react';
import { generateProductImage, removeBackground } from './fal-service';
import backgroundImage from './assets/bcg.png';
import logoimg from './assets/Logo.png';

interface MainUIProps {
  uploadedImages?: string[];
  description?: string;
  onBack?: () => void;
}

export default function MainUI({ uploadedImages = [], description, onBack }: MainUIProps) {
  const [size, setSize] = useState<"square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9">('landscape_4_3');
  const [sharpness, setSharpness] = useState('Normal');
  const [quality, setQuality] = useState('High');
  const [orientation, setOrientation] = useState('Landscape');
  const [thoughts, setThoughts] = useState(description || '');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const sizeOptions = [
    { label: 'Square HD', value: 'square_hd' as const },
    { label: 'Square', value: 'square' as const },
    { label: 'Portrait 4:3', value: 'portrait_4_3' as const },
    { label: 'Portrait 16:9', value: 'portrait_16_9' as const },
    { label: 'Landscape 4:3', value: 'landscape_4_3' as const },
    { label: 'Landscape 16:9', value: 'landscape_16_9' as const },
  ];
  const sharpnessOptions = ['Soft', 'Normal', 'Sharp', 'Very Sharp'];
  const qualityOptions = ['Low', 'Medium', 'High', 'Ultra'];
  const orientationOptions = ['Portrait', 'Landscape', 'Square'];

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleGenerate = async () => {
    console.log('=== Generate Button Clicked ===');
    console.log('Uploaded Images:', uploadedImages.length);
    console.log('Thoughts:', thoughts);
    console.log('Size:', size);
    console.log('API Key:', import.meta.env.VITE_FAL_KEY ? 'Found' : 'MISSING!');

    if (uploadedImages.length === 0 || !thoughts.trim()) {
      alert('Please provide images and description');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('Calling fal.ai API...');
      const result = await generateProductImage({
        imageUrls: uploadedImages,
        prompt: thoughts,
        size: size,
        quality: quality.toLowerCase(),
      });

      console.log('API Response:', result);

      if (result.success) {
        setGeneratedImage(result.imageUrl);
        console.log('Generated image URL:', result.imageUrl);
      } else {
        setError(result.error || 'Failed to generate image');
        console.error('Generation failed:', result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Exception caught:', err);
    } finally {
      setIsGenerating(false);
      console.log('=== Generation Complete ===');
    }
  };

  const removeBg = async () => {
    console.log('=== Remove Background Clicked ===');
    const imageToProcess = generatedImage || uploadedImages[0];
    
    if (!imageToProcess) {
      alert('Please upload an image first');
      return;
    }

    setIsRemovingBg(true);
    setError(null);

    try {
      console.log('Removing background...');
      const result = await removeBackground(imageToProcess);

      if (result.success) {
        setGeneratedImage(result.imageUrl);
        console.log('Background removed successfully');
      } else {
        setError(result.error || 'Failed to remove background');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Exception caught:', err);
    } finally {
      setIsRemovingBg(false);
    }
  };

  const toDataURL = async (url: string) => {
    try {
      const response = await fetch(url);
      const blobData = await response.blob();
      const imageDataUrl = URL.createObjectURL(blobData);
      return imageDataUrl;
    } catch (error) {
      console.error('Error converting image to data URL:', error);
      return url; // Fallback to original URL
    }
  };

  const handleDownload = async () => {
    const imageToDownload = generatedImage || uploadedImages[0];
    if (!imageToDownload) {
      alert('No image to download');
      return;
    }

    try {
      const a = document.createElement('a');
      a.href = await toDataURL(imageToDownload);
      a.download = `photo-studio-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the blob URL after download
      setTimeout(() => URL.revokeObjectURL(a.href), 100);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const displayImage = generatedImage || uploadedImages[0];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col p-6"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Logo */}
      <div className="absolute top-6 left-6">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
          <img src={logoimg} alt="Logo" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 right-6 bg-white hover:bg-gray-100 text-gray-700 px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Upload</span>
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex gap-6 mt-24 max-w-7xl mx-auto w-full">
        {/* Left Side - Image Display */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Image Container */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex-1 flex items-center justify-center min-h-[500px] relative">
            {(isGenerating || isRemovingBg) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10">
                <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
                <p className="text-white text-xl font-medium">
                  {isGenerating ? 'Generating your image...' : 'Removing background...'}
                </p>
              </div>
            )}
            {generatedImage ? (
              <img 
                src={generatedImage} 
                alt="Generated Product" 
                className="max-w-full max-h-full object-contain"
              />
            ) : uploadedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 p-4 w-full h-full overflow-auto">
                {uploadedImages.map((img, i) => (
                  <img 
                    key={i}
                    src={img} 
                    alt={`Uploaded ${i}`} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-xl">
                No images uploaded
              </div>
            )}
          </div>

          {/* Description Input with Generate Button */}
          <div className="flex gap-4 items-end">
            <textarea
              value={thoughts}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setThoughts(e.target.value)}
              placeholder="Describe what you want to create or enhance..."
              className="flex-1 bg-white rounded-lg px-6 py-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none shadow-md"
              rows={3}
              disabled={isGenerating}
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !thoughts.trim()}
              className={`rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 ${
                isGenerating || !thoughts.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500'
              }`}
              title="Generate image from description"
            >
              {isGenerating ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              ❌ {error}
            </div>
          )}

          {generatedImage && !error && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              ✨ Image generated successfully! You can download it now.
            </div>
          )}
        </div>

        {/* Right Side - Control Panel */}
        <div className="w-80 flex flex-col gap-4">
          {/* Size Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('size')}
              className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white px-6 py-4 rounded-2xl text-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between"
            >
              <span>Size</span>
              <ChevronDown className={`w-6 h-6 transition-transform ${openDropdown === 'size' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'size' && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl overflow-hidden z-10">
                {sizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSize(option.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-6 py-3 text-left hover:bg-teal-50 transition-colors ${
                      size === option.value ? 'bg-teal-100 text-teal-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sharpness Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('sharpness')}
              className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white px-6 py-4 rounded-2xl text-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between"
            >
              <span>Sharpness</span>
              <ChevronDown className={`w-6 h-6 transition-transform ${openDropdown === 'sharpness' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'sharpness' && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl overflow-hidden z-10">
                {sharpnessOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSharpness(option);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-6 py-3 text-left hover:bg-teal-50 transition-colors ${
                      sharpness === option ? 'bg-teal-100 text-teal-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quality Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('quality')}
              className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white px-6 py-4 rounded-2xl text-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between"
            >
              <span>Quality</span>
              <ChevronDown className={`w-6 h-6 transition-transform ${openDropdown === 'quality' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'quality' && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl overflow-hidden z-10">
                {qualityOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setQuality(option);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-6 py-3 text-left hover:bg-teal-50 transition-colors ${
                      quality === option ? 'bg-teal-100 text-teal-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Orientation Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('orientation')}
              className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white px-6 py-4 rounded-2xl text-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between"
            >
              <span>Orientation</span>
              <ChevronDown className={`w-6 h-6 transition-transform ${openDropdown === 'orientation' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'orientation' && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl overflow-hidden z-10">
                {orientationOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setOrientation(option);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-6 py-3 text-left hover:bg-teal-50 transition-colors ${
                      orientation === option ? 'bg-teal-100 text-teal-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Remove Bg Button */}
          <button
            onClick={removeBg}
            disabled={isRemovingBg || !displayImage}
            className={`w-full px-6 py-4 rounded-2xl text-xl font-medium shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mt-2 ${
              isRemovingBg || !displayImage
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white hover:shadow-xl'
            }`}
          >
            {isRemovingBg ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Remove Background</span>
                <Wallpaper className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!displayImage}
            className={`w-full px-6 py-4 rounded-2xl text-xl font-medium shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mt-2 ${
              displayImage
                ? 'bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>Download</span>
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
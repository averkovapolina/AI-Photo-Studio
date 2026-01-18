import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Upload, Mic, MicOff, ChevronDown, Download, Loader2, X } from 'lucide-react';
import { generateProductImage, removeBackground } from './fal-service';
import logoimg from './assets/Logo.png';
import type { HistoryItem } from './history-sidebar';

interface EditorPageProps {
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  onClearHistory: () => void;
}

export default function EditorPage({
  history,
  addToHistory,
  onClearHistory
}: EditorPageProps) {
  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Prompt state
  const [thoughts, setThoughts] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  
  // Settings state - Aspect Ratio and Resolution with multi-select
  const [aspectRatio, setAspectRatio] = useState<string>('landscape_4_3');
  const [resolution, setResolution] = useState<string>('High');
  const [sharpness, setSharpness] = useState('Normal');
  const [lighting, setLighting] = useState('Studio');
  const [model, setModel] = useState('fal-ai/gemini-25-flash-image/edit');
  
  // Generation state
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const aspectRatioOptions = [
    { label: 'Square', value: 'square' },
    { label: 'Portrait 4:3', value: 'portrait_4_3' },
    { label: 'Portrait 16:9', value: 'portrait_16_9' },
    { label: 'Landscape 4:3', value: 'landscape_4_3' },
    { label: 'Landscape 16:9', value: 'landscape_16_9' },
  ];

  const resolutionOptions = ['Low', 'Medium', 'High', 'Ultra'];
  const sharpnessOptions = ['Soft', 'Normal', 'Sharp', 'Very Sharp'];
  const lightingOptions = ['Natural', 'Studio', 'Cinematic', 'Dramatic', 'Ambient', 'Soft'];
  const modelOptions = [
    { label: 'Gemini 2.5 Flash', value: 'fal-ai/gemini-25-flash-image/edit' },
    { label: 'Flux 2 Pro', value: 'fal-ai/flux-2-pro/edit' },
    { label: 'Nano Banana Pro', value: 'fal-ai/nano-banana-pro/edit' },
  ];

  // Popular prompt suggestions for interior and decor
  const popularTags = [
    'modern interior', 'minimalist design', 'scandinavian style', 'luxury decor',
    'cozy atmosphere', 'natural lighting', 'neutral colors', 'warm tones',
    'contemporary furniture', 'vintage elements', 'industrial design', 'bohemian style',
    'elegant decor', 'sustainable materials', 'open space', 'high ceilings',
    'wooden floors', 'marble surfaces', 'plants', 'textured walls',
    'geometric patterns', 'art deco', 'mid-century modern', 'rustic charm'
  ];

  // Common prompt templates for interior design autocomplete
  const promptTemplates = [
    'a modern', 'a minimalist', 'a luxurious', 'a cozy',
    'a contemporary', 'a scandinavian', 'an elegant', 'a vintage',
    'with', 'featuring', 'including', 'decorated with',
    'in', 'room with', 'space with', 'interior with',
    'living room', 'bedroom', 'kitchen', 'bathroom',
    'dining area', 'home office', 'studio apartment', 'penthouse'
  ];

  // Map aspect ratio to size format
  const getSizeFromAspectRatio = (ratio: string): "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9" => {
    const map: Record<string, "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9"> = {
      'square': 'square_hd',
      'portrait_4_3': 'portrait_4_3',
      'portrait_16_9': 'portrait_16_9',
      'landscape_4_3': 'landscape_4_3',
      'landscape_16_9': 'landscape_16_9',
    };
    return map[ratio] || 'landscape_4_3';
  };

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };

        recognitionRef.current.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          setInterimText(interimTranscript);
          if (finalTranscript) {
            setThoughts(prev => prev + finalTranscript);
            setInterimText('');
          }
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
          setInterimText('');
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          setInterimText('');
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => handleFile(file));
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => handleFile(file));
    }
  };

  // Handle prompt input with autocomplete
  const handlePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setThoughts(value);

    // Show autocomplete suggestions based on current word
    const words = value.split(' ');
    const currentWord = words[words.length - 1].toLowerCase().trim();

    if (currentWord.length > 0 && !currentWord.includes(' ')) {
      const suggestions = promptTemplates.filter(template =>
        template.toLowerCase().startsWith(currentWord) && 
        template.toLowerCase() !== currentWord
      ).slice(0, 5);
      setAutocompleteSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setAutocompleteSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Add tag to prompt
  const addTagToPrompt = (tag: string) => {
    const currentValue = thoughts.trim();
    const newValue = currentValue ? `${currentValue}, ${tag}` : tag;
    setThoughts(newValue);
  };

  // Apply autocomplete suggestion
  const applySuggestion = (suggestion: string) => {
    const words = thoughts.split(' ');
    words[words.length - 1] = suggestion;
    setThoughts(words.join(' '));
    setShowSuggestions(false);
    setAutocompleteSuggestions([]);
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewUrls(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload an image file');
    }
  };

  const removeImage = (index: number) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleGenerate = async () => {
    if (previewUrls.length === 0 || !thoughts.trim()) {
      alert('Please provide images and description');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateProductImage({
        imageUrls: previewUrls,
        prompt: thoughts,
        size: getSizeFromAspectRatio(aspectRatio),
        quality: resolution.toLowerCase(),
        sharpness: sharpness.toLowerCase(),
        orientation: aspectRatio.includes('portrait') ? 'portrait' : aspectRatio.includes('square') ? 'square' : 'landscape',
        lighting: lighting.toLowerCase(),
        model: model,
      });

      if (result.success) {
        setGeneratedImage(result.imageUrl);
        addToHistory({
          imageUrl: result.imageUrl,
          prompt: thoughts,
          settings: {
            size: getSizeFromAspectRatio(aspectRatio),
            sharpness,
            quality: resolution,
            orientation: aspectRatio.includes('portrait') ? 'Portrait' : aspectRatio.includes('square') ? 'Square' : 'Landscape',
            lighting,
            model,
          }
        });
      } else {
        setError(result.error || 'Failed to generate image');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Exception caught:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const removeBg = async () => {
    const imageToProcess = generatedImage || previewUrls[0];
    
    if (!imageToProcess) {
      alert('Please upload an image first');
      return;
    }

    setIsRemovingBg(true);
    setError(null);

    try {
      const result = await removeBackground(imageToProcess);

      if (result.success) {
        setGeneratedImage(result.imageUrl);
        addToHistory({
          imageUrl: result.imageUrl,
          prompt: thoughts,
          settings: {
            size: getSizeFromAspectRatio(aspectRatio),
            sharpness,
            quality: resolution,
            orientation: aspectRatio.includes('portrait') ? 'Portrait' : aspectRatio.includes('square') ? 'Square' : 'Landscape',
            lighting,
            model,
          }
        });
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
      return url;
    }
  };

  const handleDownload = async () => {
    const imageToDownload = generatedImage || previewUrls[0];
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
      setTimeout(() => URL.revokeObjectURL(a.href), 100);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const displayImage = generatedImage || previewUrls[0];

  return (
    <div className="min-h-screen w-full bg-white flex flex-col overflow-hidden">
      {/* Logo in top left */}
      <div className="absolute top-4 left-4 z-20">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden">
          <img src={logoimg} alt="Logo" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden pt-20">
        {/* Left Sidebar - Compact Panel */}
        <div className="w-80 border-r border-gray-200 flex flex-col overflow-y-auto bg-gray-50">
          {/* Upload Section */}
          <div className="p-4 border-b border-gray-200">
            <div
              className={`bg-white rounded-lg border-2 border-dashed transition-all duration-200 ${
                isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-300'
              } p-4`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {!previewUrls.length ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Upload className="w-8 h-8 mb-3 text-gray-400" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Drop images here
                  </p>
                  <button
                    onClick={handleSelectClick}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    or select files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleSelectClick}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-xs text-gray-500 hover:border-teal-500 hover:text-teal-500 transition-colors"
                  >
                    + Add more
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Prompt Section */}
          <div className="p-4 border-b border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-2">Prompt</label>
            <div className="relative">
              <textarea
                value={thoughts + (interimText ? ' ' + interimText : '')}
                onChange={handlePromptChange}
                onFocus={() => setShowSuggestions(autocompleteSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Describe your interior design... (e.g., 'a modern minimalist living room with natural light')"
                className="w-full bg-white rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none border border-gray-300"
                rows={4}
                disabled={isGenerating}
              />
              {interimText && (
                <span className="absolute bottom-3 right-12 text-xs text-gray-400 italic">
                  (speaking...)
                </span>
              )}
              
              {/* Autocomplete suggestions */}
              {showSuggestions && autocompleteSuggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-30 max-h-40 overflow-y-auto">
                  {autocompleteSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-teal-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <button 
                onClick={toggleListening}
                className={`absolute bottom-2 right-2 rounded-full w-8 h-8 flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title={isListening ? 'Stop recording' : 'Start recording'}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* Popular tags */}
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5">
                {popularTags.slice(0, 10).map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addTagToPrompt(tag)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-700 rounded-md transition-colors border border-gray-200 hover:border-teal-300"
                    title={`Add "${tag}" to prompt`}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {isListening && (
              <p className="text-xs text-gray-500 mt-2">
                🎤 Listening...
              </p>
            )}
          </div>

          {/* Parameters Section - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {aspectRatioOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAspectRatio(option.value)}
                    className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                      aspectRatio === option.value
                        ? 'bg-teal-50 border-teal-500 text-teal-700 font-medium'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Resolution</label>
              <div className="grid grid-cols-2 gap-2">
                {resolutionOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setResolution(option)}
                    className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                      resolution === option
                        ? 'bg-teal-50 border-teal-500 text-teal-700 font-medium'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Sharpness */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Sharpness</label>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('sharpness')}
                  className="w-full bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between hover:border-gray-400"
                >
                  <span>{sharpness}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'sharpness' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'sharpness' && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-20">
                    {sharpnessOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSharpness(option);
                          setOpenDropdown(null);
                        }}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors ${
                          sharpness === option ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lighting */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Lighting</label>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('lighting')}
                  className="w-full bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between hover:border-gray-400"
                >
                  <span>{lighting}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'lighting' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'lighting' && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-20">
                    {lightingOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setLighting(option);
                          setOpenDropdown(null);
                        }}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors ${
                          lighting === option ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Model</label>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('model')}
                  className="w-full bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between hover:border-gray-400"
                >
                  <span>{modelOptions.find(o => o.value === model)?.label || 'Model'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'model' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'model' && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-20">
                    {modelOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setModel(option.value);
                          setOpenDropdown(null);
                        }}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors ${
                          model === option.value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !thoughts.trim() || previewUrls.length === 0}
              className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${
                isGenerating || !thoughts.trim() || previewUrls.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-black hover:bg-gray-800 text-white'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </span>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>

        {/* Right Side - Image Display */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* History - Subtle, above image */}
          {history.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs text-gray-500 whitespace-nowrap">Recent:</span>
                {history.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPreviewUrls([item.imageUrl]);
                      setThoughts(item.prompt);
                      setAspectRatio(item.settings.size.includes('portrait') ? 'portrait_4_3' : item.settings.size.includes('square') ? 'square' : 'landscape_4_3');
                      setResolution(item.settings.quality);
                      setSharpness(item.settings.sharpness);
                      setLighting(item.settings.lighting || 'Studio');
                      setModel(item.settings.model || 'fal-ai/gemini-25-flash-image/edit');
                      setGeneratedImage(item.imageUrl);
                    }}
                    className="flex-shrink-0 w-12 h-12 rounded border border-gray-200 overflow-hidden hover:border-teal-400 transition-all"
                  >
                    <img src={item.imageUrl} alt="History" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Display Area */}
          <div className="flex-1 flex items-center justify-center p-8 relative bg-gray-50">
            {(isGenerating || isRemovingBg) && (
              <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
                <p className="text-sm text-gray-600">
                  {isGenerating ? 'Generating your image...' : 'Removing background...'}
                </p>
              </div>
            )}
            
            {displayImage ? (
              <div className="relative max-w-full max-h-full">
                <img 
                  src={displayImage} 
                  alt="Generated" 
                  className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-lg"
                />
                {/* Download button on image */}
                {generatedImage && (
                  <button
                    onClick={handleDownload}
                    className="absolute top-4 right-4 bg-white/90 hover:bg-white border border-gray-200 rounded-lg p-2 shadow-lg hover:shadow-xl transition-all"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-gray-700" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p className="text-sm">Upload images and generate to see results</p>
              </div>
            )}

            {error && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm">
                ❌ {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

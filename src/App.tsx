import { useState } from 'react'
import PhotoUploadInterface from './photo-upload-interface'
import MainUI from './main-ui'

function App() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const handleUploadSubmit = (images: string[], desc: string) => {
    setUploadedImages(images);
    setDescription(desc);
  };

  const handleBackToUpload = () => {
    setUploadedImages([]);
    setDescription('');
  };

  if (uploadedImages.length > 0) {
    return (
      <MainUI 
        uploadedImages={uploadedImages} 
        description={description}
        onBack={handleBackToUpload}
      />
    );
  }

  return <PhotoUploadInterface onSubmit={handleUploadSubmit} />
}

export default App
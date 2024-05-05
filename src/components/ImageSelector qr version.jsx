import { createSignal, onMount } from 'solid-js';
import { imageStore, initImageStore, removeFromCache } from '../imageCache';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import LICENSE from '../../LICENSE.md?raw';

console.log(LICENSE)

const ImageSelector = () => {
  const [selectedImages, setSelectedImages] = createSignal([]);
  const [showQRCodeModal, setShowQRCodeModal] = createSignal(false);
  const [qrCodeDataURL, setQRCodeDataURL] = createSignal('');

  const toggleImageSelection = (image) => {
    setSelectedImages((prevSelectedImages) => {
      if (prevSelectedImages.includes(image)) {
        return prevSelectedImages.filter((selectedImage) => selectedImage !== image);
      } else {
        return [...prevSelectedImages, image];
      }
    });
  };

  const generateQRCode = async () => {
    const zip = new JSZip();
    const licenseFile = zip.file('LICENSE.md', LICENSE);
  
    console.log('adding images to zip')
    for (const image of selectedImages()) {
      const fileName = image.name;
      const fileData = await image.blob.arrayBuffer();
      zip.folder('images').file(fileName, fileData);
    }
  
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    console.log('generating zip data url')
    const zipDataURL = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(zipBlob);
    });

    console.log("converting to canvas")
  
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, zipDataURL, { errorCorrectionLevel: 'H' }, (error) => {
      if (error) {
        console.error('Error generating QR code:', error);
      } else {
        const qrCodeDataURL = canvas.toDataURL('image/png');
        setQRCodeDataURL(qrCodeDataURL);
        setShowQRCodeModal(true);
      }
    });
    console.log('done converting to canvas')
  };

  const closeQRCodeModal = () => {
    setShowQRCodeModal(false);
  };

  onMount(() => {
    initImageStore();
  });

  return (
    <div>
      <button onClick={generateQRCode}>Generate QR Code</button>
      <div
        style={{
          display: 'grid',
          'grid-template-columns': 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <For each={imageStore.cachedFiles} fallback={<div>Loading...</div>}>
          {(image) => (
            <div key={image.name}>
              <img
                src={URL.createObjectURL(image.blob)}
                alt={image.name}
                width="200"
                onClick={() => toggleImageSelection(image)}
                style={{
                  border: selectedImages().includes(image) ? '2px solid red' : 'none',
                }}
              />
            </div>
          )}
        </For>
      </div>
      {showQRCodeModal() && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '5px',
              position: 'relative',
            }}
          >
            <button
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
              }}
              onClick={closeQRCodeModal}
            >
              &times;
            </button>
            <img src={qrCodeDataURL()} alt="QR Code" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSelector;
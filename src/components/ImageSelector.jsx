import { createSignal, onMount } from 'solid-js';
import { imageStore, initImageStore, removeFromCache } from '../imageCache';
import JSZip from 'jszip';
import LICENSE from '../../LICENSE.md?raw';

const ImageSelector = () => {
  const [selectedImages, setSelectedImages] = createSignal([]);
  const [showNFCModal, setShowNFCModal] = createSignal(false);

  const toggleImageSelection = (image) => {
    setSelectedImages((prevSelectedImages) => {
      if (prevSelectedImages.includes(image)) {
        return prevSelectedImages.filter((selectedImage) => selectedImage !== image);
      } else {
        return [...prevSelectedImages, image];
      }
    });
  };

  const transferFilesViaNFC = async () => {
    const zip = new JSZip();
    const licenseFile = zip.file('LICENSE.md', LICENSE);

    for (const image of selectedImages()) {
      const fileName = image.name;
      const fileData = await image.blob.arrayBuffer();
      zip.folder('images').file(fileName, fileData);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    if ('NDEFReader' in window) {
      const ndef = new window.NDEFReader();
      try {
        await ndef.write({ records: [{ data: zipBlob, mediaType: 'application/octet-stream' }] });
        setShowNFCModal(true);
      } catch (error) {
        console.error('Error writing NFC data:', error);
      }
    } else {
      console.error('Web NFC API is not supported in this browser.');
    }
  };

  const closeNFCModal = () => {
    setShowNFCModal(false);
  };

  onMount(() => {
    initImageStore();
  });

  return (
    <div>
      <button onClick={transferFilesViaNFC}>Transfer Files via NFC</button>
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
      {showNFCModal() && (
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
              onClick={closeNFCModal}
            >
              &times;
            </button>
            <p>Hold your NFC-enabled device near the NFC reader to transfer the files.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSelector;
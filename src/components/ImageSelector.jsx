import { createSignal, onMount } from "solid-js";
import { imageStore, initImageStore, removeFromCache } from "../imageCache";
import QRCode from "qrcode";

const ImageSelector = () => {
  const [selectedImages, setSelectedImages] = createSignal([]);

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
    const readmeFile = zip.folder("images").file("README.md", );

    for (const image of selectedImages()) {
      const fileName = image.name;
      const fileData = await image.blob.arrayBuffer();
      zip.folder("images").file(fileName, fileData);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);

    const canvas = document.createElement("canvas");
    QRCode.toCanvas(canvas, zipUrl, { errorCorrectionLevel: "H" }, (error) => {
      if (error) {
        console.error("Error generating QR code:", error);
      } else {
        const qrCodeImage = canvas.toDataURL("image/png");
        const qrCodeWindow = window.open("");
        qrCodeWindow.document.write(`<img src="${qrCodeImage}" alt="QR Code">`);
      }
    });
  };

  onMount(() => {
    initImageStore();
  });

  return (
    <div>
      <button onClick={generateQRCode}>Generate QR Code</button>
      <div>
        <For each={imageStore.cachedFiles} fallback={<div>Loading...</div>}>
          {(image) => (
            <div key={image.name}>
              <img
                src={URL.createObjectURL(image.blob)}
                alt={image.name}
                width="200"
                onClick={() => toggleImageSelection(image)}
                style={{
                  "border": selectedImages().includes(image) ? "2px solid red" : "none",
                }}
              />
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default ImageSelector;
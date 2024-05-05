import { createSignal, onMount } from "solid-js";

const ImageUploader = () => {
  const [files, setFiles] = createSignal([]);
  const [cachedFiles, setCachedFiles] = createSignal([]);
  let cacheRef;

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files));
    cacheFiles().catch(console.error);
  };

  const cacheFiles = async () => {
    if ("caches" in window) {
      if (!cacheRef) cacheRef = await caches.open("image-cache");
      for (const file of files()) {
        const response = await fetch(URL.createObjectURL(file));
        const blob = await response.blob();
        await cacheRef.put(file.name, new Response(blob));
        setCachedFiles(
          cachedFiles()
            .filter((testFile) => testFile.name !== file.name)
            .concat([{ name: file.name, blob }])
        );
      }
    } else {
      console.error("Cache API not supported in this browser.");
    }
  };

  const loadCachedFiles = async () => {
    console.log("loading cache");
    if ("caches" in window) {
      if (!cacheRef) cacheRef = await caches.open("image-cache");
      const keys = await cacheRef.keys();
      const files = await Promise.all(
        keys.map(async (key) => {
          const response = await cacheRef.match(key);
          const blob = await response.blob();
          return { name: key.url.split("/").pop(), blob };
        })
      );
      setCachedFiles(files);
    } else {
      console.error("Cache API not supported in this browser.");
    }
  };

  const removeFromCache = async (fileName) => {
    if ("caches" in window) {
      cacheRef = await caches.open("image-cache");
      await cacheRef.delete(fileName);
      loadCachedFiles();
    } else {
      console.error("Cache API not supported in this browser.");
    }
  };

  onMount(() => {
    loadCachedFiles();
  });

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <ul>
        <For each={cachedFiles()}>
          {(file) => (
            <li key={file.name}>
              {file.name}{" "}
              <button onClick={() => removeFromCache(file.name)}>X</button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
};

export default ImageUploader;

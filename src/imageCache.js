import { createStore } from "solid-js/store";

const [imageStore, setImageStore] = createStore({
  cachedFiles: [],
  cacheRef: null,
});

export async function initImageStore() {
  if ("caches" in window) {
    setImageStore("cacheRef", await caches.open("image-cache"));
    loadCachedFiles();
  } else {
    console.error("Cache API not supported in this browser.");
  }
}

async function loadCachedFiles() {
  if (imageStore.cacheRef) {
    const keys = await imageStore.cacheRef.keys();
    const files = await Promise.all(
      keys.map(async (key) => {
        const response = await imageStore.cacheRef.match(key);
        const blob = await response.blob();
        return { name: key.url.split("/").pop(), blob };
      })
    );
    setImageStore("cachedFiles", files);
  } else {
    throw new Error("The cache has not been initialized");
  }
}

export async function wipeFiles() {
  await Promise.all(
    imageStore.cachedFiles.map((cachedFile) => removeFromCache(cachedFile.name))
  );
}

export async function cacheFiles(files) {
  if (imageStore.cacheRef) {
    const outputFiles = [];
    for (const file of files) {
      const response = await fetch(URL.createObjectURL(file));
      const blob = await response.blob();
      await imageStore.cacheRef.put(file.name, new Response(blob));
      outputFiles.push({ name: file.name, blob });
    }
    const newStoreFiles = imageStore.cachedFiles
      .filter((testFile) =>
        outputFiles.every((outputFile) => outputFile.name !== testFile.name)
      )
      .concat(outputFiles);
    setImageStore("cachedFiles", newStoreFiles);
  } else {
    throw new Error("The cache has not been initialized");
  }
}

export async function removeFromCache(fileName) {
  if (imageStore.cacheRef) {
    await imageStore.cacheRef.delete(fileName);
    loadCachedFiles();
  } else {
    throw new Error("The cache has not been initialized");
  }
}

export { imageStore };

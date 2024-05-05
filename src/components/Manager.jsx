import { createSignal, onMount } from "solid-js";
import { initImageStore, imageStore, cacheFiles, removeFromCache} from "../imageCache";

const ImageUploader = () => {
  //const [files, setFiles] = createSignal([]);

  const handleFileChange = (event) => {
    cacheFiles(Array.from(event.target.files))
  };

  onMount(() => {
    initImageStore()
    window.imageStore = imageStore
  });

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <ul>
        <For each={imageStore.cachedFiles}>
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

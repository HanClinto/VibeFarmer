function versionedUrl(relativePath) {
  const moduleUrl = new URL(import.meta.url);
  const url = new URL(`../../../assets/game/${relativePath}`, moduleUrl);
  const version = moduleUrl.searchParams.get("v");
  if (version) url.searchParams.set("v", version);
  return url;
}

function loadImage(url, imageFactory) {
  return new Promise((resolve, reject) => {
    const image = imageFactory();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error(`Failed to load sprite: ${url}`)), {
      once: true,
    });
    image.src = url;
  });
}

export async function loadSpriteCatalog({
  fetchCatalog = (url) => fetch(url).then((response) => {
    if (!response.ok) throw new Error(`Failed to load sprite catalog: ${response.status}`);
    return response.json();
  }),
  imageFactory = () => new Image(),
} = {}) {
  const definition = await fetchCatalog(versionedUrl("catalog.json"));
  const entries = await Promise.all(Object.entries(definition.frames).map(
    async ([frameId, frame]) => {
      const url = versionedUrl(frame.file);
      return [frameId, { image: await loadImage(url, imageFactory), url: String(url) }];
    },
  ));
  return {
    definition,
    frames: Object.fromEntries(entries),
  };
}
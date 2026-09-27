const fs = require('fs/promises');
const path = require('path');

const categories = [
  'salida',
  'recorrido',
  'meta',
  'convivencia',
  'institucional'
];

const supportedExtensions = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.webp'
]);

const galleryStoragePath = path.resolve(
  process.env.GALLERY_STORAGE_PATH ||
  path.join(process.cwd(), 'storage', 'gallery')
);

function titleFromFilename(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)([a-záéíóúüñ])/giu, (match) => match.toUpperCase());
}

class GalleryService {

  async getGallery() {
    const photos = [];

    for (const category of categories) {
      const categoryPath = path.join(galleryStoragePath, category);
      let entries;

      try {
        entries = await fs.readdir(categoryPath, { withFileTypes: true });
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }

      const files = entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((filename) => supportedExtensions.has(path.extname(filename).toLowerCase()))
        .sort((left, right) => left.localeCompare(right, 'es', { numeric: true }));

      files.forEach((filename, index) => {
        photos.push({
          id: `${category}-${index + 1}-${filename}`,
          src: `/media/gallery/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`,
          category,
          title: titleFromFilename(filename)
        });
      });
    }

    return {
      photos,
      totalPhotos: photos.length
    };
  }

}

module.exports =
  new GalleryService();

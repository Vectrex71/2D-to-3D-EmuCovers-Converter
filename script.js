
const outputContainer = document.getElementById('output-container');
const zipDownloadContainerTop = document.getElementById('zip-download-container-top');
const saveAllContainer = document.getElementById('save-all-container');
const zipDownloadContainerBottom = document.getElementById('zip-download-container');

// Modal Elements
const zipModal = document.getElementById('zip-info-modal');
const closeModalButton = document.querySelector('.modal-close');
const cancelModalButton = document.getElementById('modal-cancel-button');
const confirmDownloadButton = document.getElementById('modal-confirm-download-button');

// Image Lightbox Elements
const imageLightboxModal = document.getElementById('image-lightbox-modal');
const lightboxImage = document.getElementById('lightbox-image');
const imageLightboxCloseButton = document.querySelector('.image-lightbox-close');

// Download Progress Bar Elements
const downloadProgressContainer = document.getElementById('download-progress-container');
const downloadProgressLabel = document.getElementById('download-progress-label');
const downloadProgressBarInner = document.getElementById('download-progress-bar-inner');

// Processing Progress Bar Elements
const processingProgressContainer = document.getElementById('processing-progress-container');
const processingProgressLabel = document.getElementById('processing-progress-label');
const processingProgressBarInner = document.getElementById('processing-progress-bar-inner');

let currentGeneratedImages = [];

const selectDirectoryButton = document.getElementById('select-directory-button');

if (selectDirectoryButton) {
    selectDirectoryButton.addEventListener('click', async () => {
        try {
            if (!('showDirectoryPicker' in window)) {
                alert('Your browser does not support the File System Access API, which is required for this feature. Please use a modern browser like Chrome or Edge.');
                return;
            }

            const dirHandle = await window.showDirectoryPicker();
            const imageFiles = [];
            
            // Show a generic "reading files" message first
            processingProgressContainer.style.display = 'block';
            processingProgressLabel.textContent = 'Reading files...';
            processingProgressBarInner.style.width = '0%';


            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && (entry.name.toLowerCase().endsWith('.jpg') || entry.name.toLowerCase().endsWith('.jpeg') || entry.name.toLowerCase().endsWith('.png'))) {
                    const file = await entry.getFile();
                    imageFiles.push(file);
                }
            }
            
            if (imageFiles.length === 0) {
                alert('No JPG or PNG images found in the selected directory.');
                processingProgressContainer.style.display = 'none';
                return;
            }

            const confirmation = confirm(`Are you sure? This will process ${imageFiles.length} images.`);
            if (!confirmation) {
                processingProgressContainer.style.display = 'none';
                return;
            }

            outputContainer.innerHTML = '';
            zipDownloadContainerTop.innerHTML = '';
            saveAllContainer.innerHTML = '';
            zipDownloadContainerBottom.innerHTML = '';
            downloadProgressContainer.style.display = 'none';
            
            document.querySelector('.container').classList.add('loading');
            updateProcessingProgress(0, imageFiles.length);
            setTimeout(() => processImages(imageFiles), 100);

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error selecting directory:', err);
                alert('An error occurred while selecting the directory.');
            }
            processingProgressContainer.style.display = 'none';
        }
    });
}

function updateProcessingProgress(current, total) {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    processingProgressBarInner.style.width = `${percentage}%`;
    processingProgressLabel.textContent = `Processing ${current} / ${total}...`;
}

function getAspectRatioFromFile(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src); // Clean up memory
            resolve(img.width / img.height);
        };
        img.onerror = (err) => {
            URL.revokeObjectURL(img.src);
            reject(err);
        };
        img.src = URL.createObjectURL(file);
    });
}

async function processImages(files) {
    const batchAspectRatio = await getAspectRatioFromFile(files[0]);
    let processedCount = 0;

    const generatedImages = [];
    const promises = files.map(file => {
        return new Promise(resolve => {
            create3DBox(file, batchAspectRatio, (result) => {
                generatedImages.push(result);
                processedCount++;
                updateProcessingProgress(processedCount, files.length);
                resolve();
            });
        });
    });

    await Promise.all(promises);
    currentGeneratedImages = generatedImages;
    createActionButtons(generatedImages);
    
    setTimeout(() => { // Hide after a short delay
        processingProgressContainer.style.display = 'none';
        document.querySelector('.container').classList.remove('loading');
    }, 500);
}

function create3DBox(file, aspectRatio, callback) {
    const originalFileName = file.name;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const imageUrl = e.target.result;
        const textureLoader = new THREE.TextureLoader();
        const frontTexture = textureLoader.load(imageUrl, (texture) => {
            const scene = new THREE.Scene();
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            
            const maxSize = 512;
            let canvasWidth, canvasHeight;

            if (aspectRatio >= 1) { // Wider or square
                canvasWidth = maxSize;
                canvasHeight = Math.round(maxSize / aspectRatio);
            } else { // Taller
                canvasWidth = Math.round(maxSize * aspectRatio);
                canvasHeight = maxSize;
            }
            
            // Ensure canvas dimensions are at least 1px
            canvasWidth = Math.max(1, canvasWidth);
            canvasHeight = Math.max(1, canvasHeight);

            renderer.setSize(canvasWidth, canvasHeight);

            const camera = new THREE.PerspectiveCamera(30, canvasWidth / canvasHeight, 0.1, 1000);
            camera.position.set(0, 0, 5);

            const boxWidth = 1.5;
            const boxHeight = boxWidth / aspectRatio;
            const boxDepth = 0.35;

            const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
            const sideMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
            const frontMaterial = new THREE.MeshBasicMaterial({ map: texture });

            // Create a texture for the box spine
            const spineTexture = texture.clone();
            spineTexture.needsUpdate = true;

            // Use a thin vertical slice from the left side of the image and stretch it
            const spineWidthRatio = 0.05; // Use 5% of the image width for the spine texture
            spineTexture.repeat.x = spineWidthRatio;
            spineTexture.offset.x = 0; // Start from the left edge

            const spineMaterial = new THREE.MeshBasicMaterial({ map: spineTexture, color: 0x777777 });

            // materials order: right, left, top, bottom, front, back
            const materials = [
                spineMaterial,         // right side (+X)
                sideMaterial,          // left side (-X) is not visible with current rotation
                sideMaterial,          // top (+Y)
                sideMaterial,          // bottom (-Y)
                frontMaterial,         // front (+Z)
                sideMaterial           // back (-Z)
            ];
            const box = new THREE.Mesh(geometry, materials);

            box.rotation.y = -0.5;
            box.rotation.x = 0.1;
            scene.add(box);

            renderer.render(scene, camera);

            const resultUrl = renderer.domElement.toDataURL('image/png');
            displayPreview(resultUrl);
            callback({ fileName: originalFileName, dataUrl: resultUrl });
        });
    };
}

function displayPreview(imageUrl) {
    if (outputContainer.style.display === 'none' || outputContainer.style.display === '') {
        outputContainer.style.display = 'flex';
    }
    const img = document.createElement('img');
    img.src = imageUrl;
    img.addEventListener('click', () => openLightbox(imageUrl));
    outputContainer.appendChild(img);
}

function openLightbox(imageUrl) {
    lightboxImage.src = imageUrl;
    imageLightboxModal.style.display = 'flex';
}

function closeLightbox() {
    imageLightboxModal.style.display = 'none';
    lightboxImage.src = ''; // Clear image source
}

function updateDownloadProgress(current, total, action) {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    downloadProgressBarInner.style.width = `${percentage}%`;
    downloadProgressLabel.textContent = `${action} ${current} / ${total}...`;
}

async function saveAllToFolder(images, button) {
    button.style.pointerEvents = 'none';
    downloadProgressContainer.style.display = 'block';
    updateDownloadProgress(0, images.length, 'Saving');

    try {
        const dirHandle = await window.showDirectoryPicker();
        let savedCount = 0;

        for (const image of images) {
            const blob = await (await fetch(image.dataUrl)).blob();
            const fileHandle = await dirHandle.getFileHandle(image.fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            savedCount++;
            updateDownloadProgress(savedCount, images.length, 'Saving');
        }
        setTimeout(() => {
            alert('All images saved successfully in the selected folder!');
        }, 100);

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Error saving files:', err);
            alert('Error saving files.');
        }
    } finally {
        button.style.pointerEvents = 'auto';
        downloadProgressContainer.style.display = 'none';
    }
}

const performZipDownload = async () => {
    zipModal.style.display = 'none';
    const zipButton = zipDownloadContainerTop.querySelector('.zip-download-button');
    zipButton.style.pointerEvents = 'none';
    downloadProgressContainer.style.display = 'block';
    downloadProgressLabel.textContent = 'Creating ZIP...';
    downloadProgressBarInner.style.width = '0%';

    const zip = new JSZip();
    for (const image of currentGeneratedImages) {
        const base64Data = image.dataUrl.split(',')[1];
        zip.file(image.fileName, base64Data, { base64: true });
    }

    // Fake progress for zipping
    downloadProgressBarInner.style.transition = 'width 1.5s ease-in-out';
    downloadProgressBarInner.style.width = '100%';

    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const downloadUrl = URL.createObjectURL(zipBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = '3D_Covers.zip';
    downloadLink.click();

    URL.revokeObjectURL(downloadUrl);
    
    setTimeout(() => {
        zipButton.style.pointerEvents = 'auto';
        downloadProgressContainer.style.display = 'none';
        downloadProgressBarInner.style.transition = 'width 0.3s ease-in-out'; // reset transition
    }, 500);
};

function createActionButtons(images) {
    zipDownloadContainerTop.innerHTML = '';
    saveAllContainer.innerHTML = '';

    // ZIP Button
    const topButton = document.createElement('a');
    topButton.textContent = 'Download All as ZIP';
    topButton.href = '#';
    topButton.className = 'zip-download-button';
    topButton.addEventListener('click', (e) => {
        e.preventDefault();
        zipModal.style.display = 'flex';
    });
    zipDownloadContainerTop.appendChild(topButton);

    // Save All Button
    if ('showDirectoryPicker' in window) {
        const saveAllButton = document.createElement('a');
        saveAllButton.textContent = 'Save All to Folder';
        saveAllButton.href = '#';
        saveAllButton.className = 'save-all-button';
        saveAllButton.addEventListener('click', (e) => {
            e.preventDefault();
            saveAllToFolder(images, saveAllButton);
        });
        saveAllContainer.appendChild(saveAllButton);
    }
}

// Modal event listeners
closeModalButton.addEventListener('click', () => zipModal.style.display = 'none');
cancelModalButton.addEventListener('click', () => zipModal.style.display = 'none');
confirmDownloadButton.addEventListener('click', performZipDownload);
window.addEventListener('click', (event) => {
    if (event.target == zipModal) {
        zipModal.style.display = 'none';
    }
});
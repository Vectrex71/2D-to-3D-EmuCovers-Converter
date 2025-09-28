# 3D Cover Converter

![Logo](LOGO.PNG.png)

A web-based tool to convert your 2D cover images (JPG or PNG) into 3D box images. This tool runs entirely in your browser, ensuring your files' privacy.

![Preview](PreviewImage.png)

## Live Demo

[**Try the 3D Cover Converter here!**](https://vectrex71.github.io/2D-to-3D-EmuCovers-Converter/)


## Features

*   **Batch Conversion:** Select a directory and convert all JPG and PNG images into 3D boxes at once.
*   **Client-Side Processing:** All processing is done in your browser. No files are uploaded to a server.
*   **Multiple Download Options:**
    *   Download all generated 3D covers as a single ZIP file.
    *   Save all images directly to a folder on your computer (requires a browser that supports the File System Access API).
*   **Interactive Preview:** View the generated 3D covers in a gallery and click on any image to see a larger version.
*   **Progress Indicators:** See the progress of image processing and downloading.
*   **Customizable:** The code is well-commented and easy to modify.

## How to Use

1.  **Open the tool:** [Click here](https://vectrex71.github.io/2D-to-3D-EmuCovers-Converter/) to open the live demo.
2.  **Select Directory:** Click the "Select Directory" button and choose the folder containing your 2D cover images.
3.  **Confirm:** A confirmation prompt will show how many images were found. Click "OK" to start the conversion.
4.  **Processing:** Wait for the tool to process all the images. You can see the progress in the processing bar.
5.  **Download:**
    *   Click "Download All as ZIP" to get a single ZIP file with all your 3D covers.
    *   Click "Save All to Folder" to save the images to a directory of your choice on your computer.

## Technologies Used

*   **HTML5**
*   **CSS3**
*   **JavaScript (ES6+)**
*   **[three.js](https://threejs.org/):** For creating and rendering the 3D boxes.
*   **[JSZip.js](https://stuk.github.io/jszip/):** For creating the ZIP file in the browser.
*   **File System Access API:** For reading directories and saving files directly to your computer.

## Donations

If you find this tool helpful and would like to support its development, please consider a small donation.

<a href="https://paypal.me/HansjuergWuethrich" target="_blank" rel="noopener noreferrer">
    <img src="paypal-donate-button.png" alt="Donate via PayPal.Me" width="200">
</a>

## Contributing

Contributions are welcome! If you have ideas for new features, find a bug, or want to improve the code, feel free to:

*   Open an issue to report a bug or suggest a feature.
*   Create a pull request with your changes.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contact

If you have any questions, please feel free to contact [hj.wuethrich@gmail.com](mailto:hj.wuethrich@gmail.com).

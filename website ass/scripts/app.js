const MAX_FILE_SIZE = 10 * 1024 * 1024;

document.addEventListener("DOMContentLoaded", () => {
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("file-input");
  const zoomInButton = document.getElementById("zoom-in");
  const zoomOutButton = document.getElementById("zoom-out");
  const errorMessage = document.getElementById("error-message");
  const previewContainer = document.getElementById("preview-container");
  const searchInput = document.getElementById("search-input");
  const submitButton = document.getElementById("submit-button");
  const clearSearchButton = document.getElementById("clear-button");

  const prevButton = document.createElement("button");
  const nextButton = document.createElement("button");
  const downloadButton = document.getElementById("download-button");

  const fileNameElement = document
    .getElementById("file-name")
    .querySelector("span");
  const fileSizeElement = document
    .getElementById("file-size")
    .querySelector("span");
  const fileTypeElement = document
    .getElementById("file-type")
    .querySelector("span");

  prevButton.textContent = "Previous";
  nextButton.textContent = "Next";
  prevButton.classList.add("page-nav-button");
  nextButton.classList.add("page-nav-button");

  previewContainer.appendChild(prevButton);
  previewContainer.appendChild(nextButton);

  let zoomLevel = 1; // Initial zoom level
  const zoomStep = 0.1; // Zoom step size (adjust as needed)

  // Set up zoom in functionality
  zoomInButton.addEventListener("click", () => {
    zoomLevel += zoomStep;
    updateZoom();
  });

  // Set up zoom out functionality
  zoomOutButton.addEventListener("click", () => {
    zoomLevel = Math.max(zoomLevel - zoomStep, 0.1); // Prevent zooming out too much
    updateZoom();
  });

  function updateZoom() {
    previewContainer.style.transform = `scale(${zoomLevel})`;
    previewContainer.style.transformOrigin = "top left"; // Ensure zoom happens from the top-left corner
  }

  // Implement pan functionality
  let isDragging = false;
  let startX, startY;

  previewContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.pageX - previewContainer.offsetLeft;
    startY = e.pageY - previewContainer.offsetTop;
    previewContainer.style.cursor = "move";
  });

  previewContainer.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const x = e.pageX - startX;
    const y = e.pageY - startY;
    previewContainer.style.transform = `scale(${zoomLevel}) translate(${x}px, ${y}px)`;
  });

  previewContainer.addEventListener("mouseup", () => {
    isDragging = false;
    previewContainer.style.cursor = "default";
  });

  previewContainer.addEventListener("mouseleave", () => {
    isDragging = false;
    previewContainer.style.cursor = "default";
  });

  const allowedFileTypes = [
    "application/pdf", // .pdf
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "text/plain", // .txt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "application/vnd.ms-powerpoint", // .ppt
  ];

  let pdfDoc = null;
  let currentPage = 1; // Track the current page number
  let totalPages = 0; // Track the total number of pages
  let currentTextContent = ""; // Stores extracted text for search
  let currentFile = null;

  downloadButton.addEventListener("click", () => {
    if (currentFile) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(currentFile);
      link.download = currentFile.name;
      link.click();
    } else {
      errorMessage.textContent = "No file to download.";
    }
  });

  dropArea.addEventListener("click", () => fileInput.click());
  dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.style.backgroundColor = "#d0e9ff";
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.style.backgroundColor = "#e8f4ff";
  });

  dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.style.backgroundColor = "#e8f4ff";
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleFile(file);
  });

  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    clearHighlights();
  });

  function handleFile(file) {
    errorMessage.textContent = "";
    previewContainer.innerHTML = "";

    // Check if the file is of a valid type
    if (!allowedFileTypes.includes(file.type) && !isValidExtension(file.name)) {
      errorMessage.textContent =
        "Unsupported file type. Please upload a valid file type (.pdf, .doc, .docx, .xls, .xlsx, .txt, .pptx, .ppt).";
      return;
    }

    // Check file size (e.g., 10MB limit)
    if (file.size > MAX_FILE_SIZE) {
      errorMessage.textContent =
        "File size exceeds the 10MB limit. Please upload a smaller file.";
      return;
    }
    currentFile = file;
    updateMetadata(file);
    const fileExtension = file.name.split(".").pop().toLowerCase();

    try {
      if (file.type === "application/pdf") {
        renderPDF(file);
      } else if (file.type === "text/plain") {
        renderText(file);
      } else if (fileExtension === "docx" || fileExtension === "doc") {
        renderDocx(file);
      } else if (fileExtension === "xls" || fileExtension === "xlsx") {
        renderExcel(file);
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        fileExtension === "pptx" ||
        fileExtension === "ppt"
      ) {
        renderPowerPoint(file);
      } else {
        errorMessage.textContent =
          "This file type is not supported for preview.";
      }
      showNotification("File uploaded successfully!");
    } catch (error) {
      errorMessage.textContent = `An error occurred while processing the file: ${error.message}`;
    }
  }

  function isValidExtension(filename) {
    const allowedExtensions = [
      "doc",
      "docx",
      "xls",
      "xlsx",
      "txt",
      "pptx",
      "ppt",
      "pdf",
    ];
    const extension = filename.split(".").pop().toLowerCase();
    return allowedExtensions.includes(extension);
  }

  function updateMetadata(file) {
    fileNameElement.textContent = file.name;
    fileSizeElement.textContent = formatFileSize(file.size);
    fileTypeElement.textContent = file.type || "Unknown";
  }

  function formatFileSize(size) {
    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  function showNotification(message) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.classList.remove("hidden");
    notification.classList.add("visible");

    // Automatically hide the notification after 3 seconds
    setTimeout(() => {
      notification.classList.remove("visible");
      notification.classList.add("hidden");
    }, 3000);
  }

  function renderPDF(file) {
    const pdfjsLib = window["pdfjs-dist/build/pdf"];
    if (!pdfjsLib) {
      errorMessage.textContent = "Error: PDF.js library is not loaded.";
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js";

    const fileUrl = URL.createObjectURL(file);

    pdfjsLib
      .getDocument(fileUrl)
      .promise.then((pdf) => {
        pdfDoc = pdf;
        totalPages = pdf.numPages;

        // Render the first page when the PDF is loaded
        renderPage(currentPage);

        // Display navigation buttons
        createNavigationButtons();
      })
      .catch((error) => {
        errorMessage.textContent = "Error loading PDF: " + error.message;
      });
  }

  function renderPage(pageNum) {
    if (pageNum < 1 || pageNum > totalPages) return;

    pdfDoc.getPage(pageNum).then((page) => {
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      page.render({ canvasContext: context, viewport }).promise.then(() => {
        previewContainer.innerHTML = ""; // Clear previous page
        previewContainer.appendChild(canvas);
        previewContainer.appendChild(prevButton); // Keep navigation buttons
        previewContainer.appendChild(nextButton);
      });

      page.getTextContent().then((textContent) => {
        currentTextContent = textContent.items
          .map((item) => item.str)
          .join(" ");
      });
    });
  }

  function createNavigationButtons() {
    prevButton.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
      }
    });

    nextButton.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
      }
    });
  }

  function renderText(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      currentTextContent = e.target.result; // Update global variable with file content

      const textPreview = document.createElement("pre");
      textPreview.textContent = currentTextContent; // Display the text content
      textPreview.style.fontSize = "16px";

      previewContainer.innerHTML = ""; // Clear previous content
      previewContainer.appendChild(textPreview);
    };
    reader.readAsText(file);
  }

  function renderPowerPoint(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const zip = await JSZip.loadAsync(e.target.result);
      const slideTexts = [];
      const slideRegex = /^ppt\/slides\/slide\d+\.xml$/;

      const slideFiles = Object.keys(zip.files).filter((fileName) =>
        slideRegex.test(fileName)
      );

      for (const slide of slideFiles) {
        const content = await zip.files[slide].async("string");
        const textMatches = content.match(/<a:t>(.*?)<\/a:t>/g);
        if (textMatches) {
          textMatches.forEach((match) =>
            slideTexts.push(match.replace(/<\/?a:t>/g, ""))
          );
        }
      }

      currentTextContent = slideTexts.join("\n"); // Store globally
      const pptxContainer = document.createElement("div");
      pptxContainer.innerHTML = `<pre>${currentTextContent}</pre>`;
      previewContainer.innerHTML = ""; // Clear previous content
      previewContainer.appendChild(pptxContainer);
    };

    reader.readAsArrayBuffer(file);
  }

  function renderDocx(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      mammoth
        .extractRawText({ arrayBuffer: e.target.result })
        .then((result) => {
          currentTextContent = result.value; // Store the content globally
          const docxPreview = document.createElement("div");
          docxPreview.innerHTML = `<pre>${currentTextContent}</pre>`;
          previewContainer.innerHTML = ""; // Clear previous content
          previewContainer.appendChild(docxPreview);
        })
        .catch((err) => {
          errorMessage.textContent = "Error reading .docx file: " + err.message;
        });
    };
    reader.readAsArrayBuffer(file);
  }

  function renderExcel(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const workbook = XLSX.read(e.target.result, { type: "binary" });

      // Combine text content from all sheets
      let textContent = "";
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        textContent += XLSX.utils.sheet_to_csv(worksheet) + "\n"; // Extract as CSV text
      });

      currentTextContent = textContent; // Update global variable for search/highlight

      // Render the first sheet as HTML (for preview)
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const excelPreview = XLSX.utils.sheet_to_html(worksheet);

      // Render preview
      previewContainer.innerHTML = ""; // Clear previous content
      const excelContainer = document.createElement("div");
      excelContainer.innerHTML = excelPreview;
      previewContainer.appendChild(excelContainer);
    };
    reader.readAsBinaryString(file);
  }

  submitButton.addEventListener("click", () => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      highlightSearchTerm(searchTerm);
    }
  });

  function highlightSearchTerm(searchTerm) {
    if (!currentTextContent) return;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const highlightedText = currentTextContent.replace(regex, (match) => {
      return `<span style="background-color: yellow; font-weight: bold;">${match}</span>`;
    });

    // Clear the preview container before adding the highlighted text
    previewContainer.innerHTML = `<pre>${highlightedText}</pre>`;
  }

  function clearHighlights() {
    if (!currentTextContent) return;

    previewContainer.innerHTML = ""; // Clear all highlights
    previewContainer.innerHTML = `<pre>${currentTextContent}</pre>`; // Re-render plain content
  }
});

// // Event listener for submit button
// document.getElementById("submit-button").addEventListener("click", () => {
//   const searchTerm = document.getElementById("search-input").value.trim();
//   highlightSearchTerm(searchTerm);
// });

// // Event listener for clear button
// document.getElementById("clear-button").addEventListener("click", () => {
//   document.getElementById("search-input").value = ""; // Clear input field
//   clearHighlights(); // Remove highlights from document
// });

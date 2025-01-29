import JSZip from 'jszip';

/**
 * parsePptx - Unzips a PPTX file (arrayBuffer) and extracts text from each slide.
 * @param {ArrayBuffer} arrayBuffer - Raw binary data from the .pptx file
 * @returns {Promise<Array>} - Returns an array of slides, each with { filename, text }
 */
export async function parsePptx(arrayBuffer) {
  // Load the ZIP contents
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Identify all slide files in "ppt/slides/slideX.xml"
  const slideFileNames = Object.keys(zip.files)
    .filter((filename) => filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml'));

  // Sort by slide number so they appear in correct order
  // e.g. "slide1.xml", "slide2.xml", ...
  slideFileNames.sort((a, b) => {
    const aNum = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0', 10);
    const bNum = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0', 10);
    return aNum - bNum;
  });

  // Parse each slide’s XML to extract text in <a:t> tags
  const slides = [];
  for (const filename of slideFileNames) {
    // Get raw XML from zip
    const xmlStr = await zip.file(filename).async('string');

    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');

    // Gather text from <a:t> tags (PowerPoint text nodes)
    const textNodes = xmlDoc.getElementsByTagName('a:t');
    let slideText = '';
    for (const node of textNodes) {
      slideText += node.textContent + ' ';
    }

    slides.push({
      filename,
      text: slideText.trim()
    });
  }

  return slides;
}

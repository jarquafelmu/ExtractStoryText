import fs, { lstatSync } from "fs";
import { rm } from "node:fs/promises";
import { load } from "cheerio";
import sanitize from "sanitize-filename";
import decode from "decode-html";

const REMOVE_FILE = false;
const EXTRACT_AS_HTML = true;
const SITE = 'royalroad'; // royalroad or ga

const siteHandlers = {
  royalroad: { title: "title", content: ".chapter-content > p, .chapter-content table" },
  ga: { title: "#chapterTitle", content: "#chapterText > p, #chapterText table" },
};

/**
 * Extracts text from an HTML element.
 *
 * @param {Object} $ - The jQuery object.
 * @param {HTMLElement} el - The HTML element to extract text from.
 * @param {boolean} [extractAsHTML=false] - Whether to extract the text as HTML or plain text. Default is false.
 * @returns {string} - The extracted text.
 */
function extractText($, el, extractAsHTML = false) {
  if (extractAsHTML) return $(el).html();
  return $(el).text();
}

/**
 * Process the file at the given file path.
 * @param {string} filePath - The path of the file to be processed.
 */
function process(filePath) {
  const file = fs.readFileSync(filePath, "utf8");
  const $ = load(file);

  const sanitizedTitle = sanitize($(siteHandlers[SITE].title).text().trim()); // sanitize the title to be used as a filename
  
  const storyContent = $(siteHandlers[SITE].content)
    .toArray()
    .map((el) =>
      decode( // decode HTML entities
        extractText($, el, EXTRACT_AS_HTML) // extract text from the element
          .replace(/“|”/g, '"') // replace smart quotes
          .replace(/’/g, "'") // replace smart apostrophes
          .replace(/\n(?= )|(?<= )\n/g, "") // remove newlines between words
          .replace(/\n{3,}/g, "\n\n") // remove multiple newlines
      )
    )
    .join("\n\n");

  writeFile(`${sanitizedTitle}`, storyContent);
}

/**
 * Reads the contents of a directory and processes each file.
 * @param {string} dirPath - The path of the directory to read.
 */
async function readDir(dirPath) {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }

    files.forEach(async (file) => {
      const filepath = `${dirPath}${file}`;
      const stat = lstatSync(filepath);

      // skip directories
      if (!stat.isDirectory()) {
        process(filepath);
      }

      // exit if we don't want to remove the file
      if (!REMOVE_FILE) return;

      // remove the file
      await rm(filepath, { recursive: true, force: true });
    });
  });
}

/**
 * Writes content to a file in the specified directory.
 * @param {string} filename - The name of the file to be created.
 * @param {string} content - The content to be written to the file.
 * @param {string} [outDir='output'] - The directory where the file will be created. Defaults to 'output'.
 * @param {string} [extension='txt'] - The file extension. Defaults to 'txt'.
 */
function writeFile(filename, content, outDir = "extracted", extension = "txt") {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }
  fs.writeFileSync(`${outDir}/${filename}.${extension}`, content);
}

readDir("raw/");

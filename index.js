// import fs, { lstatSync } from "fs";
import * as fs from "fs/promises";
import { load } from "cheerio";
import sanitize from "sanitize-filename";

// Configuration
const REMOVE_FILE = false;
const EXTRACT_AS_HTML = true;
const SITE = "royalroad"; // royalroad or ga

const siteHandlers = {
  royalroad: {
    title: "title",
    content: ".chapter-content > p, .chapter-content table",
  },
  ga: {
    title: "#chapterTitle",
    content: "#chapterText > p, #chapterText table",
  },
};

/**
 * Process the file at the given file path.
 * @param {string} filePath - The path of the file to be processed.
 */
async function process(filePath) {
  try {
    const file = await fs.readFile(filePath, "utf8");
    const $ = load(file);

    const title = sanitize($(siteHandlers[SITE].title).text().trim()); // sanitize the title to be used as a filename

    const content = $(siteHandlers[SITE].content)
      .toArray()
      .map((el) => {
        let text = EXTRACT_AS_HTML ? $(el).html() : $(el).text();
        text = text.replace(/“|”/g, '"'); // replace smart quotes
        text = text.replace(/‘|’/g, "'"); // replace smart apostrophes
        text = text.replace(/\n(?= )|(?<= )\n/g, ""); // remove newlines between words
        text = text.replace(/\n{3,}/g, "\n\n"); // remove multiple newlines

        return decodeURI(text); // decode HTML entities
      })
      .join("\n\n");

    await writeFile(`${title}`, content, EXTRACT_AS_HTML ? "html" : "txt");

    if (REMOVE_FILE) {
      // remove the file
      await fs.rm(filePath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Failed to process file ${filePath}: ${err.message}`);
  }
}

/**
 * Reads the contents of a directory and processes each file.
 * @param {string} dirPath - The path of the directory to read.
 */
async function readDir(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      const filepath = `${dirPath}/${file}`;
      const stat = await fs.stat(filepath);

      // skip directories
      if (!stat.isDirectory()) {
        await process(filepath);
      }
    }
  } catch (err) {
    console.error(`Failed to read directory ${filepath}: ${err.message}`);
  }
}

/**
 * Writes content to a file in the specified directory.
 * @param {string} filename - The name of the file to be created.
 * @param {string} content - The content to be written to the file.
 * @param {string} [outDir='output'] - The directory where the file will be created. Defaults to 'output'.
 * @param {string} [extension='txt'] - The file extension. Defaults to 'txt'.
 */
async function writeFile(
  filename,
  content,
  extension = "txt",
  outDir = "extracted"
) {
  try {
    await fs.access(outDir);
  } catch (e) {
    await fs.mkdir(outDir);
  }

  await fs.writeFile(`${outDir}/${filename}.${extension}`, content);
}

readDir("raw");

# ExtractStoryText

A simple script to extract story text from some popular indie author websites for personal use only.

This script extracts the title and content from HTML files and writes the extracted content to new files. It's designed to work with specific sites, but can be easily adapted to work with others.

## Requirements

- Node.js

## Installation

1. Clone this repository.
2. Run `npm install` to install the required dependencies.

## Configuration

Before running the script, you need to configure it to work with the site you're scraping. The configuration is done in the `index.js` file.

- `REMOVE_FILE`: Set this to `true` if you want the script to remove the original file after processing. Default is `false`.
- `EXTRACT_AS_HTML`: Set this to `true` if you want to extract the text as HTML. Default is `false`.
- `SITE`: Set this to the name of the site you're scraping. Currently, the script supports `'royalroad'` and `'ga'`.

The `siteHandlers` object contains the CSS selectors for the title and content elements for each supported site. To add support for a new site, add a new key-value pair to this object. The key should be the name of the site, and the value should be an object with `title` and `content` properties. These properties should be CSS selectors that specify where to find the title and content in the HTML of a page from the site.

## Usage

To run the script, use the following command:

```bash
node index.js
```

or

```bash
node .
```

The script will read the HTML files in the `'raw'` directory, extract the title and content, and write the extracted content to new files in the `'extracted'` directory. The name of each new file will be the sanitized title of the corresponding HTML file.

If `REMOVE_FILE` is `true`, the original HTML file will be removed after processing.

You can save the HTML file directly into the `'raw'` directory.

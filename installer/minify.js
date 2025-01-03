/*
 * Code minifier
 * @busgounet
*/

const path = require("node:path");
const { fdir } = require("fdir");
const esbuild = require("esbuild");

var files = [];

let project = require("../package.json").name;
let revision = require("../package.json").rev;
let version = require("../package.json").version;

let commentIn = "/**";
let commentOut = "**/";

/**
 * search all javascript files
 */
async function searchFiles () {
  const components = await new fdir()
    .withBasePath()
    .filter((path) => path.endsWith(".js"))
    .crawl("../src")
    .withPromise();

  files = files.concat(components);
  console.log(`Found: ${files.length} files to install and minify\n`);
}

/**
 * Minify all files in array with Promise
 */
async function minifyFiles () {
  await searchFiles();
  await Promise.all(files.map((file) => { return minify(file); })).catch(() => process.exit(255));
}

/**
 * Minify filename with esbuild
 * @param {string} file to minify
 * @returns {boolean} resolved with true
 */
function minify (file) {
  let FileName = file.replace("../src/", "../");
  let MyFileName = `${project}/${FileName.replace("../", "")}`;
  let pathInResolve = path.resolve(__dirname, file);
  let pathOutResolve = path.resolve(__dirname, FileName);
  console.log("Process File:", MyFileName);
  return new Promise((resolve, reject) => {
    try {
      esbuild.buildSync({
        entryPoints: [pathInResolve],
        allowOverwrite: true,
        minify: true,
        outfile: pathOutResolve,
        banner: {
          js: `${commentIn} ${project}\n  * File: ${MyFileName}\n  * Version: ${version}\n  * Revision: ${revision}\n  * ⚠ This file must not be modified ⚠\n${commentOut}`
        },
        footer: {
          js: `${commentIn} ❤ Coded With Heart by @bugsounet -- https://www.bugsounet.fr ${commentOut}`
        }
      });
      resolve(true);
    } catch {
      reject();
    }
  });
}

minifyFiles();

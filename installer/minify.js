const check = require("check-node-version")
const fs = require('fs')

const files= [
 "../node_helper.js",
 "../EXT-Screen.js",
 "../lib/screenLib.js"
]

// import minify
async function loadMinify() {
  const loaded = await import('minify')
  return loaded
}

// minify files array
async function minifyFiles() {
  const {minify} = await loadMinify()
  files.forEach(file => {
    new Promise(resolve => {
      minify(file)
        .then(data => {
          console.log("Process File:", file)
          try {
            fs.writeFileSync(file, data)
          } catch(err) {
            console.error("Writing Error: " + err)
          }
          resolve()
        })
        .catch( error => {
          console.log("File:", file, " -- Error Detected:", error)
          resolve() // continue next file
        })
    })
  })
}

check(
  { node: ">= 14.0", },
  (error, result) => {
    if (error) {
      console.error(error)
      return
    }
    if (!result.isSatisfied) {
      console.error("Warn: Master code optimization error!");
      console.error("Needed node >= 14.0");
      console.error("If you want to optimize really, you have use node v14.0 (or more)");
      console.error("Info: Don't worry, this step is not compulsory!")
    } else {
      minifyFiles()
    }
  }
)

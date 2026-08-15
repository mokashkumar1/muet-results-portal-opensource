const fs = require("fs");
const path = require("path");
const { compileCsv } = require("../lib/data-compiler");

const csvPath = path.join(__dirname, "..", "data", "dummy_dataset.csv");
const outputPath = path.join(__dirname, "..", "data.js");

try {
  console.log("Starting data compilation...");
  if (!fs.existsSync(csvPath)) throw new Error(`CSV file not found at: ${csvPath}`);
  const compiledBatches = compileCsv(fs.readFileSync(csvPath, "utf8"));
  const output = `/* AUTOMATICALLY GENERATED DATA FILE - DO NOT EDIT MANUALLY */\nconst generatedBatches = ${JSON.stringify(compiledBatches, null, 2)};\n`;
  fs.writeFileSync(outputPath, output, "utf8");
  console.log(`Successfully compiled CSV to data.js. Total batches: ${Object.keys(compiledBatches).length}.`);
} catch (error) {
  console.error("Data compilation failed:", error.message);
  process.exit(1);
}

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolve = (p) => path.resolve(__dirname, p);

// prepare html content in advance
const baseHtml = fs.readFileSync(resolve("dist/index.html"), "utf-8");

const app = express();

app.use(express.static(resolve("dist"), { index: false }));

app.get("*name", (req, res) => {
  // Exclude faq on all other routes
  res.send(baseHtml);
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log("Press Ctrl+C to quit.");
});
const fs = require("fs");
const path = require("path");

console.log("🧪 Testing Bank Statement Summarizer Setup...\n");

// Check if all required files exist
const requiredFiles = [
  "package.json",
  "backend/package.json",
  "frontend/package.json",
  "backend/src/index.js",
  "frontend/src/main.tsx",
  "frontend/src/App.tsx",
  "README.md",
  ".gitignore",
];

console.log("📁 Checking required files:");
let allFilesExist = true;
requiredFiles.forEach((file) => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? "✅" : "❌"} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check if node_modules exist
console.log("\n📦 Checking dependencies:");
const backendNodeModules = fs.existsSync("backend/node_modules");
const frontendNodeModules = fs.existsSync("frontend/node_modules");
const rootNodeModules = fs.existsSync("node_modules");

console.log(`  ${backendNodeModules ? "✅" : "❌"} Backend node_modules`);
console.log(`  ${frontendNodeModules ? "✅" : "❌"} Frontend node_modules`);
console.log(`  ${rootNodeModules ? "✅" : "❌"} Root node_modules`);

// Check package.json scripts
console.log("\n🔧 Checking package.json scripts:");
try {
  const rootPackage = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const backendPackage = JSON.parse(
    fs.readFileSync("backend/package.json", "utf8")
  );
  const frontendPackage = JSON.parse(
    fs.readFileSync("frontend/package.json", "utf8")
  );

  console.log("  Root scripts:", Object.keys(rootPackage.scripts || {}));
  console.log("  Backend scripts:", Object.keys(backendPackage.scripts || {}));
  console.log(
    "  Frontend scripts:",
    Object.keys(frontendPackage.scripts || {})
  );
} catch (error) {
  console.log("  ❌ Error reading package.json files");
}

console.log("\n🎯 Setup Summary:");
if (
  allFilesExist &&
  backendNodeModules &&
  frontendNodeModules &&
  rootNodeModules
) {
  console.log("  ✅ All files and dependencies are in place!");
  console.log("\n🚀 To start development:");
  console.log("  1. Set up your OpenAI API key in backend/.env");
  console.log("  2. Run: npm run dev");
  console.log("  3. Backend will be available at: http://localhost:3001");
  console.log("  4. Frontend will be available at: http://localhost:3000");
} else {
  console.log("  ❌ Some files or dependencies are missing");
  console.log("  💡 Try running: npm run install:all");
}

console.log("\n📋 Next steps:");
console.log("  1. Create backend/.env file with your OpenAI API key");
console.log("  2. Run: npm run dev");
console.log("  3. Upload a PDF bank statement to test the application");

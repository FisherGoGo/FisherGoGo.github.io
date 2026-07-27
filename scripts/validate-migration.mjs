import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const sourceCandidates = [
	process.argv[2] ? path.resolve(process.argv[2]) : null,
	path.resolve(projectRoot, "..", "source", "_posts"),
	path.resolve(projectRoot, "..", "AACM_Blog", "source", "_posts"),
].filter(Boolean);
const sourceDir = sourceCandidates.find((candidate) => fs.existsSync(candidate));
const targetDir = path.join(projectRoot, "src", "content", "posts");
const distDir = path.join(projectRoot, "dist");
const intentionallyCorrectedBodies = new Set([
	"Combination.md",
	"Segment_Tree.md",
	"Summer_Problem.md",
]);

if (!sourceDir) throw new Error("Hexo source directory not found");

function bodyOf(markdown) {
	const normalized = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
	const closing = normalized.indexOf("\n---", 4);
	if (!normalized.startsWith("---\n") || closing < 0) {
		throw new Error("Invalid frontmatter");
	}
	const bodyStart = normalized.indexOf("\n", closing + 4);
	return (bodyStart < 0 ? "" : normalized.slice(bodyStart + 1)).trim();
}

const sourceFiles = fs
	.readdirSync(sourceDir)
	.filter((name) => name.toLowerCase().endsWith(".md"))
	.sort();
const targetFiles = fs
	.readdirSync(targetDir)
	.filter((name) => name.toLowerCase().endsWith(".md"))
	.sort();

if (sourceFiles.length !== 36 || targetFiles.length !== sourceFiles.length) {
	throw new Error(`Unexpected article count: source=${sourceFiles.length}, target=${targetFiles.length}`);
}

const changedBodies = [];
for (const file of sourceFiles) {
	const source = fs.readFileSync(path.join(sourceDir, file), "utf8");
	const targetPath = path.join(targetDir, file);
	if (!fs.existsSync(targetPath)) {
		throw new Error(`Missing migrated article: ${file}`);
	}
	const target = fs.readFileSync(targetPath, "utf8");
	if (bodyOf(source) !== bodyOf(target)) changedBodies.push(file);
	if (!target.includes(`legacySlug: ${JSON.stringify(path.basename(file, path.extname(file)))}`)) {
		throw new Error(`Missing exact legacy slug: ${file}`);
	}
}

const unexpectedBodyChanges = changedBodies.filter(
	(file) => !intentionallyCorrectedBodies.has(file),
);
if (unexpectedBodyChanges.length > 0) {
	throw new Error(`Article bodies changed unexpectedly: ${unexpectedBodyChanges.join(", ")}`);
}

const requiredFiles = [
	"index.html",
	path.join("directory", "index.html"),
	path.join("archive", "index.html"),
	path.join("posts", "kmp", "index.html"),
	path.join("2025", "03", "05", "KMP", "index.html"),
];
for (const relativePath of requiredFiles) {
	if (!fs.existsSync(path.join(distDir, relativePath))) {
		throw new Error(`Missing built page: ${relativePath}`);
	}
}

const directoryHtml = fs.readFileSync(path.join(distDir, "directory", "index.html"), "utf8");
const kmpHtml = fs.readFileSync(path.join(distDir, "posts", "kmp", "index.html"), "utf8");
const redirectHtml = fs.readFileSync(
	path.join(distDir, "2025", "03", "05", "KMP", "index.html"),
	"utf8",
);

if (!directoryHtml.includes("文章目录") || !directoryHtml.includes("前缀函数与KMP")) {
	throw new Error("Directory page content is incomplete");
}
if (!kmpHtml.includes("katex")) throw new Error("KaTeX output was not generated");
if (!redirectHtml.includes("/posts/kmp/")) throw new Error("Legacy redirect is incorrect");

function walkHtml(directory) {
	const result = [];
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) result.push(...walkHtml(absolutePath));
		else if (entry.isFile() && entry.name.endsWith(".html")) result.push(absolutePath);
	}
	return result;
}

const brokenLinks = new Set();
const katexErrors = [];
let checkedLinks = 0;
for (const htmlPath of walkHtml(distDir)) {
	const html = fs.readFileSync(htmlPath, "utf8");
	if (html.includes('class="katex-error"')) {
		katexErrors.push(path.relative(distDir, htmlPath));
	}
	for (const match of html.matchAll(/\bhref="([^"]+)"/g)) {
		const href = match[1].replace(/&amp;/g, "&");
		if (!href.startsWith("/") || href.startsWith("//")) continue;
		const pathname = href.split(/[?#]/, 1)[0] || "/";
		let decoded;
		try {
			decoded = decodeURIComponent(pathname);
		} catch {
			decoded = pathname;
		}
		const relative = decoded.replace(/^\/+/, "");
		const target = decoded.endsWith("/")
			? path.join(distDir, relative, "index.html")
			: path.join(distDir, relative);
		checkedLinks++;
		if (!fs.existsSync(target)) brokenLinks.add(`${href} (from ${path.relative(distDir, htmlPath)})`);
	}
}

if (brokenLinks.size > 0) {
	throw new Error(`Broken internal links:\n${[...brokenLinks].join("\n")}`);
}
if (katexErrors.length > 0) {
	throw new Error(`KaTeX render errors:\n${katexErrors.join("\n")}`);
}

console.log(
	JSON.stringify(
		{
			articles: sourceFiles.length,
			intentionalBodyCorrections: changedBodies.length,
			directory: true,
			katex: true,
			katexErrors: katexErrors.length,
			legacyRedirect: true,
			checkedInternalLinks: checkedLinks,
			brokenInternalLinks: brokenLinks.size,
		},
		null,
		2,
	),
);

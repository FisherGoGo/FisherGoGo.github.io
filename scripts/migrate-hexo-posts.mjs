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

if (!sourceDir) {
	throw new Error(`Hexo source directory not found. Checked: ${sourceCandidates.join(", ")}`);
}

function unquote(value) {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
}

function parseFrontmatter(markdown, filename) {
	const normalized = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
	if (!normalized.startsWith("---\n")) {
		throw new Error(`${filename}: missing frontmatter`);
	}

	const closing = normalized.indexOf("\n---", 4);
	if (closing < 0) {
		throw new Error(`${filename}: unclosed frontmatter`);
	}

	const frontmatterText = normalized.slice(4, closing);
	const bodyStart = normalized.indexOf("\n", closing + 4);
	const body = bodyStart < 0 ? "" : normalized.slice(bodyStart + 1).trimStart();
	const data = {};
	let currentArray = null;

	for (const line of frontmatterText.split("\n")) {
		const arrayItem = line.match(/^\s+-\s+(.*)$/);
		if (arrayItem && currentArray) {
			data[currentArray].push(unquote(arrayItem[1]));
			continue;
		}

		const property = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
		if (!property) continue;
		const [, key, rawValue] = property;
		if (rawValue === "") {
			data[key] = [];
			currentArray = key;
		} else if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
			data[key] = rawValue
				.slice(1, -1)
				.split(",")
				.map((item) => unquote(item))
				.filter(Boolean);
			currentArray = null;
		} else {
			data[key] = unquote(rawValue);
			currentArray = null;
		}
	}

	return { data, body };
}

function makeDescription(body) {
	const plain = body
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/\$\$[\s\S]*?\$\$/g, " ")
		.replace(/\$[^$]*\$/g, " ")
		.replace(/^#{1,6}\s+/gm, "")
		.replace(/[*_>`~|]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	if (!plain) return "Fisher 的算法与竞赛学习笔记。";
	return plain.length > 110 ? `${plain.slice(0, 109)}…` : plain;
}

function yamlString(value) {
	return JSON.stringify(String(value ?? ""));
}

fs.mkdirSync(targetDir, { recursive: true });

const files = fs
	.readdirSync(sourceDir, { withFileTypes: true })
	.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
	.sort((a, b) => a.name.localeCompare(b.name, "en"));

const summary = [];
for (const entry of files) {
	const sourcePath = path.join(sourceDir, entry.name);
	const source = fs.readFileSync(sourcePath, "utf8");
	const { data, body } = parseFrontmatter(source, entry.name);
	const title = data.title;
	const published = data.date;
	const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [];
	const categories = Array.isArray(data.categories)
		? data.categories
		: data.categories
			? [data.categories]
			: [];
	const category = categories[0] ?? "未分类";
	const legacySlug = path.basename(entry.name, path.extname(entry.name));

	if (!title || !published) {
		throw new Error(`${entry.name}: title or date is missing`);
	}

	const frontmatter = [
		"---",
		`title: ${yamlString(title)}`,
		`published: ${published}`,
		`description: ${yamlString(makeDescription(body))}`,
		`tags: [${tags.map(yamlString).join(", ")}]`,
		`category: ${yamlString(category)}`,
		`legacySlug: ${yamlString(legacySlug)}`,
		"draft: false",
		"---",
		"",
	].join("\n");

	const outputPath = path.join(targetDir, entry.name);
	fs.writeFileSync(outputPath, `${frontmatter}${body.trimEnd()}\n`, "utf8");
	summary.push({ file: entry.name, title, published, category, tags: tags.length });
}

console.log(JSON.stringify({ migrated: summary.length, posts: summary }, null, 2));

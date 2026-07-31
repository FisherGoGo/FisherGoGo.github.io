import {
	access,
	mkdir,
	readdir,
	rename,
	stat,
	utimes,
	writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const projectRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const albumsRoot = path.join(projectRoot, "public", "images", "albums");
const sourceRoot = process.argv[2] ? path.resolve(process.argv[2]) : null;
const refreshCoversOnly = process.argv.includes("--refresh-covers");

const albumDefinitions = [
	{
		source: "2024 修水",
		slug: "2024-xiushui",
		title: "2024 · 修水",
		description: "修水的夏夜与沿途风景。",
		date: "2024-08-07",
		location: "江西修水",
		tags: ["2024", "旅行", "风景"],
		cover: "the_milky_way-1.jpg",
	},
	{
		source: "2024 北京",
		slug: "2024-beijing",
		title: "2024 · 北京",
		description: "在北京走走停停，记录城市里的光影。",
		date: "2024-09-01",
		location: "北京",
		tags: ["2024", "北京", "城市"],
	},
	{
		source: "2024 海宁",
		slug: "2024-haining",
		title: "2024 · 海宁",
		description: "海宁旅途中的街景与片刻。",
		date: "2024-08-10",
		location: "浙江海宁",
		tags: ["2024", "旅行", "街景"],
	},
	{
		source: "2024 苏州",
		slug: "2024-suzhou",
		title: "2024 · 苏州",
		description: "苏州漫游，园林、水巷与城市夜色。",
		date: "2024-08-26",
		location: "江苏苏州",
		tags: ["2024", "旅行", "夜景"],
		cover: "YYY_9425.jpg",
	},
	{
		source: "2024 长沙",
		slug: "2024-changsha",
		title: "2024 · 长沙",
		description: "盛夏长沙，街巷与城市风景。",
		date: "2024-07-24",
		location: "湖南长沙",
		tags: ["2024", "旅行", "城市"],
	},
	{
		source: "2024.10.13 国家博物馆",
		slug: "2024-10-13-national-museum",
		title: "国家博物馆",
		description: "国家博物馆参观记录。",
		date: "2024-10-13",
		location: "北京 · 国家博物馆",
		tags: ["2024", "北京", "博物馆"],
	},
	{
		source: "2024.10.15 追星",
		slug: "2024-10-15-fan-event",
		title: "追星日记",
		description: "一场属于现场与热爱的记录。",
		date: "2024-10-15",
		location: "北京",
		tags: ["2024", "现场", "记录"],
	},
	{
		source: "2024.12.1 北京街溜子",
		slug: "2024-12-01-beijing-walk",
		title: "北京街溜子",
		description: "冬日北京街头随拍。",
		date: "2024-12-01",
		location: "北京",
		tags: ["2024", "北京", "街拍"],
		cover: "YYY_2848.jpg",
	},
	{
		source: "2025.1.19 随拍",
		slug: "2025-01-19-snapshots",
		title: "冬日随拍",
		description: "冬日里随手记录的生活片段。",
		date: "2025-01-19",
		location: "北京",
		tags: ["2025", "随拍", "生活"],
	},
	{
		source: "2025.1.5 颐和园",
		slug: "2025-01-05-summer-palace",
		title: "冬日颐和园",
		description: "冬日颐和园的湖光与建筑。",
		date: "2025-01-05",
		location: "北京 · 颐和园",
		tags: ["2025", "北京", "风景"],
	},
	{
		source: "2025.3 春",
		slug: "2025-03-spring",
		title: "春",
		description: "春日里的颜色与新绿。",
		date: "2025-03-16",
		location: "北京",
		tags: ["2025", "春天", "随拍"],
	},
	{
		source: "2025.4.6 玉渊潭",
		slug: "2025-04-06-yuyuantan",
		title: "玉渊潭的春天",
		description: "玉渊潭的春日与花。",
		date: "2025-04-06",
		location: "北京 · 玉渊潭",
		tags: ["2025", "春天", "花"],
	},
	{
		source: "2025.8.17  奥森公园",
		slug: "2025-08-17-olympic-forest-park",
		title: "奥森公园",
		description: "夏日奥森公园随拍。",
		date: "2025-08-17",
		location: "北京 · 奥林匹克森林公园",
		tags: ["2025", "夏天", "公园"],
	},
	{
		source: "2025.8.24 天文台",
		slug: "2025-08-24-observatory",
		title: "天文台",
		description: "天文台之行与沿途风景。",
		date: "2025-08-24",
		location: "天文台",
		tags: ["2025", "旅行", "记录"],
		cover: "YYY_5918.jpg",
	},
];

const imageExtensions = new Set([".jpg", ".jpeg", ".png"]);
const collator = new Intl.Collator("zh-CN", {
	numeric: true,
	sensitivity: "base",
});

function webFileName(fileName, usedNames) {
	const base = path
		.basename(fileName, path.extname(fileName))
		.normalize("NFKC")
		.toLowerCase()
		.replace(/[_\s]+/gu, "-")
		.replace(/[^\p{L}\p{N}-]+/gu, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^-|-$/g, "");
	const safeBase = base || "photo";
	let candidate = `${safeBase}.webp`;
	let suffix = 2;
	while (usedNames.has(candidate)) {
		candidate = `${safeBase}-${suffix}.webp`;
		suffix += 1;
	}
	usedNames.add(candidate);
	return candidate;
}

function coverScore(metadata) {
	let width = metadata.width || 1;
	let height = metadata.height || 1;
	if ([5, 6, 7, 8].includes(metadata.orientation)) {
		[width, height] = [height, width];
	}
	const ratio = width / height;
	const portraitPenalty = ratio < 1 ? 4 : 0;
	return Math.abs(Math.log(ratio / 1.5)) + portraitPenalty;
}

async function ensureExists(targetPath, label) {
	try {
		await access(targetPath);
	} catch {
		throw new Error(`${label}不存在：${targetPath}`);
	}
}

async function importAlbum(definition) {
	const sourceDir = path.join(sourceRoot, definition.source);
	const destinationDir = path.join(albumsRoot, definition.slug);
	const stagingDir = `${destinationDir}.importing`;

	await ensureExists(sourceDir, "相册目录");
	try {
		await access(destinationDir);
		throw new Error(`目标相册已存在，为避免覆盖已停止：${destinationDir}`);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	try {
		await access(stagingDir);
		throw new Error(`发现未完成的导入目录，请先检查：${stagingDir}`);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}

	const sourceFiles = (await readdir(sourceDir))
		.filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
		.sort(collator.compare);
	if (sourceFiles.length === 0) {
		throw new Error(`相册中没有可导入的图片：${sourceDir}`);
	}

	await mkdir(stagingDir, { recursive: false });
	const usedNames = new Set();
	const coverCandidates = [];
	let sourceBytes = 0;
	let outputBytes = 0;

	for (const sourceFile of sourceFiles) {
		const sourcePath = path.join(sourceDir, sourceFile);
		const sourceInfo = await stat(sourcePath);
		const outputName = webFileName(sourceFile, usedNames);
		const outputPath = path.join(stagingDir, outputName);
		const image = sharp(sourcePath, { failOn: "warning" });
		const metadata = await image.metadata();

		await image
			.rotate()
			.resize({
				width: 2400,
				height: 2400,
				fit: "inside",
				withoutEnlargement: true,
			})
			.webp({ quality: 82, effort: 6, smartSubsample: true })
			.toFile(outputPath);
		await utimes(outputPath, sourceInfo.atime, sourceInfo.mtime);

		const outputInfo = await stat(outputPath);
		sourceBytes += sourceInfo.size;
		outputBytes += outputInfo.size;
		coverCandidates.push({
			sourcePath,
			sourceFile,
			score: coverScore(metadata),
		});
	}

	coverCandidates.sort(
		(a, b) =>
			a.score - b.score || collator.compare(a.sourceFile, b.sourceFile),
	);
	const coverSource = definition.cover
		? coverCandidates.find(
				(candidate) => candidate.sourceFile === definition.cover,
			)
		: coverCandidates[0];
	if (!coverSource) {
		throw new Error(`指定的封面不存在：${definition.cover}`);
	}
	const coverPath = path.join(stagingDir, "cover.webp");
	await sharp(coverSource.sourcePath, { failOn: "warning" })
		.rotate()
		.resize(1200, 900, { fit: "cover", position: "attention" })
		.webp({ quality: 84, effort: 6, smartSubsample: true })
		.toFile(coverPath);
	outputBytes += (await stat(coverPath)).size;

	const info = {
		title: definition.title,
		hidden: false,
		description: definition.description,
		date: definition.date,
		location: definition.location,
		tags: definition.tags,
		layout: "masonry",
		columns: 3,
	};
	await writeFile(
		path.join(stagingDir, "info.json"),
		`${JSON.stringify(info, null, "\t")}\n`,
		"utf8",
	);
	await rename(stagingDir, destinationDir);

	return {
		title: definition.title,
		photos: sourceFiles.length,
		cover: coverSource.sourceFile,
		sourceBytes,
		outputBytes,
	};
}

async function refreshCover(definition) {
	if (!definition.cover) return null;
	const sourcePath = path.join(
		sourceRoot,
		definition.source,
		definition.cover,
	);
	const destinationPath = path.join(
		albumsRoot,
		definition.slug,
		"cover.webp",
	);
	await ensureExists(sourcePath, "封面源文件");
	await ensureExists(path.dirname(destinationPath), "目标相册");
	await sharp(sourcePath, { failOn: "warning" })
		.rotate()
		.resize(1200, 900, { fit: "cover", position: "attention" })
		.webp({ quality: 84, effort: 6, smartSubsample: true })
		.toFile(destinationPath);
	return `${definition.title}：${definition.cover}`;
}

async function main() {
	if (!sourceRoot) {
		throw new Error(
			"请提供相册源目录，例如：pnpm import-albums -- D:\\Photo\\Album",
		);
	}
	await ensureExists(sourceRoot, "源目录");
	await mkdir(albumsRoot, { recursive: true });
	if (refreshCoversOnly) {
		for (const definition of albumDefinitions) {
			const result = await refreshCover(definition);
			if (result) console.log(`✓ ${result}`);
		}
		return;
	}

	let sourceBytes = 0;
	let outputBytes = 0;
	let photoCount = 0;
	for (const definition of albumDefinitions) {
		const result = await importAlbum(definition);
		sourceBytes += result.sourceBytes;
		outputBytes += result.outputBytes;
		photoCount += result.photos;
		console.log(
			`✓ ${result.title}：${result.photos} 张，封面 ${result.cover}`,
		);
	}

	const savings = ((1 - outputBytes / sourceBytes) * 100).toFixed(1);
	console.log(
		`\n完成：${albumDefinitions.length} 个相册、${photoCount} 张照片，` +
			`${(sourceBytes / 1024 / 1024).toFixed(1)} MiB → ${(outputBytes / 1024 / 1024).toFixed(1)} MiB（减少 ${savings}%）`,
	);
}

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});

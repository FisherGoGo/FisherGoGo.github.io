import { SKIP, visit } from "unist-util-visit";

function isSingleLineDisplayMath(source) {
	const value = source.trim();
	return (
		value.length >= 4 &&
		value.startsWith("$$") &&
		!value.startsWith("$$$") &&
		value.endsWith("$$") &&
		value.at(-3) !== "$" &&
		!value.includes("\n")
	);
}

function toDisplayMath(node) {
	return {
		type: "math",
		meta: null,
		value: node.value,
		data: {
			hName: "pre",
			hChildren: [
				{
					type: "element",
					tagName: "code",
					properties: {
						className: ["language-math", "math-display"],
					},
					children: [{ type: "text", value: node.value }],
				},
			],
		},
		position: node.position,
	};
}

function toParagraph(node, children) {
	while (
		children[0]?.type === "text" &&
		children[0].value.trim().length === 0
	) {
		children.shift();
	}
	while (
		children.at(-1)?.type === "text" &&
		children.at(-1).value.trim().length === 0
	) {
		children.pop();
	}
	if (children.length === 0) return null;

	return {
		...node,
		children,
		position: {
			start: children[0].position?.start ?? node.position.start,
			end: children.at(-1).position?.end ?? node.position.end,
		},
	};
}

/* Treat a standalone `$$formula$$` line as display math. */
export function remarkDisplayMath() {
	return (tree, file) => {
		const source = String(file.value);

		visit(tree, "paragraph", (node, index, parent) => {
			if (index === undefined || !parent) return;

			const replacements = [];
			let paragraphChildren = [];
			let foundDisplayMath = false;

			const flushParagraph = () => {
				const paragraph = toParagraph(node, paragraphChildren);
				if (paragraph) replacements.push(paragraph);
				paragraphChildren = [];
			};

			for (const child of node.children) {
				const start = child.position?.start.offset;
				const end = child.position?.end.offset;
				const isDisplayMath =
					child.type === "inlineMath" &&
					start !== undefined &&
					end !== undefined &&
					isSingleLineDisplayMath(source.slice(start, end));

				if (!isDisplayMath) {
					paragraphChildren.push(child);
					continue;
				}

				foundDisplayMath = true;
				flushParagraph();
				replacements.push(toDisplayMath(child));
			}

			if (!foundDisplayMath) return;

			flushParagraph();
			parent.children.splice(index, 1, ...replacements);
			return SKIP;
		});
	};
}

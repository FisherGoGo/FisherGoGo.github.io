import type { TimelineItem } from "../components/features/timeline/types";

type Medal = "金牌" | "银牌" | "铜牌" | "铁牌";
type CompetitionSeries = "ICPC" | "CCPC";
type CompetitionStage = "邀请赛" | "区域赛" | "EC-Final" | "Final";

interface Competition {
	id: string;
	year: number;
	month: number;
	series: CompetitionSeries;
	stage: CompetitionStage;
	medal: Medal;
	location: string;
}

const medalColors: Record<Medal, string> = {
	金牌: "#D97706",
	银牌: "#64748B",
	铜牌: "#B45309",
	铁牌: "#475569",
};

const createCompetition = ({
	id,
	year,
	month,
	series,
	stage,
	medal,
	location,
}: Competition): TimelineItem => {
	const competitionName = `${series} ${stage}（${location}）`;

	return {
		id,
		title: `${competitionName} · ${medal}`,
		description: `参加 ${year} ${competitionName}，获得${medal}。`,
		type: "achievement",
		startDate: `${year}-${String(month).padStart(2, "0")}-01`,
		location,
		skills: ["程序设计竞赛", medal],
		icon: "material-symbols:emoji-events",
		color: medalColors[medal],
		featured: medal === "金牌",
		current: false,
		showDuration: false,
	};
};

export const timelineData: TimelineItem[] = [
	{
		id: "cuc-digital-media-technology",
		title: "进入中国传媒大学",
		description:
			"2024 年进入中国传媒大学数字媒体技术专业学习。大学期间继续钻研算法与程序设计，并把学习过程整理成博客笔记。",
		type: "education",
		startDate: "2024-09-01",
		location: "北京",
		organization: "中国传媒大学",
		position: "数字媒体技术",
		skills: ["数字媒体技术", "C++", "算法与数据结构"],
		icon: "material-symbols:school",
		color: "#2563EB",
		featured: true,
	},
	createCompetition({
		id: "2026-icpc-shenyang-invitational",
		year: 2026,
		month: 7,
		series: "ICPC",
		stage: "邀请赛",
		medal: "金牌",
		location: "沈阳",
	}),
	{
		id: "mizuki-blog-migration",
		title: "重构个人博客",
		description:
			"将原有笔记迁移到 Mizuki，重新整理站点结构，并修复 LaTeX 显示、中文字体和文章阅读体验。",
		type: "project",
		startDate: "2026-07-27",
		endDate: "2026-07-30",
		skills: ["Astro", "TypeScript", "Markdown", "LaTeX"],
		links: [
			{
				name: "GitHub 仓库",
				url: "https://github.com/FisherGoGo/FisherGoGo.github.io",
				type: "project",
			},
		],
		icon: "material-symbols:web",
		color: "#7C3AED",
		featured: true,
	},
	createCompetition({
		id: "2025-ccpc-henan-invitational",
		year: 2025,
		month: 6,
		series: "CCPC",
		stage: "邀请赛",
		medal: "银牌",
		location: "河南",
	}),
	createCompetition({
		id: "2026-icpc-xian-invitational",
		year: 2026,
		month: 5,
		series: "ICPC",
		stage: "邀请赛",
		medal: "银牌",
		location: "西安",
	}),
	createCompetition({
		id: "2026-icpc-jiangxi-invitational",
		year: 2026,
		month: 5,
		series: "ICPC",
		stage: "邀请赛",
		medal: "金牌",
		location: "江西",
	}),
	createCompetition({
		id: "2026-ccpc-zhengzhou-final",
		year: 2026,
		month: 4,
		series: "CCPC",
		stage: "Final",
		medal: "铁牌",
		location: "郑州",
	}),
	createCompetition({
		id: "2026-icpc-hangzhou-ec-final",
		year: 2026,
		month: 2,
		series: "ICPC",
		stage: "EC-Final",
		medal: "铁牌",
		location: "杭州",
	}),
	createCompetition({
		id: "2025-icpc-shenyang-regional",
		year: 2025,
		month: 11,
		series: "ICPC",
		stage: "区域赛",
		medal: "银牌",
		location: "沈阳",
	}),
	createCompetition({
		id: "2025-icpc-chengdu-regional",
		year: 2025,
		month: 10,
		series: "ICPC",
		stage: "区域赛",
		medal: "铜牌",
		location: "成都",
	}),
	createCompetition({
		id: "2025-icpc-xian-invitational",
		year: 2025,
		month: 5,
		series: "ICPC",
		stage: "邀请赛",
		medal: "铜牌",
		location: "西安",
	}),
	{
		id: "personal-blog-start",
		title: "开始记录自己的算法与生活",
		description:
			"建立个人博客，用来沉淀算法学习笔记、比赛题解，也偶尔记录读书与生活。",
		type: "project",
		startDate: "2024-11-18",
		skills: ["Markdown", "算法笔记", "内容整理"],
		links: [
			{
				name: "博客首页",
				url: "/",
				type: "website",
			},
		],
		icon: "material-symbols:edit-note",
		color: "#059669",
	},
	{
		id: "sustech-affiliated-high-school",
		title: "进入南方科技大学附属中学",
		description:
			"2021 年进入南方科技大学附属中学，在深圳完成高中阶段的学习。",
		type: "education",
		startDate: "2021-09-01",
		endDate: "2024-06-30",
		location: "广东深圳",
		organization: "南方科技大学附属中学",
		icon: "material-symbols:school",
		color: "#0891B2",
		featured: true,
	},
];

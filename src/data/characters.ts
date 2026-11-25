import { lilyExhibit } from "./lily";

export interface CharacterShowcaseItem {
	/** 唯一标识 */
	id: string;
	/** 中文角色名 */
	name: string;
	/** 英文/罗马音副名 */
	romanName: string;
	/** 所属作品名（用于顶部分类筛选） */
	work: string;
	/** 所属作品英文或副标 */
	workEn?: string;
	/** 角色属性/身份简标 */
	roleTag: string;
	/** 展柜代表台词 */
	quote: string;
	/** 正计时/纪念起始时间（ISO 格式，前端实时计算天数） */
	startDate?: string;
	/** 纪念节点说明文案 */
	dateLabel?: string;
	/** 展柜右侧去背立绘路径 */
	portrait: string;
	/** 专属独立特设页路由 */
	href: string;
	/** 角色印象主色（用于悬停微光与细节焦点） */
	accentColor: string;
	/** 角色印象柔光背景色 */
	accentSoft: string;
}

/**
 * 角色展览柜数据配置
 * 后续新增角色时，只需在此数组中追加一项，展柜页与作品筛选栏会自动生成。
 */
export const charactersData: CharacterShowcaseItem[] = [
	{
		id: "daniya",
		name: "达妮娅",
		romanName: "Denia",
		work: "鸣潮",
		workEn: "Wuthering Waves",
		roleTag: "热熔 · 音感仪 · 泡影视阈",
		quote: "「就算你有一天真的坠入了虚无之中，也不必害怕就是了……因为一片虚无中，会有我在。」",
		startDate: "2026-05-21T00:00:00+08:00",
		dateLabel: "自 2026.05.21 星海告别以来",
		portrait: "/assets/daniya/denia-editorial.webp",
		href: "/daniya/",
		accentColor: "#d4355d",
		accentSoft: "rgba(236, 144, 178, 0.22)",
	},
	{
		id: lilyExhibit.id,
		name: lilyExhibit.name,
		romanName: "Lily Grace",
		work: "鸣潮",
		workEn: "Wuthering Waves",
		roleTag: "绮梦织香",
		quote: "「愿你的灵魂不再迷惘」",
		portrait: "/assets/lily/showcase-cover.webp",
		href: lilyExhibit.href,
		accentColor: "#9e68ca",
		accentSoft: "rgba(184, 148, 255, 0.24)",
	},
];

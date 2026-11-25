<script lang="ts">
import { onMount } from "svelte";

// 起始时间：2026 年 5 月 21 日 00:00:00 (UTC+8)
const START_TIMESTAMP = new Date("2026-05-21T00:00:00+08:00").getTime();

// 游戏内实装原版心声文本与专属印象曲台词
const whispers = [
	"就算你有一天真的坠入了虚无之中，也不必害怕就是了……因为一片虚无中，会有我在。",
	"毫无意义的我，却已能够听见自己心脏的搏动，听见与你们曾在一起时留下的笑声。",
	"如果世界本就由谎言构成，我们又何必害怕遭到欺骗呢。",
	"当然是夹着新鲜水果，涂满了奶油，插着蜡烛的生日蛋糕了……毕竟，我还没吃过呢。",
	"每天都能睡个好觉，吃到美味的东西，还有就是……和朋友们在一起。",
	"До свидания —— 直到星海尽处，我们再次相见。",
];

let days = $state(0);
let hours = $state("00");
let minutes = $state("00");
let seconds = $state("00");
let centis = $state("00");
let daysToBirthday = $state(0);
let isBirthdayToday = $state(false);
let isBeforeStart = $state(false);
let entered = $state(false);

let quoteIndex = $state(0);
let quoteVisible = $state(true);

// 归一化平滑视差坐标 (-1 ~ 1)
let parallaxX = $state(0);
let parallaxY = $state(0);

let canvasEl: HTMLCanvasElement | undefined = $state();

function pad2(n: number): string {
	return String(Math.floor(Math.max(0, n))).padStart(2, "0");
}

function updateClock() {
	const now = Date.now();
	const diff = now - START_TIMESTAMP;
	isBeforeStart = diff < 0;
	const abs = Math.abs(diff);

	const totalSec = Math.floor(abs / 1000);
	days = Math.floor(totalSec / 86400);
	hours = pad2(Math.floor((totalSec % 86400) / 3600));
	minutes = pad2(Math.floor((totalSec % 3600) / 60));
	seconds = pad2(totalSec % 60);
	centis = pad2(Math.floor((abs % 1000) / 10));

	const nowUtc8 = new Date(now + 8 * 3600 * 1000);
	const y = nowUtc8.getUTCFullYear();
	const m = nowUtc8.getUTCMonth() + 1;
	const d = nowUtc8.getUTCDate();

	if (m === 5 && d === 21) {
		isBirthdayToday = true;
		daysToBirthday = 0;
	} else {
		isBirthdayToday = false;
		const nextY = m > 5 || (m === 5 && d > 21) ? y + 1 : y;
		const nextTs = new Date(`${nextY}-05-21T00:00:00+08:00`).getTime();
		daysToBirthday = Math.ceil((nextTs - now) / 86400000);
	}
}

function cycleWhisper() {
	if (!quoteVisible) return;
	quoteVisible = false;
	window.setTimeout(() => {
		quoteIndex = (quoteIndex + 1) % whispers.length;
		quoteVisible = true;
	}, 420);
}

onMount(() => {
	updateClock();
	const enterRaf = requestAnimationFrame(() => {
		entered = true;
	});

	const clockTimer = window.setInterval(updateClock, 45);
	const quoteTimer = window.setInterval(cycleWhisper, 9500);

	// 线性插值 (lerp) 平滑鼠标追踪
	let targetX = 0;
	let targetY = 0;
	let currentX = 0;
	let currentY = 0;
	let pointerNormX = 0.65;
	let pointerNormY = 0.5;

	const onPointerMove = (e: PointerEvent) => {
		const nx = e.clientX / window.innerWidth;
		const ny = e.clientY / window.innerHeight;
		pointerNormX = nx;
		pointerNormY = ny;
		targetX = (nx - 0.5) * 2;
		targetY = (ny - 0.5) * 2;
	};
	window.addEventListener("pointermove", onPointerMove, { passive: true });

	// Layer 1 Canvas：雾樱瓷白艺术纸上的丝网印共鸣声波等高线
	const canvas = canvasEl;
	const ctx = canvas?.getContext("2d");
	let width = 0;
	let height = 0;
	let dpr = 1;
	let pulseAmp = 0;

	const onClick = (e: MouseEvent) => {
		const target = e.target as HTMLElement | null;
		if (target?.closest("a, button")) return;
		pulseAmp = 1;
	};

	function resize() {
		if (!canvas || !ctx) return;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	resize();
	window.addEventListener("resize", resize);
	window.addEventListener("click", onClick);

	let rafId = 0;
	let time = 0;

	function renderField() {
		currentX += (targetX - currentX) * 0.055;
		currentY += (targetY - currentY) * 0.055;
		parallaxX = currentX;
		parallaxY = currentY;

		pulseAmp *= 0.96;
		time += 0.0072;

		if (ctx && width > 0 && height > 0) {
			ctx.clearRect(0, 0, width, height);

			const lineCount = 26;
			const stepX = Math.max(8, Math.floor(width / 160));
			const focusX = width * (0.74 + (pointerNormX - 0.5) * 0.05);
			const focusY = height * (0.56 + (pointerNormY - 0.5) * 0.05);
			const lightRadius = Math.max(width, height) * 0.46;

			for (let i = 0; i < lineCount; i++) {
				const norm = i / (lineCount - 1);
				const baseY = height * (0.06 + norm * 0.89);
				const isAccentLine = i === 13;

				ctx.beginPath();
				for (let x = -20; x <= width + 20; x += stepX) {
					const xn = x / width;
					const dx = (x - focusX) / (width * 0.42);
					const dy = (baseY - focusY) / (height * 0.46);
					const distSq = dx * dx + dy * dy;
					const envelope = Math.exp(-distSq * 1.4);

					const wave1 = Math.sin(xn * 4.2 - time * 0.9 + norm * 3.1) * 26;
					const wave2 = Math.cos(xn * 8.6 + time * 0.65 - norm * 4.8) * 11;
					const resonance =
						Math.sin(Math.sqrt(distSq) * 9.5 - time * 2.4) *
						envelope *
						(28 + pulseAmp * 24);
					const arch = Math.sin(xn * Math.PI) * (norm - 0.48) * 54;

					const y = baseY + wave1 + wave2 + resonance - arch;
					if (x === -20) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
				}

				if (isAccentLine) {
					// 基准共鸣丝线：由左侧淡灰粉过渡至人物身后的绯红莓果色
					const accentGrad = ctx.createRadialGradient(
						focusX,
						focusY,
						lightRadius * 0.08,
						focusX,
						focusY,
						lightRadius,
					);
					accentGrad.addColorStop(0, `rgba(208, 52, 92, ${0.38 + pulseAmp * 0.18})`);
					accentGrad.addColorStop(0.55, `rgba(216, 84, 124, ${0.24 + pulseAmp * 0.1})`);
					accentGrad.addColorStop(1, "rgba(186, 128, 150, 0.14)");
					ctx.strokeStyle = accentGrad;
					ctx.lineWidth = 1;
				} else {
					// 常规等高线：浅樱纸本上的灰粉紫细线，靠近人物边缘自然加深为暖樱粉
					const edgeWeight = 0.7 + 0.3 * Math.sin(norm * Math.PI);
					const baseAlpha = (0.11 + 0.04 * edgeWeight).toFixed(3);
					const nearAlpha = (0.2 + 0.07 * edgeWeight + pulseAmp * 0.06).toFixed(3);

					const lineGrad = ctx.createRadialGradient(
						focusX,
						focusY,
						lightRadius * 0.1,
						focusX,
						focusY,
						lightRadius,
					);
					lineGrad.addColorStop(0, `rgba(218, 96, 138, ${nearAlpha})`);
					lineGrad.addColorStop(0.5, `rgba(204, 124, 156, ${(Number(baseAlpha) * 1.25).toFixed(3)})`);
					lineGrad.addColorStop(1, `rgba(178, 132, 152, ${baseAlpha})`);

					ctx.strokeStyle = lineGrad;
					ctx.lineWidth = i % 4 === 0 ? 0.95 : 0.72;
				}
				ctx.stroke();
			}
		}

		rafId = window.requestAnimationFrame(renderField);
	}

	rafId = window.requestAnimationFrame(renderField);

	return () => {
		window.cancelAnimationFrame(enterRaf);
		window.clearInterval(clockTimer);
		window.clearInterval(quoteTimer);
		window.cancelAnimationFrame(rafId);
		window.removeEventListener("pointermove", onPointerMove);
		window.removeEventListener("resize", resize);
		window.removeEventListener("click", onClick);
	};
});
</script>

<div
	class="showcase"
	class:is-entered={entered}
	style={`--mx: ${parallaxX.toFixed(4)}; --my: ${parallaxY.toFixed(4)};`}
>
	<!-- ==================== LAYER 1: 雾樱瓷白底韵 + 柔和樱粉/星紫晕染场（衬托白色礼服层次） ==================== -->
	<div class="layer-field" aria-hidden="true">
		<div class="blush-wash-left"></div>
		<div class="ambient-aura-outer"></div>
		<div class="ambient-aura-core"></div>
		<div class="ambient-aura-iris"></div>
		<canvas bind:this={canvasEl} class="wave-canvas"></canvas>
	</div>

	<!-- ==================== LAYER 2: 巨型斜体衬线水印（浅樱水彩印记质感） ==================== -->
	<div class="layer-watermark" aria-hidden="true">
		<span class="watermark-primary">Denia</span>
	</div>

	<!-- ==================== LAYER 3: 右侧全出血立绘（贴底生长 + 玫瑰暖调环境投影） ==================== -->
	<div class="layer-portrait" aria-hidden="true">
		<img
			src="/assets/daniya/denia-editorial.webp"
			alt="达妮娅 Denia"
			class="bleed-portrait"
			draggable="false"
		/>
	</div>

	<!-- ==================== LAYER 4: 雾樱画报级前景排版 ==================== -->
	<div class="layer-editorial">
		<!-- 左上角锚点：杂志页眉式返回角色展柜导航 -->
		<header class="corner-tl">
			<a href="/showcase/" class="masthead-back">
				<span class="back-dash"></span>
				<span class="back-label">SHOWCASE</span>
				<span class="back-sep">/</span>
				<span class="back-site">角色展柜</span>
			</a>
		</header>

		<!-- 中左主视觉区：细宋体角色名 + 12.8vw 巨型天数 + 3 格紧凑精密副计时 -->
		<main class="monument-zone" aria-label="达妮娅正计时">
			<div class="identity-group">
				<div class="identity-eyebrow">
					<span class="crimson-rule"></span>
					<span class="eyebrow-code">FUSION · RECTIFIER · ДО СВИДАНИЯ</span>
				</div>
				<div class="identity-title">
					<h1 class="serif-cn">达妮娅</h1>
					<span class="roman-tag">DENIA</span>
				</div>
			</div>

			<div class="chronometer">
				<div class="days-monument">
					{#key days}
						<span class="giant-days">{days}</span>
					{/key}
					<div class="days-meta">
						<span class="days-en">DAYS</span>
						<span class="days-cn">
							{isBeforeStart ? "距星海告别" : "自星海告别以来"}
						</span>
					</div>
				</div>

				<div class="instrument-rule"></div>

				<!-- 精密仪表感副计时：仅保留 HRS / MIN / SEC 三格紧凑节奏 -->
				<div class="sub-instrument" role="timer" aria-live="off">
					<div class="inst-cell">
						<span class="inst-k">HRS</span>
						{#key hours}
							<span class="inst-v">{hours}</span>
						{/key}
					</div>

					<span class="inst-divider" aria-hidden="true"></span>

					<div class="inst-cell">
						<span class="inst-k">MIN</span>
						{#key minutes}
							<span class="inst-v">{minutes}</span>
						{/key}
					</div>

					<span class="inst-divider" aria-hidden="true"></span>

					<div class="inst-cell is-crimson">
						<span class="inst-k">SEC</span>
						<span class="inst-sec-group">
							{#key seconds}
								<span class="inst-v sec-tick">{seconds}</span>
							{/key}
							<span class="inst-cs">.{centis}</span>
						</span>
					</div>
				</div>
			</div>
		</main>

		<!-- 左下角锚点：绯红微点缀竖线台词 + 周年叙事底注 -->
		<footer class="corner-bl">
			<button
				type="button"
				class="quote-trigger"
				onclick={cycleWhisper}
				title="点击切换台词"
			>
				<span class="quote-index">0{quoteIndex + 1} / 0{whispers.length}</span>
				<p class="quote-line" class:is-fading={!quoteVisible}>
					{whispers[quoteIndex]}
				</p>
			</button>

			<div class="colophon">
				<span>SINCE 2026.05.21</span>
				<span class="colophon-dot">·</span>
				<span>
					{#if isBirthdayToday}
						今日 5 月 21 日 · 生日快乐，达妮娅
					{:else}
						距下一个 5 月 21 日还有 {daysToBirthday} 天 · 直到下次再见
					{/if}
				</span>
			</div>
		</footer>
	</div>

	<!-- ==================== TOP PAPER GRAIN: 艺术棉纸微颗粒层 (multiply 正片叠底) ==================== -->
	<svg class="film-grain" aria-hidden="true">
		<filter id="daniya-editorial-grain">
			<feTurbulence
				type="fractalNoise"
				baseFrequency="0.8"
				numOctaves="3"
				stitchTiles="stitch"
			/>
			<feColorMatrix type="saturate" values="0" />
		</filter>
		<rect width="100%" height="100%" filter="url(#daniya-editorial-grain)" />
	</svg>
</div>

<style>
	.showcase {
		/* 拒绝生硬纯白：采用温润的「雾樱瓷白」艺术纸渐变基调 */
		--bg-porcelain: #fcf7f9;
		--bg-blush: #f7ecf1;
		/* 拒绝死黑：采用带有 10% 浆果酒红调的深炭褐墨色 */
		--ink-primary: #261720;
		/* 次级文本与台词：温润深梅子墨色，清晰通透 */
		--ink-secondary: rgba(44, 24, 36, 0.86);
		/* 微标签与说明：高级灰粉褐（Dusty Rose-Taupe） */
		--ink-muted: rgba(108, 66, 86, 0.66);
		/* 装饰线条与分割线：半透明灰樱粉细线 */
		--hairline: rgba(182, 112, 140, 0.28);
		/* 高饱和点缀色：立绘手套同系绯红莓果色 & 发丝樱花粉 */
		--crimson: #d4355d;
		--sakura-deep: #c46289;
		--edge-x: clamp(32px, 3.8vw, 48px);
		--edge-y: clamp(32px, 3.8vh, 44px);

		position: relative;
		width: 100vw;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		background: linear-gradient(
			125deg,
			#fdf9fb 0%,
			var(--bg-porcelain) 46%,
			var(--bg-blush) 100%
		);
		color: var(--ink-primary);
		user-select: none;
	}

	/* ==================== LAYER 1: 樱粉水彩氛围晕染（烘托白色礼服轮廓，避免白衣融底） ==================== */
	.layer-field {
		position: absolute;
		inset: -24px;
		z-index: 1;
		pointer-events: none;
		transform: translate3d(
			calc(var(--mx, 0) * -9px),
			calc(var(--my, 0) * -6px),
			0
		);
		will-change: transform;
	}

	/* 左上极淡暖粉空气感过渡 */
	.blush-wash-left {
		position: absolute;
		left: -10vw;
		top: -14vh;
		width: 52vw;
		height: 58vh;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(246, 198, 218, 0.24) 0%,
			rgba(246, 198, 218, 0.08) 48%,
			transparent 74%
		);
		filter: blur(54px);
	}

	/* 立绘身后的大半径樱花玫瑰色晕染底光，把达妮娅纯白裙装干净地“托”出来 */
	.ambient-aura-outer {
		position: absolute;
		right: -6vw;
		bottom: -10vh;
		width: min(68vw, 980px);
		height: min(94vh, 980px);
		border-radius: 50%;
		background: radial-gradient(
			circle at 54% 56%,
			rgba(236, 144, 178, 0.36) 0%,
			rgba(242, 174, 200, 0.22) 38%,
			rgba(246, 202, 220, 0.08) 64%,
			transparent 80%
		);
		filter: blur(56px);
	}

	/* 肩颈后方的柔绯红核心气韵 */
	.ambient-aura-core {
		position: absolute;
		right: 7vw;
		top: 12vh;
		width: min(44vw, 640px);
		height: min(64vh, 660px);
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(224, 108, 148, 0.22) 0%,
			rgba(238, 158, 188, 0.11) 46%,
			transparent 74%
		);
		filter: blur(48px);
	}

	/* 呼应她眼眸与发丝星海内衬的一缕极淡紫罗兰冷调平衡光，防止粉色发腻 */
	.ambient-aura-iris {
		position: absolute;
		right: 2vw;
		top: 28vh;
		width: min(32vw, 460px);
		height: min(48vh, 480px);
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(156, 166, 232, 0.18) 0%,
			transparent 70%
		);
		filter: blur(50px);
	}

	.wave-canvas {
		position: absolute;
		inset: 24px;
		width: calc(100% - 48px);
		height: calc(100% - 48px);
	}

	/* ==================== LAYER 2: 巨型斜体衬线水印（温柔灰樱粉印记） ==================== */
	.layer-watermark {
		position: absolute;
		right: 13vw;
		top: 4.5vh;
		z-index: 2;
		pointer-events: none;
		transform: translate3d(
			calc(var(--mx, 0) * -14px),
			calc(var(--my, 0) * -8px),
			0
		);
		will-change: transform;
		opacity: 0;
		transition: opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.16s;
	}

	.is-entered .layer-watermark {
		opacity: 1;
	}

	.watermark-primary {
		display: block;
		font-family: "Cormorant Garamond", Georgia, "Times New Roman", serif;
		font-style: italic;
		font-weight: 400;
		font-size: clamp(13rem, 26vw, 33rem);
		line-height: 0.78;
		letter-spacing: -0.02em;
		color: rgba(206, 112, 148, 0.14);
		white-space: nowrap;
	}

	/* ==================== LAYER 3: 右侧全出血立绘（暖玫瑰灰柔和立体阴影） ==================== */
	.layer-portrait {
		position: absolute;
		right: clamp(-1vw, 3.2vw, 6vw);
		bottom: -22px;
		z-index: 3;
		pointer-events: none;
		translate: calc(var(--mx, 0) * 16px) calc(var(--my, 0) * 9px);
		transform: translateY(28px);
		opacity: 0;
		transition:
			opacity 1.25s cubic-bezier(0.16, 1, 0.3, 1) 0.1s,
			transform 1.25s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
		will-change: translate, transform, opacity;
	}

	.is-entered .layer-portrait {
		opacity: 1;
		transform: translateY(0);
	}

	.bleed-portrait {
		display: block;
		height: clamp(560px, 86vh, 1020px);
		width: auto;
		max-width: none;
		object-fit: contain;
		object-position: bottom right;
		/* 用暖调玫瑰梅子色柔和阴影替代黑底重阴影，让白色裙摆自然立于浅粉空间 */
		filter: drop-shadow(-16px 10px 34px rgba(146, 68, 98, 0.16))
			drop-shadow(0 2px 14px rgba(188, 96, 130, 0.11));
	}

	/* ==================== LAYER 4: 前景四角定锚 UI 与纪念碑排版（分层跟随鼠标微视差） ==================== */
	.layer-editorial {
		position: relative;
		z-index: 4;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	/* 左上角页眉（微幅随动：+5px / +3.5px） */
	.corner-tl {
		position: absolute;
		top: var(--edge-y);
		left: var(--edge-x);
		pointer-events: auto;
		translate: calc(var(--mx, 0) * 5px) calc(var(--my, 0) * 3.5px);
		opacity: 0;
		transform: translateY(-10px);
		transition:
			opacity 0.9s ease 0.05s,
			transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.05s;
		will-change: translate;
	}

	.is-entered .corner-tl {
		opacity: 1;
		transform: translateY(0);
	}

	.masthead-back {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		text-decoration: none;
		color: var(--ink-muted);
		font-family: "JetBrains Mono Variable", "Inter", monospace;
		font-size: 0.76rem;
		font-weight: 500;
		letter-spacing: 0.24em;
		transition: color 0.25s ease;
	}

	.back-dash {
		width: 20px;
		height: 1.5px;
		background: rgba(154, 86, 114, 0.62);
		transition:
			width 0.3s cubic-bezier(0.16, 1, 0.3, 1),
			background-color 0.25s ease;
	}

	.masthead-back:hover {
		color: var(--crimson);
	}

	.masthead-back:hover .back-dash {
		width: 32px;
		background: var(--crimson);
	}

	.back-sep {
		color: rgba(154, 86, 114, 0.48);
	}

	/* 中左核心视觉锚区 */
	.monument-zone {
		position: absolute;
		left: var(--edge-x);
		top: 50%;
		transform: translateY(-54%);
		pointer-events: auto;
		display: flex;
		flex-direction: column;
		gap: clamp(1.2rem, 2.4vh, 2.1rem);
	}

	/* 角色标题层（中近景随动：+8px / +5px） */
	.identity-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		translate: calc(var(--mx, 0) * 8px) calc(var(--my, 0) * 5px);
		opacity: 0;
		transform: translateY(14px);
		transition:
			opacity 0.95s ease 0.16s,
			transform 0.95s cubic-bezier(0.16, 1, 0.3, 1) 0.16s;
		will-change: translate;
	}

	.is-entered .identity-group {
		opacity: 1;
		transform: translateY(0);
	}

	.identity-eyebrow {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.crimson-rule {
		width: 22px;
		height: 1.5px;
		background-color: var(--crimson);
		transform-origin: left center;
		transform: scaleX(0);
		transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.3s;
	}

	.is-entered .crimson-rule {
		transform: scaleX(1);
	}

	.eyebrow-code {
		font-family: "JetBrains Mono Variable", "Inter", monospace;
		font-size: 0.72rem;
		font-weight: 500;
		letter-spacing: 0.26em;
		color: var(--ink-muted);
	}

	.identity-title {
		display: flex;
		align-items: baseline;
		gap: 1.15rem;
	}

	.serif-cn {
		margin: 0;
		font-family: "Noto Serif SC", "Songti SC", "STSong", serif;
		font-weight: 500;
		font-size: clamp(1.95rem, 2.9vw, 2.85rem);
		letter-spacing: 0.36em;
		color: var(--ink-primary);
		line-height: 1.1;
	}

	.roman-tag {
		font-family: "Cormorant Garamond", Georgia, serif;
		font-style: italic;
		font-weight: 600;
		font-size: clamp(1.15rem, 1.5vw, 1.45rem);
		letter-spacing: 0.18em;
		color: var(--sakura-deep);
	}

	/* 巨型主天数 + 紧凑 3 格精密副计时（前景主视觉随动：+12px / +7.5px，与标题形成细腻层差） */
	.chronometer {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		translate: calc(var(--mx, 0) * 12px) calc(var(--my, 0) * 7.5px);
		opacity: 0;
		transform: translateY(18px);
		transition:
			opacity 1.05s ease 0.26s,
			transform 1.05s cubic-bezier(0.16, 1, 0.3, 1) 0.26s;
		will-change: translate;
	}

	.is-entered .chronometer {
		opacity: 1;
		transform: translateY(0);
	}

	.days-monument {
		display: flex;
		align-items: baseline;
		gap: clamp(1rem, 1.8vw, 1.75rem);
	}

	.giant-days {
		font-family: "Inter", "JetBrains Mono Variable", sans-serif;
		font-variant-numeric: tabular-nums;
		font-feature-settings: "tnum" 1;
		font-weight: 300;
		font-size: clamp(6.6rem, 12.8vw, 14.4rem);
		line-height: 0.84;
		letter-spacing: -0.045em;
		color: var(--ink-primary);
	}

	.days-meta {
		display: flex;
		flex-direction: column;
		gap: 0.34rem;
		padding-bottom: 0.4vw;
	}

	.days-en {
		font-family: "JetBrains Mono Variable", "Inter", monospace;
		font-size: 0.84rem;
		font-weight: 500;
		letter-spacing: 0.34em;
		color: var(--ink-secondary);
	}

	.days-cn {
		font-family: "Noto Serif SC", serif;
		font-size: 0.8rem;
		font-weight: 500;
		letter-spacing: 0.2em;
		color: var(--ink-muted);
	}

	/* 1px 灰樱粉渐变水平基准线 */
	.instrument-rule {
		width: min(360px, 38vw);
		height: 1px;
		margin: clamp(1rem, 2vh, 1.45rem) 0 clamp(0.85rem, 1.6vh, 1.2rem);
		background: linear-gradient(
			90deg,
			rgba(212, 53, 93, 0.42) 0%,
			rgba(182, 112, 140, 0.3) 65%,
			transparent 100%
		);
		transform-origin: left center;
		transform: scaleX(0);
		transition: transform 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.36s;
	}

	.is-entered .instrument-rule {
		transform: scaleX(1);
	}

	.sub-instrument {
		display: flex;
		align-items: center;
		gap: clamp(1.15rem, 2vw, 1.85rem);
	}

	.inst-cell {
		display: flex;
		flex-direction: column;
		gap: 0.24rem;
	}

	.inst-k {
		font-family: "JetBrains Mono Variable", "Inter", monospace;
		font-size: 0.64rem;
		font-weight: 500;
		letter-spacing: 0.26em;
		color: var(--ink-muted);
	}

	.inst-v {
		font-family: "JetBrains Mono Variable", monospace;
		font-variant-numeric: tabular-nums;
		font-feature-settings: "tnum" 1;
		font-size: clamp(1.1rem, 1.42vw, 1.36rem);
		font-weight: 480;
		letter-spacing: 0.08em;
		color: var(--ink-secondary);
		line-height: 1.1;
	}

	.inst-divider {
		width: 1px;
		height: 26px;
		background-color: var(--hairline);
		flex-shrink: 0;
	}

	.inst-sec-group {
		display: inline-flex;
		align-items: baseline;
	}

	/* 绯红色克制点缀于读秒焦点 */
	.is-crimson .inst-k {
		color: var(--crimson);
	}

	.is-crimson .inst-v {
		color: var(--crimson);
		font-weight: 560;
	}

	.inst-cs {
		font-family: "JetBrains Mono Variable", monospace;
		font-variant-numeric: tabular-nums;
		font-size: 0.76rem;
		font-weight: 450;
		color: var(--sakura-deep);
		margin-left: 0.12rem;
	}

	.sec-tick {
		display: inline-block;
		animation: secBreath 0.34s cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* 左下角锚点：原版心声与周年叙事底注（近景微随动：+7px / +4.5px） */
	.corner-bl {
		position: absolute;
		left: var(--edge-x);
		bottom: var(--edge-y);
		max-width: min(490px, 44vw);
		pointer-events: auto;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		translate: calc(var(--mx, 0) * 7px) calc(var(--my, 0) * 4.5px);
		opacity: 0;
		transform: translateY(12px);
		transition:
			opacity 1s ease 0.4s,
			transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s;
		will-change: translate;
	}

	.is-entered .corner-bl {
		opacity: 1;
		transform: translateY(0);
	}

	.quote-trigger {
		position: relative;
		appearance: none;
		background: none;
		border: none;
		padding: 0.12rem 0 0.12rem 1rem;
		margin: 0;
		text-align: left;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.36rem;
	}

	/* 绯红向淡樱粉过渡的竖线 */
	.quote-trigger::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0.15rem;
		bottom: 0.15rem;
		width: 2px;
		background: linear-gradient(
			180deg,
			var(--crimson) 0%,
			rgba(212, 53, 93, 0.55) 42%,
			rgba(182, 112, 140, 0.28) 100%
		);
		transition: background 0.3s ease;
	}

	.quote-trigger:hover::before {
		background: var(--crimson);
	}

	.quote-index {
		font-family: "JetBrains Mono Variable", monospace;
		font-size: 0.66rem;
		font-weight: 500;
		letter-spacing: 0.24em;
		color: var(--ink-muted);
	}

	.quote-line {
		margin: 0;
		font-family: "Noto Serif SC", "LXGW WenKai", serif;
		font-weight: 500;
		font-size: 0.94rem;
		line-height: 1.8;
		letter-spacing: 0.05em;
		color: var(--ink-secondary);
		transition:
			opacity 0.4s ease,
			transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
			color 0.25s ease;
	}

	.quote-trigger:hover .quote-line {
		color: var(--ink-primary);
	}

	.quote-line.is-fading {
		opacity: 0;
		transform: translateY(4px);
	}

	.colophon {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.55rem;
		font-family: "JetBrains Mono Variable", "LXGW WenKai", monospace;
		font-size: 0.74rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		color: var(--ink-muted);
	}

	.colophon-dot {
		color: var(--crimson);
	}

	/* ==================== TOP PAPER GRAIN (艺术棉纸质感，浅底采用 multiply) ==================== */
	.film-grain {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 20;
		opacity: 0.035;
		pointer-events: none;
		mix-blend-mode: multiply;
	}

	@keyframes secBreath {
		0% {
			opacity: 0.48;
			transform: translateY(2.5px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ==================== 响应式兜底（小屏/移动端优雅纵向海报） ==================== */
	@media (max-width: 960px) {
		.showcase {
			height: auto;
			min-height: 100vh;
			min-height: 100dvh;
			overflow-x: hidden;
			overflow-y: auto;
		}

		.layer-editorial {
			min-height: 100dvh;
			padding: 28px 24px 32px;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			gap: 2.25rem;
		}

		.corner-tl,
		.monument-zone,
		.corner-bl {
			position: relative;
			top: auto;
			left: auto;
			right: auto;
			bottom: auto;
			transform: none;
			translate: none;
		}

		.identity-group,
		.chronometer {
			translate: none;
		}

		.is-entered .monument-zone {
			transform: none;
		}

		.layer-watermark {
			top: 12vh;
			right: 2vw;
		}

		.watermark-primary {
			font-size: 34vw;
		}

		.layer-portrait {
			right: -8vw;
			bottom: -16px;
			opacity: 0;
		}

		.is-entered .layer-portrait {
			opacity: 0.36;
		}

		.bleed-portrait {
			height: min(64vh, 540px);
		}

		.monument-zone {
			margin-top: auto;
			padding-top: 14vh;
		}

		.giant-days {
			font-size: clamp(5.2rem, 22vw, 7.6rem);
		}

		.instrument-rule {
			width: 100%;
		}

		.corner-bl {
			max-width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.layer-field,
		.layer-watermark,
		.layer-portrait,
		.corner-tl,
		.identity-group,
		.chronometer,
		.corner-bl,
		.sec-tick {
			transition: none !important;
			animation: none !important;
			transform: none !important;
			translate: none !important;
		}
	}
</style>

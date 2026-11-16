---
title: "语音到语音翻译（S2ST）初期报告"
published: 2026-11-16
description: "从语音特征与表征学习出发，梳理语音到语音翻译的主要模型、数据集，以及语义、自然度和表达保留的评价方法。"
tags: ["语音翻译", "S2ST", "深度学习"]
category: "深度学习"
draft: false
comment: true
lang: "zh_CN"
---

# 研究背景与任务定义

目前的研究方向是中文到英文的语音到语音翻译及其质量评价。

语音到语音翻译（Speech-to-Speech Translation，S2ST）是将一种语言的语音翻译为另一种语言的语音，常见技术路线包括级联式与直接式。[\[01\]](#ref-01)

级联式系统通常由相对独立的模块组成，依次完成自动语音识别（ASR）、机器翻译（MT）和语音合成（TTS）。直接式系统将源语音到目标语音表示的映射放在统一或紧密耦合的架构中建模。它也可以包含多个功能模块，或使用中间文本表示。因此，区分两类路线时，需要结合翻译主干的连接方式和训练方式，不能只看模块数量或是否使用文本。[\[03\]](#ref-03)、[\[04\]](#ref-04)、[\[06\]](#ref-06)、[\[07\]](#ref-07)

在级联式系统中，上游模块的错误可能传递到下游，影响最终结果。对于依赖平行语音监督的直接式系统，训练数据往往稀缺，收集成本也较高。[\[01\]](#ref-01)、[\[08\]](#ref-08)

对 S2ST 的评价还需要考虑语音表达。除了译文内容是否准确，还应关注生成语音是否自然，以及语气、语调、停顿和音色等特征是否得到恰当保留。因此，需要从多个维度评价系统质量。[\[06\]](#ref-06)、[\[07\]](#ref-07)、[\[13\]](#ref-13)

# 技术基础

## 语音特征提取与声学特征表示

现实中的语音是空气压力随时间变化形成的声波。录音设备将声音转换为电信号，再经过采样和量化等模数转换过程，得到离散采样点，这就是 *Waveform（数字语音波形）*。对于一段 1 秒、采样率为 16 kHz 的单声道语音，就有 16000 个采样点。但我们很难直观地从这段离散序列中看出频率分布，因此希望将原始波形转换成更有结构的*特征*。

声音可以视为不同频率成分的叠加，分析这些成分的经典方法是傅里叶变换。但语音的频率结构会随时间变化，对整段语音进行一次傅里叶变换，难以反映这种变化。因此引入**短时傅里叶变换（STFT）**：将语音分成多个短时间窗口，再对每个窗口单独进行傅里叶变换。这样，每一帧都有对应的频率分析结果，拼在一起就能得到时频表示。相邻窗口通常会重叠，以便更连续地描述声音的变化。

人耳对不同频率的感知分辨率并不相同。在较低频率范围内，人耳能够分辨更细微的频率差异；在较高频率范围内，分辨则相对粗糙。因此，可以引入**梅尔频率尺度（Mel Scale）**，近似描述人类对音高的感知。具体方法是通过一组 Mel 滤波器，对 STFT 得到的功率谱进行加权汇总，得到梅尔频谱。由于不同频带的能量差异可能很大，通常还会进行对数变换，得到 **Log-Mel Spectrogram（对数梅尔频谱）**。

经过上述变换后，如果还希望得到更紧凑的表示，可以进一步提取**梅尔频率倒谱系数（MFCC）**。通常是在 Log-Mel 的基础上进行**离散余弦变换（DCT）**，再保留低阶的部分系数。MFCC 是一种声学特征选择，并不是所有语音模型都必须使用的处理步骤。[\[S04\]](#ref-S04)

## 语音表征学习与离散语音单元

声学特征能够描述声音的频率分布，却不会直接告诉模型这些声音代表什么。而且，提取声学特征时，无论是参数设置还是滤波器设计，都需要人为确定。我们更希望模型能够从大量语音数据中，进一步学习对任务更有用的特征。

**表征**可以理解为模型学习得到的一组特征，用于描述输入数据中的有用信息。比如，有些表征更适合识别语言内容，有些更适合识别说话人特征。

传统的监督学习需要大量标注数据，但在语音领域，优质的标注数据往往难以获得。因此，可以使用**自监督学习**，即不依赖人工提供的任务标签，而是从原始数据本身构造训练目标。[\[02\]](#ref-02)、[\[S02\]](#ref-S02)

经典方法有 *wav2vec 2.0* 与 *HuBERT*。

简单来说，wav2vec 2.0 先用 CNN 提取局部语音特征，再通过 Transformer 建模不同位置之间的上下文关系。训练时遮蔽部分位置，让模型根据上下文，从候选的量化语音表示中辨别正确目标，这属于对比学习。HuBERT 则通过离线聚类生成伪标签，再利用掩码预测学习表征。[\[S02\]](#ref-S02)、[\[02\]](#ref-02)

这两种方法都可以提供连续的上下文特征向量。如果希望把这些向量转换成有限数量的类别，就需要进行**离散化**。一种常见做法是利用 K-Means，将每个时间位置的连续特征向量分配到一个聚类中心，使其从高维向量变成类别编号。由此得到的序列可以作为**离散语音单元**。这里的离散单元不一定与音素或词一一对应；wav2vec 2.0 预训练中的量化模块，也不等同于下游的 K-Means 聚类。[\[02\]](#ref-02)、[\[03\]](#ref-03)、[\[S02\]](#ref-S02)

经过离散化后，语音可以表示为 Token 序列，这样就能借鉴文本序列建模的方法。[\[03\]](#ref-03)

## 序列建模

语音翻译可以看成一个 **序列到序列（Seq2Seq）** 任务：输入一个序列，通过模型进行编码和转换，再生成另一个序列。输入和输出可以具有不同长度。

典型的 Seq2Seq 架构是先让源序列进入**编码器（Encoder）**，得到内部表征，再由**解码器（Decoder）**生成目标序列。

在不同任务中，解码器生成的结果并不相同。有时生成文本，再结合 TTS 生成语音；有时生成目标语言的声学特征，再经过声码器（Vocoder）生成语音；也可以预测离散语音单元。Seq2Seq 是一种通用的序列建模框架，具体模型的区别之一在于选择什么表示作为输出目标。[\[03\]](#ref-03)、[\[04\]](#ref-04)、[\[06\]](#ref-06)

## 语音合成与生成模型

当模型已经知道翻译后应该说什么，还需要将这些信息转换成自然的声音，这就是语音合成与生成模型要完成的工作。

语音合成模型需要生成对应的发音、音高、节奏和音色等声学信息。传统 TTS 通常利用**声学模型**后接**声码器**生成语音：前者根据文本或其他条件预测时长、音高变化和频谱等声学信息，后者再根据这些信息生成最终波形。不过，这种划分并不是所有语音合成模型都必须遵循的，有些端到端模型会将两者联合建模。[\[05\]](#ref-05)

语音生成中常用的方法包括**生成对抗网络（GAN）**和**扩散模型（Diffusion）**等。[\[05\]](#ref-05)

还有一种方法与前面提到的离散表示有关，即**神经音频编解码器语言模型（Codec LM）**。[\[05\]](#ref-05)、[\[S03\]](#ref-S03)

Codec LM 同样预测离散 Token，但其 Token 通常由**神经音频编解码器（Neural Audio Codec）**生成。编解码器将音频压缩为较紧凑的离散编码，并利用解码器重建音频。一个代表性模型是 *VALL-E*，它将 TTS 建模为以文本和参考语音为条件的离散编码生成任务。这类编码侧重音频重建，与前面基于 HuBERT 聚类得到的单元不能直接等同。[\[S03\]](#ref-S03)

## 语音副语言信息与表达控制

语音包含语言内容，也包含表达方式、说话人特征等超出字面意义的信息。通常用**副语言信息**描述语调、节奏、情绪等表达特征；音色和说话人身份也常被纳入更宽泛的**非语义特征**讨论。这些特征与语言内容可能相互影响，不能认为它们完全独立。[\[06\]](#ref-06)、[\[07\]](#ref-07)

一种常见思路是分别建模源语音中的语言内容与表达信息，再在生成时结合起来。不同模型对这些信息的提取和控制方式并不相同。[\[06\]](#ref-06)、[\[07\]](#ref-07)

# 模型

## S2ST 技术路线总览

根据系统如何组织翻译过程，通常可以分为两大类：**级联式**和**直接式**。[\[01\]](#ref-01)

级联式将翻译拆成多个任务，最经典的形式是 ASR → MT → TTS。各模块都有独立的研究基础，可以利用已有模型组合出完整系统，也能够单独训练、测试和替换。但这种方式存在*错误传播*问题，上游的错误可能被后续模块继承。[\[01\]](#ref-01)

直接式则学习源语音到目标语音表示的转换，尝试减少对独立文本翻译流水线的依赖。这为利用源语音中的*非文本信息*提供了更多可能。不过，直接式也有不同的细分：Translatotron 预测连续声学特征，S2UT 预测离散语音单元，SeamlessExpressive 结合多阶段预测与表达控制。部分系统会使用中间文本，并分别训练不同组件，因此还需要具体说明各模块的连接与训练方式。[\[03\]](#ref-03)、[\[04\]](#ref-04)、[\[06\]](#ref-06)

## 级联式 S2ST

传统级联式系统容易丢失情绪、韵律等信息，能否通过改进架构缓解这个问题？**Holistic Cascade** 是一个研究案例：语义内容通过文本传递下来，但源语音的表达信息没有完整传递到 TTS，因此需要补充相应的信息路径。[\[07\]](#ref-07)

这个系统值得理解的地方在于，它改变了源语音信息传递的方式。

论文中的系统采用两个核心模块：

- S2T：在论文实验中，将西班牙语源语音翻译为英文文本。
- Controllable TTS：结合英文文本与源语音的韵律信息，生成英文语音。[\[07\]](#ref-07)

可以理解为在级联翻译系统中，额外建立了一条表达信息传递路径。

论文将韵律迁移分成两个层次：全局韵律迁移和局部韵律迁移。

- 全局韵律迁移：描述整句话的表达特点。比如“我们终于赢了！”可以表现出兴奋、激动、语速较快等特征。模型使用 Reference Encoder（参考语音编码器），将源语音编码成向量，再提供给 TTS，生成具有相近整体表达风格的语音。
- 局部韵律迁移：论文结合了停顿插入、时长调整和音高迁移三种方法。[\[07\]](#ref-07)

这说明级联式系统也可以保留副语言信息。表达保留需要考虑多个方面，单独的标签难以完整描述一句话的表达方式，而可控语音合成是一个可以继续研究的切入点。

## 早期直接式 S2ST - Translatotron

换一个思路，能不能直接让神经网络学习从源语言语音到目标语言语音的映射，而不必先生成中间文本？**Translatotron** 是对这个问题的早期探索。[\[04\]](#ref-04)

它的具体实现是：将源语音的 80 维 Log-Mel 频谱送入 8 层双向 LSTM 编码器，通过注意力机制连接自回归解码器，预测目标语言的 1025 维对数频谱，再由声码器生成波形。[\[04\]](#ref-04)

这篇论文的一项重要设计是**辅助音素预测**。直接让神经网络从一种语言的语音频谱学习到另一种语言的语音频谱，训练起来较为困难。因此，作者引入两个可选的辅助解码器，分别预测源语言和目标语言的音素序列，以帮助模型学习语言内容及跨语言对齐。这里的“不依赖中间文本”指推理时的翻译路径，不代表训练时完全没有文本或音素监督。[\[04\]](#ref-04)

作者还引入了一个可选的**说话人编码器**，从参考语音中提取 Speaker Embedding，再将其作为条件提供给频谱解码器。这样，模型生成目标语音时，也可以参考说话人的身份特征。[\[04\]](#ref-04)

## S2UT

S2UT 最大的变化是不再直接预测连续的声学频谱，而是预测离散语音单元序列。[\[03\]](#ref-03)

原始频谱需要模型预测大量连续数值，而通过 HuBERT 和 K-Means，可以将目标语音表示成离散类别。比如，假设词表有 100 个类别，模型在每个位置就只需要预测其中一个类别。这就将部分复杂的声学特征预测问题，转换成了类似 NLP 的 Token 序列预测问题；具体类别数仍由实验设置决定。[\[02\]](#ref-02)、[\[03\]](#ref-03)

S2UT 的架构是先将源语音的声学特征送入编码器，再预测目标语言的离散语音单元，最后通过基于单元的声码器生成波形。[\[03\]](#ref-03)

HuBERT 和 K-Means 在这里主要用于提前将目标语音转换为离散单元，作为训练时的监督标签。

不过，离散语音单元在压缩声学表示的过程中，可能丢失部分细粒度信息。因此，仅通过离散单元生成目标语音，未必能够完整保留源说话人的非语义信息。[\[03\]](#ref-03)、[\[06\]](#ref-06)

## 多语言语音翻译与表达保留 - SeamlessExpressive

SeamlessExpressive 希望在保持语义翻译质量的同时，进一步保留源语音的非语义信息。与 S2UT 主要关注离散语音翻译不同，SeamlessExpressive 将表达保留作为明确的建模目标。[\[06\]](#ref-06)

SeamlessExpressive 基于 SeamlessM4T v2 构建，主要由 **Prosody UnitY2** 和 **PRETSSEL** 两个模块组成。[\[06\]](#ref-06)

首先，Prosody UnitY2 对源语音进行编码，先生成目标语言文本，再生成离散语音单元。这个过程中会引入源语音的表达特征，以保留语速、停顿等短语层面的韵律信息。[\[06\]](#ref-06)

随后，PRETSSEL 结合目标语言的离散语音单元与源语音的表达特征向量，生成相应的目标语言 Mel 频谱，最后通过 HiFi-GAN 声码器转换为语音波形。[\[06\]](#ref-06)

该架构将语言内容转换与副语言信息迁移相结合，改善了目标语音对源说话人声音风格和表达特征的保留能力。[\[06\]](#ref-06)

SeamlessExpressive 的表达保留仍有局限。论文中的部分比较显示，表达保留的改善可能伴随某些语音质量评分下降。语义与副语言信息相互影响，也使细粒度表达特征难以准确提取和迁移。相关能力还受多语言训练数据及表达对齐质量的影响，不能直接推及低资源语言。[\[06\]](#ref-06)

## S2ST 技术路线对比与总结

以上介绍了几个比较经典的模型，下面各用一句话总结它们的主要思路。

- Translatotron（2019）：探索在推理时不经过中间文本，直接利用 Seq2Seq 模型将源语音转换成目标语音。[\[04\]](#ref-04)
- S2UT（2022）：将目标语音表示为离散语音单元，使跨语言语音转换可以采用 Token 序列预测的方法。[\[03\]](#ref-03)
- Holistic Cascade（2023）：在级联式 S2ST 中结合全局与局部韵律迁移，改善表达信息的保留。[\[07\]](#ref-07)
- SeamlessExpressive（2023）：结合韵律感知的语音单元预测与表达条件语音合成，改善跨语言声音风格和韵律保留。[\[06\]](#ref-06)

这四篇论文关注的问题有所不同：Translatotron 和 S2UT 探索如何完成跨语言语音转换，Holistic Cascade 和 SeamlessExpressive 则更关注翻译过程中的表达保留。

# 数据集

## 多语言语音到语音翻译数据集 - CVSS

在 MT 任务中，我们需要源语言文本与对应的目标语言文本；ASR 需要语音与转写文本；TTS 需要文本与对应语音。类似地，在 S2ST 中，我们需要源语音与对应的目标语音，这种数据被称为**平行语音数据**。获取这类数据已经很困难，如果还要求两侧具有相似的音色、情绪等表达特征，就更加困难。CVSS 正是为了缓解多语言平行语音数据不足的问题而提出的。[\[08\]](#ref-08)

CVSS 覆盖 21 种源语言到英语的翻译方向，源语音合计约 1153 小时。它并没有重新人工录制所有目标英语语音，而是利用已有资源构建数据集。[\[08\]](#ref-08)

构建过程涉及三个部分：先有 Common Voice，即真实说话人录制的源语言语音；CoVoST 2 在此基础上提供对应的英语翻译文本；最后用 TTS 将英语翻译文本合成为英语语音。也就是说，CVSS 的源语音是*真实录音*，目标英语语音则是*通过 TTS 合成的*。这样就能较大规模地构建 S2ST 所需的平行语音对，而不需要逐句人工录制译出的英语语音。[\[08\]](#ref-08)、[\[09\]](#ref-09)

CVSS 提供两个版本。CVSS-C 的目标语音统一使用一个标准说话人的音色，可以降低目标语音的声学差异，使模型更容易集中学习语言翻译与语音生成。CVSS-T 则尝试将源说话人的音色迁移到目标英语语音中，使模型能够接触跨语言说话人音色的对应关系。[\[08\]](#ref-08)

CVSS 的优势是提供了较大规模的训练数据，缓解了 S2ST 平行数据稀缺的问题。但目标语音由合成系统生成，不能完整反映自然说话人在跨语言交流中的表达方式，也不能将音色迁移直接理解为情绪和韵律都已对齐。

## 跨语言表达保留数据集 - mExpresso 与 mDRAL

CVSS 缓解了 S2ST 平行语音数据不足的问题。但如果希望翻译后的声音保留原说话人的情绪、语调、停顿和表达风格，仅有语义对应的语音数据还不够。**mExpresso** 和 **mDRAL** 就是为研究跨语言*表达保留*而构建的两组数据。[\[06\]](#ref-06)

**mExpresso** 是原始英语表达语音数据集 Expresso 的多语言扩展。录音人员在朗读翻译文本时，也可以听原始英语录音，以尽量保留原来的情绪与表达方式。独立的双语审核人员会检查表达保留和录音质量，不符合要求的录音需要重新录制。它的优势是表达风格明确，跨语言内容与风格有较好的对应关系，适合测试模型能否保留指定情绪、强调方式和说话风格。局限在于它主要采用有脚本的朗读与表演式表达，可能比较夸张，不能完全代表真实交流中的自然表达。[\[06\]](#ref-06)

**mDRAL** 在早期 DRAL 数据收集方法的基础上，扩展到英语与普通话、法语、德语、意大利语、西班牙语之间的对话语音。尽管 mExpresso 已经包含开心、悲伤、困惑等风格，但真实交流中的情绪往往与上下文、交流对象和情境有关，很难完全通过指定情绪标签的朗读还原。因此，mDRAL 希望获得更自然的对话韵律和情绪表达。其流程是先由说话人自由交谈，再由原说话人以另一种语言重演选定片段，得到跨语言语音对。它的优势是表达更自然，源语音和目标语音来自同一说话人，可以更有针对性地测试跨语言音色和表达一致性。局限是采集成本较高，需要双语说话人、主持人以及重演和质量控制流程，因此规模相对有限。[\[06\]](#ref-06)

## 总结

前面几组数据的区别，主要在于目标语音如何获得，以及构建时是否专门考虑表达保留。

在基础语音翻译方面，CoVoST 2 和 MuST-C 主要提供源语音与目标语言文本，为语音到文本翻译提供训练资源，并不是直接提供两侧语音的 S2ST 数据集。[\[09\]](#ref-09)、[\[12\]](#ref-12) CVSS 进一步利用 TTS 合成目标语音，构建平行语音数据，并通过 CVSS-T 探索跨语言音色迁移。[\[08\]](#ref-08) SpeechMatrix 则从欧洲议会的真实多语言录音中自动挖掘平行语音对，为扩大 S2ST 训练数据规模提供了另一种思路。[\[11\]](#ref-11)

随着研究目标从语义准确性扩展到副语言信息保留，mExpresso 和 mDRAL 分别通过受控表达式朗读和自然对话重演，构建包含情绪、韵律及说话风格的跨语言语音数据。[\[06\]](#ref-06) STEB 则提出面向中英语音翻译的多维评价基准，将评价范围扩展到情绪、场景风格和非语言发声等方面。[\[10\]](#ref-10)

这些数据集仍有共同的不足：高质量自然平行语音较少，跨语言表达难以对齐，情绪与韵律标注也不充分。部分数据集还依赖合成语音，难以完整反映真实交流中的表达特征。

因此，对于以语义准确性和副语言信息保留为目标的 S2ST 研究，需要结合不同类型的数据资源，并建立能够同时衡量翻译质量、语音自然度及表达一致性的多维评价体系。

# 评价

S2ST 评价不能简单依赖一个总分，而应先拆分成不同维度。只从一个方面评价，难以完整反映系统质量。比如，可以分别考察语义准确性、语音质量与自然度、说话人身份与音色保留、韵律与表达保留；评价方法也可以分为自动评价与人工评价。[\[10\]](#ref-10)、[\[13\]](#ref-13)、[\[14\]](#ref-14)

## 语义准确性评价

先讨论第一个问题：如何判断翻译后的语音是否准确传递了源语言的意思？

### BLEU：通过文本匹配评价翻译质量

BLEU 是机器翻译领域经典的自动评价指标。它将模型生成的翻译与参考翻译进行比较，统计不同长度词组（n-gram）的匹配情况，并结合长度惩罚计算分数。匹配越充分，通常 BLEU 越高；如果模型省略了大量内容，即使剩余词语匹配，也会受到长度惩罚。[\[15\]](#ref-15)

不过，BLEU 本身只能处理文本，不能直接评价语音波形。在 S2ST 中，通常先用 ASR 将生成语音转写成文本，再与目标语言参考文本计算 BLEU，这就是 ASR-BLEU。[\[03\]](#ref-03)、[\[14\]](#ref-14)

由于 BLEU 更关注词组匹配，语义相近但措辞不同的译文也可能得到较低分数。ASR-BLEU 还受到语音识别错误的影响，因此比较系统时，需要统一 ASR、文本规范化和评分设置。[\[14\]](#ref-14)

### COMET：通过神经网络评价语义质量

为了解决传统词组匹配指标的局限，COMET 利用跨语言预训练模型及人工质量评分，学习预测翻译质量。原始的有参考模型会结合源文本、候选译文和参考译文进行评价。用于 S2ST 时，通常仍需将生成语音转写为文本，因此要记录文本的获取方式以及 COMET 的具体版本。[\[16\]](#ref-16)

### BLASER：直接评价语音翻译质量

BLASER（ACL 2023）针对 S2ST 提出了另一条思路：利用语音表征评价翻译质量，减少对 ASR 转写的依赖。[\[14\]](#ref-14)

它通过跨语言、多模态编码器，将源语音、生成语音与参考语音映射到共享表征空间，再据此计算或预测翻译质量。其中，监督版本利用人工评分训练评价模型。这里的“无需文本”不等于“无需参考语音”，也不意味着它能同时判断音色、自然度和情绪保留。[\[14\]](#ref-14)

BLASER 2.0 进一步支持多语言语音与文本输入，并提供有参考评价和无参考质量估计两个版本。实际使用时，需要区分具体版本及其输入条件。[\[17\]](#ref-17)

## 语音质量与自然度评价

我们也需要评价生成语音本身的听觉质量，包括语音质量与自然度。

语音质量关注声音是否清晰，是否存在失真、杂音等问题；自然度则更关注合成语音是否像真人说话，以及发音、节奏和语调是否自然。

### MOS：让人直接评价语音质量

MOS（Mean Opinion Score，平均意见分）是一种主观评价方法：让多个听众聆听语音并打分，最后取平均值。ITU-T P.800 提供了通信语音主观质量评价的方法参考；评价合成语音自然度时，还需要明确听测问题、评分尺度和样本条件，不能把不同听测中的 MOS 直接比较。[\[S01\]](#ref-S01)

MOS 的优势是能够直接获得人类听众的感知判断。不过，听测需要招募听众，且不同听众的判断可能存在差异，因此也有成本和一致性方面的局限。

### UTMOS：利用神经网络预测 MOS

UTMOS（2022）是东京大学团队在 VoiceMOS Challenge 2022 中提出的自动 MOS 预测系统。它的目标是输入一段语音，预测人类听众可能给出的 MOS 分数。该系统利用自监督语音特征和带有人工评分的数据，结合多个强、弱学习器预测质量。[\[18\]](#ref-18) 自动预测值不能替代当前实验中的人工听测，跨语言或跨领域使用时也需要验证其适用性。[\[13\]](#ref-13)

### NISQA：不仅预测质量，还分析失真

原始 NISQA 主要面向通信语音质量评价，关注音频传输中出现的失真问题。它使用 CNN 和 Self-Attention 提取特征，预测整体感知质量，以及噪声感、音色失真（Coloration）、不连续性和响度四个维度。[\[19\]](#ref-19) 用于合成语音时，需要说明具体模型和适用条件，不能将这些分数直接等同于自然度或表达保留。

## 副语言信息保留评价

接下来讨论一个更贴近研究目标的问题：如何判断翻译后的语音是否保留了源说话人的音色、韵律、情绪和表达风格？

### 说话人身份与音色保留

前面提到过 Speaker Embedding。我们可以从语音中提取说话人特征向量，再计算源语音与生成语音向量之间的余弦相似度，衡量它们的接近程度。一般来说，相似度越高，表示编码器认为两段语音的说话人特征越接近。[\[06\]](#ref-06)

不过，说话人相似度高，并不意味着音色的所有细节都得到保留。不同语言的发音结构也可能影响相似度的可靠性，因此通常还需要加入人工听音比较。

### 韵律保留评价

韵律（Prosody）包含音高、语速、停顿、时长和节奏等多个方面。与说话人身份相比，韵律具有更明显的时间变化特征。

**F0（基频）**是描述音高变化的重要声学特征。一种分析方法是提取源语音与目标语音的 F0 曲线，经过适当归一化和时间对齐后，比较变化趋势。[\[07\]](#ref-07) 不过，不同语言对音高的使用方式不同，比如中文属于声调语言，而英语的音高更多承担语调等功能。因此，跨语言韵律评价不应简单要求两条 F0 曲线完全一致。

语速可以用单位时间内说出的音节数量衡量；停顿则关注目标语音是否在适当位置保留了源语音的停顿。[\[06\]](#ref-06)

在 SeamlessExpressive 的评价中，AutoPCP 利用神经网络预测人工韵律一致性评分；Rate 则统计源语音与生成语音的音节语速在样本集合上的 Spearman 相关性。后者是集合层面的相关性，不能当作单条语音的评分。[\[06\]](#ref-06)

### 情绪与表达风格评价

一种方法是使用语音情绪识别（Speech Emotion Recognition，SER）模型，比较源语音与生成语音的情绪预测结果。不过，情绪很难通过几个标签完整描述。

另一种方法是结合音频理解模型与大语言模型（LLM）进行评价。STEB 使用音频理解模型生成描述，再提炼情绪、场景风格等信息，最后由 LLM Judge 判断源语音与生成语音的表达一致性。它还关注笑声、哭声、喘息等非语言发声是否得到保留。[\[10\]](#ref-10) 这类评分也可能受到音频描述错误和判断模型偏差的影响，需要结合人工评价验证。

## 多维评价框架

### IWSLT：实际评测任务如何评价语音翻译

IWSLT 长期组织语音翻译相关的 Shared Tasks（共享任务），让不同团队在统一数据、规则与指标下比较系统表现。2026 年的任务包括语音到文本翻译、S2ST、跨语言声音克隆和翻译质量估计等。[\[20\]](#ref-20)

不同任务的指标并不完全相同。以 2026 年的几个代表性任务为例：[\[20\]](#ref-20)

| 评测任务 | 主要指标或评价方法 | 评价重点 |
| --- | --- | --- |
| Indic S2S | sacreBLEU、TER、BLASER | 翻译准确性 |
| African & Celtic S2S | ASR 转写后计算 CER | 生成语音的内容正确性 |
| Cross-Lingual Voice Cloning | 内容一致性、说话人相似度、语音质量 | 跨语言音色与声音生成 |
| Speech Translation Metrics | 与人工评分的相关性等元评价 | 自动评价方法本身的可靠性 |

其中，跨语言声音克隆任务提供目标语言文本，主要考察语音生成与说话人保留，不能直接当作完整的 S2ST 翻译任务。[\[20\]](#ref-20)

Speech Translation Metrics 任务关注无参考翻译质量估计及自动指标的可靠性。评价模型可以利用源语音、源语音转写文本和系统生成的目标文本，在不依赖人工参考译文的情况下预测翻译质量，再通过与人工评分的相关性分析检验效果。[\[20\]](#ref-20) 这一思路也可以用于 S2ST：除了计算语义、音色和韵律等指标，还需要抽取样本进行人工评价，检查这些指标是否符合实际听感。

### COMPASS：建立完整、统一的评价指标体系

COMPASS 关注的是另一个问题：S2ST 有这么多质量维度，如何将不同指标组织成一套统一且有效的评价体系？[\[13\]](#ref-13)

论文面向离线 S2ST 整合了 8 个维度、46 项指标，涉及翻译质量、自然度、说话人保留、韵律及时间同步等内容。通过分析指标间的相关性，作者将其筛选为每个翻译方向约 10 项代表性指标，在原文实验中保持了较一致的模型排序，同时降低了评价成本。这组精简指标与实验语向、数据领域有关，不能直接作为所有场景下的固定配置。[\[13\]](#ref-13)

它说明，多维评价除了覆盖不同方面，还需要考虑指标之间的互补性、可靠性和计算成本。

### STEB：重点解决表达信息保留的评价

STEB 更聚焦中英语音翻译中的表达保留。它评价六个维度：三个常规维度是翻译准确性、说话人相似度和时长对齐，另外三个表达维度是情绪、场景风格和非语言发声。[\[10\]](#ref-10)

它采用 Caption-then-Summarize 和 LLM Judge，将源语音与生成语音转换成结构化表达描述，再比较两者，在不需要标准目标语音参考的情况下评价表达一致性。这里的“无参考”主要指无需目标参考语音，评价仍然需要源语音。[\[10\]](#ref-10)

# 参考文献

以下保留文献索引中的 \[01\]-\[20\] 编号；\[S01\] 为技术标准，\[S02\]-\[S04\] 为补充原始论文。同一文献在正文中沿用同一编号。原始论文链接及已核验的 DOI 列于各条目后。

<a id="ref-01"></a>

\[01\] Mohammad Sarim, Saim Shakeel, Laeeba Javed, Jamaluddin, Mohammad Nadeem. **Direct Speech to Speech Translation: A Review**. arXiv 预印本，2025，arXiv:2503.04799. [原文](https://arxiv.org/abs/2503.04799). DOI: 10.48550/arXiv.2503.04799.
<a id="ref-02"></a>

\[02\] Wei-Ning Hsu, Benjamin Bolte, Yao-Hung Hubert Tsai, Kushal Lakhotia, Ruslan Salakhutdinov, Abdelrahman Mohamed. **HuBERT: Self-Supervised Speech Representation Learning by Masked Prediction of Hidden Units**. arXiv 预印本，2021，arXiv:2106.07447. [所引版本](https://arxiv.org/abs/2106.07447). DOI: 10.48550/arXiv.2106.07447.
<a id="ref-03"></a>

\[03\] Ann Lee, Peng-Jen Chen, Changhan Wang, et al. **Direct Speech-to-Speech Translation With Discrete Units**. Proceedings of the 60th Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)，2022: 3327-3339. [正式论文](https://aclanthology.org/2022.acl-long.235/). DOI: 10.18653/v1/2022.acl-long.235.
<a id="ref-04"></a>

\[04\] Ye Jia, Ron J. Weiss, Fadi Biadsy, et al. **Direct Speech-to-Speech Translation with a Sequence-to-Sequence Model**. Interspeech 2019，2019: 1123-1127. [正式论文](https://www.isca-archive.org/interspeech_2019/jia19_interspeech.html). DOI: 10.21437/Interspeech.2019-1951.
<a id="ref-05"></a>

\[05\] Sayanton Dibbo, Sudip Vhaduri, Chia-Hua Lin. **Challenges and opportunities of generative artificial intelligence models in audio/acoustic domain: a comprehensive survey**. Artificial Intelligence Review，2026，在线先行发表版本. [出版社页面](https://link.springer.com/article/10.1007/s10462-026-11670-y). DOI: 10.1007/s10462-026-11670-y.
<a id="ref-06"></a>

\[06\] Seamless Communication, et al. **Seamless: Multilingual Expressive and Streaming Speech Translation**. arXiv 技术报告，2023，arXiv:2312.05187. [原文](https://arxiv.org/abs/2312.05187). DOI: 10.48550/arXiv.2312.05187.
<a id="ref-07"></a>

\[07\] Wen-Chin Huang, Benjamin Peloquin, Justine Kao, et al. **A Holistic Cascade System, benchmark, and Human Evaluation Protocol for Expressive Speech-to-Speech Translation**. arXiv 预印本，2023，arXiv:2301.10606. [所引完整版本](https://arxiv.org/abs/2301.10606). DOI: 10.48550/arXiv.2301.10606.
<a id="ref-08"></a>

\[08\] Ye Jia, Michelle Tadmor Ramanovich, Quan Wang, Heiga Zen. **CVSS Corpus and Massively Multilingual Speech-to-Speech Translation**. Proceedings of the Thirteenth Language Resources and Evaluation Conference，2022: 6691-6703. [正式论文](https://aclanthology.org/2022.lrec-1.720/).
<a id="ref-09"></a>

\[09\] Changhan Wang, Anne Wu, Jiatao Gu, Juan Pino. **CoVoST 2 and Massively Multilingual Speech Translation**. Interspeech 2021，2021: 2247-2251. [正式论文](https://www.isca-archive.org/interspeech_2021/wang21s_interspeech.html). DOI: 10.21437/Interspeech.2021-2027. [早期预印本](https://arxiv.org/abs/2007.10310).
<a id="ref-10"></a>

\[10\] Sitong Cheng, Weizhen Bian, Songjun Cao, et al. **STEB: A Speech-to-Speech Translation Expressiveness Benchmark for Evaluating Beyond Translation Fidelity**. arXiv 预印本，2026，arXiv:2606.25529. [原文](https://arxiv.org/abs/2606.25529). DOI: 10.48550/arXiv.2606.25529.
<a id="ref-11"></a>

\[11\] Paul-Ambroise Duquenne, Hongyu Gong, Ning Dong, et al. **SpeechMatrix: A Large-Scale Mined Corpus of Multilingual Speech-to-Speech Translations**. Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)，2023: 16251-16269. [正式论文](https://aclanthology.org/2023.acl-long.899/). DOI: 10.18653/v1/2023.acl-long.899.
<a id="ref-12"></a>

\[12\] Mattia A. Di Gangi, Roldano Cattoni, Luisa Bentivogli, Matteo Negri, Marco Turchi. **MuST-C: a Multilingual Speech Translation Corpus**. Proceedings of the 2019 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies, Volume 1 (Long and Short Papers)，2019: 2012-2017. [正式论文](https://aclanthology.org/N19-1202/). DOI: 10.18653/v1/N19-1202.
<a id="ref-13"></a>

\[13\] Alkis Koudounas, Hayato Futami, Quentin Jodelet, Osamu Take, Shinji Watanabe, Emiru Tsunoo. **Benchmarking Speech-to-Speech Translation Models**. Findings of the Association for Computational Linguistics: EMNLP 2026，2026: 46973-47008. [正式论文](https://aclanthology.org/2026.findings-emnlp.2194/). DOI: 10.18653/2026.findings-emnlp.2194.
<a id="ref-14"></a>

\[14\] Mingda Chen, Paul-Ambroise Duquenne, Pierre Andrews, et al. **BLASER: A Text-Free Speech-to-Speech Translation Evaluation Metric**. Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)，2023: 9064-9079. [正式论文](https://aclanthology.org/2023.acl-long.504/). DOI: 10.18653/v1/2023.acl-long.504.
<a id="ref-15"></a>

\[15\] Kishore Papineni, Salim Roukos, Todd Ward, Wei-Jing Zhu. **Bleu: a Method for Automatic Evaluation of Machine Translation**. Proceedings of the 40th Annual Meeting of the Association for Computational Linguistics，2002: 311-318. [正式论文](https://aclanthology.org/P02-1040/). DOI: 10.3115/1073083.1073135.
<a id="ref-16"></a>

\[16\] Ricardo Rei, Craig Stewart, Ana C Farinha, Alon Lavie. **COMET: A Neural Framework for MT Evaluation**. Proceedings of the 2020 Conference on Empirical Methods in Natural Language Processing (EMNLP)，2020: 2685-2702. [正式论文](https://aclanthology.org/2020.emnlp-main.213/). DOI: 10.18653/v1/2020.emnlp-main.213.
<a id="ref-17"></a>

\[17\] David Dale, Marta R. Costa-jussà. **BLASER 2.0: a metric for evaluation and quality estimation of massively multilingual speech and text translation**. Findings of the Association for Computational Linguistics: EMNLP 2024，2024: 16075-16085. [正式论文](https://aclanthology.org/2024.findings-emnlp.943/). DOI: 10.18653/v1/2024.findings-emnlp.943.
<a id="ref-18"></a>

\[18\] Takaaki Saeki, Detai Xin, Wataru Nakata, et al. **UTMOS: UTokyo-SaruLab System for VoiceMOS Challenge 2022**. Interspeech 2022，2022: 4521-4525. [正式论文](https://www.isca-archive.org/interspeech_2022/saeki22c_interspeech.html). DOI: 10.21437/Interspeech.2022-439.
<a id="ref-19"></a>

\[19\] Gabriel Mittag, Babak Naderi, Assmaa Chehadi, Sebastian Möller. **NISQA: A Deep CNN-Self-Attention Model for Multidimensional Speech Quality Prediction with Crowdsourced Datasets**. Interspeech 2021，2021: 2127-2131. [正式论文](https://www.isca-archive.org/interspeech_2021/mittag21_interspeech.html). DOI: 10.21437/Interspeech.2021-299.
<a id="ref-20"></a>

\[20\] David Ifeoluwa Adelani, Victor Agostinelli, Antonios Anastasopoulos, et al. **Speech Translation and Metrics in 2026: Findings of the IWSLT Campaign**. Proceedings of the 23rd International Conference on Spoken Language Translation (IWSLT 2026)，2026: 336-422. [正式论文](https://aclanthology.org/2026.iwslt-1.39/). DOI: 10.18653/v1/2026.iwslt-1.39.
<a id="ref-S01"></a>

\[S01\] ITU-T. **P.800: Methods for subjective determination of transmission quality**. 技术标准，1996（08/96 版）. [标准页面](https://www.itu.int/rec/T-REC-P.800/en).
<a id="ref-S02"></a>

\[S02\] Alexei Baevski, Yuhao Zhou, Abdelrahman Mohamed, Michael Auli. **wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations**. Advances in Neural Information Processing Systems 33（NeurIPS 2020），2020. [正式论文](https://proceedings.neurips.cc/paper_files/paper/2020/hash/92d1e1eb1cd6f9fba3227870bb6d7f07-Abstract.html).
<a id="ref-S03"></a>

\[S03\] Chengyi Wang, Sanyuan Chen, Yu Wu, et al. **Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers**. arXiv 预印本，2023，arXiv:2301.02111. [所引 VALL-E 原始版本](https://arxiv.org/abs/2301.02111). DOI: 10.48550/arXiv.2301.02111.
<a id="ref-S04"></a>

\[S04\] S. B. Davis, P. Mermelstein. **Comparison of Parametric Representations for Monosyllabic Word Recognition in Continuously Spoken Sentences**. IEEE Transactions on Acoustics, Speech, and Signal Processing，1980，28(4): 357-366. [论文原文（高校存档）](https://courses.physics.illinois.edu/ece417/fa2017/davis80.pdf).

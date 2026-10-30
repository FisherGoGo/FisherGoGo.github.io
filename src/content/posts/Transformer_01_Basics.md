---
title: "Transformer 01：基础知识"
published: 2026-10-30
description: "从序列到序列任务出发，梳理 Token、词表、Embedding、向量相似度、Softmax 与位置编码。"
tags: ["深度学习", "Transformer"]
category: "深度学习"
draft: false
comment: true
lang: "zh_CN"
---

# Transformer 要解决什么

先从机器翻译这个任务出发：给定一种语言的句子，生成另一种语言中含义相近的句子。对计算机来说，这里有几个问题：怎样把原文输入神经网络，怎样利用上下文理解词义，以及怎样处理两种语言的语序差异。

## 序列与 Seq2Seq

**序列**是按一定顺序排列的一组元素，通常写成

$$
X=(x_1,x_2,x_3,\ldots,x_n).
$$

序列不一定是文字，也可以是语音帧、时间序列中的观测值等。

**Seq2Seq**，也就是“序列到序列”，指输入一个长度为 $n$ 的序列，生成一个长度为 $m$ 的序列：

$$
(x_1,x_2,\ldots,x_n)\longrightarrow(y_1,y_2,\ldots,y_m).
$$

输入和输出的长度可以不同，元素之间也不必一一对应。机器翻译就是一个典型例子。

## 为什么机器翻译困难

- **词义依赖上下文。** 同一个词在不同语境下可能有不同含义，模型需要建立不同位置之间的联系。
- **有些联系相隔很远。** 例如 `The book that I bought yesterday from a small shop near the station is interesting.` 中，主语 `book` 和谓语 `is interesting` 之间隔了很长一段修饰语。
- **不同语言的语序不同。** 翻译时往往需要重新组织表达，逐词替换并不足够。

这些问题都要求模型利用上下文，而不能孤立地处理每一个词。

## 从 RNN 到 Transformer

在 Transformer 之前，RNN 是序列建模的常用方法之一。以单向 RNN 为例，它从左到右逐个读取 Token，把已有信息保存在隐藏状态中，再结合新输入更新状态：

$$
h_t=f(h_{t-1},x_t).
$$

这样做有两个局限。首先，计算当前状态要依赖前一个状态，同一条序列的时间步难以完全并行计算。其次，远处的信息需要经过多次状态更新才能传到当前位置，学习长距离依赖比较困难，反向传播时也可能遇到梯度消失或爆炸。LSTM 等结构可以缓解其中一些问题，但仍保留了按时间步递推的依赖。

Transformer 用 **Self-Attention（自注意力）**在序列位置之间交换信息，使一个位置能够直接读取允许关注的其他位置的信息，不必让信息沿 RNN 的隐藏状态逐步传递。原始 Transformer 不使用循环结构或卷积结构，但仍包含前馈网络等模块。

这里的“更容易并行”需要区分训练与生成：给定完整输入时，编码器可以并行处理各个位置；训练解码器时，也可以在因果掩码约束下并行计算各个目标位置。自回归推理仍要根据已生成的前缀逐步生成后续 Token。完整自注意力还要处理位置之间的两两交互，序列变长时，计算代价会明显增加。

## Encoder 与 Decoder 的分工

原始 Transformer 采用 **Encoder-Decoder（编码器-解码器）**架构。

Encoder 负责把输入序列转换为一组上下文表示。例如，在把 `I love you` 简化为 3 个 Token 的教学例子中，编码器会为这 3 个位置分别输出一个向量。每个向量既保留当前位置的信息，也融入了从其他位置读取的信息。实际 Token 数量取决于分词器，标点也可能单独占据位置。

Decoder 根据编码器的输出和已有的目标语言前缀，预测下一个 Token。推理时，再把选出的 Token 接到前缀后面，继续生成，直到输出结束符或达到长度上限。这个过程叫作**自回归生成**。训练时通常提供右移后的真实目标序列，并用因果掩码防止当前位置读取未来的目标内容。

## Attention 的直觉

先看一句话：

> The animal didn't cross the street because it was too tired.

理解 `it` 时，我们需要结合上下文，判断它更可能指代 `animal`。Attention 的直观作用，就是在处理某个位置时，根据当前表示计算各个候选位置的权重，再汇总这些位置的信息。

Self-Attention 的信息来自同一个序列；解码器读取编码器输出时使用的则是跨序列的 Attention。这里先建立直觉，具体的 Q、K、V 和计算公式留到后面再推导。[原论文第 3 节](https://arxiv.org/html/1706.03762v7#S3)给出了这两类注意力在模型中的分工。

# Token、Token ID 和词表

接下来主要看：文字怎样变成神经网络能够处理的数字和张量。

## 什么是 Token

对于中文句子 `我昨天买了书`，第一步是 **Tokenization（标记化，常简称分词）**。它可能被切成

```text
我 / 昨 / 天 / 买 / 了 / 书
```

也可能被切成

```text
我 / 昨天 / 买 / 了 / 书
```

前者有 6 个 Token，后者有 5 个。Token 不一定是一个汉字，也不一定是一个完整的词，具体取决于 Tokenizer（分词器）的规则。英文也是如此：`playing` 可能是一个 Token，也可能被拆成类似 `play` 和 `ing` 的片段。这里的切分都只是示意。

为什么不把每个完整单词都单独收进词表？一方面，词形变化、复合词等会使词表变得很大；另一方面，实际输入还可能出现训练时没见过的词。使用较小的子词单位，可以用已有片段组合表示更多词。

## BPE：从语料中学习合并规则

**BPE（Byte Pair Encoding）**的基本思路是：从较小的符号单位开始，每轮统计当前语料中相邻符号对的频次，合并最频繁的一对，再重复这个过程，直到达到预设的合并次数或词表规模。

例如，假设从字符开始，且统计结果依次支持这些合并，`play` 可能经历

```text
p l a y → pl a y → pl ay → play
```

如果已经存在 `play` 和 `ing` 两个符号，而且它们组成的相邻符号对被选中，才会进一步合并为 `playing`。不能仅凭“这个词出现得多”，就断定它一定是单个 Token。

经典 BPE 的合并规则通常在训练分词器时根据语料统计得到；之后使用分词器时，按已学到的规则切分文本。这个过程与神经网络通过反向传播学习参数是两回事。[BPE 子词论文](https://aclanthology.org/P16-1162/)介绍了这种方法在机器翻译中的用法。

## Vocabulary：Token 怎样变成整数

分词后得到的是一串 Token。为了把它们转换为整数，我们需要 **Vocabulary（词表）**，可以把它理解为从 Token 到整数编号的映射：

$$
\text{Token}\longmapsto\text{Token ID}.
$$

下面是一个人为构造的教学词表片段，编号只用于演示：

| Token | Token ID |
| --- | --- |
| `<PAD>` | 0 |
| `<BOS>` | 1 |
| `<EOS>` | 2 |
| `<UNK>` | 3 |
| 我 | 10 |
| 昨天 | 11 |
| 买 | 12 |
| 了 | 13 |
| 书 | 14 |
| I | 20 |
| am | 21 |
| play | 22 |
| ing | 23 |
| football | 24 |
| today | 25 |
| . | 26 |

那么，`我昨天买了书` 先被切成 `我 / 昨天 / 买 / 了 / 书`，再映射为

```text
[10, 11, 12, 13, 14]
```

Token ID 只是离散的索引。编号接近，不代表语义接近。

## 特殊 Token：BOS、EOS、PAD、UNK

普通 Token 表示文本内容，特殊 Token 则用于标记序列边界、填充等信息。

| 特殊 Token | 含义 | 典型用途 |
| --- | --- | --- |
| BOS | 开始 | 标识序列起点、初始化生成 |
| EOS | 结束 | 标识序列终点、停止生成 |
| PAD | 填充 | 将同一批次中的序列补齐到统一长度 |
| UNK | 未知 | 表示分词器无法覆盖的内容 |

这些是常见约定，具体模型不一定同时使用全部符号，也不一定采用这些名称。某些能覆盖任意字节输入的分词器可以不依赖 UNK。

## 从单句到 Batch：形状与 Padding Mask

`[10, 11, 12, 13, 14]` 是一个**一阶张量，也就是长度为 5 的向量**：

$$
X\in\mathbb{Z}^{5},\qquad X.\mathrm{shape}=[5].
$$

它有 5 个元素，不能因此称为“五阶张量”。向量空间的维数与张量的阶数需要区分。

假设在本例中添加 BOS 和 EOS，得到

```text
[1, 10, 11, 12, 13, 14, 2]
```

再加上 Batch 维度，即使只有一个样本，形状也会变为 `[1, 7]`。如果一批句子长度不同，可以使用 PAD 补齐：

$$
X=
\begin{bmatrix}
1&10&11&12&13&14&2\\
1&10&12&14&2&0&0
\end{bmatrix}.
$$

这里有 $B=2$ 个样本，补齐后长度 $T=7$，因此 $X.\mathrm{shape}=[B,T]=[2,7]$。

PAD 只用于凑齐形状，不应被当作真实文本内容。为此，还需要记录哪些位置有效。这里约定 **1 表示有效位置，0 表示 PAD**：

$$
M=
\begin{bmatrix}
1&1&1&1&1&1&1\\
1&1&1&1&1&0&0
\end{bmatrix}.
$$

这只是本文的掩码约定，不同接口的含义可能相反。例如，[PyTorch `MultiheadAttention` 的布尔 `key_padding_mask`](https://docs.pytorch.org/docs/stable/generated/torch.nn.MultiheadAttention.html)中，`True` 表示该位置需要被忽略，不能直接照搬上面的 0/1 含义。

Padding Mask 用于屏蔽填充位置；因果掩码用于阻止读取未来位置，两者解决的是不同问题。计算序列损失时，通常还需要单独忽略 PAD 对应的目标位置。

# Embedding：如何把 Token 变成向量

Token ID 可以作为查表输入，但不能把编号大小直接当作词义大小。**Embedding（嵌入）**为每个 Token 分配一个可学习的向量，让模型使用连续向量表示这些离散符号。

## 手算一次查表

下面另设一个独立的教学词表，不沿用上一节的编号。假设词表大小 $N_{\mathrm{vocab}}=6$，每个 Token 用 4 个数表示，那么嵌入矩阵为

$$
E\in\mathbb{R}^{6\times4}.
$$

为了便于手算，先人为给出矩阵中的数值：

| Token ID 与 Token | 分量 1 | 分量 2 | 分量 3 | 分量 4 |
| --- | --- | --- | --- | --- |
| 0：`<PAD>` | 0.0 | 0.0 | 0.0 | 0.0 |
| 1：我 | 0.2 | 0.1 | -0.3 | 0.5 |
| 2：喜欢 | 0.6 | -0.2 | 0.4 | 0.1 |
| 3：学习 | -0.1 | 0.7 | 0.2 | 0.3 |
| 4：你 | 0.3 | 0.4 | -0.5 | 0.2 |
| 5：`<EOS>` | 0.1 | 0.0 | 0.1 | -0.1 |

对于 `我 / 喜欢 / 你 / <EOS>`，Token ID 序列为 `[1, 2, 4, 5]`。依次取出对应的行，得到

$$
X_{\mathrm{emb}}=
\begin{bmatrix}
0.2&0.1&-0.3&0.5\\
0.6&-0.2&0.4&0.1\\
0.3&0.4&-0.5&0.2\\
0.1&0&0.1&-0.1
\end{bmatrix}.
$$

查表也可以写成独热向量与矩阵相乘。例如，ID 为 2 的 Token 对应

$$
o_2=[0,0,1,0,0,0],\qquad o_2E=E_{2,:}.
$$

这里采用从 0 开始的索引，因此取到的是**索引为 2 的行，也就是表中的第 3 行**，对应“喜欢”。实际实现通常直接查表，无须显式构造独热向量。

## 形状怎样变化

对于形状为 `[B, T]` 的 Token ID 张量，每个位置查出一个长度为 $d_{\mathrm{model}}$ 的向量后，输出形状变成

$$
[B,T]\longrightarrow[B,T,d_{\mathrm{model}}].
$$

$B$ 是批次大小，$T$ 是序列长度，$d_{\mathrm{model}}$ 是每个位置的表示维度。原始 Transformer Base 使用 $d_{\mathrm{model}}=512$。

上面的数值只是手算示例。实际训练时，Embedding 参数通常先随机初始化，再通过反向传播更新，也可以加载预训练参数。[PyTorch `Embedding` 文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.Embedding.html)给出了这种查表层的输入输出形状。

同一个 Token ID 在同一个嵌入表中查出的向量相同；结合位置编码、经过编码器等模块后，同一个 Token 在不同语境中的表示就可能不同。需要区分**查表得到的 Token Embedding**和**融入上下文后的表示**。

# 相似度、点积与 Softmax

有了一组向量，接下来要看怎样计算匹配分数，以及怎样根据这些分数汇总信息。

## 点积

对于两个 $d$ 维向量，点积为

$$
\mathbf a\cdot\mathbf b=\sum_{i=1}^{d}a_ib_i.
$$

结果是一个标量。对于非零向量，还可以写成

$$
\mathbf a\cdot\mathbf b=\lVert\mathbf a\rVert\,\lVert\mathbf b\rVert\cos\theta.
$$

所以点积既与方向有关，也与向量长度有关。它可以用作匹配分数，但点积较大并不天然等于“两个词的语义更相似”，还要看这些向量怎样得到、模型怎样训练。

## 余弦相似度

对于两个非零向量，余弦相似度为

$$
\operatorname{sim}(\mathbf a,\mathbf b)=
\frac{\mathbf a\cdot\mathbf b}{\lVert\mathbf a\rVert\,\lVert\mathbf b\rVert}.
$$

它衡量方向关系，消除了向量长度的影响。也可以先把两个向量分别除以自身的长度，归一化为单位向量，再计算点积。零向量不能直接代入这个公式。

## Softmax

**Softmax** 可以把一组实数分数转换为和为 1 的权重。对于分数向量 $\mathbf s$，第 $i$ 个分量为

$$
\operatorname{softmax}(\mathbf s)_i=
\frac{e^{s_i}}{\sum_j e^{s_j}}.
$$

输入分数有限时，每个权重都大于 0，所有权重的和为 1。例如，

$$
\operatorname{softmax}([2,1,0])\approx[0.6652,0.2447,0.0900].
$$

如果先把分数扩大 10 倍，输入变为 `[20, 10, 0]`，Softmax 的输出就会更集中在第一个位置。虽然分数排序没变，但它们之间的差距变大了。

引入温度参数 $\tau>0$ 后，可以写成

$$
\operatorname{softmax}(\mathbf s/\tau)_i=
\frac{e^{s_i/\tau}}{\sum_j e^{s_j/\tau}}.
$$

相对于 $\tau=1$，当 $0<\tau<1$ 时，分数差异被放大，权重更集中；当 $\tau>1$ 时，分数差异被缩小，权重更平缓。若所有分数相同，改变温度仍会得到均匀分布。[PyTorch `Softmax` 文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.Softmax.html)也强调了归一化所沿的维度。

## 加权求和

假设有三个待汇总的向量 $v_1,v_2,v_3$，权重分别为 $\alpha_1,\alpha_2,\alpha_3$，那么输出为

$$
z=\alpha_1v_1+\alpha_2v_2+\alpha_3v_3.
$$

Attention 会针对当前查询位置计算一组权重，因此每个查询位置都能得到自己的汇总向量。在 Self-Attention 中，通常仍然输出一个向量序列，并不会自动把整句话压缩成一个向量。若要得到单个句向量，还需要明确采用池化或其他汇总方式。

# 序列顺序与位置编码

模型还需要知道 Token 的位置。即使词语相同，顺序不同也可能改变含义，例如“我喜欢你”和“你喜欢我”。

如果没有位置信息或其他与顺序有关的约束，纯 Self-Attention 无法自行获得先后顺序：对输入位置做同样的重排，输出也会相应重排，而不会凭空知道哪个 Token 原本排在前面。这称为**置换等变性**，不能简单理解为“交换词序后输出矩阵完全不变”。这里讨论的是未加入位置和顺序约束的情形，因果掩码本身也带有方向约束。

## 内容向量加上位置向量

位置索引 $pos$ 是一个整数。位置编码则把它转换成与 Token Embedding 维度相同的向量，再与内容向量相加：

$$
x_{pos}=e_{pos}+PE(pos).
$$

这里的 $e_{pos}$ 表示当前位置查出的 Token Embedding，$PE(pos)$ 表示该位置的编码。对于一个批次，Token Embedding 的形状为 `[B, T, d_model]`，位置编码可以使用 `[T, d_model]`，再沿 Batch 维度广播相加。相加后形状不变。

## 正弦与余弦位置编码

原论文使用的固定正弦位置编码为

$$
\begin{aligned}
PE_{(pos,2i)}&=\sin\left(\frac{pos}{10000^{2i/d_{\mathrm{model}}}}\right),\\
PE_{(pos,2i+1)}&=\cos\left(\frac{pos}{10000^{2i/d_{\mathrm{model}}}}\right).
\end{aligned}
$$

其中，$pos$ 是从 0 开始的位置索引，$i$ 标记一对分量。对于原论文所用的偶数 $d_{\mathrm{model}}$，有 $i=0,1,\ldots,d_{\mathrm{model}}/2-1$。每一对分量使用相同频率的正弦和余弦，不同的分量对使用不同频率。

这样，每个位置都会得到一个由不同频率的周期函数组成的向量。例如，当 $d_{\mathrm{model}}=4$ 时，位置 0 的编码为

$$
PE(0)=[0,1,0,1].
$$

它还有一个性质：对于固定偏移 $k$，利用正余弦的加法公式，可以把 $PE(pos+k)$ 写成 $PE(pos)$ 的线性变换，变换系数只依赖 $k$ 和各分量对的频率。这为表达相对位置关系提供了条件，但不代表模型一定能可靠处理任意长的序列。

原论文还会先将 Token Embedding 乘以 $\sqrt{d_{\mathrm{model}}}$，再加入位置编码。用本文的记号，一层输入可写为

$$
x_{pos}=\sqrt{d_{\mathrm{model}}}\,e_{pos}+PE(pos).
$$

这里表示加入位置编码后的输入，还不是 Transformer 的最终输出。

另一种方式是**学习式位置编码**：先初始化一个位置嵌入矩阵，再通过反向传播学习各位置的向量。它与固定正弦位置编码的主要区别，在于位置向量是否作为参数参与学习。原论文对两种方式都做了实验，具体定义见[第 3.4、3.5 节](https://arxiv.org/html/1706.03762v7#S3.S5)。

# 参考资料

- Vaswani et al. [Attention Is All You Need](https://arxiv.org/abs/1706.03762), 2017。
- Sennrich et al. [Neural Machine Translation of Rare Words with Subword Units](https://aclanthology.org/P16-1162/), 2016。
- PyTorch 官方文档：[Embedding](https://docs.pytorch.org/docs/stable/generated/torch.nn.Embedding.html)、[Softmax](https://docs.pytorch.org/docs/stable/generated/torch.nn.Softmax.html)、[MultiheadAttention](https://docs.pytorch.org/docs/stable/generated/torch.nn.MultiheadAttention.html)。

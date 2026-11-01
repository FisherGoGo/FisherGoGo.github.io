---
title: "Transformer 04：模型架构"
published: 2026-11-01
description: "串起 Encoder、Decoder、残差连接、LayerNorm 与 FFN，结合右移输入和张量形状，完整走一遍 Transformer 的训练与生成流程。"
tags: ["深度学习", "Transformer"]
category: "深度学习"
draft: false
comment: true
lang: "zh_CN"
---

![Transformer 编码器与解码器结构示意](/images/transformer04/architecture.png)

这一讲接着上一篇的 Self-Attention，把 Encoder、Decoder、残差连接、LayerNorm 和 FFN 串起来。下面讨论的是 2017 年原始 Transformer 的 Base 配置，结构可对照[原论文 Figure 1 与第 3 节](https://arxiv.org/html/1706.03762v7#S3)。

# Encoder 架构

原论文 Transformer Base 的主要参数：

| 参数          | 数值   | 含义                 |
| ----------- | ---- | ------------------ |
| $N$         | 6    | Encoder 和 Decoder 各自的层数 |
| $d_{model}$ | 512  | 每个 Token 的表示维度     |
| $h$         | 8    | Attention Head 数量  |
| $d_k$       | 64   | 每个 Head 的 Query、Key 维度 |
| $d_v$       | 64   | 每个 Head 的 Value 维度 |
| $d_{ff}$    | 2048 | FFN 中间层维度          |

输入 $X\in\mathbb{R}^{B\times T\times512}$ 中，$B$ 是 Batch 大小，也就是一次处理多少条序列；$T$ 是序列长度，也就是每条序列有多少个 Token。一个 Batch 内长度不同时，通常先用 PAD 补齐，并用 Padding Mask 屏蔽作为 Key 的 PAD 位置。

先回顾一下：句子经过分词（Tokenization），转成 Token ID，再通过 Embedding 查表变成向量，最后加上位置信息，得到 `[B, T, 512]` 的 Encoder 输入。原论文还会将 Embedding 乘以 $\sqrt{d_{\mathrm{model}}}$，再与位置编码相加。

论文中的 Encoder 由 6 个相同结构的 Encoder Layer 堆叠而成。每层包含两个主要子层，按数据流顺序为：

1. Multi-Head Self-Attention，多头自注意力。
2. Position-wise Feed Forward Network（FFN），逐位置前馈网络。

每个子层后面都有 Add & Norm，也就是残差相加后再做 LayerNorm。用 $F$ 统一表示当前子层，先忽略 Dropout，可以写成：

$$
Y=\operatorname{LayerNorm}(X+F(X)).
$$

这里的 $X$ 始终指当前子层的输入。因此，一个 Encoder Layer 的计算要分两步：

$$
\begin{aligned}
H&=\operatorname{LayerNorm}_1\bigl(X+\operatorname{MHA}(X)\bigr),\\
Y&=\operatorname{LayerNorm}_2\bigl(H+\operatorname{FFN}(H)\bigr).
\end{aligned}
$$

第二次残差相加使用的是 $H$，不是整层最初的输入 $X$。两个子层各有自己的 LayerNorm 参数，输出形状都保持 `[B, T, 512]`，这样才能逐元素相加。

Attention 负责不同 Token 之间的信息交互，FFN 则对每个 Token 已融合的上下文特征做进一步的非线性变换。6 个 Encoder Layer 结构相同，但参数不共享，每层输出都是下一层的输入。最终输出仍保留每个源 Token 的表示，不会把整句话压缩成一个向量。

# 残差连接与归一化

## Residual Connection 残差连接

深层神经网络训练时可能出现梯度消失、梯度爆炸，也可能出现增加深度后，训练误差反而变大的退化问题。残差连接给信息和梯度提供了一条更直接的传递路径。

普通子网络直接输出 $y=F(x)$，残差结构则输出 $y=x+F(x)$。这样，子网络可以学习在输入基础上需要增加的改变量 $F(x)$，而不必重新构造整个输出。

先用标量形式看这条残差分支，对输入 $x$ 求导：

$$
\frac{\partial y}{\partial x}=1+\frac{\partial F(x)}{\partial x}
$$

相比直接经过 $F$，这里多了恒等路径的梯度项 $1$。如果不需要明显改变输入，子网络也可以学习 $F(x)\approx0$。对于向量，对应的表达是 $I+J_F(x)$，其中 $I$ 是单位矩阵，$J_F(x)$ 是 $F$ 的雅可比矩阵。

这解释了残差连接为什么有助于梯度传播，但不代表它能保证梯度永远不会消失或爆炸。上式也只描述残差相加部分，完整 Add & Norm 的反向传播还要经过 LayerNorm。

## Layer Normalization 层归一化

但还有另一个问题：每一层都把输入和子网络输出相加，特征的数值尺度可能发生较大变化。LayerNorm 会对每个 Token 的特征向量做标准化，再通过可学习参数调整尺度和偏移。

这里的标准化是减去均值，再除以标准差，不是除以方差。对于某个 Token 的向量 $x\in\mathbb{R}^{d}$，其中 $d=d_{\mathrm{model}}$：

$$
\mu=\frac{1}{d}\sum_{j=1}^{d}x_j,\qquad
\sigma^2=\frac{1}{d}\sum_{j=1}^{d}(x_j-\mu)^2.
$$

$$
\operatorname{LN}(x)=\gamma\odot\frac{x-\mu}{\sqrt{\sigma^2+\epsilon}}+\beta.
$$

其中，$\gamma,\beta\in\mathbb{R}^{d}$ 分别是可学习的缩放和平移参数，$\odot$ 表示逐元素相乘，$\epsilon$ 是防止除零的小常数。

对 `[B, T, 512]` 的输入，LayerNorm 在最后的 512 个特征上计算均值和方差，**每个 Token 单独计算统计量**，不混合不同句子或位置。同一个 LayerNorm 模块的 $\gamma$、$\beta$ 则由所有位置共享。输出形状不变，经过缩放和平移后，也不必再严格满足均值为 0、方差为 1。

原始 Transformer 采用 **Post-LN**：先经过子层，再残差相加，最后 LayerNorm。把原论文训练时的 Dropout 也写上，就是：

$$
Y=\operatorname{LayerNorm}\bigl(X+\operatorname{Dropout}(F(X))\bigr).
$$

后来的 Pre-LN 则把 LayerNorm 放到子层之前，常写为 $Y=X+\operatorname{Dropout}(F(\operatorname{LayerNorm}(X)))$。读不同实现时，需要先看清归一化的位置。

# Position-wise Feed Forward Network 逐位置前馈网络

前面的多头注意力负责 Token 之间的信息交互，形成上下文相关的表示；FFN 则在每个位置内部加工特征，提取和组合更复杂的特征。原始 Transformer 使用两个线性层，中间接 ReLU：

$$
\operatorname{FFN}(x)=\max(0,xW_1+b_1)W_2+b_2.
$$

对于每个 Token，第一次线性变换将特征从 512 维扩张到 $d_{ff}=2048$ 维，ReLU 引入非线性，第二次线性变换再映射回 512 维：

$$
[B,T,512]\longrightarrow[B,T,2048]
\xrightarrow{\mathrm{ReLU}}[B,T,2048]
\longrightarrow[B,T,512].
$$

按行向量约定，$W_1\in\mathbb{R}^{512\times2048}$、$b_1\in\mathbb{R}^{2048}$，$W_2\in\mathbb{R}^{2048\times512}$、$b_2\in\mathbb{R}^{512}$。

Position-wise 的意思是每个位置分别计算，**同一层的所有位置共享一套 FFN 参数**，不同层使用不同参数。FFN 本身不在位置之间交换信息，但它的输入已经可以包含 Attention 汇总的上下文。中间的非线性也很重要，否则两个连续线性变换可以合并成一次仿射变换。

# Decoder

原始 Transformer 的 Decoder 也堆叠了 6 个结构相同、参数不共享的 Decoder Layer。每层有三个主要子层，每个子层后面都有 Add & Norm，按数据流顺序为：

1. Masked Multi-Head Self-Attention
2. Encoder-Decoder Attention（Cross-Attention）
3. Position-wise Feed Forward Network（FFN）

Masked Multi-Head Self-Attention 负责目标序列内部的信息交互。为了预测下一个 Token，每个输入位置只能关注自身及之前的位置，需要用 Causal Mask 屏蔽后续位置。有 PAD 时，还要同时处理 Padding Mask。

训练时，Causal Mask 需要配合**右移后的目标输入**。例如，用下面两组序列对齐输入和预测目标：

```text
Decoder 输入：BOS   I      love   you
预测目标：     I     love   you    EOS
```

第一个位置读取 BOS 来预测 I，第二个位置读取 BOS 和 I 来预测 love，以此类推。这样模型既看不到后续输入，也不会在当前位置直接读到待预测的答案。训练时已知整段正确目标，因此可以并行计算各位置；推理时还不知道下一个 Token，仍需逐步生成。

Cross-Attention 解决的是 Decoder 如何读取源序列的信息：Q 来自当前 Decoder Layer 中 Masked Self-Attention 及其 Add & Norm 的输出，K、V 来自最后一层 Encoder 的输出。三者都要经过该 Cross-Attention 模块自己的可学习投影。

若源长度为 $S$、目标输入长度为 $T$，单个 Head 的 Q 形状为 `[B, T, 64]`，K、V 的形状为 `[B, S, 64]`。因此注意力权重形状为 `[B, T, S]`，单头输出为 `[B, T, 64]`，8 个头拼接并投影后回到 `[B, T, 512]`。

每个 Decoder Layer 都读取同一份 Encoder 最终输出，但各层使用自己的投影参数。Cross-Attention 通常允许读取全部有效源位置，只屏蔽源端 PAD，无需对源序列施加目标端的 Causal Mask。

三种 Attention 可以放在一起比较：

| 模块 | Q 的来源 | K、V 的来源 | 允许读取的范围 |
| --- | --- | --- | --- |
| Encoder Self-Attention | 当前 Encoder 层输入 | 同一输入 | 全部有效源位置 |
| Decoder Masked Self-Attention | 当前 Decoder 层输入 | 同一输入 | 当前及之前的有效目标输入位置 |
| Cross-Attention | 当前层第一个 Add & Norm 的输出 | Encoder 最终输出 | 全部有效源位置 |

# 从输入到输出完整走一遍 Transformer

以“我爱你”翻译成“I love you”为例。为方便追踪形状，这里假设源句切成 `[我, 爱, 你]`，源长度 $S=3$；目标训练输入为 `[BOS, I, love, you]`，长度 $T=4$。实际分词结果取决于分词器，这里只用一个样本，即 $B=1$，并用 $V_{\mathrm{tgt}}$ 表示目标词表大小。

| 步骤 | 操作 | 输出形状 |
| --- | --- | --- |
| 1 | 源句分词并转为 Token ID | `[1, 3]` |
| 2 | 源 Embedding 乘以 $\sqrt{512}$，再加位置编码 | `[1, 3, 512]` |
| 3 | 依次通过 6 个 Encoder Layer，得到源序列表示 $E$ | `[1, 3, 512]` |
| 4 | 准备右移后的目标 Token ID | `[1, 4]` |
| 5 | 目标 Embedding 乘以 $\sqrt{512}$，再加位置编码 | `[1, 4, 512]` |
| 6 | 依次通过 6 个 Decoder Layer，每层按 Masked Self-Attention、Cross-Attention、FFN 的顺序计算，并分别做 Add & Norm | `[1, 4, 512]` |
| 7 | 线性投影到目标词表，得到 logits | `[1, 4, V_tgt]` |
| 8 | 沿词表维度做 Softmax，得到各位置的下一个 Token 概率 | `[1, 4, V_tgt]` |

训练时，源端和目标端的 Embedding 与位置编码相加后还会做 Dropout。Encoder 输出 $E$ 在第 6 步中供每一层 Decoder 的 Cross-Attention 使用。Cross-Attention 的长度关系是从目标端查询源端，因此本例每个 Head 的注意力权重为 `[1, 4, 3]`。

设最终 Decoder 输出为 $D$，词表投影可写为：

$$
\begin{aligned}
Z&=DW_{\mathrm{vocab}}+b_{\mathrm{vocab}},\\
P&=\operatorname{softmax}(Z),
\end{aligned}
$$

其中 $W_{\mathrm{vocab}}\in\mathbb{R}^{512\times V_{\mathrm{tgt}}}$，$b_{\mathrm{vocab}}\in\mathbb{R}^{V_{\mathrm{tgt}}}$。输出层把 512 维特征变成词表中每个 Token 的分数，再将分数转成概率；它的 Softmax 沿词表维度计算，要与 Attention 中沿 Key 位置计算的 Softmax 区分开。

训练时，将四个位置分别与 `[I, love, you, EOS]` 对齐，计算损失。实际实现通常直接把 logits 交给交叉熵损失函数，不需要先手动做 Softmax。

推理时，先计算一次源序列的 Encoder 输出，再从 BOS 开始：

```text
[BOS]               → 预测 I
[BOS, I]            → 预测 love
[BOS, I, love]      → 预测 you
[BOS, I, love, you] → 预测 EOS，停止生成
```

这是一条示意生成路径，实际结果由模型和解码策略决定。每一步读取当前最后一个位置的词表分布，选择下一个 Token，再追加到输入中；若没有生成 EOS，则需要在设定的长度上限停止。

到这里，完整的数据流就接起来了：Encoder 为源序列各位置形成上下文表示，Decoder 结合已有目标前缀，通过 Cross-Attention 读取源信息，最后预测下一个目标 Token。架构、FFN、输出投影与 Dropout 的原文说明可分别查阅[第 3.1 节](https://arxiv.org/html/1706.03762v7#S3.S1)、[第 3.3 节](https://arxiv.org/html/1706.03762v7#S3.S3)、[第 3.4 节](https://arxiv.org/html/1706.03762v7#S3.S4)和[第 5.4 节](https://arxiv.org/html/1706.03762v7#S5.S4)。

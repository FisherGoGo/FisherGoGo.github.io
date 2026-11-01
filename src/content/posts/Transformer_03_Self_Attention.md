---
title: "Transformer 03：Self-Attention"
published: 2026-11-01
description: "从自注意力的直觉出发，梳理 Q、K、V、缩放点积注意力、Mask 与多头注意力，并手算完整示例。"
tags: ["深度学习", "Transformer"]
category: "深度学习"
draft: false
comment: true
lang: "zh_CN"
---

# Self-Attention 的直觉

如果一个序列中的每个 Token，都可以读取同一序列中其他位置的信息，会发生什么？这就是 **Self-Attention**（自注意力）的直觉，也是 Transformer 的核心机制之一。

为了理解句子中的词语，我们通常需要结合上下文，模型也是如此。初始的 Token Embedding 主要反映 Token 自身的信息；经过 Self-Attention 后，当前位置的表示可以融入从其他位置读取的信息。这里先讨论不屏蔽有效位置的情形，后面再看 Mask 如何限制可读取的范围。

Self-Attention 的步骤如下：

1. 查看同一序列中允许关注的位置，包括当前位置自身。
2. 计算当前位置与这些位置的匹配分数。
3. 将分数转换为注意力权重。
4. 按照权重汇总各个位置提供的信息。
5. 得到当前位置的新向量表示。

这里的“重要”是相对于当前查询位置而言的，不是对整句话统一评判重要程度。不同位置通常有不同的注意力分布，有些位置的权重可能很小，甚至接近 0。

把各个查询位置的权重按行排列，就得到注意力权重矩阵 $A$。如果先用输入向量本身作为待汇总的信息，可以把整个序列的更新写成 $Y=AX$。实际 Transformer 会先将输入投影为 Value 矩阵 $V$，因此后面的完整计算是 $O=AV$。

给定当前层的输入后，各个位置的注意力可以并行计算，不必像 RNN 那样等待上一个位置的隐藏状态。不过，自回归推理仍然需要逐步生成新的 Token。

# Query、Key、Value

这一部分主要看模型如何决定应该关注哪些位置，以及从这些位置读取什么信息。这也是 **Query、Key、Value**（Q、K、V）要完成的事。

想象我们在图书馆查找一本书，可以把这个过程分成三步：

1. `Query`：我要找什么，比如一本科幻小说。
2. `Key`：用什么来匹配，比如书的分类、关键词等检索信息。
3. `Value`：匹配后读取什么，也就是书中真正需要的内容。

Query 和 Key 共同完成**匹配**，判断哪些书更符合当前要求；Value 用于**读取**，提供需要汇总的内容。一个位置有多值得关注，取决于当前 Query 与该位置 Key 的匹配程度，不能由 Key 单独决定。

在 Self-Attention 中，每个位置都有自己的 Q、K、V。当前位置用自己的 Q 与允许关注的各个位置的 K 比较，得到权重后，再加权汇总对应的 V。Q、K、V 都来自同一序列，这也是“Self”的含义。

设当前位置的输入表示为行向量 $x_i$，使用三个可学习的投影矩阵，就能生成三个不同用途的向量：

$$
\begin{aligned}
q_i&=x_iW_Q,\\
k_i&=x_iW_K,\\
v_i&=x_iW_V.
\end{aligned}
$$

同一层、同一个 Head 中，所有位置共用一组投影矩阵。投影矩阵是模型参数，通过训练更新；Q、K、V 则是由当前输入和这些参数计算得到的结果，会随输入变化，并不是为每个词预先存好的三种固定标签。

把所有位置一起写成矩阵形式，就是 $Q=XW_Q$、$K=XW_K$、$V=XW_V$。暂不考虑 Batch 维度，若序列长度为 $T$，输入维度为 $d_{\mathrm{model}}$，则：

| 矩阵 | 形状 |
| --- | --- |
| $X$ | $T\times d_{\mathrm{model}}$ |
| $W_Q,W_K$ | $d_{\mathrm{model}}\times d_k$ |
| $W_V$ | $d_{\mathrm{model}}\times d_v$ |
| $Q,K$ | $T\times d_k$ |
| $V$ | $T\times d_v$ |

其中，$d_k$ 是 Query 和 Key 的维度，$d_v$ 是 Value 的维度，两者不必相等。

# Scaled Dot-Product Attention

有了 Q、K、V，就可以计算**缩放点积注意力**：

$$
\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\left( \frac{QK^{T}}{\sqrt{d_{k}}} \right)V
$$

这个公式主要做了四件事：

1. 计算匹配分数：$S=QK^T$。
2. 缩放分数：$S'=S/\sqrt{d_k}$。
3. 逐行转换为注意力权重：$A=\operatorname{softmax}(S')$。
4. 根据权重读取信息：$O=AV$。

首先，$QK^T$ 计算的是每个 Query 与各个 Key 的点积，而不是 Q 内部各个向量之间的点积。所得矩阵形状为 $T\times T$，其中第 $i$ 行、第 $j$ 列的元素表示 $q_i$ 与 $k_j$ 的匹配分数。

再除以 $\sqrt{d_k}$，缓解分数尺度过大造成的 Softmax 输出过度集中。Softmax 沿每一行单独计算，也就是对一个 Query 对应的所有 Key 位置进行归一化。

最后，$T\times T$ 的权重矩阵与 $T\times d_v$ 的 Value 矩阵相乘，得到 $T\times d_v$ 的输出。第 $i$ 个位置的输出为：

$$
o_i=\sum_{j=1}^{T}A_{ij}v_j.
$$

这对应[原论文第 3.2.1 节](https://arxiv.org/html/1706.03762v7#S3.S2.SS1)的计算方式。

# 算一次完整的 Attention

假设有 3 个 Token，$d_k=d_v=2$，直接给出用于手算的 Q、K、V 矩阵。这个例子不使用 Mask：

$$
Q=\begin{bmatrix}1&0\\0&1\\1&1\end{bmatrix} \quad
K=\begin{bmatrix}1&0\\0&1\\1&1\end{bmatrix} \quad
V=\begin{bmatrix}1&0\\0&2\\2&1\end{bmatrix}
$$

先计算 $QK^T$，形状由 $[3,2]\times[2,3]$ 变为 $[3,3]$：

$$
S=QK^{T}=\begin{bmatrix}1&0&1\\0&1&1\\1&1&2\end{bmatrix}
$$

其中，第 $i$ 行是第 $i$ 个 Query 与所有 Key 的匹配分数，包括当前位置自身。

然后除以 $\sqrt{d_k}=\sqrt{2}\approx1.4142$，形状不变：

$$
S'\approx\begin{bmatrix}0.7071&0&0.7071\\0&0.7071&0.7071\\0.7071&0.7071&1.4142\end{bmatrix}
$$

接着逐行进行 Softmax：

$$
A = \operatorname{softmax}(S')\approx \begin{bmatrix}0.4011&0.1978&0.4011\\0.1978&0.4011&0.4011\\0.2483&0.2483&0.5035\end{bmatrix}  
$$

每一行的权重之和都为 1；显示为四位小数时，可能因舍入出现微小偏差。

最后乘上 $V$，形状由 $[3,3]\times[3,2]$ 变为 $[3,2]$：

$$
O=AV\approx\begin{bmatrix}1.2033&0.7967\\1.0000&1.2033\\1.2552&1.0000\end{bmatrix}
$$

这里使用未舍入的中间结果计算，最后才保留四位小数。例如，第一个位置的输出可以近似写成：

$$
o_1\approx0.4011[1,0]+0.1978[0,2]+0.4011[2,1]
\approx[1.2033,0.7967].
$$

# 缩放因子与 Mask 机制

先看为什么要除以 $\sqrt{d_k}$。当维度增加时，点积的数值不一定每次都变大，但在一定假设下，它的方差会随维度增大。

假设 $q$ 和 $k$ 的各个分量相互独立，均值都为 0，方差都为 1，那么：

$$
\operatorname{Var}(q\cdot k)
=\operatorname{Var}\left(\sum_{r=1}^{d_k}q_rk_r\right)
=d_k.
$$

标准差为 $\sqrt{d_k}$，因此缩放后有：

$$
\operatorname{Var}\left(\frac{q\cdot k}{\sqrt{d_k}}\right)
=\frac{1}{d_k}\operatorname{Var}(q\cdot k)=1.
$$

这是解释缩放因子的简化假设，不代表训练中的 Q、K 一定严格满足这些条件。

如果分数之间的差距过大，Softmax 的权重可能过度集中到某个位置，进入梯度很小的饱和区域。缩放有助于缓解这个问题，但并不保证注意力权重一定均匀，也不保证训练中不会出现梯度问题。

再看 **Mask（掩码）**。有时候需要禁止模型关注某些位置，比如 PAD，或者 Decoder 当前输入位置之后的 Token。记加性掩码矩阵为 $M$，将它加在 Softmax 之前：

$$
\operatorname{softmax}\left( \frac{QK^{T}}{\sqrt{d_{k}}} +{M}\right)V
$$

这里约定，允许关注的位置取 $M_{ij}=0$，禁止关注的位置取 $M_{ij}=-\infty$。这样，屏蔽位置经过 Softmax 后的权重为 0。实际实现也可能使用足够大的负数近似屏蔽效果。

常见的掩码有两种：

- **Padding Mask**：屏蔽作为 Key 的 PAD 位置，因为 PAD 只用于补齐长度，不是真实的语言内容。计算训练损失时，通常还需要单独忽略 PAD 对应的目标位置。
- **Causal Mask（因果掩码）**：禁止 Decoder 读取当前输入位置之后的 Token，也叫 Look-Ahead Mask。它允许关注当前位置自身及之前的位置。

例如，对于长度为 4 的序列，因果掩码可以写成：

$$
M=\begin{bmatrix}
0&-\infty&-\infty&-\infty\\
0&0&-\infty&-\infty\\
0&0&0&-\infty\\
0&0&0&0
\end{bmatrix}.
$$

行表示 Query 位置，列表示 Key 位置。训练 Decoder 时，因果掩码还需要与右移后的目标输入配合，才能在并行计算各位置时防止读取待预测的目标内容。

# Multi-Head Attention

单头 Attention 生成一张注意力权重矩阵。如果希望模型同时从不同的表示子空间读取信息，就可以引入多个 **Attention Head（注意力头）**。

$$
X\longrightarrow\begin{cases}
\mathrm{head}_1\\
\mathrm{head}_2\\
\vdots\\
\mathrm{head}_8
\end{cases}
$$

在 Self-Attention 中，所有 Head 使用同一个输入 $X$，每个 Head 都有自己的一组 Q、K、V 投影矩阵，分别执行 Attention。8 个 Head 就能得到 8 组注意力分布和对应输出。不同 Head 可以学到不同的关系，但这种分工不是预先指定的，也不保证各头一定互不相同。

以原论文 Base 配置为例，$d_{\mathrm{model}}=512$、$h=8$、$d_k=d_v=64$。假设 Batch 大小 $B=2$、序列长度 $T=4$，形状变化如下：

| 步骤 | 形状 |
| --- | --- |
| 输入 $X$ | `[2, 4, 512]` |
| 每个 Head 的 $W_Q,W_K,W_V$ | `[512, 64]` |
| 每个 Head 的 $Q,K,V$ | `[2, 4, 64]` |
| 每个 Head 的 $QK^T$ | `[2, 4, 4]` |
| 每个 Head 的注意力权重 $A$ | `[2, 4, 4]` |
| 每个 Head 的输出 $AV$ | `[2, 4, 64]` |
| 8 个 Head 的输出沿最后一维拼接 | `[2, 4, 512]` |

这里的转置只交换最后两个维度，不交换 Batch 维度。注意区分：**分数和权重矩阵的形状是 `[B, T, T]`，每个 Head 的输出形状才是 `[B, T, d_v]`**。

拼接后，还要乘以输出投影矩阵 $W^O\in\mathbb{R}^{hd_v\times d_{\mathrm{model}}}$。本例中，$W^O\in\mathbb{R}^{512\times512}$，最终输出形状仍为 `[2, 4, 512]`。这次可学习的线性变换用于整合各个 Head 的信息。

将[原论文第 3.2.2 节](https://arxiv.org/html/1706.03762v7#S3.S2.SS2)的多头公式专门写成 Self-Attention 的形式：

$$
\begin{aligned}
\mathrm{head}_i&=\operatorname{Attention}(XW_i^Q,XW_i^K,XW_i^V),\\
\operatorname{MultiHead}(X)&=\operatorname{Concat}(\mathrm{head}_1,\ldots,\mathrm{head}_h)W^O.
\end{aligned}
$$


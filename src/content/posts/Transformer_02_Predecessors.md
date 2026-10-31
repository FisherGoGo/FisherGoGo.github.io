---
title: "Transformer 02：Transformer 的前世"
published: 2026-10-31
description: "从 RNN 和 LSTM 出发，理解 Encoder-Decoder 的固定上下文瓶颈，以及传统 Attention 如何动态读取原文信息。"
tags: ["深度学习", "Transformer"]
category: "深度学习"
draft: false
comment: true
lang: "zh_CN"
---

# RNN 和 LSTM 如何处理序列

处理自然语言时，不能只看每个 Token 自身的含义，还要结合上下文。以单向 RNN 为例，它的核心思想是：处理当前 Token 时，携带之前 Token 留下的信息。

**RNN（Recurrent Neural Network，循环神经网络）**通过隐藏状态，在不同时间步之间传递信息：

$$
h_{t}=f(x_{t},h_{t-1})
$$

| 符号        | 含义                   |
| --------- | -------------------- |
| $t$       | 当前时间步，也就是当前 Token 位置 |
| $x_t$     | 当前 Token 的输入向量       |
| $h_{t-1}$ | 上一个时间步的隐藏状态          |
| $h_t$     | 当前时间步更新后的隐藏状态        |
| $f$       | 神经网络实现的状态更新函数        |

最基础的 Elman RNN 可以写成下面这样，这里把输入和隐藏状态都视为行向量：

$$
h_{t}=\tanh(x_{t}W_{x}+h_{t-1}W_{h}+b)
$$

可以看到，接收新的 Token 时，模型会结合当前输入 $x_t$ 和上一步的隐藏状态 $h_{t-1}$，计算新的隐藏状态。隐藏状态并没有完整保存历史上所有的 Token，而是对已有信息的一种压缩表示。

这就带来了一个问题：随着序列变长，早期的细节可能在反复更新中被覆盖或丢失。模型需要利用相隔很远的位置之间的联系时，就涉及**长距离依赖**。普通 RNN 较难学好这类依赖，反向传播时还可能出现梯度消失或梯度爆炸。

**LSTM（Long Short-Term Memory，长短期记忆网络）**是 RNN 的一种变体。它保留循环结构，同时让模型学习什么时候保留、写入和输出信息。

相比普通 RNN，LSTM 多了一个细胞状态 $c_t$，也叫 **Cell State**。可以把 $c_t$ 想象为一本持续更新的笔记本，而 $h_t$ 是当前需要拿出来使用的摘要。LSTM 有三个重要的门，分别是遗忘门、输入门和输出门：

- 遗忘门：决定旧记忆保留多少，记为 $f_{t}$
- 输入门：决定新候选信息写入多少，记为 $i_{t}$
- 输出门：决定细胞状态经过 $\tanh$ 变换后，有多少用于形成当前隐藏状态，记为 $o_t$

这些门的值通常由当前输入和上一步隐藏状态经过线性变换，再通过 Sigmoid 得到，因此每个分量都在 0 到 1 之间。门值会随输入变化，不是训练完成后就固定不变的参数。

细胞状态的更新公式为：

$$
c_{t}=
\underbrace{f_t \odot c_{t-1}}_{\text{保留的旧记忆}}
+
\underbrace{i_t \odot \tilde{c}_t}_{\text{写入的新记忆}}
$$

其中，$\tilde{c}_t$ 是新生成的候选记忆，$\odot$ 表示逐元素相乘。隐藏状态则由下面的公式得到：

$$
h_t=o_t\odot\tanh(c_t)
$$

可以看出，LSTM 为旧记忆提供了一条加性传递路径，有助于缓解梯度消失，学习较长距离的依赖。不过，它并不能保证梯度永远稳定，梯度爆炸仍可能需要梯度裁剪等方法处理。[PyTorch 的 LSTM 文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.LSTM.html)给出了各个门和状态的完整公式。

为什么 LSTM 还是不够好？因为它虽然改善了记忆机制，却仍然需要按顺序计算：计算当前状态时，要先知道上一步的状态。因此，同一条序列的不同时间步仍然受到递推依赖的限制，不能直接全部并行计算。不同样本之间，以及每个时间步内部的矩阵运算，仍可以并行。

# Encoder 和 Decoder

对于机器翻译这类 Seq2Seq 任务，输入和输出的长度、语序都可能不同。普通的逐时间步输入、逐时间步输出结构不便直接完成这种映射，因此一种常见做法是把理解输入和生成输出分给两个网络，这就是 **Encoder-Decoder（编码器-解码器）架构**。Encoder 和 Decoder 本身都可以使用 RNN 或 LSTM，并不是 RNN 不能用于 Seq2Seq。

接下来用 `我爱你 → I love you` 这个例子，了解最基础的、没有 Attention 的 RNN Encoder-Decoder 如何运行。[Seq2Seq 原论文](https://arxiv.org/abs/1409.3215)使用的就是基于 LSTM 的编码和解码网络。

## Encoder

为了让张量形状明确，这里假设分词结果是 `我 / 爱 / 你`，并在末尾添加 `<EOS>`，一共 4 个 Token。实际切分方式和特殊 Token 的使用取决于具体模型。

加入 Batch 维度后，Token ID 张量为 $X_{\mathrm{id}}\in\mathbb{Z}^{1\times4}$。注意，Token ID 是整数索引。再假设 Embedding 维度为 4，查表后得到：

$$
X_{\mathrm{emb}}\in\mathbb{R}^{1\times4\times4}
$$

其中，每个时间步的输入形状都是 `[1, 4]`。如果 RNN 的隐藏维度设为 3，那么每一步的隐藏状态形状就是 `[1, 3]`。经过 4 个时间步，取最后的隐藏状态 $h_4$ 作为 **Context Vector（上下文向量）**：

$$
c=h_4\in\mathbb{R}^{1\times3}
$$

最后，Encoder 把这个向量传递给 Decoder。这里的 Embedding 维度和隐藏维度可以不同；$c$ 表示整句的上下文向量，与上一部分 LSTM 的细胞状态 $c_t$ 含义不同。如果使用 LSTM，传递给 Decoder 的状态通常还包括最终细胞状态。

## Decoder

推理时，Decoder 从 `<BOS>` 开始生成目标序列。Encoder 已经读取了完整原文，Decoder 则需要根据原文信息和已经生成的内容，逐步预测下一个 Token。

在一个简单实现中，用 Encoder 的最终状态初始化 Decoder 的状态；如果二者维度不同，还需要进行映射。Decoder 把 `<BOS>` 的 Embedding 与当前状态一起送入 RNN，再把得到的隐藏状态经过线性层和 Softmax，得到目标词表上的概率分布。

假设采用贪心解码，第一步选出的 Token 是 `I`。下一步就把 `I` 的 Embedding 作为新输入，同时沿用 Decoder 上一步的状态，继续预测 `love`，再预测 `you`，直到生成 `<EOS>` 或达到长度上限。这里把英文简化为按词切分，实际 Token 数量仍由分词器决定。

这是推理时的过程。训练时常用 **Teacher Forcing**，即把真实目标序列中的上一个 Token 作为输入，而不总是使用模型自己预测的结果。

## 固定上下文向量的问题

在这种没有 Attention 的基础结构中，Encoder 和 Decoder 之间的桥梁是 Encoder 最后传出的固定大小的状态。向量维度是模型预先设置的，可以是上例中的 3，也可以是 512 等其他数值，并不固定为 512。

无论原文有多长，都要用同样大小的状态承载后续翻译需要的信息，容易形成信息瓶颈，尤其是处理长句时。Decoder 也不能直接读取原文各个位置的隐藏状态；想利用某个细节时，只能依赖这份压缩表示，以及它在后续状态中的传递。

# 传统 Attention

上部分讨论了最基础 Encoder-Decoder 结构的缺点，于是有一个想法：为什么不保留 Encoder 每个位置的隐藏状态，让 Decoder 在生成每个词时，动态决定应该关注哪些位置？

原来只通过最后的状态传递整句信息，现在则保留 Encoder 各个位置的表示 $h_1,h_2,\ldots,h_n$。生成第 $t$ 个目标 Token 时，先用 Decoder 上一步的隐藏状态 $s_{t-1}$ 与各个 Encoder 状态计算对齐分数：

$$
e_{t,i}=\operatorname{score}(s_{t-1},h_i)
$$

再沿源序列的位置做 Softmax，得到注意力权重：

$$
\alpha_{t,i}=\frac{\exp(e_{t,i})}{\sum_{j=1}^{n}\exp(e_{t,j})}
$$

最后，把 Encoder 的各个状态加权求和，得到当前解码步骤需要的上下文向量：

$$
c_t=\sum_{i=1}^{n}\alpha_{t,i}h_i
$$

这里的 $c_t$ 是随解码步骤变化的上下文向量，不是前面 LSTM 的细胞状态。它也不是目标词的 Embedding，更不是已经生成的目标词。Decoder 还需要结合这个向量、已有状态和上一个目标 Token，更新状态并计算下一个 Token 的概率分布。

例如，生成 `I` 时可以更关注“我”的位置，生成 `love` 时更关注“爱”的位置。但这些权重是模型从训练中学到的软对齐，不是事先规定的一一对应关系。[Bahdanau 等人的论文](https://arxiv.org/abs/1409.0473)介绍了这种动态读取原文表示的方法；这里采用的是先用上一步解码状态计算对齐分数的写法，其他 Attention 变体的具体计算顺序可能不同。

Attention 缓解了固定上下文表示的瓶颈，但如果 Encoder 和 Decoder 仍使用 RNN，按时间步递推的限制就依然存在。后面的 Transformer 会进一步用 Self-Attention 在序列内部交换信息，去掉这种循环依赖。[Transformer 原论文](https://arxiv.org/html/1706.03762v7#S3)给出了具体结构。需要区分的是：训练时可以并行计算多个位置，自回归推理时仍然需要逐步生成目标 Token。

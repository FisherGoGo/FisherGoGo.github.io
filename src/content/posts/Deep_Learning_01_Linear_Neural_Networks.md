---
title: "深度学习 01：线性神经网络"
published: 2026-10-22
description: "从线性回归和高斯噪声推导平方损失，再从 Softmax 回归的似然推导交叉熵与梯度。"
tags: ["深度学习", "线性回归", "Softmax"]
category: "深度学习"
draft: false
comment: true
lang: "zh_CN"
---

# 线性回归
## 线性模型

**线性回归** 基于一个简单假设，假设自变量 $\mathbf{x}$ 与因变量 $y$ 之间的关系是线性的，通常允许包含观测值的一些噪声

$$
\hat{y}=w_{1}x_{1}+\ldots+w_{d}x_{d}+b
$$

上式被称为输入特征的一个仿射变换，即通过加权和对特征进行线性变换，同时通过偏置项来平移

在机器学习中，我们通常使用的是高维数据集，即输入通常是 $\mathbf{x}^{(i)}=[x_{1}^{(i)},x_{2}^{(i)},\ldots]^{T}$ ，所以也可以写成

$$
\hat{y}=\mathbf{w}^{T}\mathbf{x}+b
$$

对于包含 $n$ 个样本、每个样本有 $d$ 个特征的数据集，将每个样本的转置按行排列，得到 $\mathbf{X}\in\mathbb{R}^{n\times d}$ 。其中 $\mathbf{w}\in\mathbb{R}^{d}$ ，整个数据集的预测值向量可以写为

$$
\hat{\mathbf{y}}=\mathbf{X}\mathbf{w}+b\mathbf{1}_{n}
$$

其中 $\mathbf{1}_{n}$ 是全 $1$ 向量；在代码中通常通过广播加上标量 $b$ 。线性回归的目的是找到一组权重向量 $\mathbf{w}$ 和偏置 $b$ ，使得对于来自相同数据分布的新样本，预测误差尽可能小。训练集损失小并不一定意味着新样本误差小，还需要在独立的验证集或测试集上检查泛化表现

为了寻找最好的模型参数 $\mathbf{w}$ 和 $b$ ，我们需要一种模型质量的度量方式，和一种可以更新模型以提高模型预测质量的方法

## 损失函数

我们用损失函数来量化目标的实际值与预测值之间的差距，一般选择非负数作为损失，数值越小表示损失越小，在回归问题中，经常用平方误差函数：

$$
l^{(i)}(\mathbf{w},b)= \frac{1}{2}\left(\hat{y}^{(i)}-y^{(i)}\right)^{2}
$$

取一个 $\frac{1}{2}$ 的常数是为了导数系数为 $1$

为了度量模型在整个数据集上的质量，需要计算在训练集的 $n$ 个样本的损失均值

$$
L(\mathbf{w},b)=\frac{1}{n}\sum\limits_{i=1}^{n}l^{(i)}(\mathbf{w},b)=\frac{1}{n}\sum\limits_{i=1}^{n} \frac{1}{2}\left(\mathbf{w}^{T}\mathbf{x}^{(i)}+b-y^{(i)}\right)^{2}
$$

那么追求最好的模型质量就是希望使得损失函数最小，即

$$
\mathbf{w}^{*},b^{*}=\operatorname*{argmin}_{\mathbf{w}, b}\ L(\mathbf{w}, b)
$$
## 随机梯度下降

线性回归的最小二乘问题本身有解析解。将偏置并入参数，记 $\tilde{\mathbf{X}}=[\mathbf{X},\mathbf{1}_{n}]$ 、$\boldsymbol{\theta}=[\mathbf{w}^{T},b]^{T}$ ，当 $\tilde{\mathbf{X}}$ 列满秩时，唯一的最小二乘解为

$$
\boldsymbol{\theta}^{*}=(\tilde{\mathbf{X}}^{T}\tilde{\mathbf{X}})^{-1}\tilde{\mathbf{X}}^{T}\mathbf{y}
$$

若不列满秩，最小二乘解不唯一，可以用伪逆求一个最小范数解。上式用于说明解析解的形式，实际计算通常使用数值求解器，而不显式求逆

数据量或特征维数较大时，迭代优化更方便，也能推广到没有简单解析解的模型。**梯度下降**沿当前损失的负梯度方向更新参数，学习率合适时可以降低损失；学习率过大可能导致震荡甚至发散

最简单的方法是通过计算损失函数关于模型参数的导数（梯度），但是在每一次更新参数之前我们都要遍历整个数据集，因此我们选择每次计算更新时只随机抽取一小批样本，这种变体叫小批量随机梯度下降

在每次迭代中，我们先随机抽取一个小批量 $\mathcal{B}$ ，然后计算小批量的平均损失关于模型参数的导数，最后将梯度乘以一个预先确定的正数 $\eta$ (学习率) ，并从当前参数的值中减掉

$$
\mathbf{w} \leftarrow \mathbf{w}- \frac{\eta}{|\mathcal{B}|}\sum\limits_{i\in \mathcal{B}}\partial_{\mathbf{w}}l^{(i)}(\mathbf{w},b)=\mathbf{w}- \frac{\eta}{|\mathcal{B}|}\sum\limits_{i\in \mathcal{B}}\mathbf{x}^{(i)}(\mathbf{w}^{T}\mathbf{x}^{(i)}+b-y^{(i)})
$$
$$
b \leftarrow b - \frac{\eta}{|\mathcal{B}|}\sum\limits_{i\in \mathcal{B}}\partial_{b}l^{(i)}(\mathbf{w},b)=b- \frac{\eta}{|\mathcal{B}|}\sum\limits_{i\in \mathcal{B}}(\mathbf{w}^{T}\mathbf{x}^{(i)}+b-y^{(i)})
$$

两个更新式右侧都使用本次更新前的参数，同时计算梯度后再更新。小批量梯度含有抽样噪声，因此不保证每一步的全训练集损失都下降

## 正态分布与平方损失

若随机变量 $x$ 服从均值为 $\mu$ 、方差为 $\sigma^{2}>0$ 的正态分布，其概率密度函数如下。仅知道均值与方差，并不能确定它服从正态分布

$$
p(x) = \frac{1}{\sqrt{2\pi\sigma^{2}}} \exp{\left( - \frac{1}{2\sigma^{2}} (x-\mu)^{2} \right)}
$$

改变均值会产生 $x$ 轴的偏移，增加方差会分散分布、降低峰值

在线性回归中，可能存在一些没有被模型考虑到的因素，于是我们加入一个噪声项 $\epsilon$ ，假设给定输入后，各样本噪声相互独立，且服从相同的零均值正态分布

$$
y^{(i)}=\mathbf{w}^{T}\mathbf{x}^{(i)}+b+\epsilon^{(i)},\qquad
\epsilon^{(i)}\mid\mathbf{x}^{(i)} \sim \mathcal{N}(0,\sigma^{2})
$$

那么当输入 $\mathbf{x}$ 固定时，那么实际观测值 $y$ 也服从正态分布

$$
y \ | \ \mathbf{x} \sim \mathcal{N}(\mathbf{w}^{T}\mathbf{x}+b,\sigma^{2})
$$

可见就是正态分布的均值 $\mu$ 变成了线性模型的预测值，代入概率密度函数得到

$$
p(y \ | \ \mathbf{x}) = \frac{1}{\sqrt{2\pi\sigma^{2}}} \exp{\left( - \frac{1}{2\sigma^{2}} (y- \mathbf{w}^{T}\mathbf{x}-b)^{2} \right)}
$$

所表达的是：在给定输入 $\mathbf{x}$ 和模型参数的情况下，实际观测值 $y$ 的条件概率密度是多少，那么模型预测值与实际值越接近，这个概率密度越高，我们要做的就是最大似然估计，整个数据集的似然函数可以写成

$$
\mathcal{L}(\mathbf{w},b;\mathbf{X},\mathbf{y})=p(\mathbf{y}\mid\mathbf{X};\mathbf{w},b)=\prod_{i=1}^{n}p(y^{(i)}\mid\mathbf{x}^{(i)};\mathbf{w},b)
$$

这里的 $p$ 是连续变量的**概率密度**，可以大于 $1$ ，并不是取到某个精确值的概率。把观测数据固定、将参数视为变量时，以上表达式就是似然函数。多个密度直接连乘可能造成数值下溢或上溢，所以我们取对数，将连乘转化为求和。由于 $\log$ 严格单调递增，最大化似然与最大化对数似然等价，再加负号就转化为最小化问题

$$
-\log\mathcal{L}=\frac{n}{2}\log(2\pi\sigma^{2})+\frac{1}{2\sigma^{2}}\sum\limits_{i=1}^{n}\left(y^{(i)}-\mathbf{w}^{T}\mathbf{x}^{(i)}-b\right)^{2}
$$
当 $\sigma^{2}>0$ 固定，且所有样本共享这个方差时，第一项不影响 $\mathbf{w},b$ 的最优解，第二项的正常数系数也不影响最优解，因此目标变成

$$\operatorname*{argmin}_{\mathbf{w},b}[-\log\mathcal{L}]=\operatorname*{argmin}_{\mathbf{w},b}\sum\limits_{i=1}^{n}(y^{(i)}-\mathbf{w}^{T}\mathbf{x}^{(i)}-b)^{2}$$

这解释了独立同方差高斯噪声假设下，最大似然估计与最小二乘的等价性；使用平方损失本身并不要求数据一定服从正态分布

# Softmax 回归

线性回归可以用于预测“是多少”的问题，但是有时候我们更关注“是哪一个”的问题，即分类，而且我们更想知道属于每个类别的概率，称为软分类

这里考虑每个样本恰好属于一个类别的多分类问题。标签如何表示呢，有一个简单的方法叫**独热编码**，对于总共有 $q$ 个类别的问题，标签是一个 $q$ 维向量，真实类别对应的分量设为 $1$ ，其他分量都为 $0$ 。模型则输出一个概率向量，并不要求它也是独热向量

比如举一个例子，输入为一个 $2\times 2$ 的图像，一共有三种类别，那么三种类别标签为

$$
\mathbf{y}\in\{(1,0,0)^{T},(0,1,0)^{T},(0,0,1)^{T}\}
$$

将图像展平成四维列向量，先计算三个未归一化的类别得分（logits），输入输出关系为

$$
\begin{aligned}o_{1}&=x_{1}w_{11}+x_{2}w_{12}+x_{3}w_{13}+x_{4}w_{14}+b_{1} \\ o_{2}&=x_{1}w_{21}+x_{2}w_{22}+x_{3}w_{23}+x_{4}w_{24}+b_{2}\\
o_{3}&=x_{1}w_{31}+x_{2}w_{32}+x_{3}w_{33}+x_{4}w_{34}+b_{3}\end{aligned}
$$

简洁地写为向量形式

$$
\mathbf{o}=\mathbf{Wx}+ \mathbf{b}
$$

这里 $\mathbf{W}\in\mathbb{R}^{q\times d}$ 、$\mathbf{x}\in\mathbb{R}^{d}$ 、$\mathbf{b},\mathbf{o}\in\mathbb{R}^{q}$ 。若把一批输入按行排列成 $\mathbf{X}\in\mathbb{R}^{n\times d}$ ，则批量得分为 $\mathbf{O}=\mathbf{X}\mathbf{W}^{T}+\mathbf{1}_{n}\mathbf{b}^{T}$ 。矩阵写法取决于权重的维度约定，不能在两种约定之间直接混用

我们希望输出 $\hat{y}_{j}$ 可以视为属于类 $j$ 的条件概率，然后选择概率最大的类别作为预测类别。但是原始得分可以为任意实数，不满足概率非负且总和为 $1$ 的要求。为了做到这个目的，可以使用 softmax 函数

$$
\hat{\mathbf{y}}=\operatorname{softmax}(\mathbf{o})
$$
$$
\hat{y}_{j}=\frac{\exp(o_{j})}{\sum\limits_{k=1}^{q}\exp(o_{k})},\qquad j=1,\ldots,q
$$
对于有限的 logits，softmax 的各分量都大于 $0$ 且和为 $1$ 。由于指数函数单调递增，各类别的大小顺序不变，所以 $\operatorname*{argmax}_{j}\hat{y}_{j}=\operatorname*{argmax}_{j}o_{j}$ 。softmax 虽然是非线性函数，但模型的类别得分仍是输入的仿射函数，类别间的决策边界由 $o_{j}=o_{k}$ 给出，因此仍称为线性分类模型

## 损失函数

softmax 函数给出了一个向量 $\mathbf{\hat{y}}$ ，可以视为对于任意输入 $\mathbf{x}$ 的每个类别的条件概率，同线性回归，我们也需要一个损失函数来优化

假设数据集 $\{\mathbf{X},\mathbf{Y}\}$ 有 $n$ 个样本，第 $i$ 个样本由特征向量 $\mathbf{x}^{(i)}$ 与独热标签 $\mathbf{y}^{(i)}$ 组成。模型分配给真实类别的条件概率为

$$
P(\mathbf{y}^{(i)}\mid\mathbf{x}^{(i)};\mathbf{W},\mathbf{b})=\prod_{j=1}^{q}(\hat{y}_{j}^{(i)})^{y_{j}^{(i)}}
$$

因为只有真实类别对应的 $y_{j}^{(i)}=1$ ，乘积就等于该类别的预测概率。在给定输入后，各样本标签条件独立的假设下，整个数据集的似然为（以下省略参数）

$$
P(\mathbf{Y}\ | \ \mathbf{X}) = \prod_{i=1}^{n} P(\mathbf{y}^{(i)} \ | \ \mathbf{x}^{(i)})
$$

同样进行最小化负对数似然

$$
-\log P(\mathbf{Y} \ | \ \mathbf{X})=\sum\limits_{i=1}^{n}-\log P(\mathbf{y}^{(i)} \ | \ \mathbf{x}^{(i)})=\sum\limits_{i=1}^{n}l(\mathbf{y}^{(i)},\hat{\mathbf{y}}^{(i)})
$$

损失函数为

$$
l(\mathbf{y}^{(i)},\hat{\mathbf{y}}^{(i)})=-\sum\limits_{j=1}^{q}y_{j}^{(i)}\log\hat{y}_{j}^{(i)}
$$

这就是**交叉熵损失**，前面的负号不能省略。若真实类别为 $c$ ，独热标签会让求和简化成 $l=-\log\hat{y}_{c}$ ，真实类别的预测概率越大，损失越小。整个训练集通常取平均损失 $L=\frac{1}{n}\sum_{i=1}^{n}l(\mathbf{y}^{(i)},\hat{\mathbf{y}}^{(i)})$

对单个样本，以下省略样本索引 $(i)$ ，我们尝试将 softmax 代入损失函数

$$
\begin{aligned}
l(\mathbf{y},\hat{\mathbf{y}})&=
-\sum\limits_{j=1}^{q}y_{j}\log{\frac{\exp(o_{j})}{\sum\limits_{k=1}^{q}\exp(o_{k})}}
\\ &=\sum\limits_{j=1}^{q}y_{j}\log\sum\limits_{k=1}^{q}\exp(o_{k})-\sum\limits_{j=1}^{q}y_{j}o_{j} \\
&=\log\sum\limits_{k=1}^{q}\exp(o_{k})-\sum\limits_{j=1}^{q}y_{j}o_{j}
\end{aligned}
$$

那么关于 $o_{j}$ 的偏导为

$$
\frac{\partial l}{\partial o_{j}}=\frac{\exp(o_{j})}{\sum\limits_{k=1}^{q}\exp(o_{k})}-y_{j}=\hat{y}_{j}-y_{j}
$$

这里用到了 $\sum_{j=1}^{q}y_{j}=1$ 。注意这是 **softmax 与交叉熵组合后**关于 logits 的梯度，不是 softmax 函数本身的导数

梯度变得简单许多，再通过链式法则就能得到参数的梯度

$$
\frac{\partial l}{\partial\mathbf{W}}=(\hat{\mathbf{y}}-\mathbf{y})\mathbf{x}^{T},\qquad
\frac{\partial l}{\partial\mathbf{b}}=\hat{\mathbf{y}}-\mathbf{y}
$$

## 数值稳定性

直接计算 $\exp(o_{j})$ 可能溢出。令 $m=\max_{k}o_{k}$ ，所有 logits 同时减去 $m$ 不会改变 softmax 的值

$$
\hat{y}_{j}=\frac{\exp(o_{j}-m)}{\sum_{k=1}^{q}\exp(o_{k}-m)}
$$

计算交叉熵时，也不必先求概率再取对数。对真实类别 $c$ ，可以直接计算

$$
l=-(o_{c}-m)+\log\sum_{k=1}^{q}\exp(o_{k}-m)
$$

这样既避免指数上溢，也避免真实类别概率数值下溢到 $0$ 后再取对数。PyTorch 的 [`CrossEntropyLoss`](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html) 接收原始 logits，内部等价于 `LogSoftmax` 与负对数似然损失的组合，不需要提前调用 softmax；对于这里的单标签分类，标签可以直接使用类别索引，无须手动转成独热编码

# 参考资料

- [《动手学深度学习》：线性回归](https://zh.d2l.ai/chapter_linear-networks/linear-regression.html)
- [《动手学深度学习》：softmax 回归](https://zh.d2l.ai/chapter_linear-networks/softmax-regression.html)

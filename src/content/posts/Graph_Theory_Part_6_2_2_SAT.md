---
title: "图论 Part 6.2：2-SAT"
published: 2026-08-15
description: "从蕴含图与强连通分量出发，整理 2-SAT 的建模、可满足性判断、方案构造与字典序求解。"
tags: ["GraphAtlas"]
category: "算法"
draft: false
comment: true
lang: "zh_CN"
---

SAT 是布尔可满足性问题，即有若干布尔变量 $x_{1},x_{2},\ldots,x_{n}$，只能取 $x_{i}\in \{0,1\}$，再给出若干限制条件，然后判断是否存在一种赋值方案满足所有限制条件

而 2-SAT 是每条限制条件都可以写为 $(a \lor b)$ ，那么问题就变为存不存在一组赋值使以下式子为真
$$(a_{1}\lor b_{1})\land(a_{2}\lor b_{2})\land\ldots$$

一个关键的转化是将 OR 转化为蕴含，$a\lor b$ 表示至少有一个为真，即若 $a=0$ ，那么 $b=1$ ，也就是 $\lnot a \Rightarrow b$ ，同理 $\lnot b \Rightarrow a$ ，那么原式变为
$$a\lor b \Leftrightarrow (\lnot a \Rightarrow b)\land(\lnot b \Rightarrow a)$$
也就是一条约束产生两条有向边，然后我们建立蕴含图，即若存在边 $x \rightarrow y$ ，那么就是若 $x$ 为真那么 $y$ 也要为真

对于每个点我们建立两个节点 $x_{i}$ 和 $\lnot x_{i}$ ，若存在限制 $a\lor b$ ，那么连 $\lnot a \rightarrow b$ 和 $\lnot b \rightarrow a$

| 题目限制     | 逻辑                     | 建边                                              |
| -------- | ---------------------- | ----------------------------------------------- |
| A、B 至少一个 | ($a\lor b$)            | $\neg a\to b,\ \neg b\to a$                     |
| A、B 不能同时 | ($\neg a\lor\neg b$)   | $a\to\neg b,\ b\to\neg a$                       |
| A → B    | ($\neg a\lor b$)       | $a\to b,\ \neg b\to\neg a$                      |
| A、B 相同   | ($a\leftrightarrow b$) | $a\to b,b\to a,\neg a\to\neg b,\neg b\to\neg a$ |
| A、B 不同   | ($a\oplus b$)          | $a\to\neg b,b\to\neg a,\neg a\to b,\neg b\to a$ |
| A 必须为真   | ($a$)                  | $\neg a\to a$                                   |
| A 必须为假   | ($\neg a$)             | $a\to\neg a$                                    |

建完图后我们就可以用 SCC 来判断可满足性了。我们只需要跑一遍强连通分量，然后看是否存在 $x_{i}$ 与 $\lnot x_{i}$ 属于同一个强连通分量，若存在则说明矛盾，无解

如果存在解，我们进行缩点。同一个 SCC 里的文字必须取相同的真假值，否则会导致矛盾。在这个 DAG 中，SCC($x$) 和 SCC($\lnot x$) 恰好有一个为真；若一个 SCC 为真，那么它能够推出的 SCC 也必须为真，所以我们按照**逆拓扑序**进行处理

核心构造规则就是比较 SCC($x$) 和 SCC($\lnot x$)，谁在拓扑序中靠后就让谁为真。因为不能出现 $true \rightarrow false$，这样赋值可以确保蕴含关系成立。并且若存在边 $a \rightarrow b$，那么一定存在其逆否边 $\lnot b \rightarrow \lnot a$，可见 $pos(a)<pos(b)$ 且 $pos(\lnot b)<pos(\lnot a)$，所以按照拓扑序的大小进行赋值是合法的

<details>
  <summary>点击展开参考代码</summary>

```cpp
struct TwoSAT {
    int n;
    vector<vector<int>> g;

    vector<int> dfn, low, bel, stk;
    vector<bool> ins;
    int tim = 0, scc_cnt = 0;

    vector<bool> ans;

    TwoSAT(int n_) : n(n_) {
        g.resize(2 * n);
        dfn.assign(2 * n, 0);
        low.resize(2 * n);
        bel.resize(2 * n);
        ins.assign(2 * n, false);
        ans.resize(n);
    }

    // 表示 literal：x_i == val
    // val = 0 -> 2*i
    // val = 1 -> 2*i+1
    int id(int x, bool val) {
        return 2 * x + val;
    }

    void add_edge(int u, int v) {
        g[u].push_back(v);
    }

    // a -> b
    void add_imp(int a, int b) {
        add_edge(a, b);
        add_edge(b ^ 1, a ^ 1);
    }

    // a or b
    void add_or(int a, int b) {
        add_edge(a ^ 1, b);
        add_edge(b ^ 1, a);
    }

    // (x == xv) or (y == yv)
    void add_or(int x, bool xv, int y, bool yv) {
        add_or(id(x, xv), id(y, yv));
    }

    // a 与 b 不能同时为真
    void add_not_both(int a, int b) {
        add_or(a ^ 1, b ^ 1);
    }

    // a == b
    void add_equal(int a, int b) {
        add_imp(a, b);
        add_imp(b, a);
    }

    // a != b
    void add_xor(int a, int b) {
        add_or(a, b);
        add_or(a ^ 1, b ^ 1);
    }

    // 强制 literal a 为真
    void force_true(int a) {
        add_edge(a ^ 1, a);
    }

    // 强制 literal a 为假
    void force_false(int a) {
        add_edge(a, a ^ 1);
    }

    void tarjan(int u) {
        dfn[u] = low[u] = ++tim;
        stk.push_back(u);
        ins[u] = true;

        for (int v : g[u]) {
            if (!dfn[v]) {
                tarjan(v);
                low[u] = min(low[u], low[v]);
            }
            else if (ins[v]) {
                low[u] = min(low[u], dfn[v]);
            }
        }

        if (dfn[u] == low[u]) {
            ++scc_cnt;

            while (1) {
                int x = stk.back();
                stk.pop_back();
                ins[x] = false;
                bel[x] = scc_cnt;

                if (x == u)
                    break;
            }
        }
    }

    bool solve() {
        for (int i = 0; i < 2 * n; i++) {
            if (!dfn[i])
                tarjan(i);
        }

        for (int i = 0; i < n; i++) {
            int F = id(i, 0);
            int T = id(i, 1);

            // x 和 ¬x 在同一 SCC，无解
            if (bel[F] == bel[T])
                return false;

            // 当前 Tarjan 编号：越小越靠近缩点 DAG 的后面
            ans[i] = bel[T] < bel[F];
        }

        return true;
    }
};
```

</details>



有时候要求求字典序最小的解，我们之前的求法肯定不太行，所以我们用上贪心来求

因为要求字典序最小，所以我们从 $x_{1}$ 开始，能取 $0$ 就取 $0$，实在不行再取 $1$。具体来说，在保留前面已经确定的赋值约束的基础上，尝试强制令 $x_i=0$，然后重新建图（或清空 SCC 状态）并跑 SCC 判断是否有解；若无解，再令 $x_i=1$

然后还有问有 $m$ 条限制，问若只取前 $k$ 条是否有解，有解的 $k$ 最大为多少，可以容易发现这个 $k$ 满足单调性，所以我们可以二分

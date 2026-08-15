---
title: "图论 Part 6.1：连通分量"
published: 2026-08-15
description: "系统整理强连通分量、Tarjan、缩点、边双与点双连通分量、圆方树以及强定向。"
tags: ["GraphAtlas"]
category: "算法"
draft: false
comment: true
lang: "zh_CN"
---

# 强连通分量

强连通分量这个概念是在有向图中的，若对于两个点 $u$ 和 $v$ ，$u$ 可达 $v$ 且 $v$ 也可达 $u$ ，那么称 $u$ 和 $v$ 强连通，而强连通分量就是一个极大的、内部任意两点互相可达的点集

SCC 本质是将图里的环状结构压缩成一个点，一个重要的性质就是缩完点之后图一定是一个 DAG
## Tarjan

Tarjan 是一种求 SCC 的算法，这个算法的核心就是在 DFS 中判断哪些点要被归属到同一个强连通分量里，复杂度为 $O(n+m)$

Tarjan 主要维护这几样东西 `dfn[u]` `low[u]` `stack<int> st` `in_st[u]`

- `dfn[u]` ：节点 $u$ 第一次被访问的时间戳，即 DFS 序
- `low[u]` ：在当前 DFS 过程中，从节点 $u$ 出发，先经过若干条 DFS 树边到达其子树中的某个节点，再至多经过一条指向**当前仍在栈中节点**的有向边，所能到达节点的最小 `dfn` 值，若 `dfn[u]==low[u]` ，说明这个点是一个强连通分量在 DFS 树上的根
- `stack<int> st` ：栈里保存的是已经通过 DFS 遍历到，但还未确定所属 SCC 的点

我们在 DFS 遍历一条边 $u \rightarrow v$ 中有以下几种情况

- $v$ 未访问过：说明是树边，我们直接 DFS ，等到 $v$ 搜完之后更新 `low[u]=min(low[u],low[v])`
- $v$ 已访问过且在栈中：说明是 SCC 内部的回边，更新 `low[u]=min(low[u],dfn[v])`
- $v$ 已访问过且不在栈中：说明 $v$ 属于其他的 SCC ，不更新

<details>
  <summary>点击展开参考代码</summary>

```cpp
struct TarjanSCC {
    int n;
    int timer = 0;
    int scc_cnt = 0;

    vector<vector<int>> g;

    vector<int> dfn, low;
    vector<int> stk;
    vector<int> in_st;

    // bel[u] = u 所属 SCC 编号
    vector<int> bel;

    // sz[i] = 第 i 个 SCC 的点数
    vector<int> sz;

    TarjanSCC(int n = 0) {
        init(n);
    }

    void init(int n_) {
        n = n_;

        timer = 0;
        scc_cnt = 0;

        g.assign(n + 1, {});
        dfn.assign(n + 1, 0);
        low.assign(n + 1, 0);
        in_st.assign(n + 1, 0);
        bel.assign(n + 1, 0);

        stk.clear();

        sz.assign(n + 1, 0);
    }

    void addEdge(int u, int v) {
        g[u].push_back(v);
    }

    void dfs(int u) {
        dfn[u] = low[u] = ++timer;

        stk.push_back(u);
        in_st[u] = 1;

        for (int v : g[u]) {
            if (!dfn[v]) {
                dfs(v);
                low[u] = min(low[u], low[v]);
            }
            else if (in_st[v]) {
                low[u] = min(low[u], dfn[v]);
            }
        }

        if (dfn[u] == low[u]) {
            ++scc_cnt;

            while (true) {
                int x = stk.back();
                stk.pop_back();

                in_st[x] = 0;
                bel[x] = scc_cnt;
                sz[scc_cnt]++;

                if (x == u) break;
            }
        }
    }

    void work() {
        for (int i = 1; i <= n; i++) {
            if (!dfn[i]) {
                dfs(i);
            }
        }
    }
};
```

</details>


## 缩点

做完 SCC 后一般要进行缩点，我们保留不同 SCC 间的路径即可，缩完点后必定是 DAG，跑完缩点后一般可以做拓扑

有一个经典问题是，最少添加多少条有向边，可以使得原图变成强连通图。我们先缩点变成 DAG，设 $S$ 为 DAG 中入度为 $0$ 的 SCC 数量，$T$ 为出度为 $0$ 的 SCC 数量。若缩点后只有一个 SCC，答案为 $0$；否则答案为 $\max(S,T)$

# 无向图连通性

对于有向图的强连通，我们研究的是能不能互相抵达；而在无向图中，我们研究的是图的连通稳固性

我们先引入**桥**这个概念，若一条边被删除后会增加连通块数量，那么这个边被称为**桥**，也叫**割边**，显而易见的环上的边一定不是桥

再引入**割点**的概念，同割边，若删除这个点会导致连通块数量增加，那么这个点被称为割点
## DFS 树

对无向图从任意未访问节点开始做 DFS，若通过一条边访问新节点，这条边称为 **DFS 树边**，其他边为非树边

可以发现非树边都连接一个节点与它的祖先，所以这样的边也称为 **回边/返祖边**，且 DFS 树中的非树边不存在横叉边，这是由 DFS 的遍历顺序决定的

所以桥的问题变成：对于树边 $u-v$，在 $v$ 的子树里是否存在回边能够回到 $u$ 或 $u$ 的祖先。如果存在，那么这条树边必定不是桥；因此判桥条件为 `low[v]>dfn[u]`

## `dfn` 与 `low`

这块概念已经在强连通分量记录过，现在来讲讲怎么在无向图中更新 `low`

`low` 在无向图中定义为：表示从 $u$ 的 DFS 子树中的某个节点出发，经过若干条 DFS 树边，再至多经过一条返祖边，能够到达的最小 `dfn`

初始值为 `low[u]=dfn[u]=++timer` ，因为它至少可以抵达它自己

然后在遍历边 $u-v$ 时有两种更新方法：

- $v$ 未访问过：那么我们对 $v$ 进行 `dfs(v)` 后 $v$ 可以抵达的那么 $u$ 也可以抵达，即 `low[u]=min(low[u],low[v])`
- $v$ 访问过：说明这是一条回边，直接取就行 `low[u]=min(low[u],dfn[v])`
## 边双连通分量

边双连通分量就是在这个分量中，无论删除哪一条边，都不影响这个分量的连通性，即不存在桥

在一张图中我们将所有的桥删去后，剩下的连通块就是各边双连通分量。若对边双连通分量进行类似的缩点，原图的每个连通块都会变成一棵树，称为桥树；原图不连通时，整体得到的是森林

因为非树边一定不是桥，所以我们只需要考虑树边即可

对于边 $u-v$ ，若 `low[v]>dfn[u]` 那么这条边为桥，因为无法通过其他边抵达 $u$

所以用以下代码判桥

<details>
  <summary>点击展开参考代码</summary>

```cpp
int dfn[N], low[N], timer;
bool bridge[M];

void tarjan(int u, int in_edge) {
    dfn[u] = low[u] = ++timer;

    for (auto [v, id] : g[u]) {
        if (id == in_edge) continue;

        if (!dfn[v]) {
            tarjan(v, id);

            low[u] = min(low[u], low[v]);

            if (low[v] > dfn[u]) {
                bridge[id] = true;
            }
        }
        else {
            low[u] = min(low[u], dfn[v]);
        }
    }
}
```

</details>


因为我们已经有一个结论，把桥删掉后剩下的就是边双，所以做法就是忽略所有桥后对节点进行 BFS 染色，然后进行缩点后就可以得到桥树

## 点双连通分量

同样地，点双连通分量就是不存在割点的分量，或者是此分量中任意两点存在两条内部互不相交的路径

不同于边双，点双连通分量之间可能会共享节点，所以我们不能像边双一样建桥树，而是圆方树，后边会提到

在割点的判断中，条件变成了 `low[v]>=dfn[u]` ，因为当 `low[v]==dfn[u]` 时，只能说明 $v$ 能够回到 $u$ ，但无法回到 $u$ 的祖先，所以 $u$ 阻挡了 $v$ 的路

但是 DFS 的根需要特判，因为 `low[root]=dfn[root]` 永远成立，但是根不一定是割点，当且仅当根存在两个以上的 DFS 儿子时根为割点

<details>
  <summary>点击展开参考代码</summary>

```cpp
int dfn[N], low[N], timer;
bool cut[N];

void tarjan(int u, int in_edge) {
    dfn[u] = low[u] = ++timer;

    int child = 0;

    for (auto [v, id] : g[u]) {
        if (id == in_edge) continue;

        if (!dfn[v]) {
            child++;

            tarjan(v, id);

            low[u] = min(low[u], low[v]);

            if (in_edge != -1 && low[v] >= dfn[u]) {
                cut[u] = true;
            }
        }
        else {
            low[u] = min(low[u], dfn[v]);
        }
    }

    if (in_edge == -1 && child >= 2) {
        cut[u] = true;
    }
}
```

</details>


若非根节点 $u$ 存在 $k$ 个儿子满足 `low[v]>=dfn[u]`，那么删去 $u$ 后会使连通块数量增加 $k$；若根节点有 $k$ 个 DFS 儿子，删去根节点后会使连通块数量增加 $k-1$

因为一个割点可能属于多个点双，所以我们不能像求边双一样求点双，我们回到看 `low[v]>=dfn[u]` ，这个条件说明 $v$ 无法绕过 $u$ 抵达 $u$ 的祖先，所以 $u$ 就是 $v$ 与其上边的分界点，我们用栈进行维护

<details>
  <summary>点击展开参考代码</summary>

```cpp
int dfn[N], low[N], timer;
vector<vector<int>> bcc;
stack<int> st;

void tarjan(int u, int parent_edge) {
    dfn[u] = low[u] = ++timer;
    st.push(u);

    for (auto [v, id] : g[u]) {
        if (id == parent_edge) continue;

        if (!dfn[v]) {
            tarjan(v, id);

            low[u] = min(low[u], low[v]);

            if (low[v] >= dfn[u]) {
                vector<int> cur;

                while (true) {
                    int x = st.top();
                    st.pop();

                    cur.push_back(x);

                    if (x == v) break;
                }

                cur.push_back(u);

                bcc.push_back(cur);
            }
        }
        else {
            low[u] = min(low[u], dfn[v]);
        }
    }
}
```

</details>


按常见定义，孤立点本身也构成一个点双；上面的框架需要在遍历每个连通块时对孤立点单独处理

可以发现两个点双之间至多共享一个节点，所以我们也可以建立树结构
## 圆方树/块割树

目的是将点双也进行*缩点*，建立树结构。圆方树的思想是给原图每个节点保留一个节点，给每个点双建立一个节点，如果原图点 $u$ 属于点双 $B$，那么在两点之间连一条边。通常将原图节点叫做*圆点*，点双节点叫做*方点*。原图连通时，这样建出的图是一棵树；原图不连通时，得到的是森林

<details>
  <summary>点击展开参考代码</summary>

```cpp
int dfn[N], low[N], timer;
int tot; // 建图前令 tot = n，保证方点编号从 n + 1 开始
stack<int> st;

vector<int> G[N];
vector<int> T[2 * N];

void tarjan(int u, int in_edge) {
    dfn[u] = low[u] = ++timer;
    st.push(u);

    for (auto [v, id] : G[u]) {
        if (id == in_edge) continue;

        if (!dfn[v]) {
            tarjan(v, id);

            low[u] = min(low[u], low[v]);

            if (low[v] >= dfn[u]) {
                int b = ++tot; // 新建方点

                while (true) {
                    int x = st.top();
                    st.pop();

                    T[b].push_back(x);
                    T[x].push_back(b);

                    if (x == v) break;
                }

                T[b].push_back(u);
                T[u].push_back(b);
            }
        }
        else {
            low[u] = min(low[u], dfn[v]);
        }
    }
}
```

</details>


当然也有一个重要的性质是圆方树一定是一个二分图，因为不存在 圆点-圆点 的边，也不存在 方点-方点 的边

# 强定向与 Robbins 定理

>[!Note] Robbins 定理
>对于一个连通无向图，存在一种定向方案，使得得到的有向图强连通，当且仅当原图**没有桥**

若原图存在桥 $u-v$ ，那无论怎么定向，都只能使得路径单向连通

现在来解决若不存在桥如何定向得到强连通图，我们可以通过 DFS 将边分为树边和非树边，然后采取一个固定的定向方式：

- 树边：由祖先指向后代
- 非树边：由后代指向祖先

<details>
  <summary>点击展开参考代码</summary>

```cpp
void dfs(int u) {
    dfn[u] = low[u] = ++timer;

    for (auto [v, id] : g[u]) {
        if (usedEdge[id]) continue;
        usedEdge[id] = true;

        if (!dfn[v]) {
            // 树边：u -> v
            ans[id] = {u, v};

            dfs(v);

            low[u] = min(low[u], low[v]);

            if (low[v] > dfn[u]) {
                has_bridge = true;
            }
        }
        else {
            // 非树边
            low[u] = min(low[u], dfn[v]);

            // 后访问点 -> 先访问点
            if (dfn[v] < dfn[u]) {
                ans[id] = {u, v};
            }
            else {
                ans[id] = {v, u};
            }
        }
    }
}
```

</details>

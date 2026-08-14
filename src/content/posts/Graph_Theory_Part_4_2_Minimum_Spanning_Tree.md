---
title: "图论 Part 4.2：最小生成树"
published: 2026-08-11
description: "系统整理 Kruskal、Prim、次小生成树、Kruskal 重构树、Borůvka 与朱刘算法等生成树内容。"
tags: ["GraphAtlas"]
category: "算法"
draft: false
comment: true
lang: "zh_CN"
---

最小生成树解决的基本问题就是将所有点连在一起，且边权和最小，注意 MST 不等同于最短路

# Kruskal

本算法非常简单，将所有边按照边权排序，若此边两点不连通，那么加入此边，复杂度为 $O(m\log m)$

<details>
  <summary>点击展开 Kruskal 代码</summary>

```cpp
long long kruskal(int n,vector<Edge>& edges){
    sort(edges.begin(),edges.end());

    DSU dsu(n);

    long long ans=0;
    int cnt=0;

    for(auto [u,v,w]:edges){
        if(dsu.merge(u,v)){
            ans+=w;
            cnt++;

            if(cnt==n-1) break;
        }
    }

    if(cnt!=n-1) return -1;

    return ans;
}
```

</details>

# Prim

核心思想是：先任选一个点加入生成树，然后不断选择一条从当前生成树连向外部的最小边加入新点

先是朴素 Prim ，适合点较少的稠密图，复杂度为 $O(n^{2})$

<details>
  <summary>点击展开朴素 Prim 代码</summary>

```cpp
long long prim(int n){
    const long long INF = 4e18;

    vector<long long> dis(n+1, INF);
    vector<bool> vis(n+1, false);

    dis[1]=0;

    long long ans=0;

    for(int i=1;i<=n;i++){

        int u=-1;

        for(int j=1;j<=n;j++){
            if(!vis[j] && (u==-1 || dis[j]<dis[u])){
                u=j;
            }
        }

        if(u==-1 || dis[u]==INF){
            return -1;
        }

        vis[u]=true;
        ans+=dis[u];

        for(int v=1;v<=n;v++){
            if(!vis[v]){
                dis[v]=min(dis[v],g[u][v]);
            }
        }
    }

    return ans;
}
```

</details>

然后是堆优化的 Prim ，复杂度为 $O(m\log n)$

<details>
  <summary>点击展开堆优化 Prim 代码</summary>

```cpp
long long prim(int n){
    const long long INF=4e18;

    vector<long long> dis(n+1,INF);
    vector<bool> vis(n+1,false);

    priority_queue<
        pair<long long,int>,
        vector<pair<long long,int>>,
        greater<pair<long long,int>>
    > pq;

    dis[1]=0;
    pq.push({0,1});

    long long ans=0;
    int cnt=0;

    while(!pq.empty()){

        auto [d,u]=pq.top();
        pq.pop();

        if(vis[u]) continue;

        vis[u]=true;
        ans+=d;
        cnt++;

        for(auto [v,w]:g[u]){
            if(!vis[v] && w<dis[v]){
                dis[v]=w;
                pq.push({dis[v],v});
            }
        }
    }

    if(cnt!=n) return -1;

    return ans;
}
```

</details>

# 判断 MST 是否唯一

若存在一条非树边 $e=(u,v,w)$ 边权等于 MST 上 $u \rightarrow v$ 路径中的最大边权，那么这颗 MST 不唯一，这一块可以利用 Part2 中的倍增去维护这个查询即可

# 次小生成树

分为严格次小和非严格次小，但是基本思想都是选一条非树边 $e=(u,v,w)$ ，然后删除一条 $u- v$ 在树上路径的值

非严格次小：对于一条非树边 $e=(u,v,w)$ ，选择它后查询 MST 上 $mx=\max_{f\in path(u,v)}w(f)$ ，然后删除这条边，带来的变化是 $w-mx$ ，我们要选最小的

严格次小：选择非树边同上，我们要选择删除的边满足 $x=\max\{w(f)\mid f\in path(u,v),w(f)<w\}$ ，所以需要在倍增中维护最大和严格次大（两个不同的权值）

# Kruskal 重构树

此算法做法是在用一条边连接两个连通块合并时，新建一个节点，将这两个连通块连到这个节点下

因为连通块的性质，如果我们将新建的节点赋上边权，那么 $LCA(u,v)$ 这个点的点权就是在生成树过程中 $u$ 与 $v$ 第一次变成连通块所需要的边权阈值，即
$$val[LCA(u,v)]=\min_{P:u \rightarrow v}\max_{e\in P}w(e)$$
是一个经典的 $\min\max$ 问题

实际代码与普通的并查集不同的主要是

<details>
  <summary>点击展开 Kruskal 重构树核心代码</summary>

```cpp
for(auto [u,v,w]:e){
	u=find(u),v=find(v);
	if(u==v) continue;

	++node;
	val[node]=w;
	fa[u]=fa[v]=fa[node]=node;
	to[node].push_back(u);
	to[node].push_back(v);
}
```

</details>

同样，此算法也可以解决一个这样子的问题：

> 从点 $u$ 出发，只允许经过边权不超过 `W` 的边，问能抵达的最大的 $a_i$ 是多少

我们可以在重构树上从 $u$ 不断往上跳，找到点权不超过 `W` 的最高祖先，然后这个节点的子树就都可以抵达，这个可以转化成 `dfn` 序预处理

# Borůvka

这个是另外一种求 MST 的算法

此算法思想是：对于当前每个连通块，同时选择一条连接到其他连通块的最小边，然后全部合并。这样的合并最多进行 $O(\log n)$ 轮，每轮扫描所有边，因此下面实现的总复杂度为 $O(m\log n)$

<details>
  <summary>点击展开 Borůvka 代码</summary>

```cpp
long long boruvka(int n, vector<Edge>& edges){
    DSU dsu(n);

    long long ans=0;
    int cnt=0;

    while(cnt<n-1){

        vector<int> best(n+1,-1);

        for(int i=0;i<(int)edges.size();i++){
            auto [u,v,w]=edges[i];

            int x=dsu.find(u);
            int y=dsu.find(v);

            if(x==y) continue;

            if(best[x]==-1 ||
               edges[best[x]].w>w){
                best[x]=i;
            }

            if(best[y]==-1 ||
               edges[best[y]].w>w){
                best[y]=i;
            }
        }

        bool merged=false;

        for(int i=1;i<=n;i++){
            if(dsu.find(i)!=i) continue;
            if(best[i]==-1) continue;

            auto [u,v,w]=edges[best[i]];

            if(dsu.merge(u,v)){
                ans+=w;
                cnt++;
                merged=true;
            }
        }

        if(!merged) break;
    }

    if(cnt!=n-1) return -1;

    return ans;
}
```

</details>

此算法用的不多，但是核心思想要记住：每个连通块只需要关心自己的最小出边

# 朱刘算法 / Edmonds 最小树形图

此算法主要针对有向图，因为我们之前的算法都是在无向图上跑的，在有向图中我们讨论的是 **最小树形图**

树形图：对于一个有向图，指定一个根 $r$ ，我们希望选出一些边，使得从根可以沿着有向边抵达其他所有节点，且对于每个非根节点，入度恰好为 $1$ ，最小树形图自然就是其中边权和最小的方案

先来最基本的贪心，因为每个节点都需要恰好一条入边，那我们可以对于每个非根节点都选一条权值最小的入边，这恰好也是朱刘算法的第一步

当然如果选完之后没有环，说明我们恰好得到了答案，此时直接结束即可，但是大部分情况下我们都会产生环，因此下一步就是要打破这些环

核心思想是对于一个环如 $1 \rightarrow 2 \rightarrow 3 \rightarrow 1$ ，我们将其缩成一个新的节点 $C$ ，然后在缩点后的图上继续跑贪心

但是缩环之后还需要修改边权，加入一个环 $C$ 中每个点已经选择了自己的最小入边 $in[v]$ ，答案为 $\sum\limits_{v\in C} in[v]$ ，那么对于一条外部边 $u \rightarrow v$ ，我们想加入这条边，为了维持每个点只有一个入边，那么自然而然就要删除环内旧边，真实增加额外代价为 $w(u,v)-in[v]$ ，作为新边权

算法复杂度为 $O(nm)$

<details>
  <summary>点击展开朱刘算法代码</summary>

```cpp
struct Edge{
    int u,v;
    long long w;
};

long long dmst(int root,int n,vector<Edge> edges){
    const long long INF=4e18;

    long long ans=0;

    while(true){

        vector<long long> in(n,INF);
        vector<int> pre(n,-1);

        // 找最小入边
        for(auto [u,v,w]:edges){
            if(u!=v && w<in[v]){
                in[v]=w;
                pre[v]=u;
            }
        }

        in[root]=0;

        // 判断是否存在无入边节点
        for(int i=0;i<n;i++){
            if(in[i]==INF){
                return -1;
            }
        }

        // 找环
        int cnt=0;

        vector<int> id(n,-1);
        vector<int> vis(n,-1);

        for(int i=0;i<n;i++){
            ans+=in[i];

            int v=i;

            while(
                vis[v]!=i &&
                id[v]==-1 &&
                v!=root
            ){
                vis[v]=i;
                v=pre[v];
            }

            if(v!=root && id[v]==-1){

                for(int u=pre[v];u!=v;u=pre[u]){
                    id[u]=cnt;
                }

                id[v]=cnt++;
            }
        }

        // 没有环
        if(cnt==0){
            break;
        }

        // 其余节点编号
        for(int i=0;i<n;i++){
            if(id[i]==-1){
                id[i]=cnt++;
            }
        }

        // 缩点重新建图
        vector<Edge> newEdges;

        for(auto [u,v,w]:edges){

            int U=id[u];
            int V=id[v];

            if(U!=V){
                w-=in[v];

                newEdges.push_back({U,V,w});
            }
        }

        root=id[root];
        n=cnt;
        edges=move(newEdges);
    }

    return ans;
}
```

</details>

---
title: "图论 Part 2：树"
published: 2026-08-08
description: "系统整理树的基础概念、DFS 序、直径、中心、重心、最近公共祖先与树上差分。"
tags: ["GraphAtlas"]
category: "算法"
draft: false
comment: true
lang: "zh_CN"
---

本部分主要讲树

树是一个由 $n$ 个点 $m=n-1$ 条边组成的连通图，森林由多棵树组成

当我们选择一个点成为根之后，树的节点之间就有了父子关系，那么祖先、深度、高度、子树、叶子的定义就出来了

祖先：若 $v$ 在 $u$ 到根节点的路径上，那么称 $v$ 为 $u$ 的祖先
深度：点 $u$ 到根节点的距离
子树：点 $u$ 的子树包含节点 $u$ 自己和其所有后代
高度：点 $u$ 到其子树最远的叶子的距离
叶子：没有儿子的节点

## DFS 序

我们在 DFS 过程中第一次进入一个节点时，给它一个递增的编号，我们称这个编号为 dfn ，也叫做 DFS 序

<details>
  <summary>点击展开 DFS 序代码</summary>

```cpp
int dfn[N],timer;
void dfs(int u,int pre){
	dfn[u]=++timer;
	for(auto v:to[u]){
		if(v==pre) continue;
		dfs(v,u);
	}
}
```

</details>

有一个主要的性质，一颗子树在 DFS 序中一定占据一段连续区间，既若点 $u$ 的 DFS 序为 $dfn_{u}$ 那么其子树的区间为 $[dfn_{u},dfn_{u}+siz_{u}-1]$ ，当然我们也可以记录在 DFS 中一个节点的进入时间和离开时间来找其子树区间，如果设进入时间为 $tin_{u}$ 和处理完整一颗子树时间为 $tout_{u}$ ，那么 $u$ 的子树区间为 $[tin_{u},tout_{u}]$

因此关于一些子树信息的问题我们可以转移到 DFS 序上处理

树的欧拉序有两种，一种是跟 DFS 序一样，一种会记录进入和回退部分

## 树的直径

树的直径定义为
$$\max_{u,v}dist(u,v)$$
可以通过两次 DFS 求得树的直径

<details>
  <summary>点击展开树的直径代码</summary>

```cpp
int farP;
int maxDis;

void dfs(int u,int fa,int dis){
	if(dis>maxDis){
		farP=u;
		maxDis=dis;
	}

	for(auto v:to[u]){
		if(v==fa) continue;
		dfs(v,u,dis+1);
	}
}

maxDis=-1;
dfs(1,0,0);
int x=farP;

maxDis=-1;
dfs(x,0,0);
int y=farP;
int Len=maxDis;

// x y 即为一条直径两端
```

</details>

直径不唯一，可能存在多条直径

若已经找到一个直径 S ---- T ，那么对于任一点，他到树上其他点的最远距离一定是 $\max(dist(u,S),dist(u,T))$

## 树的中心

定义为：距离树中最远的点的距离最小的节点

树的中心在直径的中间，且对于无权树，其中心有一个或者两个，取决于直径长度的奇偶性，我们可以恢复直径路径后找到中间的点即可，当然也可以不断删去叶子来求得中心

## 树的重心

定义：删除某个节点及其相连的边后，会产生若干个连通块，让最大的连通块尽量小的点，就是树的重心

若我们定义 $f(u)$ 表示删除 $u$ 后产生的最大的连通块大小
$$f(u)=\max(n-siz[u],\max_{v是u儿子} siz[v])$$
下边为 DFS 求树的重心

<details>
  <summary>点击展开树的重心代码</summary>

```cpp
int siz[N];
int ct;
int maxn=1e9;

void dfs(int u,int pre){
	siz[u]=1;
	int mx=0;

	for(auto v:to[u]){
		if(v==pre) continue;
		dfs(v,u);
		siz[u]+=siz[v];

		mx=max(mx,siz[v]);
	}

	mx=max(mx,n-siz[u]);

	if(mx<maxn){
		maxn=mx;
		ct=u;
	}
}
```

</details>

重心一个重要性质就是当你删除 $u$ 后，每个连通块大小都不超过 $\dfrac{n}{2}$ ，所以也可以通过一直往连通块大小大于 $\dfrac{n}{2}$ 的地方一直走直到没有一个方向的连通块大于 $\dfrac{n}{2}$

## 最近公共祖先

$$w=LCA(u,v)$$
衍生出距离树上距离公式
$$dist(u,v)=depth[u]+depth[u]-2depth[LCA(u,v)]$$
接下来看怎么求 LCA

### 倍增法求第 $k$ 级祖先

记 $fa[u][j]$ 表示 $u$ 往上走 $2^{j}$ 步后到达的祖先，可以通过这样子预处理这个倍增数组
$$fa[u][j]=fa[fa[u][j-1]][j-1]$$

<details>
  <summary>点击展开倍增数组预处理代码</summary>

```cpp
void dfs(int u,int pre){
	fa[u][0]=pre;

	for(int j=1;j<=LOG;j++){
		fa[u][j]=fa[fa[u][j-1]][j-1];
	}

	for(auto v:to[u]){
		if(v==pre) continue;
		dfs(v,u);
	}
}
```

</details>

然后求第 $k$ 个父亲时，可以把 $k$ 拆成二进制位即可

<details>
  <summary>点击展开第 k 级祖先代码</summary>

```cpp
int kthFa(int u,int k){
	for(int j=0;j<=LOG;j++){
		if((k>>j)&1){
			u=fa[u][j];
		}
	}
	return u;
}
```

</details>

然后就可以利用这个方法求 LCA 了

1. 要让两个点深度相同，所以要让较低的那个点先往上跳到同一高度
2. 然后当深度相同时，从大到小枚举跳跃长度，跳到最高的，且不同的点
3. 最后这两个点的父亲即为 LCA

<details>
  <summary>点击展开倍增法 LCA 代码</summary>

```cpp
int lca(int u,int v){
	if(dep[u]<dep[v]) swap(u,v);

	int d=dep[u]-dep[v];
	for(int j=0;j<=LOG;j++){
		if((d>>j)&1) u=fa[u][j];
	}

	if(u==v) return u;

	for(int j=LOG;j>=0;j--){
		if(fa[u][j]!=fa[v][j]){
			u=fa[u][j];
			v=fa[v][j];
		}
	}

	return fa[u][0];
}
```

</details>

同时还有求路径上第 $k$ 个点

<details>
  <summary>点击展开路径上第 k 个点代码</summary>

```cpp
int kthNode(int u,int v,int k){
	int w=lca(u,v);
	int upLen=dep[u]-dep[w];
	int Len=dep[u]+dep[v]-2*dep[w];

	if(k<=upLen+1) return kthFa(u,k-1);
	else return kthFa(v,Len+1-k);
}
```

</details>

---

$x$ 在 $u$ 和 $v$ 之间的路径上当且仅当 $dist(u,x)+dist(x,v)=dist(u,v)$

三个点 $a,b,c$ 的交汇点为 $lca(a,b),lca(a,c),lca(b,c)$ 中最深的点

### 欧拉序+RMQ 求 LCA

基本思路是将树转化为一个欧拉序，然后将 LCA 问题转化为 RMQ 问题

<details>
  <summary>点击展开 LCA 欧拉序代码</summary>

```cpp
int euler[N],dep[N],depEuler[N],first[N],tot;

void dfs(int u,int pre){
	dep[u]=dep[pre]+1;
	euler[++tot]=u;
	depEuler[tot]=dep[u];
	first[u]=tot;
	for(auto v:to[u]){
		if(v==pre) continue;
		dfs(v,u);
		euler[++tot]=u;
		depEuler[tot]=u;
	}
}
```

</details>

若 $first[u]<first[v]$ ，那么欧拉序中 $[first[u],first[v]]$ 中深度最小的节点就是 LCA ，因为在 DFS 中过程中第一次到达 $u$ 后，想要到达 $v$ ，必须沿着树上唯一路径走，那么这个路径上位置最低点就是 LCA

那么我们用 ST 表维护区间深度最小节点即可

<details>
  <summary>点击展开 RMQ 求 LCA 代码</summary>

```cpp
int st[N][32];
void init_STLCA(){
	for(int i=1;i<=tot;i++) st[i][0]=euler[i]
	for(int j=1;(1<<j)<=tot;j++){
		for(int i=1;i+(1<<j)-1<=tot;i++){
			int a=st[i][j-1];
			int b=st[i+(1<<(j-1))][j-1];

			st[i][j]=dep[a]<dep[b]?a:b;
		}
	}
}
int LCA(int u,int v){
	int l=first[u],r=first[v];
	if(l>r) swap(l,r);

	int k=__lg(r-l+1);
	int a=st[l][k];
	int b=st[r-(1<<k)+1][k];
	return dep[a]<dep[b]?a:b;
}
```

</details>

这个方法每次查询的复杂度可以做到 $O(1)$

### Tarjan 离线 LCA

核心是 DFS + 并查集，离线预处理所有询问，既我预先有 $q$ 次询问 $lca(u_{1},v_{1}),lca(u_{2},v_{2})\ldots lca(u_{q},v_{q})$

<details>
  <summary>点击展开 Tarjan 离线 LCA 代码</summary>

```cpp
struct OfflineLCA {
    int n;
    vector<vector<int>> g;
    vector<vector<pair<int, int>>> qry;
    vector<int> fa, done, ans;

    OfflineLCA(int n, int q) : n(n), g(n + 1), qry(n + 1),
        fa(n + 1), done(n + 1), ans(q) {}

    void addQuery(int u, int v, int id) {
        qry[u].push_back({v, id});
        qry[v].push_back({u, id});
    }

    int find(int x) { return x == fa[x] ? x : fa[x] = find(fa[x]); }

    void dfs(int u, int p) {
        fa[u] = u;
        for (int v : g[u]) {
            if (v == p) continue;
            dfs(v, u);
            fa[find(v)] = u;
        }
        done[u] = 1;
        for (auto [v, id] : qry[u]) if (done[v]) ans[id] = find(v);
    }
};
```

</details>

## 树上差分

点差分：若要在路径 $(u,v)$ 上每个节点加 $1$ ，令 $w=LCA(u,v)$ ，那么 $diff[u],diff[v]$ 都加 $1$ ，而 $diff[w],diff[fa[w]]$ 都减 $1$

边差分：若要在路径 $(u,v)$ 上每个边加 $1$ ，令 $w=LCA(u,v)$ ，那么 $diff[u],diff[v]$ 都加 $1$ ，而 $diff[w]$ 减 $2$ ，而 $diff[v]$ 表示 $v-fa[v]$ 这条边

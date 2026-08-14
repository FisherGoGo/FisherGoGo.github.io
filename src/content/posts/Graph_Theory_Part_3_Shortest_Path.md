---
title: "图论 Part 3：最短路"
published: 2026-08-10
description: "系统整理 0-1 BFS、Dijkstra、Bellman–Ford、Floyd、SPFA、Johnson、k 短路与差分约束等最短路算法和模型。"
tags: ["GraphAtlas"]
category: "算法"
draft: false
comment: true
lang: "zh_CN"
---

本章主要是最短路

# 0-1 BFS

主要解决当图上所有边权只有 $0$ 和 $1$ 时的最短路
我们使用双端队列，对于一个边 $u-v$ ，若边权为 $0$ ，所以 $dis[v]=dis[u]$ ，那么我们把 $v$ 放到队头，反之若边权为 $1$ ，那么我们放到队尾

<details>
  <summary>点击展开 0-1 BFS 代码</summary>

```cpp
int dis[N];

void bfs(int s){
	for(int i=1;i<=n;i++) dis[i]=1e9;
	deque<int> q;
	dis[s]=0;
	q.push_front(s);

	while(!q.empty()){
		int u=q.front();
		q.pop_front();

		for(auto [v,w]:to[u]){
			if(dis[v]>dis[u]+w){
				dis[v]=dis[u]+w;

				if(w==0) q.push_front(v);
				else q.push_back(v);
			}
		}
	}
}
```

</details>

# Dijkstra

Dij 解决的是单源、**非负边权**最短路

核心思想就是不断松弛，即：
$$dis[v]=\min(dis[v],dis[u]+w(u,v))$$
先是朴素 Dij ，适用于稠密图，即边很多但是点很少的情况，复杂度为 $O(n^{2})$

<details>
  <summary>点击展开朴素 Dijkstra 代码</summary>

```cpp
int g[N][N];
int dis[N];
bool vis[N];

void dij(int s){
	f(i,1,n) dis[i]=1e9,vis[i]=0;
	dis[s]=0;

	for(int i=1;i<=n;i++){
		int u=-1;
		for(int j=1;j<=n;j++){
			if(!vis[j]&&(u==-1||dis[j]<dis[u])){
				u=j;
			}
		}

		if(u==-1||dis[u]==1e9) break ;

		vis[u]=1;

		for(int v=1;v<=n;v++){
			if(g[u][v]!=1e9){
				dis[v]=min(dis[v],dis[u]+g[u][v]);
			}
		}
	}
}
```

</details>

然后是堆优化 Dij ，复杂度为 $O((n+m)\log n)$

<details>
  <summary>点击展开堆优化 Dijkstra 代码</summary>

```cpp
struct node{
	int dis,u;
	bool operator > (const node& a) const{return dis>a.dis;}
};

int dis[N],vis[N];
priority_queue <node,vector<node>,greater<node>> q;

void Dij(){
	for(int i=1;i<=n;i++) dis[i]=0x3f3f3f3f,vis[i]=0;
	dis[s]=0;
	q.push({0,s});
	while(!q.empty()){
		int u=q.top().u;
		q.pop();
		if(vis[u]) continue;
		vis[u]=1;
		for(int i=head[u];i;i=edge[i].nxt){
			int v=edge[i].v,w=edge[i].w;
			if(dis[v]>dis[u]+w){
				dis[v]=dis[u]+w;
				q.push({dis[v],v});
			}
		}
	}
}
```

</details>

# Bellman–Ford

主要解决存在**负边**时的单源最短路，复杂度为 $O(nm)$

此算法因为存在负边，无法做 Dij 的贪心假设，所以不断松弛所有边，又因为不存在负环时，一个最短路最多经过 $n-1$ 条边，其实也相当于跑 DP

<details>
  <summary>点击展开 Bellman–Ford 代码</summary>

```cpp
struct Edge {
	int u,v;
	ll w;
};
ll dis[N];

void BellmanFord(int s){
	for(int i=1;i<=n;i++) dis[i]=1e18;
	dis[s]=0;

	for(int i=1;i<n;i++){
		bool flag=0;
		for(auto [u,v,w]:edges){
			if(dis[u]==1e18) continue;
			if(dis[v]>dis[u]+w){
				dis[v]=dis[u]+w;
				flag=1;
			}
		}
		if(!flag) break;
	}
}
```

</details>

如果题目要求最多经过 $k$ 条边的最短路

<details>
  <summary>点击展开限制边数的 Bellman–Ford 代码</summary>

```cpp
struct Edge {
	int u,v;
	ll w;
};
ll dis[N][2];
void BellmanFord(int s,int k){
	for(int i=1;i<=n;i++) dis[i][0]=dis[i][1]=1e18;
	int now=0;
	dis[s][0]=0;

	for(int i=1;i<=k;i++){
		bool flag=0;
		for(int j=1;j<=n;j++) dis[j][now^1]=dis[j][now];
		for(auto [u,v,w]:edges){
			if(dis[u][now]==1e18) continue;
			if(dis[v][now^1]>dis[u][now]+w){
				dis[v][now^1]=dis[u][now]+w;
				flag=1;
			}
		}
		now^=1;
		if(!flag) break;
	}
}
```

</details>

如果在 $n-1$ 轮松弛结束后还可以松弛就说明有负环

<details>
  <summary>点击展开 Bellman–Ford 判负环代码</summary>

```cpp
bool bellmanFord(int s){
    fill(dis, dis + n + 1, INF);
    dis[s] = 0;

    for(int i = 1; i <= n; i++){
        bool changed = false;

        for(auto [u, v, w] : edges){
            if(dis[u] == INF) continue;

            if(dis[v] > dis[u] + w){
                dis[v] = dis[u] + w;
                changed = true;

                if(i == n)
                    return true;
            }
        }

        if(!changed)
            return false;
    }

    return false;
}
```

</details>

若一个点在第 $n$ 轮被松弛，那么这个点能被某个负环抵达，我们收集这些点然后做多源 BFS/DFS ，遍历到的点都会被负环抵达和影响

# Floyd 全源最短路

此算法用来求全源最短路，复杂度为 $O(n^{3})$

<details>
  <summary>点击展开 Floyd 代码</summary>

```cpp
const ll INF = 4e18;
ll dis[N][N];

void floyd(){
    for(int k = 1; k <= n; k++){
        for(int i = 1; i <= n; i++){
            for(int j = 1; j <= n; j++){
                if(dis[i][k] == INF || dis[k][j] == INF)
                    continue;

                dis[i][j] = min(
                    dis[i][j],
                    dis[i][k] + dis[k][j]
                );
            }
        }
    }
}
```

</details>

循环最外层的 $k$ 可以理解为一个 DP 状态
$$f_{k}[i][j]$$
表示从 $i$ 到 $j$ ，只允许使用编号为 $1\ldots k$ 的节点作为中间节点的最短路

若存在 $dis[i][i]<0$ 说明原图中存在负环

我们修改转移方程后就可以求 MinMax 路径
$$f[i][j]=\min(f[i][j],\max(f[i][k],f[k][j]))$$

# SPFA

BellmanFord 的队列优化版本，同样可以处理负边负环的情况，但是最坏复杂度依然为 $O(nm)$ ，一般用来判负环

队列优化思想类似 Dij ，只有一个点的 dis 被更新才加入队列去更新邻居

<details>
  <summary>点击展开 SPFA 代码</summary>

```cpp
ll dis[N];
bool inq[N];

void spfa(int s){
	const ll INF=4e18;

	fill(dis,dis+n+1,INF);
	fill(inq,inq+n+1,false);

	queue<int> q;

	dis[s]=0;
	q.push(s);
	inq[s]=1;

	while(!q.empty()){
		int u=q.front();
		q.pop();

		inq[u]=false;

		for(auto [v,w]:g[u]){
			if(dis[v]>dis[u]+w){
				dis[v]=dis[u]+w;

				if(!inq[v]){
					q.push(v);
					inq[v]=1;
				}
			}
		}
	}
}
```

</details>

跟 BellmanFord 的判负环一样，若一条最短路超过 $n$ 条边，说明存在负环

<details>
  <summary>点击展开 SPFA 判负环代码</summary>

```cpp
ll dis[N];
bool inq[N];
int cnt[N];

bool spfa(int s){
	const ll INF=4e18;

	fill(dis,dis+n+1,INF);
	fill(cnt,cnt+n+1,0);
	fill(inq,inq+n+1,false);

	queue<int> q;

	dis[s]=0;
	q.push(s);
	inq[s]=1;

	while(!q.empty()){
		int u=q.front();
		q.pop();

		inq[u]=false;

		for(auto [v,w]:g[u]){
			if(dis[v]>dis[u]+w){
				dis[v]=dis[u]+w;
				cnt[v]=cnt[u]+1;

				if(cnt[v]>=n) return true;

				if(!inq[v]){
					q.push(v);
					inq[v]=1;
				}
			}
		}
	}

	return false;
}
```

</details>

# 最短路 DAG

若边 $u \rightarrow v$ 满足 $dis[v]=dis[u]+w$ ，那么保留这条边，就可以得到最短路子图。当所有边权均为正时，边一定从较小的 $dis$ 指向较大的 $dis$ ，此时它是一张 DAG ，可以在上面做 DP ，如统计最短路条数等；若允许零权边，子图中可能存在零权环，需要先处理这些环，不能直接当作 DAG

在上述 DAG 条件成立时，统计一个 $cnt[u]$ 表示到点 $u$ 的最短路数量，可以在 Dijkstra 过程中顺手统计：若 $dis[v]=dis[u]+w$ ，那么将路径数量累计上去；若 $dis[v]>dis[u]+w$ ，那么将路径数量覆盖上去

若要统计点 $v$ 在多少条 $s\rightarrow t$ 最短路上，还需满足 $dis_s[v]+dis_t[v]=dis_s[t]$ ，此时答案为 $cnt_{s}[v]\times cnt_{t}[v]$
若要统计边 $u \rightarrow v$ 在多少条 $s\rightarrow t$ 最短路上，还需满足 $dis_s[u]+w(u,v)+dis_t[v]=dis_s[t]$ ，此时答案为 $cnt_{s}[u]\times cnt_{t}[v]$ 。其中 $dis_t$ 和 $cnt_t$ 需要从 $t$ 在反图上求出

# 分层最短路

其实就是一个模型，将点变成 实际点+状态 表示即可

# DAG 最短/长路

求出拓扑序后按照拓扑序松弛即可

# 差分约束

差分约束是将不等式系统转化为图然后再转化为最短路问题进行解决的建模

一般来都是这种不等式
$$x_{v}-x_{u}\le c$$
可以转化为
$$x_{v}\le x_{u}+c$$
建成边
$$u \rightarrow v \quad w=c$$
而这和最短路的松弛条件一样

所以将 $x_{i}$ 理解成一个距离变量，建立完模型后跑最短路就是答案

对于建边：

1. 先是 $x_{v}-x_{u}\le c$ ，直接建 $u \rightarrow v,c$
2. 然后 $x_{v}-x_{u}\ge c$ ，先转化为 $x_{u}-x_{v}\le -c$ ，建 $v \rightarrow u,-c$
3. 最后 $x_{v}-x_{u} = c$ ，变成 $x_{v}-x_{u}\le c$ 和 $x_{v}-x_{u}\ge c$ ，所以建两条边 $u \rightarrow v,c$ 和 $v \rightarrow u ,-c$

如果建出来的图存在负环，说明无解，因为会得到某个点 $x_{k}\le x_{k}-c$ ，即 $x_{k}<x_{k}$ ，明显矛盾，如果只需要看有没有解，可以建立超级源点然后判负环即可，如果存在解，跑完最短路后让 $x_{i}=dis[i]$ 即可

同时两个元素最大差为
$$\max(x_{v}-x_{u})\le dist(u,v)$$
最小差为
$$\min(x_{v}-x_{u})\ge -dist(v,u)$$

当然如果所给不等式都是 $x_{v}-x_{u}\ge c$ ，可以建 $u \rightarrow v,c$ 然后跑最长路

# Johnson 全源最短路

此算法解决这样的问题：图比较稀疏，求任意两点最短路，且允许存在负边

核心思想是，将所有边权变为非负后跑 $n$ 次 Dij ，复杂度为 $O(nm\log n)$

对于负边，此算法引入一个势函数 $h[v]$ ，对于原边 $u \rightarrow v,w(u,v)$ 重新赋为 $w'(u,v)=w(u,v)+h[u]-h[v]$

可以证明对于任意一条最短路，重新赋权后的值为 $w'(s,t)=w(s,t)+h[s]-h[t]$ ，对于固定了起点和终点的任意一条路径，都是原最短路加上一个固定的常数，不影响相对大小

现在是怎么确定这个势函数，目的是 $w(u,v)+h[u]-h[v]\ge 0$ ，即 $h[v]\le h[u]+w(u,v)$ ，这和一直讲的松弛一样，所以令 $h[v]$ 为某个源点到 $v$ 的最短距离，即可令条件成立

所以建立超级源点 $S$ ，然后跑 BellmanFord ，那么 $h[v]=dist(S,v)$ ，同时也不能存在负环

这样得到的新边必定非负，因为对每条边 $u \rightarrow v$ ，最短路的三角不等式都保证 $h[v]\le h[u]+w$ ，即 $w+h[u]-h[v]\ge 0$

最后跑 $n$ 遍 Dij 即可

# $k$ 短路

先是最基础的次短路，在跑 Dij 时同时维护到这个点的最短路长度和次短路长度即可

然后推广到 $k$ 短路，在边权非负时，一个最简单的方法是允许每个节点从优先队列中被有效弹出 $k$ 次，这个方法基于 Dijkstra 的贪心成立

<details>
  <summary>点击展开 k 短路代码</summary>

```cpp
vector<ll> kth[N];
int cnt[N];

void k_shortest(int s, int K){
    priority_queue<
        pair<ll,int>,
        vector<pair<ll,int>>,
        greater<pair<ll,int>>
    > pq;

    fill(cnt, cnt + n + 1, 0);

    pq.push({0, s});

    while(!pq.empty()){
        auto [d,u] = pq.top();
        pq.pop();

        if(cnt[u] >= K)
            continue;

        cnt[u]++;
        kth[u].push_back(d);

        for(auto [v,w] : g[u]){
            if(cnt[v] < K){
                pq.push({d + w, v});
            }
        }
    }
}
```

</details>

最后 kth 数组里存的就是答案，但是这个最短路可能不是简单路径，即可能经过一个点多次

# 同余最短路

此算法是将无限状态按模数压缩为有限状态，基本问题为：

> 有若干个正整数 $a_{1},a_{2},\ldots,a_{m}$​ ，可以不断累加它们，问哪些数能够表示出来，或者某个区间里有多少个数可以表示。

选一个数作为模数 $M$ ，这个模数一般选 $M=\min a_{i}$ ，然后不关心具体的数 $x$ ，只关心 $x\bmod M$ ，所以只有 $0,1,2\ldots,M-1$ 这 $M$ 个状态

定义 $dis[r]$ 表示：能够构造出的、模 $M$ 余 $r$ 的最小非负整数

然后对于每个点 $r$ ，我们建边 $r \rightarrow (r+a_{i})\bmod M ,\,a_{i}$ 即可，从 $0$ 开始跑最短路就行

最后若 $X\ge dis[X\bmod M]$ 的数可以被表示出来

# A\* 最短路

A\* 定义估价函数 $g(u)$ 表示当前这条路从 $s$ 走到 $u$ 已经花费的距离，再定义 $h(u)$ 表示对 $u \rightarrow t$ 剩余距离的估计，然后优先队列按照 $f(u)=g(u)+h(u)$ 从小往大进行扩展。下面的写法同样要求边权非负

我们可以直接让 $h(u)=dist(u,t)$ ，那么 $f(u)=g(u)+dist(u,t)$ ，然后我们跑 Dij 的 k 短路即可

<details>
  <summary>点击展开 A* 最短路代码</summary>

```cpp
struct Edge{
    int v;
    ll w;
};

vector<Edge> g[N], rg[N];
ll h[N];

//先是反图 Dij
void dij_reverse(int t){
    const ll INF = 4e18;

    fill(h, h + n + 1, INF);

    priority_queue<
        pair<ll,int>,
        vector<pair<ll,int>>,
        greater<pair<ll,int>>
    > pq;

    h[t] = 0;
    pq.push({0,t});

    while(!pq.empty()){
        auto [d,u] = pq.top();
        pq.pop();

        if(d != h[u])
            continue;

        for(auto [v,w] : rg[u]){
            if(h[v] > d + w){
                h[v] = d + w;
                pq.push({h[v],v});
            }
        }
    }
}

//A*
ll kth_shortest(int s, int t, int K){
    const ll INF = 4e18;

    dij_reverse(t);

    if(h[s] == INF)
        return -1;

    vector<int> cnt(n + 1, 0);

    using State = tuple<ll,ll,int>;
    // {f = g+h, g, u}

    priority_queue<
        State,
        vector<State>,
        greater<State>
    > pq;

    pq.push({h[s], 0, s});

    while(!pq.empty()){
        auto [f,gcost,u] = pq.top();
        pq.pop();

        cnt[u]++;

        if(u == t && cnt[u] == K)
            return gcost;

        if(cnt[u] > K)
            continue;

        for(auto [v,w] : g[u]){
            if(h[v] == INF)
                continue;

            if(cnt[v] < K){
                ll ng = gcost + w;
                pq.push({ng + h[v], ng, v});
            }
        }
    }

    return -1;
}
```

</details>

---
title: "图论 Part 4.1：并查集"
published: 2026-08-11
description: "系统整理并查集的基本操作、按秩合并、带权与扩展域并查集、可撤销并查集及离线动态连通性。"
tags: ["GraphAtlas"]
category: "算法"
draft: false
comment: true
lang: "zh_CN"
---

对于一个并查集，我们主要维护两种操作：

1. `find(x)` 查询元素所在集合代表元
2. `merge(x,y)` 合并两个元素所在集合

给出两种操作最朴素的写法

<details>
  <summary>点击展开并查集基础代码</summary>

```cpp
struct DSU{
	vector<int> fa;

	DSU(int _n){
		fa.assign(n+1,0);
		for(int i=1;i<=n;i++) fa[i]=i;
	}

	int find(int x){//此为路径压缩版本
		if(fa[x]==x) return x;
		else return fa[x]=find(fa[x]);
	}

	bool merge(int x,int y){
		int fx=find(x);
		int fy=find(y);

		if(fx==fy) return false;
		fa[fx]=fy return true;
	}

	bool same(int x,int y){
		return find(x)==find(y);
	}
}
```

</details>

并查集实际上就是在维护无向图中的连通块

可见到代码中有这一行

<details>
  <summary>点击展开路径压缩核心代码</summary>

```cpp
fa[x]=find(fa[x])
```

</details>

此为路径压缩，因为我们只关注节点属于哪一个集合，我们不关心其他的，所以我们完全可以压缩掉这个路径，结果是等价的，最后复杂度为 $O(m\alpha(n))$ ，当然路径压缩也会破坏原有树结构

# 按秩/大小合并

路径压缩解决的是在 `find` 的时候压平路径，但我们还可以在合并时就避免树太高，核心思想就是永远把较小的树挂在较大的树下边，这样子就不容易退化成链

<details>
  <summary>点击展开按大小合并代码</summary>

```cpp
//按大小合并
bool merge(int x,int y){
	int fx=find(x);
	int fy=find(y);

	if(fx==fy) return false;

	if(siz[fx]<siz[fy]) swap(fx,fy);
	siz[fx]+=siz[fy];
	fa[fy]=x;

	return true;
}
```

</details>

# 维护无向图连通性

这是 DSU 最经典的用法，在不断加边的情况下，可以通过并查集维护连通块大小、数量和两点之间是否连通、判环、判树等

# 带权并查集

带权并查集就是在维护并查集的同时维护一下点之间或者某些权值关系

比如：若 $x$ 与 $y$ 在同一个集合里，那么他们的差是多少，即回答 $val[x]-val[y]$

我们定义：
$$dis[x]=val[x]-dis[fa[x]]$$
若 $x$ 与 $y$ 处于同一个集合，他们的差可以表示为：
$$dis[x]-dis[y]=val[x]-val[z]-val[y]+val[z]=val[x]-val[y]$$
所以重点就是维护 $dis[x]$ ，先看看 `find` 怎么写

<details>
  <summary>点击展开带权并查集 find 代码</summary>

```cpp
int find(int x){
	if(fa[x]==x) return ;

	int p=find(x);
	fa[x]=find(p);
	dis[x]+=dis[p];

	return fa[x];
}
```

</details>

我们先保存旧父亲，这样子通过递归后，原来的父亲的权值就变成压缩后，相对于根的权值，所以再压缩后该点就变成相对于根的权值

那么 `merge` 也需要重写，这里不做赘述，直接推导即可

<details>
  <summary>点击展开带权并查集 merge 代码</summary>

```cpp
bool merge(int x, int y, long long w){
    int rx = find(x);
    int ry = find(y);

    if(rx == ry)
        return false;

    fa[ry] = rx;

    dis[ry] = w + dis[x] - dis[y];

    return true;
}
```

</details>

# 扩展域并查集

思想是把关系拆成多个虚拟状态节点，然后用普通并查集维护，常用于处理：同类/异类、朋友/敌人、食物链等关系

最经典的就是朋友与敌人的关系，我们就拿这个举例子

加入每个人有两种关系：同一阵营/不同阵营

那么对于每一个 $x$ ，我们拆分为两个节点：

- $x$ ：自己所在阵营
- $x+n$ ：敌对阵营

如果 $x$ 与 $y$ 同阵营，我们执行 `merge(x,y)` ，那么同时 $x$ 的敌人与 $y$ 的敌人也要属于同一个阵营，即 `merge(x+n,y+n)`

反之如果 $x$ 与 $y$ 是敌人，同理执行 `merge(x,y+n)` 和 `merge(x+n,y)`

若 `find(x)==find(x+n)` 那么则出现矛盾

# 可撤销并查集

可撤销并查集支持的是允许我们将若干次最近的合并操作合并，让并查集恢复到之前的某个状态

核心思想是记录修改历史，在普通的按大小合并中，被修改的有两个值 `fa[y]` 和 `siz[y]` ，所以我们可以存下修改前的信息，同时我们**不能进行路径压缩**

我们一般将操作压入栈中，然后通过退栈来进行撤消

<details>
  <summary>点击展开可撤销并查集代码</summary>

```cpp
struct RollbackDSU{
    vector<int> fa, siz;
    vector<pair<int,int>> stk;
    int cnt;

    RollbackDSU(int n){
        fa.resize(n + 1);
        siz.assign(n + 1, 1);
        cnt = n;

        for(int i = 1; i <= n; i++)
            fa[i] = i;
    }

    int find(int x){
        while(x != fa[x])
            x = fa[x];

        return x;
    }

    bool merge(int x, int y){
        x = find(x);
        y = find(y);

        if(x == y){
            stk.push_back({-1, -1});
            return false;
        }

        if(siz[x] < siz[y])
            swap(x, y);

        stk.push_back({x, y});

        fa[y] = x;
        siz[x] += siz[y];
        cnt--;

        return true;
    }

    void undo(){
        auto [x, y] = stk.back();
        stk.pop_back();

        if(x == -1)
            return;

        siz[x] -= siz[y];
        fa[y] = y;
        cnt++;
    }

    int time(){
        return stk.size();
    }

    void rollback(int t){
        while((int)stk.size() > t)
            undo();
    }

    bool same(int x, int y){
        return find(x) == find(y);
    }
};
```

</details>

# 离线动态连通性

此算法解决的典型问题是支持以下操作：

- `+ u v` ：加入边
- `- u v` ：删除边
- `? u v` ：询问是否连通

对于此问题，我们可以离线处理

一条边在 $s_{i}$ 时刻加入，在 $e_{i}$ 时刻删去，那么其实这条边作用的时间是 $[s_{i},e_{i}]$ 这个时间段，不难发现可以用线段树维护，但此时线段树维护的是时间，每个节点代表一段时间区间，我们可以把这个操作挂到节点上，然后递归求解状态即可，不难发现每个操作会被拆分为不超过 $O(\log q)$ 次

我们只需要支持两种操作 `add` 和 `query` 即可，前者加入操作，后者查询状态

<details>
  <summary>点击展开离线动态连通性代码</summary>

```cpp
vector<pair<int,int>> seg[4 * Q];

void add(int p,int l,int r,
         int ql,int qr,pair<int,int> e){

    if(ql <= l && r <= qr){
        seg[p].push_back(e);
        return;
    }

    int mid = (l+r)>>1;

    if(ql <= mid)
        add(p<<1,l,mid,ql,qr,e);

    if(qr > mid)
        add(p<<1|1,mid+1,r,ql,qr,e);
}

void dfs(int p,int l,int r){
    int t = dsu.time();

    for(auto [u,v] : seg[p])
        dsu.merge(u,v);

    if(l == r){

        if(op[l].type == '?'){
            cout << (dsu.same(op[l].u,op[l].v)
                     ? "YES\n"
                     : "NO\n");
        }

    }else{

        int mid = (l+r)>>1;

        dfs(p<<1,l,mid);
        dfs(p<<1|1,mid+1,r);
    }

    dsu.rollback(t);
}
```

</details>

---
title: "存图"
published: 2024-11-19
description: "前言 - 存图一般有三种方法，既 邻接矩阵 ， 邻接表 ， 链式前向星 ；由于我基本只用第一和一三钟，所以就介绍下这两种存图方式 邻接矩阵 内容 - 所谓矩阵，就是用矩阵去存图 - 对于有 n 个点的图，便用 的矩阵去…"
tags: ["graph"]
category: "图论"
legacySlug: "save_graph"
draft: false
---
# 前言
- 存图一般有三种方法，既**邻接矩阵**，**邻接表**，**链式前向星**；由于我基本只用第一和一三钟，所以就介绍下这两种存图方式

# 邻接矩阵
## 内容
- 所谓矩阵，就是用矩阵去存图
- 对于有**n**个点的图，便用 **$n\times n$** 的矩阵去存，在c++里便是用数组实现
- 假设用 $graph_{i,j}$ 代表点**i**到点**j**有一条边权为 $graph_{i,j}$ 的边
## 代码
<details>
	<summary>邻接矩阵</summary>
	```cpp
	void add_edge(int u,int v,int w){
		graph[u][v]=w;
		return ;
	}
	```
</details>	

## 优缺点
- 优点：存储查询方便，使用简单
- 缺点；当点数太多而边很少时，会占用十分多空间（$O(n^2)$），并且浪费大量空间
# 链式前向星
## 内容
- **链式前向星**是一种存边的存法，将同一起点的边用类似链表结构存起来
- 我们将会用到：
  - $Node_i$ ，每条边的信息，里边有：
    - **to** 终点
    - **w** 边权
    - **next** 下一条边
  -  $head_i$  每个点的第一条边，可以用 **cnt** 计数

## 过程
- 每次进来一条新边，除了存入**终点**和**边权**外，我们的**next**存的是$head_{from}$，既上一条边的编号，并把$head_{from}$变为这条新边的编号

## 代码
<details>
  	<summary>链式前向星</summary>

	```cpp
	struct Edge{
		int to
		int w;
		int nxt;
	}edge[100005];
	int head[1005];
	int cnt;

	void add_edge(int from,int to,int w){
		edge[++cnt].to=to;
		edge[cnt].w=w;
		edge[cnt].nxt=head[from];
		head[from]=cnt;
	}

	//遍历
	for(int i=head[point];i!=0;i=edge[i].nxt){
		cout<<edge[i].to<<endl;
	}
	```
	
</details>

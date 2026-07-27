---
title: "指针"
published: 2024-11-29
description: "本篇博客借鉴自OIWiki 内容 - 指针是 变量的地址 ，既每个变量在内存中储存的 地址 ，指针也可以当作变量使用 - 我们可以定义不同类型的指针变量，比如 int，char，double... 等等 ，不过我们也可…"
tags: ["pointer"]
category: "编程基础"
legacySlug: "pointer"
draft: false
---
>本篇博客借鉴自[OIWiki](https://oi-wiki.org/lang/pointer/)
# 内容

- 指针是**变量的地址**，既每个变量在内存中储存的**地址**，指针也可以当作变量使用
- 我们可以定义不同类型的指针变量，比如 **int，char，double...** 等等 ，不过我们也可以自己定义指针变量，比如用结构体，比如下图就可以多一个**Node**类型指针
```cpp
struct Node{
	int a;
	int b;
	int c;
};
```

# 声明与使用

- 我们可以在定义变量前加个 * 号来定义一个指针变量，也可以用 **&** 获取一个变量地址，我们也可以在指针变量前加 * 号来对指针解应用（就相当于当成普通变量来用）
```cpp
int a=5;
int* pos=&a;
*p = 6;
```
- 对结构体成员也是如此，我们也可以用 -> 来更方便使用结构体的元素，如下代码
```cpp
struct Node{
	int a;
	int b;
	int c;
};

Node x={1,2,3},y={4,5,6};
Node* px = &x;
cout << (*px).a; // 1
(*px) = y; // x={4,5,6};
cout << px->a // 4
```

# 指针偏移

- 由于指针代表的是地址，而数组之类的数据也是在一段连续地址中储存，因此我们可以利用指针偏移来访问数组各元素，如下
```cpp
int a[30];
int* pa = a; //指针pa指向a[0]
*pa = 4; //修改a[0]元素
pa = pa + 1; //指向a[1]
*pa = 5; //修改a[1]
```

# 指针类型参数使用

- 有时候在外部函数中我们想要修改外部数据，我们可以通过传入地址来访问或者修改外部数据，如下
```cpp
void swap(int* a,int *b){
	int t;
	t = *a;
	*a = *b;
	*b = t;
	return ;
}

int main(){
	int a,b;
	cin>>a>>b;
	swap(&a,&b);
}
```
- 但是在C++中，加入了引用的概念，让我们可以更方便更安全地传参
```cpp
void swap(int &a,int &b){
	...;
}

swap(a,b);
```

>还有一些我觉得应该不会用到，就不再写了，但是指针的用处还有许多 ~~在算法竞赛中，有时候开个内存池比指针方便许多~~

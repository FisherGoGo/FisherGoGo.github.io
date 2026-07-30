---
title: "2026 牛客暑期多校第一场题解"
published: 2026-07-30
description: "收录 2026 牛客暑期多校第一场的 6 道题：Problem C、Problem F、Problem G、Problem H、Problem J、Problem L，包含完整思路、正确性说明、复杂度分析与 AC 代码。"
tags: ["ACM", "题解", "牛客多校", "2026 暑假集训"]
category: "竞赛题解"
sourceLink: "https://ac.nowcoder.com/acm/contest/133876"
draft: false
comment: true
lang: "zh_CN"
---

本篇整理自队伍的 2026 暑假集训记录，共收录 **6** 道已通过题目。每题均包含题意、核心思路、正确性说明、复杂度分析和对应的 AC 代码。

比赛链接：[2026 牛客暑期多校第一场](https://ac.nowcoder.com/acm/contest/133876)

## 题目索引

| 题目 | 核心算法 |
| --- | --- |
| Problem C. 大鱼吃小鱼 | 并查集、动态加点、路径压缩、在线查询 |
| Problem F. 排列生成 | 构造、排列、模运算、循环移位 |
| Problem G. 精度误差？！ | 构造、计算几何、浮点数、分层构造 |
| Problem H. 石头剪刀布大师 | 动态规划、状态压缩、博弈论、极大极小、概率期望 |
| Problem J. 梭哈 | 枚举、模拟、博弈论、扑克牌型判断、状态缓存 |
| Problem L. 子串的子串 | AC自动机、字符串匹配、前缀和、最大子段和、离线查询、区间计数 |

## Problem C. 大鱼吃小鱼

### 题意

一个 $n\times m$ 的网格初始全是障碍。操作一会拆掉一个障碍并放入一条大小为 $v$ 的鱼，且新放入的鱼不小于此前放入的所有鱼。鱼可以反复移动到相邻格子，吃掉大小不超过自己的鱼，每吃一条大小增加 $1$。

- 操作一：放入鱼后，询问这条新鱼最多能吃多少条鱼；
- 操作二：允许先把指定鱼的大小增加一个非负整数。在它能吃到尽可能多的鱼的前提下，求最小增加量。

输入坐标需要与上一次答案异或解密。

### 思路

#### 连通块随加点合并

网格只会由障碍变成有鱼的格子，不会删除已经加入的格子，因此可以用并查集维护当前有鱼格子的四连通块。

新鱼的大小不小于所有旧鱼。只要它与一个旧连通块相邻，就能先吃掉相邻的旧鱼；之后它的大小只会继续增加，因此一定能吃完这个连通块里的所有鱼。

所以操作一只需找到新格子四周所有不同的连通块。若这些连通块的大小分别为 $s_1,s_2,\dots$，则答案是

$$
s_1+s_2+\cdots
$$

四个方向可能属于同一连通块，代码用集合对并查集根去重。合并时令新加入的格子成为所有相邻连通块的父亲，并把合并后的总大小记在新根上。

#### 一条旧鱼跨过一次合并所需的大小

考虑一个原有连通块，大小为 $s$，随后有一条大小为 $v$ 的新鱼把它接入更大的连通块。

块内任意一条旧鱼如果想继续吃到这条新鱼，可以先吃掉原块内其余 $s-1$ 条鱼。设它经过预先增加后的初始大小为 $w$，吃完旧块后大小为

$$
w+s-1
$$

要吃掉大小为 $v$ 的新鱼，需要

$$
w+s-1\ge v
$$

即

$$
w\ge v-s+1
$$

因此，这次合并给原连通块中的所有鱼增加了一个“初始大小至少为 $v-s+1$”的限制。

#### 把所有限制挂在并查集父边上

并查集的父子方向正好是“旧连通块根指向后来加入的新鱼”。对旧根 $r$，在把它接到新根时记录

$$
mx_r\leftarrow \max(mx_r, v-s_r+1)
$$

一条鱼要吃完整个当前连通块，必须依次跨过它到当前根路径上的每一次合并，所以所需的初始大小是这些限制的最大值。

路径压缩时同时执行

$$
mx_x\leftarrow\max(mx_x,mx_{parent(x)})
$$

这样一次 `find(x)` 后，`mx[x]` 就是从该格子到当前并查集根的全部限制的最大值。若这条鱼原始大小为 $val_x$，操作二的答案为

$$
\max(0,mx_x-val_x)
$$

增加到这个大小后，它可以逐层吃过所有合并点，因而能吃完整个当前连通块；再小则至少有一个合并点无法跨过。

### 正确性说明

操作一中，新鱼不小于所有旧鱼，所以它能吃完每个相邻旧连通块；不同相邻连通块之间只能通过新格子连起来，故去重后块大小之和恰好是可吃鱼数。

操作二中，每条父边记录跨过对应合并点的充要下界。取路径上所有下界的最大值能够同时满足全部合并点；若小于该最大值，就无法跨过产生最大下界的合并点。因此公式给出的增加量既可行又最小。

### 复杂度

初始化为 $O(nm)$。每次操作至多处理四个邻居，并查集操作均摊为 $O(\alpha(nm))$；空间复杂度为 $O(nm)$。

### 参考代码

```cpp title="C.cpp"
#include<bits/stdc++.h>
#define f(i,a,b) for(int i=a;i<=b;i++)
#define df(i,a,b) for(int i=a;i>=b;i--)
#define cmax(a,b) a=max(a,b)
#define cmin(a,b) a=min(a,b)
#define lowbit(x) ((x)&(-(x)))
#define cntbit(x) __builtin_popcount(x)
#define int long long
using namespace std;
typedef long long ll;
const int N=3e5+10;
const ll M=998244353;
int TT=1;

ll qp(ll a,ll x){
    ll res=1;for(;x;x>>=1,a=a*a%M)
        (x&1)&&(res=a*res%M);return res;
}

int n,m,q;

int topfa[N];
int sz[N];
int vis[N];
ll mx[N];
ll val[N];

int t1(int x,int y){
    return (x-1)*m+y;
}
pair<int,int> t2(int v){
    int y=v%m;
    int x=v/m;
    if(y==0) y=m;
    return {x,y};
}

int dx[5]={0,-1,0,1};
int dy[5]={1,0,-1,0};

// vector<int> p;

int find(int x){
    if(x==topfa[x]) return x;
    else {
        int p=topfa[x];
        topfa[x]=find(p);
        cmax(mx[x],mx[p]);
        return topfa[x];
    }
}


void solve(){
    cin>>n>>m>>q;
    f(i,1,n*m) topfa[i]=i,vis[i]=0,mx[i]=-1e18;
    int l=0;
    while(q--){
        int typ,x,y;
        cin>>typ;
        if(typ==1){
            cin>>x>>y;
            x^=l;y^=l;
            ll v;
            cin>>v;
            ll ans=0;
            set<int>s;
            sz[t1(x,y)]=1;
            val[t1(x,y)]=v;
            f(i,0,3){
                int nx=x+dx[i],ny=y+dy[i];
                if(nx<1||nx>n||ny<1||ny>m) continue;
                if(!vis[t1(nx,ny)]) continue;
                s.insert(find(t1(nx,ny)));
            }
            vis[t1(x,y)]=1;
            for(auto V:s){
                ans+=sz[V];
                topfa[V]=t1(x,y);
                cmax(mx[V],v-sz[V]+1);
            }
            sz[t1(x,y)]=ans+1;
            cout<<ans<<"\n";
            l=ans;
        }
        else {
            cin>>x>>y;
            x^=l;y^=l;
            int id=t1(x,y);
            find(id);
            int ans=max(0ll,mx[id]-val[id]);
            l=ans;
            cout<<ans<<"\n";
        }
    }
}



signed main(){
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);
    // cin>>TT;
    while(TT--) solve();
    return 0;
}
```

---

## Problem F. 排列生成

### 题意

对 $0$ 到 $n-1$ 的排列 $P$，定义

$$
f(P)=\sum_{0\le i<j<n}(P_j-P_i)
$$

给定排列 $P$ 和整数 $k,x$，构造一个排列 $P'$，满足 $P'_k=x$ 且

$$
f(P')\equiv f(P)\pmod n
$$

无解时输出 `-1`。

### 思路

#### 循环移位不改变答案模 $n$ 的值

考虑把排列最后一个元素 $a=P_{n-1}$ 移到最前面，其余元素整体右移一位。

元素 $P_i$ 在 $f(P)$ 中的系数为

$$
c_i=i-(n-1-i)=2i-n+1
$$

右移后，原来前 $n-1$ 个元素的系数都增加 $2$，而 $a$ 的系数从 $n-1$ 变为 $-(n-1)$。因此函数值的变化量为

$$
\begin{aligned}
\Delta
&=2\sum_{i=0}^{n-2}P_i-2(n-1)a\\
&=2\left(\frac{n(n-1)}2-a\right)-2(n-1)a\\
&=n(n-1-2a)
\end{aligned}
$$

它一定是 $n$ 的倍数，所以一次循环右移不会改变 $f(P)\bmod n$。任意次数的循环移位同样保持该值不变。

#### 把 $x$ 转到位置 $k$

设 $x$ 在原排列中的位置为 $t$。把整个排列循环移动

$$
d=k-t
$$

位，即把原位置 $i$ 的元素放到

$$
(i+d+n)\bmod n
$$

的位置。此时 $x$ 恰好位于下标 $k$，同时函数值模 $n$ 不变。

因此本题对所有合法输入都有解，不需要输出 `-1`。

### 正确性说明

构造只是对原排列做循环移位，所以元素集合不变，结果仍是 $0$ 到 $n-1$ 的排列。位移量由 $d=k-t$ 得到，因此 $x$ 的新位置为 $k$。又因为循环移位保持 $f(P)\bmod n$ 不变，所有要求均被满足。

### 复杂度

寻找 $x$ 并构造新排列均为 $O(n)$，空间复杂度为 $O(n)$。

### 参考代码

```cpp title="F.cpp"
#include<bits/stdc++.h>
#define f(i,a,b) for(int i=a;i<=b;i++)
#define df(i,a,b) for(int i=a;i>=b;i--)
#define cmax(a,b) a=max(a,b)
#define cmin(a,b) a=min(a,b)
#define lowbit(x) ((x)&(-(x)))
#define cntbit(x) __builtin_popcount(x)
#define int long long
using namespace std;
typedef long long ll;
const int N=4e5+10;
const ll M=998244353;
int TT=1;

ll qp(ll a,ll x){
    ll res=1;for(;x;x>>=1,a=a*a%M)
        (x&1)&&(res=a*res%M);return res;
}

ll n;
ll k,x;
ll p[N],b[N];

void solve(){
    cin>>n>>k>>x;
    f(i,0,n-1) cin>>p[i];

    int t=0;
    f(i,0,n-1){
        if(p[i]==x){
            t=i;
            break;
        }
    }
    int d=k-t;

    f(i,0,n-1){
        // cerr<<(i+d+n)%n<<" "<<i<<"\n";
        b[(i+d+n)%n]=p[i];
    }


    f(i,0,n-1){
        cout<<b[i]<<' ';
    }
    // cerr<<res<<" "<<sum<<"\n";

    // cout<<"No\n";
}



signed main(){
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);
    // cin>>TT;
    while(TT--) solve();
    return 0;
}
```

---

## Problem G. 精度误差？！

### 题意

构造一个三维点集 $S$，点数不超过 $2n+2$，满足：

- 任意两点距离严格大于 $\varepsilon=0.01$；
- 对每个点，恰好有 $n$ 个其他点与它的距离位于 $(1-\varepsilon,1+\varepsilon)$。

坐标必须在 $[-100,100]$ 内。

### 思路

#### 在两个平行平面各放 $n$ 个点

在平面 $x=0$ 和 $x=0.99000001$ 上各放置同样的 $n$ 个点。平面内使用一个 $10\times10$ 的小网格：

$$
y=i\times0.01000001,\qquad
z=j\times0.010000001
$$

其中 $1\le i,j\le10$。由于 $n\le100$，取前 $n$ 个网格位置即可。每个网格位置同时在两个平面各放一个点，总点数为 $2n$。

#### 验证同一平面内的距离

同一平面内两个不同点至少有一个坐标相差一个网格步长，而两个步长都严格大于 $0.01$。所以同层任意两点的距离都严格大于 $\varepsilon$。

#### 验证两个平面之间的距离

跨层两点的 $x$ 坐标差恒为

$$
0.99000001>0.99=1-\varepsilon
$$

所以它们的距离一定大于 $1-\varepsilon$。

两个网格坐标在 $y,z$ 方向的最大差都小于 $0.091$，故跨层距离小于

$$
\sqrt{0.99000001^2+0.091^2+0.091^2}<1.01=1+\varepsilon
$$

因此任意跨层点对的距离都在目标区间内。

每个点与另一平面的全部 $n$ 个点距离接近 $1$，而与本平面其他点的距离很小、不会落入该区间，所以每个点恰好有 $n$ 个符合条件的邻点。

代码故意让几个常数略大于边界值，避免严格不等号被浮点误差破坏。

### 正确性说明

同层不同点的距离大于 $0.01$，跨层点对的距离也大于 $0.99>0.01$，所以点集内没有距离过近的点。任意点与另一层恰有 $n$ 个点，且这些距离全部属于 $(0.99,1.01)$；同层距离远小于 $0.99$，不会额外计数。因此构造满足全部条件。

### 复杂度

每组数据输出 $2n$ 个点，时间复杂度为 $O(n)$，额外空间复杂度为 $O(n)$。

### 参考代码

```cpp title="G.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
struct node
{
    double x,y,z;
};
void solve()
{
    int n;
    cin>>n;
    vector<node> a;
    cout<<2*n<<"\n";
    for (int i=1;i<=10;i++)
    {
        for (int j=1;j<=10;j++)
        {
            a.push_back({0,(double)i*0.01000001,(double)j*0.010000001});
            a.push_back({0.99000001,(double)i*0.01000001,(double)j*0.010000001});
            if (a.size()>=2*n)break;
        }
        if (a.size()>=2*n)break;
    }
    for (auto i:a)cout<<fixed<<setprecision(10)<<i.x<<" "<<i.y<<" "<<i.z<<"\n";
}

int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    int t = 1;
    cin >> t;
    while (t--)
    {
        solve();
    }
    return 0;
}
```

---

## Problem H. 石头剪刀布大师

### 题意

Alice 和 Bob 各有三张石头、剪刀或布。每轮 Alice 先出牌，Bob 看见后再出牌；Alice 胜得 $3$ 分，平局得 $1$ 分，失败得 $0$ 分。打出的两张牌被丢弃，双方再分别等概率获得一张新牌。

双方都采取最优策略：Alice 最大化自己的期望总分，Bob 最小化它。求进行 $k$ 轮后 Alice 的最大期望总分，其中 $k$ 可达 $10^9$。

### 思路

#### 用六个计数表示状态

手牌的具体顺序没有意义，只需记录双方三种牌的数量：

$$
(a_R,a_S,a_P,b_R,b_S,b_P)
$$

每一方的三个计数之和都是 $3$。非负整数三元组的数量为

$$
\binom{3+3-1}{3-1}=10
$$

所以双方组合后只有 $10\times10=100$ 个状态。代码给每个六元组分配一个编号，并预处理所有可能的出牌与补牌转移。

#### 极大极小期望 DP

令 $dp[s][t]$ 表示从状态 $s$ 开始再进行 $t$ 轮时，Alice 在双方最优策略下能得到的最大期望分数，显然

$$
dp[s][0]=0
$$

Alice 先选择自己持有的牌型 $i$，Bob 看到后选择自己持有的牌型 $j$。双方补到的新牌分别记为 $x,y$，共有 $3\times3=9$ 种等概率结果。转移为

$$
dp[s][t]
=\max_{i:a_i>0}\ \min_{j:b_j>0}
\left(
score(i,j)+\frac19\sum_{x=0}^{2}\sum_{y=0}^{2}
dp[next(s,i,j,x,y)][t-1]
\right)
$$

先取 `min` 是因为 Bob 已经看见 Alice 的选择，并会选出对 Alice 最不利的应对；Alice 再在所有首手中取 `max`。

#### 大轮数的线性外推

状态只有 $100$ 个，且每轮都有独立随机补牌，有限时域价值的相邻差

$$
dp[s][t]-dp[s][t-1]
$$

会快速收敛到该博弈的长期平均每轮收益。题目允许浮点误差，因此代码预处理到第 $100$ 轮，并用

$$
d_s=dp[s][100]-dp[s][99]
$$

作为稳定后的每轮增量。于是当 $k>100$ 时输出

$$
dp[s][100]+(k-100)d_s
$$

随机补牌带来的混合使增量误差快速衰减，预热 $100$ 轮后，即使外推到 $10^9$ 轮也能满足题目的 $10^{-6}$ 相对或绝对误差要求。对 $k\le100$ 直接使用预处理值。

### 正确性说明

六元组计数完整描述了当前所有可选动作及下一状态的分布，因此是充分状态。DP 在每轮严格按照“Alice 先选、Bob 观察后选、随后随机补牌”的顺序执行 `max-min-expectation`，由有限时域博弈的逆推原理可得前 $100$ 轮的值正确。大轮数部分使用稳定的相邻差近似长期平均收益，并利用题目允许误差完成外推。

### 复杂度

预处理约为

$$
O(100\times100\times3\times3\times9)
$$

之后每组询问为 $O(1)$。状态表空间复杂度为 $O(100\times100)$。

### 参考代码

```cpp title="H.cpp"
#include<bits/stdc++.h>
#define f(i,a,b) for(int i=a;i<=b;i++)
#define df(i,a,b) for(int i=a;i>=b;i--)
#define cmax(a,b) a=max(a,b)
#define cmin(a,b) a=min(a,b)
#define lowbit(x) ((x)&(-(x)))
#define cntbit(x) __builtin_popcount(x)
using namespace std;
typedef long long ll;
const int N=2e5+10;
const ll M=998244353;
int TT=1;

ll qp(ll a,ll x){
    ll res=1;for(;x;x>>=1,a=a*a%M)
        (x&1)&&(res=a*res%M);return res;
}

int np;
double dp[200][200];
double C[1000];
int idx=0;
double L=1.0/9.0;
int n,k;

int id[4][4][4][4][4][4];
int got[200][4][4][4][4];
vector<array<int,6>> S(200);

void init(){
    f(x0,0,3){
        f(y0,0,3-x0){
            f(z0,0,3-x0-y0){
                f(x1,0,3){
                    f(y1,0,3-x1){
                        f(z1,0,3-x1-y1){
                            if(x0+y0+z0!=3||x1+y1+z1!=3) continue;
                            id[x0][y0][z0][x1][y1][z1]=++idx;
                            S[idx]={x0,y0,z0,x1,y1,z1};
                        }
                    }
                }
            }
        }
    }

    f(x0,0,3){
        f(y0,0,3-x0){
            f(z0,0,3-x0-y0){
                f(x1,0,3){
                    f(y1,0,3-x1){
                        f(z1,0,3-x1-y1){
                            if(x0+y0+z0!=3||x1+y1+z1!=3) continue;
                            array<int,3> A={x0,y0,z0};
                            array<int,3> B={x1,y1,z1};
                            int nid=id[x0][y0][z0][x1][y1][z1];
                            f(i,0,2){
                                if(!A[i]) continue;
                                f(j,0,2){
                                    if(!B[j]) continue;
                                    auto a=A,b=B;
                                    a[i]--;
                                    b[j]--;
                                    f(x,0,2){
                                        f(y,0,2){
                                            a[x]++;
                                            b[y]++;
                                            got[nid][i][j][x][y]=id[a[0]][a[1]][a[2]][b[0]][b[1]][b[2]];
                                            a[x]--;
                                            b[y]--;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

double sc(int i,int j){
    if(i==j) return 1.0;
    if((i+1)%3==j) return 3.0;
    else return 0.0;
}

void nxt(int tip){
    f(s,1,idx){
        auto [x0,y0,z0,x1,y1,z1]=S[s];
        int A[]={x0,y0,z0};
        int B[]={x1,y1,z1};

        double mx=0;
        f(i,0,2){
            if(!A[i]) continue;
            double mn=1e18;
            f(j,0,2){
                if(!B[j]) continue;
                double res=sc(i,j);
                f(x,0,2){
                    f(y,0,2){
                        res+=dp[got[s][i][j][x][y]][tip-1]*L;
                    }
                }
                cmin(mn,res);
            }
            cmax(mx,mn);
        }
        dp[s][tip]=mx;
    }
}


void init2(){
    f(i,1,100){
        nxt(i);
    }
}

void solve(){
    np=0;
    cin>>k;
    double ans=0;
    string sa,sb;
    cin>>sa>>sb;

    int X0=0,X1=0,X2=0,Y0=0,Y1=0,Y2=0;

    f(i,0,2){
        if(sa[i]=='R') X0++;
        else if(sa[i]=='S') X1++;
        else X2++;
        if(sb[i]=='R') Y0++;
        else if(sb[i]=='S') Y1++;
        else Y2++;
    }

    int start=id[X0][X1][X2][Y0][Y1][Y2];

    double res=max(0,k-100);
    double d=0;
    d=(dp[start][min(100,k)]-dp[start][min(99,k-1)]);
    // cerr<<d<<"\n";
    // cerr<<d*res<<"\n";
    ans=dp[start][min(100,k)]+d*res;

    printf("%.10lf\n",ans);
}



int main(){
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);
    cin>>TT;
    init();
    init2();
    while(TT--) solve();
    return 0;
}
```

---

## Problem J. 梭哈

### 题意

双方各有四张已知且互不相同的明牌。法国赌神先从其余牌中选择一张暗牌；你知道他的选择后，再从剩余牌中选择自己的暗牌。双方组成五张牌并按标准梭哈牌型比较。

需要判断：

- 你是否有必胜策略；
- 法国赌神是否有必胜策略；
- 如果双方都没有必胜策略，则为平局情形。

### 思路

#### 枚举双方的暗牌

一副牌只有 $52$ 张，已知八张明牌后，法国赌神有 $44$ 种暗牌选择。确定他的暗牌后，你还有 $43$ 张牌可选。

因此可以直接枚举

$$
44\times43
$$

种有先后顺序的暗牌组合，并比较两手五张牌。

#### 统一表示五张牌的强弱

把点数映射为 $0\sim12$，花色映射为 $0\sim3$。对五张牌统计每个点数和花色的出现次数，并判断顺子。

牌型按从弱到强编号：

1. Highcard；
2. Pair；
3. Two pairs；
4. Three of a kind；
5. Straight；
6. Flush；
7. Full house；
8. Four of a kind；
9. Straight flush（Royal flush 是其中最大的情况）。

同牌型的比较信息按题面要求排列后，用十三进制编码成一个整数。这样两手牌可以用

$$
(level,tiebreak)
$$

做字典序比较。顺子判断中特别处理了 `A2345`，同时排除 `JQKA2`、`QKA23`、`KA234` 等跨越 A 但不合法的序列。

每个固定暗牌只对应一手五张牌。代码分别缓存双方加入某张暗牌后的牌型，避免在双重枚举中重复计算。

#### 按行动顺序判断必胜策略

固定法国赌神选择的暗牌 $f$：

- 如果无论你选哪张剩余暗牌，他都获胜，则他能用 $f$ 强制获胜；
- 如果他不能强制获胜，但无论你如何选择都不会输，则他能用 $f$ 至少保证平局；
- 如果你存在一种回应能获胜，则这个 $f$ 不能阻止你取胜。

再对法国赌神的所有 $f$ 取最优结果：

- 存在一个 $f$ 能让他对所有回应都获胜：输出 `GeiWoCaPiXie`；
- 他不能必胜，但存在一个 $f$ 能保证不败：双方都没有必胜策略，输出 `PaiMeiYouWenTi`；
- 对他的每个 $f$，你都存在获胜回应：你有必胜策略，输出 `WoYaoYanPai`。

这正对应量词顺序“法国赌神先选，你看见后再选”。

### 正确性说明

枚举覆盖了双方所有合法暗牌选择。牌型函数先比较牌型等级，再按题目规定的关键点数顺序比较，故能正确判断任意两手牌的胜负。最后按照先手的每个选择检查后手的全部回应，分别对应“存在一个选择对所有回应获胜”和“对每个先手选择都存在获胜回应”，所以三个输出分支与双方是否拥有必胜策略完全一致。

### 复杂度

每组数据最多比较 $44\times43$ 对牌，单次牌型判断为常数时间；总时间复杂度为 $O(52^2)$，空间复杂度为 $O(52)$。

### 参考代码

```cpp title="J.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
bool check(char e)
{
    // cerr<<e<<"\n";
    if (e=='a'||e=='e'||e=='i'||e=='o'||e=='u')
    {
        // cerr<<"YES\n";
        return true;
    }
    else return false;
}
void solve()
{
    vector<string>s(8);
    vector<array<int,4>>vis(13);
    for (int i=0;i<13;i++)
    {
        for (int j=0;j<4;j++)
        {
            vis[i][j]=0;
        }
    }
    unordered_map<char,int>num;
    num['A']=12;
    num['2']=0;
    num['3']=1;
    num['4']=2;
    num['5']=3;
    num['6']=4;
    num['7']=5;
    num['8']=6;
    num['9']=7;
    num['T']=8;
    num['J']=9;
    num['Q']=10;
    num['K']=11;
    unordered_map<char,int>col;
    col['C']=0;
    col['D']=1;
    col['H']=2;
    col['S']=3;
    vector<array<int,2>>card1(4);
    vector<array<int,2>>card2(4);
    vector<vector<array<int,2>>>st1(13,vector<array<int,2>>(4,{-1,0}));
    vector<vector<array<int,2>>>st2(13,vector<array<int,2>>(4,{-1,0}));
    for (int i=0;i<13;i++)
    {
        for (int j=0;j<4;j++)
        {
            st1[i][j]={-1,0};
        }
    }
    for (int i=0;i<8;i++)
    {
            cin>>s[i];
            auto x=num[s[i][0]];
            auto y=col[s[i][1]];
            if(i<4)
            {
                card2[i]={x,y};
            }
            else
            {
                card1[i-4]={x,y};
            }
        vis[x][y]=1;
    }
    bool flag=0;
    auto get_level=[&](vector<array<int,2>>&v)->array<int,2>
    {
        unordered_map<int,int>cnt;
        unordered_map<int,int>color;
        map<int,int>cntt;
        for (auto [x,y]:v)
        {
            cnt[x]++;
            color[y]++;
            cntt[x]++;
        }
        int same=0;
        int highest=0;
        int pairs=0;
        int threes=0;
        int fourth=0;
        bool increse=0;
        int ct=0;
        int maxsize=0;
        int card=0;
        auto tmp=v;
        for (auto x:v)
        {
            tmp.push_back(x);
        }
        int m=tmp.size();
        for (int i=1;i<m;i++)
        {
            if((tmp[i][0]-tmp[i-1][0]+13)%13==1)
            {
                ct++;
                if(ct>=4)
                {
                    if(tmp[i-4][0]<12&&tmp[i-4][0]>8)
                    {
                        continue;
                    }
                    else
                    {
                        increse=1;
                        card=tmp[i][0];
                        break;
                    }

                }

            }
            else
            {
                ct=0;
            }
        }
        for (auto [y,_]:cnt)
        {
            if(_==2)
            {
                pairs++;
            }
            else if(_==3)
            {
                threes++;
            }
            else if(_==4)
            {
                fourth++;
            }
        }
        // cerr<<1<<endl;
        if(color.size()==1&&increse)
        {

            return {8,card};
        }
        else if(fourth)
        {
            priority_queue<array<int,2>>pq;
            for (auto [x,_]:v)
            {
                pq.push({cntt[x],x});
            }
            int res=0;
            while(pq.size())
            {
                auto [w,_]=pq.top();
                pq.pop();
                res+=_;
                res*=13;
            }
            return {7,res};
        }
        else if(threes&&pairs)
        {
            priority_queue<array<int,2>>pq;
            for (auto [x,_]:v)
            {
                pq.push({cntt[x],x});
            }
            int res=0;
            while(pq.size())
            {
                auto [w,_]=pq.top();
                pq.pop();
                res+=_;
                res*=13;
            }
            return {6,res};
        }
        else if(color.size()==1)
        {
            int res=0;
            for (int i=4;i>=0;i--)
            {
                res+=v[i][0];
                res*=13;
            }
            return {5,res};
        }
        else if(increse)
        {

            return {4,card};
        }
        else if(threes)
        {
            priority_queue<array<int,2>>pq;
            for (auto [x,_]:v)
            {
                pq.push({cntt[x],x});
            }
            int res=0;
            while(pq.size())
            {
                auto [w,_]=pq.top();
                pq.pop();
                res+=_;
                res*=13;
            }
            return {3,res};
        }
        else if(pairs==2)
        {
                priority_queue<array<int,2>>pq;
            for (auto [x,_]:v)
            {
                pq.push({cntt[x],x});
            }
            int res=0;
            while(pq.size())
            {
                auto [w,_]=pq.top();
                pq.pop();
                res+=_;
                res*=13;
            }
            return {2,res};
        }
        else if(pairs)
        {
                priority_queue<array<int,2>>pq;
            for (auto [x,_]:v)
            {
                pq.push({cntt[x],x});
            }
            int res=0;
            while(pq.size())
            {
                auto [w,_]=pq.top();
                pq.pop();
                res+=_;
                res*=13;
            }
            return {1,res};
        }
        else
        {
            int res=0;
            for (int i=4;i>=0;i--)
            {
                res+=v[i][0];
                res*=13;
            }
            return {0,res};
        }
    };
    int ret=0;
    for (int i=0;i<13;i++)
    {
        for (int j=0;j<4;j++)
        {
            if(vis[i][j])continue;
            int check=2;
            for (int k=0;k<13;k++)
            {
                for (int l=0;l<4;l++)
                {

                    if(i==k&&j==l)continue;
                    if(vis[k][l])continue;
                    int c1=st1[i][j][0];
                    int c2=st2[k][l][0];
                    // cerr<<c1<<" "<<c2<<endl;
                    if(c1==-1)
                    {
                        auto tp1=card1;
                        tp1.push_back({i,j});
                        sort(tp1.begin(),tp1.end());
                        st1[i][j]=get_level(tp1);
                        c1=st1[i][j][0];
                    }
                    if(c2==-1)
                    {

                        auto tp2=card2;
                        tp2.push_back({k,l});
                        sort(tp2.begin(),tp2.end());
                        st2[k][l]=get_level(tp2);
                        c2=st2[k][l][0];
                    }
                    // cerr<<c1<<endl;
                    // cerr<<c1<<" "<<c2<<endl;
                    // cerr<<i<<" "<<j<<" "<<k<<" "<<l<<"\n";
                    // cerr<<c1<<" "<<c2<<"\n";
                    if(c1>c2)
                    {
                        check=min(check,2);
                    }
                    else if(c1==c2)
                    {
                        int win=0;
                        int lose=0;
                        auto t1=st1[i][j][1];
                        auto t2=st2[k][l][1];
                        if(t1>t2)win=1;
                        if(t1<t2)lose=1;
                        if(win==1)
                        {
                            check=min(check,2);

                        }
                        else if(lose==1)
                        {
                            check=0;
                        }
                        else
                        {
                            check=min(check,1);
                        }
                    }
                    else
                    {
                        check=0;
                    }

                }
            }
            // cerr<<i<<" "<<j<<" "<<check<<endl;
            ret=max(ret,check);
        }
    }
    if(ret==1)
    {
        cout<<"PaiMeiYouWenTi"<<"\n";
    }
    else if(ret==2)
    {
        cout<<"GeiWoCaPiXie"<<"\n";
    }
    else
    {
        cout<<"WoYaoYanPai\n";
    }
}

int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    int t = 1;
    cin >> t;
    while (t--)
    {
        solve();
    }
    return 0;
}
```

---

## Problem L. 子串的子串

### 题意

给定字符串 $S$ 和权值序列 $a_1,a_2,\dots,a_n$。对每个询问串 $t$，如果 $t$ 是 $S[l..r]$ 的子串，就称 $[l,r]$ 为好区间。定义

$$
f(l,r)=\sum_{i=l}^{r}a_i
$$

对每个询问，求所有好区间中 $f(l,r)$ 的最大值，以及所有不同好区间的 $f(l,r)$ 之和。

### 思路

#### AC 自动机同时寻找所有询问串

把全部询问串插入 AC 自动机，再扫描一次主串 $S$。当扫描到位置 $r$ 时，当前节点及其失败链上的终止节点，就是所有在 $r$ 结尾的询问串。

代码在 fail 树上预处理每个节点最近的终止祖先 `f[u]`，扫描时沿终止链跳转，把每个询问串在 $S$ 中的所有出现起点记录到 `loc`。相同询问串会落在同一个终止节点，只需计算一次，再把答案复制给该节点保存的全部询问编号。

#### 最大好区间

固定 $t$ 的一次出现 $[l,r]$。任何包含它的好区间都可以分成三部分：

- 必须选中的 $[l,r]$；
- $l$ 左侧、以 $l-1$ 结尾的一段后缀；
- $r$ 右侧、以 $r+1$ 开始的一段前缀。

左右扩展相互独立，而且负贡献可以不选。因此包含这次出现的最大区间和为

$$
\max(0,endMax_{l-1})
+\sum_{i=l}^{r}a_i
+\max(0,startMax_{r+1})
$$

其中：

- $endMax_i$ 是必须以 $i$ 结尾的最大子段和；
- $startMax_i$ 是必须以 $i$ 开始的最大子段和。

它们分别用正向和反向 Kadane 预处理。对 $t$ 的所有出现取最大值，就是最大好区间答案。

#### 让每个好区间只被统计一次

设 $t$ 的长度为 $len$，所有出现起点依次为

$$
p_1<p_2<\cdots<p_m
$$

并令 $p_0=0$。把每个好区间分配给它包含的最左一次出现。若最左出现是第 $j$ 次，则区间左端点 $L$ 和右端点 $R$ 必须满足

$$
p_{j-1}<L\le p_j,\qquad
p_j+len-1\le R\le n
$$

左侧条件保证第 $j-1$ 次及更早的出现没有被完整包含，右侧条件保证第 $j$ 次出现被包含。不同 $j$ 对应的区间集合互不相交，并且覆盖全部好区间。

令 $X=L-1$、$Y=R$，再令权值前缀和为 $P_i$，则

$$
f(L,R)=P_Y-P_X
$$

对一个矩形范围 $X\in[A,B]$、$Y\in[C,D]$，区间和总和为

$$
(B-A+1)\sum_{Y=C}^{D}P_Y
-(D-C+1)\sum_{X=A}^{B}P_X
$$

代码用普通前缀和

$$
P_i=\sum_{j=1}^{i}a_j
$$

和带权前缀和

$$
I_i=\sum_{j=1}^{i}j\cdot a_j
$$

在 $O(1)$ 内求一段前缀和之和。例如

$$
\sum_{r=C}^{D}P_r
=(D-C+1)P_D-
\sum_{i=C}^{D}(i-C)a_i
$$

而最后一项可以由 $P$ 和 $I$ 求出。把每次出现对应的矩形答案累加并对 $998244353$ 取模，即得到所有不同好区间的权值和。

### 正确性说明

AC 自动机记录了每个询问串的全部出现。最大值部分对任意固定出现选择最优左右扩展，再在全部出现中取最大，所以既不会漏掉最优好区间，也不会引入不含询问串的区间。

求和部分按区间包含的最左出现分类。每个好区间存在唯一的最左出现，故恰好进入一个矩形；矩形公式又逐项计算了其中每个区间的前缀和之差。因此累加结果恰好是所有不同好区间的 $f(l,r)$ 之和。

### 复杂度

设全部询问串总长度为 $L$，沿终止链实际记录的模式出现总数为 $Occ$。建 AC 自动机和扫描主串的基础开销为 $O(L+n)$，记录出现并计算答案为 $O(Occ+q)$，总时间复杂度为

$$
O(L+n+Occ+q)
$$

空间复杂度为 $O(L+Occ+n+q)$。该实现是按实际出现次数计费的。

### 参考代码

```cpp title="L.cpp"
#include<bits/stdc++.h>
using namespace std;
constexpr int sigma=26;
typedef long long ll;
const ll mod=998244353;
const int N=3e5+5;
struct ACAM
{
    struct Node
    {
        int fail;
        int next[sigma];
        int len;
        vector<int>idx;
        Node()
        {
            init();
        }
        void init()
        {
            fail = 0;
            len = 0x7fffffff;
            idx.clear();
            memset(next, 0, sizeof(next));
        }
    } tr[N];
    static int tonum(char x)
    {
        return x - 'a';
    }
    void init()
    {
        for (int i = 0; i <= tot; i++)
        {
            tr[i].init();
        }
        tot = 0;
    }
    int tot = 0;
    void insert(const string &s, int idx = 1) // 插入
    {
        int p = 0;
        for (int i = 0; i < s.size(); i++)
        {
            int c = tonum(s[i]);
            if (!tr[p].next[c])
            {
                tr[p].next[c] = ++tot;
            }
            p = tr[p].next[c];
        }
        tr[p].len = s.length();
        // cerr<<p<<" "<<s.length()<<endl;
        tr[p].idx.push_back(idx);
    }
    void bulid() // 建fail树
    {
        queue<int> q;
        for (int i = 0; i < sigma; i++)
        {
            if (tr[0].next[i])
                q.push(tr[0].next[i]);
        }
        while (!q.empty())
        {
            auto u = q.front();
            q.pop();
            for (int i = 0; i < sigma; i++)
            {
                int p = tr[u].next[i];
                int fail = tr[u].fail;
                if (p)
                    tr[p].fail = tr[fail].next[i], q.push(tr[u].next[i]);
                else
                    tr[u].next[i] = tr[tr[u].fail].next[i];
            }
        }
    }
    int next(int p,int c)
    {
        return tr[p].next[c];
    }
    int link(int p)
    {
        return tr[p].fail;
    }
} acam;
ll add(ll x,ll y)
{
    return (x+mod+y)%mod;
}
ll del(ll x,ll y)
{
    return (x+mod-y)%mod;
}
ll mul(ll x,ll y)
{
    return (x*y)%mod;
}
void solve()
{
    int n,q;
    cin>>n>>q;
    string t;
    cin>>t;
    // cerr<<t<<endl;
    vector<ll>v(n+1,0);
    for (int i=1;i<=n;i++)
    {
        cin>>v[i];
    }
    vector<ll>pre(n+1,0);
    vector<ll>ipre(n+1,0);
    vector<ll>premax(n+2,0);
    vector<ll>sufmax(n+2,0);
    vector<ll>orpre(n+1,0);
    for (int i=1;i<=n;i++)
    {
        pre[i]=add(pre[i-1],v[i]);
        ipre[i]=add(ipre[i-1],mul(i,v[i]));
        // cerr<<ipre[i]<<"\n";
        orpre[i]=orpre[i-1]+v[i];
    }
    for (int i=1;i<=n;i++)
    {
        premax[i]=max(v[i],premax[i-1]+v[i]);

    }
    for (int i=n;i>=1;i--)
    {
        sufmax[i]=max(v[i],sufmax[i+1]+v[i]);
    }
    vector<ll>res(q+1,0);
    vector<ll>resmax(q+1,0);
    acam.init();
    for (int i=1;i<=q;i++)
    {
        string s;
        cin>>s;
        // cerr<<s<<endl;
        acam.insert(s,i);
    }
    // for (int i=1;i<=acam.tot;i++)
    // {
    //     cerr<<acam.tr[i].len<<"\n";
    // }
    acam.bulid();
    // for (int i=1;i<=acam.tot;i++)
    // {
    //     cerr<<acam.tr[i].len<<"\n";
    // }
    t=" "+t;
    int p=0;
    vector<vector<int>>adj(acam.tot+1);
    for (int i=1;i<=acam.tot;i++)
    {
        adj[acam.link(i)].push_back(i);
    }
    vector<int>f(acam.tot+1,0);
    vector<vector<ll>>loc(acam.tot+1);
    auto dfs=[&](int u,int fa,auto &&self)->void
    {
        f[u]=fa;
        // cerr<<u<<"\n";
        if(acam.tr[u].idx.size())
        {
            fa=u;
        }
        for (auto v:adj[u])
        {
            self(v,fa,self);
        }
    };
    // cerr<<1<<endl;
    dfs(0,0,dfs);
    // cerr<<1<<endl;
    for (int i=1;i<=n;i++)
    {
        auto c=t[i]-'a';
        p=acam.next(p,c);
        // cerr<<c<<endl;
        auto tp=p;
        // cerr<<p<<endl;
        while(tp)
        {
            // cerr<<tp<<" "<<i<<" "<<acam.tr[tp].len<<" "<<tp<<endl;
            loc[tp].push_back(i-acam.tr[tp].len+1);
            tp=f[tp];
            // cerr<<tp<<"\n";
        }
    }
    // for (int i=1;i<=acam.tot;i++)
    // {
    //     cerr<<acam.tr[i].len<<"\n";
    // }
    // cerr<<1<<endl;
    auto get=[&](ll C,ll D)
    {

        ll left = del(ipre[D], (C-1>=0 ? ipre[C-1] : 0));
        ll right = mul(C, del(pre[D], (C-1>=0 ? pre[C-1] : 0)));
        return del(left, right);
    };
    auto calnum=[&](ll A,ll B,ll C,ll D)
    {
        // cerr<<mul(pre[D],(D-C+1))<<" "<<pre[D]<<" "<<D-C+1<<"\n";
        ll lh=mul(B-A+1,del(mul(pre[D],(D-C+1)),get(C,D)));
        // cerr<<lh<<endl;
        ll rh=mul(D-C+1,del(mul(B-A+1,pre[B]),get(A,B)));
        return del(lh,rh);
    };
    auto getmax=[&](ll l,ll r)
    {
        // cerr<<premax[l-1]<<" "<<sufmax[r+1]<<" "<<l<<" "<<r<<endl;
        ll res=max(0ll,premax[l-1])+orpre[r]-orpre[l-1]+max(0ll,sufmax[r+1]);
        return res;
    };
    for (int i=0;i<=acam.tot;i++)
    {
        if(acam.tr[i].idx.size())
        {
            ll premax=-1e18;
            ll ans=0;
            // cerr<<i<<endl;
            for (int j=0;j<loc[i].size();j++)
            {
                // cerr<<i<<" "<<j<<" "<<loc[i][j]<<endl;
                if(j==0)
                {
                    ans=add(ans,calnum(0ll,loc[i][j]-1,loc[i][j]+acam.tr[i].len-1,n));
                    premax=max(premax,getmax(loc[i][j],loc[i][j]+acam.tr[i].len-1));
                }
                else
                {
                    ans=add(ans,calnum(loc[i][j-1],loc[i][j]-1,loc[i][j]+acam.tr[i].len-1,n));
                    premax=max(premax,getmax(loc[i][j],loc[i][j]+acam.tr[i].len-1));
                }
                // cerr<<i<<" "<<j<<endl;
            }
            for (auto x:acam.tr[i].idx)
            {
                res[x]=ans;
                resmax[x]=premax;
            }
            // cerr<<i<<endl;
        }
    }
    for (int i=1;i<=q;i++)
    {
        cout<<resmax[i]<<" "<<res[i]<<"\n";
    }
}
int main()
{
    int T=1;
    // cin>>T;
    while(T--)
    {
        solve();
    }
}
```

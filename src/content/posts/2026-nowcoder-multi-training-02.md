---
title: "2026 牛客暑期多校第二场题解"
published: 2026-07-30
description: "收录 2026 牛客暑期多校第二场的 6 道题：Problem B、Problem F、Problem G、Problem H、Problem K、Problem L，包含完整思路、正确性说明、复杂度分析与 AC 代码。"
tags: ["ACM", "题解", "牛客多校", "2026 暑假集训"]
category: "竞赛题解"
sourceLink: "https://ac.nowcoder.com/acm/contest/133877"
draft: false
comment: true
lang: "zh_CN"
---

本篇整理自队伍的 2026 暑假集训记录，共收录 **6** 道已通过题目。每题均包含题意、核心思路、正确性说明、复杂度分析和对应的 AC 代码。

比赛链接：[2026 牛客暑期多校第二场](https://ac.nowcoder.com/acm/contest/133877)

## 题目索引

| 题目 | 核心算法 |
| --- | --- |
| Problem B. 按位最大化（Bitwise Maximization） | 线性基、位运算、异或、贪心 |
| Problem F. Fabulous Tree | 树形DP、动态规划、树、绝对值 |
| Problem G. 最大公约数图（GCD Graph） | 数论、最大公约数、容斥原理、莫比乌斯函数、动态规划、质数间隔 |
| Problem H. 超空间配对（Hyperspace Pairing） | 构造、位运算、完美匹配、超立方体、递归 |
| Problem K. 幼儿园（Kindergarten） | 图论、最短路、图压缩、BFS、Dijkstra、动态修改 |
| Problem L. 懒得打乱（Lazy Shuffling） | 状态压缩DP、排列、逆序对、计数、Meet-in-the-Middle |

## Problem B. 按位最大化（Bitwise Maximization）

### 题意

把给定的 $n$ 个非负整数分别放入两个可为空的多重集合。设两个集合内所有数的异或和分别为 $X,Y$，要求最大化

$$
X+Y
$$

每个数必须且只能进入其中一个集合。

### 思路

#### 两个集合的总异或固定

设所有数的异或和为

$$
S=a_1\oplus a_2\oplus\cdots\oplus a_n
$$

如果第一个集合的异或和为 $X$，那么第二个集合的异或和必然是

$$
Y=S\oplus X
$$

因为两个集合合起来恰好包含原序列的所有元素。因此目标变为

$$
X+(S\oplus X)
$$

其中 $X$ 是原序列某个子集的异或和。

#### 逐位分析贡献

考虑第 $b$ 位。

- 若 $S_b=1$，则 $X_b$ 与 $Y_b$ 必然不同。这一位对 $X+Y$ 的贡献恒为 $2^b$；
- 若 $S_b=0$，则 $X_b=Y_b$。当两者都为 $1$ 时，这一位贡献 $2\cdot2^b$，否则贡献 $0$。

所以 $S$ 中为 $1$ 的位对答案的贡献已经固定，只需让 $S$ 中为 $0$ 的那些位组成的数尽可能大。

令

$$
b_i=a_i\mathbin{\&}(\mathord\sim S)
$$

从所有 $b_i$ 中选择一个子集，使其异或和 $Z$ 最大，则答案为

$$
S+2Z
$$

求一组数的最大子集异或和正是线性基的经典应用：从高位到低位插入所有 $b_i$，再贪心得到最大异或值。

#### 代码中的等价写法

现有代码没有显式计算 $a_i\&\sim S$，而是先把 $S$ 中每个为 $1$ 的位对应的单位向量插入线性基，再插入所有 $a_i$。

加入这些单位向量后，$S$ 为 $1$ 的位可以被独立翻转，相当于在线性空间中消去了这些无须优化的位。设线性基求出的最大值为 `res`，代码输出

$$
res+(S\oplus res)
$$

它与 $S+2Z$ 完全等价。

### 正确性说明

任意分组都唯一对应于第一个集合所选的一个子集，因此枚举可行的 $X$ 等价于枚举所有子集异或和。由于 $X\oplus Y=S$，在 $S$ 为 $1$ 的位上答案贡献固定；只有 $S$ 为 $0$ 的位需要最大化。线性基能够求出这些位上的最大可达子集异或值 $Z$，所以 $S+2Z$ 是所有分组中的最大得分。

### 复杂度

数值小于 $2^{30}$，线性基最多处理约 $30$ 位。每组数据时间复杂度为 $O(30n)$，空间复杂度为 $O(30)$（原代码另有存储输入的 $O(n)$ 数组）。

### 参考代码

<details>
<summary>查看 AC 代码：B.cpp</summary>

```cpp title="B.cpp"
#include<bits/stdc++.h>
#define f(i,a,b) for(int i=a;i<=b;i++)
#define df(i,a,b) for(int i=a;i>=b;i--)
#define cmax(a,b) a=max(a,b)
#define cmin(a,b) a=min(a,b)
#define lowbit(x) ((x)&(-(x)))
#define cntbit(x) __builtin_popcount(x)
using namespace std;
typedef long long ll;
const int N=5e5+10;
const ll M=998244353;
int TT=1;

ll qp(ll a,ll x){
    ll res=1;for(;x;x>>=1,a=a*a%M)
        (x&1)&&(res=a*res%M);return res;
}

int n;
ll a[N];
int vis[N];

struct Basis {
    long long d[64];

    Basis() {
        for (int i = 0; i < 64; ++i) d[i] = 0;
    }

    void insert(long long x) {
        for (int i = 62; i >= 0; --i) {
            if (!(x >> i)) continue;
            if (!d[i]) {
                d[i] = x;
                return;
            }
            x ^= d[i];
        }
    }

    long long query_max(long long x) {
        long long res = x;
        for (int i = 62; i >= 0; --i) {
            if ((res ^ d[i]) > res) {
                res ^= d[i];
            }
        }
        return res;
    }
};

void solve(){
    cin>>n;
    ll sumA=0,sumB=0;
    f(i,1,n){
        cin>>a[i];
        sumA^=a[i];
        vis[i]=0;
    }
    ll A=sumA;
    ll sum=0;

    Basis C;
    df(i,30,0){
        if((A>>i)&1){
            // sum+=(1ll<<i);
            C.insert(1ll<<i);
        }
    }


    f(i,1,n){
        C.insert(a[i]);
    }

    ll res=C.query_max(0);
    // cerr<<res<<"\n";
    cout<<(res+(sumA^res))<<"\n";
}



int main(){
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);
    cin>>TT;
    while(TT--) solve();
    return 0;
}
```

</details>

---

## Problem F. Fabulous Tree

### 题意

给定一棵以 $1$ 为根的树，每条边 $(u,v)$ 有非负整数权值 $w_{u,v}$。需要给每个点赋一个非负整数 $a_u$，使每条边都满足

$$
|a_u-a_v|=w_{u,v}
$$

一棵树的复杂度定义为点权最大值与最小值之差。对每个点 $u$，独立地求其子树能够达到的最小复杂度。

### 思路

#### 把非负限制转化为上下延伸量

等式只与点权之差有关，因此给整棵子树的所有点权同时加上一个常数不会影响合法性。可以暂时令子树根 $u$ 的点权为 $0$。

定义

$$
dp[u][i]
$$

表示在 $u$ 的子树中，要求所有点权不低于 $-i$ 时，点权向 $u$ 上方最少还需要延伸多少。也就是说，`dp[u][i]` 是满足所有点权都落在

$$
[-i,dp[u][i]]
$$

内时，右端点的最小值。

如果 $u$ 是叶子，那么只需要放置点权为 $0$ 的 $u$ 自己，所以对任意 $i$ 都有

$$
dp[u][i]=0
$$

如果确定了 $i$，把整个区间向上平移 $i$ 后就得到非负点权，复杂度为

$$
i+dp[u][i]
$$

因此最终答案是

$$
ans_u=\min_i\{i+dp[u][i]\}
$$

#### 合并一棵儿子子树

设 $v$ 是 $u$ 的儿子，边权为 $w$。由于 $a_u=0$，$a_v$ 只有两种选择。

##### 令 $a_v=-w$

只有在 $i\ge w$ 时才能选择这一方向，否则点 $v$ 已经低于下界 $-i$。

从 $v$ 看，它向下还有 $i-w$ 的空间，所以其子树向上最少需要 `dp[v][i-w]`。换回以 $u$ 为原点后，这棵子树的最高点为

$$
dp[v][i-w]-w
$$

同时点 $u$ 自己位于高度 $0$，因此这一方向需要的上方空间为

$$
\max(0,dp[v][i-w]-w)
$$

##### 令 $a_v=w$

此时从 $v$ 看，向下可用的空间变成 $i+w$，其子树在 $u$ 上方需要的空间为

$$
w+dp[v][i+w]
$$

两种方向取较优者，得到儿子 $v$ 对当前状态的要求：

$$
need_v(i)=\min
\begin{cases}
\max(0,dp[v][i-w]-w),&i\ge w\\
w+dp[v][i+w]
\end{cases}
$$

不同儿子之间只共享点 $u$，它们的正负方向可以独立选择。为了同时容纳所有儿子子树，取其中的最大值：

$$
dp[u][i]=\max_{v\text{ 是 }u\text{ 的儿子}}need_v(i)
$$

按后序遍历计算即可。

#### 为什么只需枚举到 $2W-1$

设整组数据中的最大边权为 $W$，并先考虑 $W\ge1$。

任取一个位于整数区间

$$
[0,2W-1]
$$

内的点权 $x$。对于一条权值为 $w\le W$ 的边：

- 如果 $x\ge w$，可以把相邻点放在 $x-w$；
- 如果 $x<w$，由于 $x\le w-1$，有

$$
x+w\le 2w-1\le2W-1
$$

  因而可以把相邻点放在 $x+w$。

从根开始依次决定每条边的正负方向，就能让整棵树的所有点权始终位于 $[0,2W-1]$。所以任何子树的最优复杂度都不会超过

$$
K=2W-1
$$

最优解中，根到最小点权的距离也不会超过 $K$，只需枚举 $0\le i\le K$。

此外，当某棵子树从根向下已有至少 $K$ 的空间时，可以对称地把所有点都安排在 $[-K,0]$ 内，不再需要向上延伸。因此对所有 $i\ge K$ 都可视为

$$
dp[u][i]=0
$$

代码在访问 `dp[v][i+w]` 时把下标截为 `min(K,i+w)`，正是利用了这一性质。

当 $W=0$ 时，所有边权均为 $0$，全部点直接赋相同的值即可，每棵子树的答案都是 $0$。

### 正确性说明

对任意状态 $(u,i)$，每个儿子 $v$ 的点权只能是 $-w$ 或 $w$。转移分别准确计算了这两种选择下，整棵 $v$ 子树在下界不低于 $-i$ 时所需的最小上方空间，并取二者的最小值。不同儿子可以独立选择方向，而容纳所有儿子所需的公共上界等于各自需求的最大值，所以转移得到的就是 `dp[u][i]` 的最优值。

任意合法赋值平移后，都能写成区间 $[-i,h]$，其复杂度为 $i+h$；反过来，每个 DP 方案向上平移 $i$ 后也都是合法的非负赋值。因此 $\min_i(i+dp[u][i])$ 恰好是子树的最小复杂度。由 $2W-1$ 的构造上界可知，枚举范围不会遗漏最优解。

### 复杂度

令所有测试数据中的最大边权为 $W$。每条父子边在每个状态 $i$ 上进行常数次转移，状态数为 $2W$，因此单个测试用例的时间复杂度和空间复杂度均为

$$
O(nW)
$$

题目对 $\sum n$ 与 $W$ 的乘积作了限制，能够覆盖这一复杂度。

### 参考代码

<details>
<summary>查看 AC 代码：F.cpp</summary>

```cpp title="F.cpp"
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

int n;
vector<pair<int,ll>> to[N];
vector<vector<ll>> dp;
ll W=0;
ll K=0;
ll ans[N];

void dfs(int u,int pre){
    for(auto [v,w]:to[u]){
        if(v==pre) continue;

        dfs(v,u);

        f(i,0,K){
            ll res=1e9;
            if(i>=w){
                cmin(res,max(0ll,dp[v][i-w]-w));
            }
            cmin(res,dp[v][min(K,i+w)]+w);
            cmax(dp[u][i],res);
            // cmin(ans[u],i+dp[u][i]);
        }
    }

    f(i,0,K){
        cmin(ans[u],dp[u][i]+i);
    }
}

void solve(){
    cin>>n;
    f(i,0,n) to[i].clear(),ans[i]=1e18;
    W=0;

    f(i,1,n-1){
        int x,y;
        ll w;
        cin>>x>>y>>w;
        to[x].push_back({y,w});
        to[y].push_back({x,w});
        cmax(W,w);
    }

    if(W==0){
        f(i,1,n) cout<<0<<" ";
        cout<<"\n";
        return;
    }

    K=2*W-1;

    dp.assign(n+1,vector<ll>(K+5,0));

    dfs(1,0);

    f(i,1,n) cout<<ans[i]<<" ";
    cout<<"\n";
}



int main(){
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);
    cin>>TT;
    while(TT--) solve();
    return 0;
}
```

</details>

---

## Problem G. 最大公约数图（GCD Graph）

### 题意

有一张顶点为所有正整数的有向图。对于 $i<j$，存在从 $i$ 到 $j$ 的边，边权为

$$
\gcd(i,j)
$$

令 $cost(u,v)$ 为从 $u$ 到 $v$ 的最短路长度。对每组询问给定 $l,r,n$，求

$$
\sum_{i=l}^{r}cost(i,n)
$$

其中 $1\le l\le r<n\le10^7$。

### 思路

#### 找到小于 $n$ 的最大质数

令 $p$ 为严格小于 $n$ 的最大质数。

在 $n\le10^7$ 的范围内，相邻质数很密，$n-p$ 的最大值不超过 $150$。因此可以把询问区间分成两部分：

- $x<p$ 的大段区间，用数论公式计算；
- $p\le x<n$ 的短尾部，用最短路 DP 直接计算。

当 $n$ 很小时可以直接对全部点做后面的 DP。

#### 对于 $x<p$，最短路只可能是 1 或 2

因为 $x<p$ 且 $p$ 是质数，所以

$$
\gcd(x,p)=1
$$

同时，小于 $n$ 的最大质数满足 $p>n/2$（可由 Bertrand 定理得到，小范围也可以直接检查），所以 $p$ 不可能整除 $n$，从而

$$
\gcd(p,n)=1
$$

因此总能通过

$$
x\rightarrow p\rightarrow n
$$

得到一条代价为 $2$ 的合法递增路径。

如果 $\gcd(x,n)=1$，直接从 $x$ 走到 $n$ 的边权就是 $1$。所有边权都是正整数，所以不可能存在比 $1$ 更短的路径，即

$$
cost(x,n)=1
$$

如果 $\gcd(x,n)>1$，直接边的权值大于 $1$；任何总权值为 $1$ 的路径只能由一条权值为 $1$ 的边组成，所以最短路不可能是 $1$。结合上面的两跳路径可得：对于所有 $x<p$，

$$
cost(x,n)=
\begin{cases}
1,&\gcd(x,n)=1\\
2,&\gcd(x,n)>1
\end{cases}
$$

#### 转化为区间互质计数

设需要用公式处理的区间为 $[L,R]$，其中 $R<p$，长度为

$$
len=R-L+1
$$

其中与 $n$ 互质的数有 $cnt$ 个，则答案为

$$
cnt+2(len-cnt)=2len-cnt
$$

这一部分只需统计 $[L,R]$ 中有多少个数与 $n$ 互质。

#### 莫比乌斯函数统计互质数

利用经典恒等式

$$
[\gcd(i,n)=1]=\sum_{d\mid\gcd(i,n)}\mu(d)
$$

交换求和顺序，可以得到 $[1,x]$ 中与 $n$ 互质的整数个数：

$$
\begin{aligned}
C(x)
&=\sum_{i=1}^{x}[\gcd(i,n)=1]\\
&=\sum_{d\mid n}\mu(d)\left\lfloor\frac{x}{d}\right\rfloor
\end{aligned}
$$

所以区间 $[L,R]$ 内与 $n$ 互质的数为

$$
cnt=C(R)-C(L-1)
$$

代码用线性筛一次性预处理 $1\sim10^7$ 的质数和莫比乌斯函数 $\mu$。每组询问枚举 $n$ 的因数对，对每个 $d\mid n$ 累加

$$
\mu(d)\left(
\left\lfloor\frac{R}{d}\right\rfloor-
\left\lfloor\frac{L-1}{d}\right\rfloor
\right)
$$

即可得到 `cnt`。因此长区间部分的答案为

$$
2(R-L+1)-C(R)+C(L-1)
$$

当 $n$ 本身是质数时，所有 $1\le i<n$ 都与 $n$ 互质，答案直接是 $r-l+1$，代码对此进行了特判。

#### 靠近 $n$ 的部分直接做 DP

对于 $p\le u<n$，中间可能已经没有合适的质数，最短路不一定能由上面的互质计数直接确定。但这一段长度至多约 $150$，可以在完整有向无环图上倒序 DP。

令 $dp[u]$ 表示从 $u$ 到 $n$ 的最短路，边界为

$$
dp[n]=0
$$

从 $u$ 出发的第一步可以走向任意 $v>u$，所以转移为

$$
dp[u]=\min_{u<v\le n}\left(\gcd(u,v)+dp[v]\right)
$$

按 $u=n-1,n-2,\dots,p$ 的顺序计算即可。最后把 $[\max(l,p),r]$ 中的 `dp` 累加到答案。

完整流程如下：

1. 线性筛预处理质数与莫比乌斯函数；
2. 若 $n$ 是质数，直接输出 $r-l+1$；
3. 否则求出严格小于 $n$ 的最大质数 $p$；
4. 对 $[l,\min(r,p-1)]$ 用莫比乌斯函数统计互质数，并按 $2len-cnt$ 计入答案；
5. 倒序计算 $[p,n]$ 的最短路 DP，累加询问落在短尾部内的部分。

### 正确性说明

对于 $x<p$，路径 $x\to p\to n$ 的两条边权都为 $1$，所以最短路至多为 $2$；直接边权为 $1$ 当且仅当 $x$ 与 $n$ 互质，因此互质时最短路为 $1$，否则恰为 $2$。莫比乌斯恒等式准确统计了这部分与 $n$ 互质的点。

对于 $u\ge p$，任意路径的第一条边都会到达某个 $v>u$。倒序计算时所有 `dp[v]` 已知，枚举第一步的全部选择并取最小值，依据最优子结构可得 `dp[u]` 正确。两部分覆盖询问区间且互不重叠，所以相加就是最终答案。

### 复杂度

线性筛预处理时间复杂度为 $O(10^7)$，空间复杂度为 $O(10^7)$。设 $d=n-p$，每组询问枚举因数和尾段 DP 的时间复杂度为

$$
O(\sqrt n+d^2\log n)
$$

其中 $d\le150$，`gcd` 的单次复杂度为 $O(\log n)$。每组数据除全局筛表外只需 $O(d)$ 额外空间。

### 参考代码

<details>
<summary>查看 AC 代码：G.cpp</summary>

```cpp title="G.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int N = 1e7;
ll notprime[N + 5];
ll mu[N + 5];
vector<int> pri;
void init()
{
    mu[1] = 1;
    for (int i = 2; i <= N; i++)
    {
        // cerr<<i<<endl;
        if (!notprime[i])
        {
            pri.push_back(i);
            mu[i] = -1;
            // cerr<<i<<endl;
        }
        for (auto j : pri)
        {
            if ((ll)i * (ll)j > (ll)N)
            {
                break;
            }
            notprime[i * j] = 1;
            if (i % j == 0)
            {
                mu[i * j] = 0;
                break;
            }
            mu[i * j] = -mu[i];
        }
    }
}
int cal(int x, int i)
{
    if (x == 0)
        return 0;
    else
        return x / i;
}
int cal1(int l, int r, int d)
{
    int ret = 0;
    for (int i = l; i <= r; i++)
    {
        if (i % d == 0)
        {
            ret++;
        }
    }
    return ret;
}
void solve()
{
    int l, r, n;
    cin >> l >> r >> n;
    // cerr<<l<<" "<<r<<" "<<n<<endl;
    if (!notprime[n] || n == 1)
    {
        cout << r - l + 1 << "\n";
    }
    else
    {
        auto ptr = upper_bound(pri.begin(), pri.end(), n);
        ptr--;
        int x = *ptr;
        // cerr<<x<<endl;
        unordered_map<int, int> dp;
        dp[n] = 0;
        for (int i = n - 1; i >= x; i--)
        {
            for (int j = i + 1; j <= n; j++)
            {
                int tmp = dp[j] + gcd(i, j);
                if (!dp.count(i))
                {
                    dp[i] = tmp;
                }
                else
                {
                    dp[i] = min(dp[i], tmp);
                }
            }
        }
        int ans = 0;
        for (int i = max(x, l); i <= r; i++)
        {
            ans += dp[i];
        }
        int up = min(x - 1, r);
        // cerr<<up<<" "<<endl;
        if (up < l)
        {
            cout << ans << "\n";
            return;
        }
        ans += 2 * (up - l + 1);
        // cerr<<up<<"\n";
        // cerr<<ans<<"\n";
        if (up >= l)
        {
            int tp = 0;
            for (int i = 1; i * i <= n; i++)
            {
                if (i * i == n)
                {
                    // cerr<<i<<endl;
                    ans -= mu[i] * (cal(up, i) - cal(l - 1, i));
                    // tp+=mu[i]*cal1(l,up,i);
                }
                else if (n % i == 0)
                {
                    // cerr<<i<<endl;
                    ans -= mu[i] * (cal(up, i) - cal(l - 1, i));
                    // tp+=mu[i]*cal1(l,up,i);
                    int oth = n / i;
                    // cerr<<oth<<endl;
                    ans -= mu[oth] * (cal(up, oth) - cal(l - 1, oth));
                    // tp+=mu[oth]*cal1(l,up,oth);
                }
                // cerr<<"ans: "<<ans<<"\n";
            }

            // for (int i=l;i<=up;i++)
            // {
            //     for (int d=1;d<=n;d++)
            //     {
            //         if(i%d==0&&n%d==0)
            //         {
            //             tp+=mu[d];
            //         }
            //     }
            // }
            // cerr<<tp<<endl;
            // cerr<<tp<<endl;
            // tp=0;
            // for (int d=1;d<=n;d++)
            // {
            //     if(n%d==0)
            //     {
            //         cerr<<d<<endl;
            //     for (int i=l;i<=up;i++)
            //     {
            //         if(i%d==0)
            //         {
            //         tp+=mu[d];
            //         }
            //     }
            //     }
            // }
            // cerr<<tp<<endl;
        }

        cout << ans << "\n";
    }
}
int main()
{
    int t;
    cin >> t;
    init();
    // cerr<<1<<endl;
    while (t--)
    {
        solve();
    }
}
```

</details>

---

## Problem H. 超空间配对（Hyperspace Pairing）

### 题意

有一张包含 $2^n$ 个点的图，每个点对应一个长度为 $n$ 的二进制串，并用该二进制串表示的整数 $0,1,\dots,2^n-1$ 编号。

两个点相邻，当且仅当它们的二进制表示恰好有两个位置不同，即

$$
\operatorname{popcount}(u\oplus v)=2
$$

现在删去两个不同的点 $a,b$。判断剩余的 $2^n-2$ 个点能否两两配对，使每一对点都相邻；如果可以，需要输出一种方案。

### 思路

#### 二进制中 $1$ 的个数奇偶性是不变量

沿一条边移动时恰好翻转两个二进制位，所以 `popcount` 的奇偶性不会改变。

反过来，任意两个 `popcount` 奇偶性相同的点，其异或中都有偶数个 $1$，可以每次翻转其中两个不同位，从一个点走到另一个点。因此整张图恰好分成两个连通分量：

- 偶数个 $1$ 的点组成一个分量；
- 奇数个 $1$ 的点组成另一个分量。

两个分量的大小均为 $2^{n-1}$。由于 $n\ge2$，该大小为偶数。

如果 $a,b$ 的奇偶性不同，那么两个分量各删去一个点，剩余大小都为奇数，不可能分别形成完美匹配。因此有解的必要条件是

$$
\operatorname{popcount}(a)\equiv\operatorname{popcount}(b)\pmod 2
$$

等价地，令 $d=a\oplus b$，必须有

$$
k=\operatorname{popcount}(d)
$$

为偶数。

下面给出这个条件成立时的构造，从而证明它也是充分条件。

#### 把被删点标准化为 $0$ 和 $2^k-1$

先对所有点统一异或 $a$，则被删点 $a$ 变成 $0$，另一个被删点变成 $d=a\oplus b$。统一异或不会改变任意两点的汉明距离。

再重新排列二进制位，把 $d$ 中为 $1$ 的 $k$ 个位置放到最低的 $k$ 位，其余位置放到高位。坐标置换同样不会改变汉明距离。经过这两步后，两个被删点变成

$$
0,\qquad 2^k-1
$$

代码中的数组 `p` 记录这个位坐标置换。对于标准化后的点 $x$，函数 `G(x)` 先把第 $i$ 位放回原来的第 `p[i]` 位，再整体异或 $a$，得到原图中的点。

#### 先处理低 $k$ 位之外的所有点

考虑所有满足 $x\ge2^k$ 的点，即至少有一个高位为 $1$ 的点。把它们按照

$$
x\longleftrightarrow x\oplus3
$$

配对。

异或 $3=(11)_2$ 恰好翻转最低两位，所以一对点的汉明距离为 $2$。同时该操作不会改变高位，因此 $x\ge2^k$ 的点仍会落在这个区域内，所有这些点被不重不漏地配完。

现在只剩低 $k$ 位构成的子立方体

$$
[0,2^k-1]
$$

并且需要排除它的两个端点 $0$ 和 $2^k-1$。由于 $a\ne b$ 且 $k$ 为偶数，所以 $k\ge2$。

#### 递归匹配低 $k$ 位子立方体

代码中的 `dfs(t)` 构造一个 $2t$ 维子立方体的匹配：在

$$
[0,2^{2t}-1]
$$

中排除 $0$ 和 $2^{2t}-1$，匹配其余所有点。最终调用 `dfs(k/2)`。

##### 递归边界

当 $t=1$ 时只有两位。删去 `00` 和 `11` 后只剩 `01` 和 `10`，二者恰好相差两位，直接配对即可：

$$
1\longleftrightarrow2
$$

##### 递归转移

设

$$
V=2^{2(t-1)}-1
$$

先递归处理区间 $[0,V]$，其中除 $0,V$ 外的点已经全部匹配，暂时留下点 $V$。

对于新增的两个高位，通常仍然使用 $x\leftrightarrow x\oplus3$ 配对。这个默认方案中有两对需要改接：

- $2V$ 原本与 $(2V)\oplus3$ 配对；
- $4V$ 原本与全 $1$ 点 $4V+3=2^{2t}-1$ 配对，但全 $1$ 点必须被删除。

因此删去这两条默认配对，改为

$$
V\longleftrightarrow2V
$$

以及

$$
(2V\oplus3)\longleftrightarrow4V
$$

第一对的异或值只在第 $0$ 位和第 $2(t-1)$ 位为 $1$，第二对的异或值只在第 $0$ 位和最高位为 $1$，所以两对也都恰好相差两个二进制位。

其余点继续按 $x\leftrightarrow x\oplus3$ 配对。这样，上一层遗留的 $V$ 被接入，新一层的全 $1$ 点被留出，恰好形成相同形式的递归问题。

代码使用 `vis` 标记已经配对的点，按上述规则扫描并输出每一对。

### 正确性说明

每条边都会翻转恰好两个二进制位，所以点的 `popcount` 奇偶性沿边不变，图被分成大小均为 $2^{n-1}$ 的两个连通分量。若 $a,b$ 奇偶性不同，两个分量删点后均为奇数阶，不可能存在完美匹配，因此代码输出 `No` 正确。

若 $a,b$ 奇偶性相同，则 $k=\operatorname{popcount}(a\oplus b)$ 为正偶数。统一异或和位坐标置换都是图的自同构，所以只需在删去 $0$ 与 $2^k-1$ 的标准化图中构造匹配。

低 $k$ 位之外的点被 $x\leftrightarrow x\oplus3$ 完整划分，每对点都恰好相差两位。对低 $k$ 位子立方体，`dfs(t)` 的边界显然成立；递归步骤保留上一层的所有合法配对，只把两条默认配对改接，使上一层遗留点被匹配、本层全 $1$ 点被排除，并且新增的两条边仍然都只翻转两个二进制位。因此由数学归纳法，`dfs(k/2)` 恰好匹配除两个被删点外的所有低位点。

两部分点集互不相交且覆盖所有剩余点。最后通过 `G` 映射回原编号后，相邻关系仍被保持，所以输出的是原图的一组合法完美匹配。

### 复杂度

算法需要输出 $2^{n-1}-1$ 对点，因此时间复杂度为

$$
O(2^n)
$$

`vis` 数组和答案数组占用的空间复杂度均为 $O(2^n)$。题目保证所有测试用例的 $\sum2^n\le2^{22}$。

### 参考代码

<details>
<summary>查看 AC 代码：H.cpp</summary>

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

int n;
int A,B;

int p[N];

vector<pair<int,int>> ans;

int G(int x){
    int res=0;
    f(i,0,n-1){
        if((x>>i)&1){
            res+=(1<<p[i]);
        }
    }

    res^=A;

    return res;
}

int vis[(1<<22)];

void dfs(int k){
    if(k==1){
        ans.push_back({1,2});
        return ;
    }

    dfs(k-1);

    int V=(1<<(2*(k-1)))-1;

    f(i,V+1,4*V+3){
        if(vis[i]) continue;
        if(i==2*V){
            ans.push_back({V,i});
            vis[V]=vis[i]=1;
        }
        else if(i==((2*V)^3)){
            ans.push_back({i,4*V});
            vis[4*V]=vis[i]=1;
        }
        else if(vis[i^3]) continue;
        else {
            ans.push_back({i,i^3});
            vis[i]=vis[i^3]=1;
        }
    }
}

void solve(){
    cin>>n>>A>>B;

    ans.clear();

    int a=0,b=A^B;

    f(i,0,(1<<n)-1){
        vis[i]=0;
    }

    if((cntbit(a)%2)!=(cntbit(b)%2)){
        cout<<"No\n";
        return ;
    }

    int node=0;
    f(i,0,n-1){
        if((b>>i)&1){
            p[node++]=i;
        }
    }
    f(i,0,n-1){
        if(((b>>i)&1)==0){
            p[node++]=i;
        }
    }

    int k=cntbit(b);

    f(i,(1<<k),(1<<n)-1){
        if(vis[i]||vis[i^3]) continue;
        ans.push_back({i,i^3});
        vis[i]=vis[i^3]=1;
    }

    dfs(k/2);


    cout<<"Yes\n";
    for(auto [x,y]:ans){
        cout<<G(x)<<" "<<G(y)<<"\n";
    }
}



int main(){
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);
    cin>>TT;
    while(TT--) solve();
    return 0;
}
```

</details>

---

## Problem K. 幼儿园（Kindergarten）

### 题意

有一张 $n$ 个点、$m$ 条边的无向连通图。通常每条边的通过时间都是 $T$，但其中有 $k$ 条边正在举办活动，它们各自有单独的边权。

接下来进行 $q$ 次更新。每次更新会修改某一条活动边的边权，随后给出若干组询问，要求回答两点之间的最短路长度。所有修改都会保留到后续操作中。

数据范围中

$$
n\le2\times10^3,\qquad m\le10^5,\qquad k\le50
$$

并且所有更新后的询问数量之和不超过 $2\times10^4$。

### 思路

#### 把图分成普通边与特殊边

把会被修改的 $k$ 条活动边称为特殊边，其余边称为普通边。

删除所有特殊边后，得到一张始终不变的普通图 $G_0$。其中每条边的权值都是 $T$，所以从一个点进行一次 BFS，就能求出它到其他点经过的最少普通边数，再乘 $T$ 即为只走普通边的最短距离。

记

$$
d_0(u,v)
$$

为 $u,v$ 之间只使用普通边时的最短距离；不可达时记为无穷大。

现有代码从每个点出发各做一次 BFS，预处理全部 $d_0(u,v)$。虽然原图连通，但删除特殊边后可能不连通，因此预处理与后续转移都要保留不可达状态。

#### 最短路只需关注特殊边端点

设所有特殊边端点组成的集合为 $P$，其大小满足

$$
r=|P|\le2k\le100
$$

任意一条原图路径都可以拆成若干段：

- 一段只经过普通边；
- 经过一条特殊边；
- 再走一段普通边；
- 如此交替。

每一段普通路径都可以直接替换为其两端之间的 $d_0$，而每条特殊边的两个端点都属于 $P$。因此，除了询问的起点和终点，真正需要在最短路过程中逐个考虑的点只有 $P$ 中的至多 $2k$ 个点。

在特殊端点之间建立一张压缩图。对于两个端点 $P_i,P_j$，一次转移可以选择：

1. 只走普通边，代价为 $d_0(P_i,P_j)$；
2. 若二者之间存在特殊边，直接经过其中当前边权最小的一条。

因此压缩图中的边权为

$$
w(i,j)=\min\bigl(d_0(P_i,P_j),\ d_s(i,j)\bigr)
$$

其中 $d_s(i,j)$ 是连接这两个端点的所有特殊边中的最小当前边权。

#### 在压缩图上回答一次询问

对于询问 $(S,E)$，令 `dist[i]` 表示从 $S$ 到特殊端点 $P_i$ 的当前最短距离。

只走普通边到达第一个特殊端点，所以初始化为

$$
dist[i]=d_0(S,P_i)
$$

完全不经过特殊边的答案为 $d_0(S,E)$，先用它初始化答案。

随后在至多 $2k$ 个点的稠密压缩图上运行朴素 Dijkstra。每确定一个当前距离最小的端点 $P_u$：

- 尝试只走普通边到终点，用

$$
dist[u]+d_0(P_u,E)
$$

更新答案；

- 枚举所有特殊端点 $P_v$，用

$$
dist[v]\leftarrow\min\bigl(dist[v],dist[u]+w(u,v)\bigr)
$$

进行松弛。

压缩图只有 $O(k)$ 个点且非常稠密，使用数组每轮暴力选择最小的未确定点即可。堆优化不会改善这里的 $O(k^2)$ 主复杂度，反而会增加常数。

#### 处理特殊边修改与重边

原图允许重边，所以两个特殊端点之间可能有多条特殊边。

代码中的 `dis2[i][j]` 维护 $d_s(i,j)$。当某条特殊边被修改时，新的边权既可能变小，也可能变大；如果它原来恰好是最小边，不能直接用新值覆盖 `dis2`。

因此代码先把这一对端点的 `dis2` 重置为无穷大，再扫描全部 $k$ 条特殊边，重新求出连接这对端点的最小边权。单次更新需要 $O(k)$ 时间。

### 正确性说明

只由普通边组成的任意路径段，其长度都不小于相同端点之间的 $d_0$；反过来，$d_0$ 对应的普通路径真实存在。因此，把原路径中的每个普通边段替换成一条权值为 $d_0$ 的压缩边，不会丢失任何最优方案。

一条经过特殊边的路径在进入和离开特殊边时一定位于特殊端点集合 $P$ 中，所以任意原图路径都能被完整压缩为：起点到某个特殊端点的普通路径、压缩图中的若干次转移、某个特殊端点到终点的普通路径。反过来，每条压缩边要么对应一条真实的普通最短路，要么对应一条真实的特殊边，因此任意压缩图路径也都能还原为原图中的合法路径。

于是原图中的最短路与上述压缩表示中的最短路长度相同。Dijkstra 正确求出起点到各特殊端点的最短距离，并在每个端点处尝试转入终点；同时初始答案覆盖完全不经过特殊边的情况，所以最终得到的正是 $S$ 到 $E$ 的最短距离。

每次更新后，`dis2` 都重新取相关端点之间所有特殊重边的最小当前权值，所以压缩图始终与当前原图一致，所有后续询问均正确。

### 复杂度

从每个点进行一次 BFS 的预处理时间为

$$
O\bigl(n(n+m)\bigr)=O(nm)
$$

其中利用了连通图满足 $m\ge n-1$。预处理空间复杂度为 $O(n^2+n+m)$。

设全部更新之后的询问总数为 $S=\sum L_i$。每次特殊边更新需要 $O(k)$，每次询问在至多 $2k$ 个点的压缩图上运行朴素 Dijkstra，需要 $O(k^2)$。总时间复杂度为

$$
O(nm+qk+Sk^2)
$$

除预处理距离和原图外，压缩图相关结构占用 $O(k^2)$ 空间。

### 参考代码

<details>
<summary>查看 AC 代码：K.cpp</summary>

```cpp title="K.cpp"
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

ll dis2[203][203];
ll d1[2003][2003];
int n,m,k,Q;
ll T;

int U[N],V[N],vis[N];
ll W[N];
int NU[N],NV[N];
int cntk=0;

ll query(int S,int E){
    vector<ll> dist(cntk+1,0);
    vector<int> dvis(cntk+1,0);

    f(i,1,cntk) dist[i]=d1[S][NU[i]];

    ll ans=d1[S][E];

    f(ii,1,cntk){
        int u=0;

        f(i,1,cntk){
            if(!dvis[i]&&(!u||dist[i]<dist[u])){
                u=i;
            }
        }

        if(!u||dist[u]==1e18) break;

        dvis[u]=1;

        if(d1[NU[u]][E]!=1e18){
            cmin(ans,dist[u]+d1[NU[u]][E]);
        }

        f(v,1,cntk){
            ll w=min(dis2[u][v],d1[NU[u]][NU[v]]);
            if(w!=1e18) cmin(dist[v],dist[u]+w);
        }
    }

    return ans;
}

vector<int> to[2003];
vector<int> sp;

void solve(){
    cin>>n>>m>>T;

    f(i,1,m) vis[i]=0;

    f(i,1,m){
        cin>>U[i]>>V[i];
        W[i]=T;
    }

    set<int> s;
    cin>>k;
    f(i,1,k){
        int w;
        ll c;
        cin>>w>>c;
        s.insert(U[w]);
        s.insert(V[w]);
        sp.push_back(w);
        W[w]=c;
        vis[w]=1;
    }

    cntk=0;
    for(auto u:s){
        NU[++cntk]=u;
        NV[u]=cntk;
    }

    f(i,1,cntk) f(j,1,cntk) dis2[i][j]=1e18;
    f(i,1,cntk) dis2[i][i]=0;

    f(i,1,m){
        if(!vis[i]) {
            to[U[i]].push_back(V[i]);
            to[V[i]].push_back(U[i]);
        }
        else {
            cmin(dis2[NV[U[i]]][NV[V[i]]],W[i]);
            cmin(dis2[NV[V[i]]][NV[U[i]]],W[i]);
        }
    }

    f(s,1,n){
        f(i,1,n) d1[s][i]=1e18;

        queue<int> q;
        d1[s][s]=0;
        q.push(s);

        while(!q.empty()){
            auto u=q.front();q.pop();

            for(auto v:to[u]){
                if(d1[s][v]==1e18){
                    d1[s][v]=d1[s][u]+T;
                    q.push(v);
                }
            }
        }
    }

    cin>>Q;
    while(Q--){
        int x;
        ll y;
        cin>>x>>y;
        W[x]=y;
        int a=NV[U[x]];
        int b=NV[V[x]];

        dis2[a][b]=1e18;
        dis2[b][a]=1e18;

        for(auto id:sp){
            int u=NV[U[id]];
            int v=NV[V[id]];

            cmin(dis2[u][v],W[id]);
            cmin(dis2[v][u],W[id]);
        }

        int L;
        cin>>L;
        while(L--){
            int u,v;
            cin>>u>>v;

            cout<<query(u,v)<<"\n";
        }
    }
}



int main(){
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);
    // cin>>TT;
    while(TT--) solve();
    return 0;
}
```

</details>

---

## Problem L. 懒得打乱（Lazy Shuffling）

### 题意

定义排列 $A$ 的逆序对数为 $f(A)$。给定一个用于打乱下标的排列 $p$，打乱结果为

$$
f_p(A)=[A_{p_1},A_{p_2},\dots,A_{p_n}]
$$

一次打乱的成绩为

$$
g(A,f_p(A))=|f(A)-f(f_p(A))|
$$

如果某个排列 $A$ 能让该成绩在所有长度为 $n$ 的排列中达到最大，就称它为幸运排列。求幸运排列的数量，对 $998244353$ 取模。

### 思路

#### 只有相对顺序被打乱的点对有贡献

考虑原排列中的两个位置 $x,y$。

如果它们在原下标顺序和打乱后的顺序中方向相同，那么无论 $A_x,A_y$ 谁大，这一对要么同时成为两个排列的逆序对，要么同时不成为逆序对，对差值没有贡献。

如果它们的相对顺序被 $p$ 翻转，那么这一对恰好只会在打乱前后之一成为逆序对：

- 一种大小关系给 $f(A)-f(f_p(A))$ 贡献 $+1$；
- 另一种大小关系贡献 $-1$。

因此可以建立一张“反序关系图”，每条边连接一对被打乱改变相对顺序的位置。问题变成：给所有顶点安排互不相同的大小，使所有边的 $\pm1$ 贡献之和的绝对值最大，并统计最优安排数。

题面写法中，可以先求逆置换 `pos`，用 `x<y` 且 `pos[x]>pos[y]` 判断反序关系。现有代码直接使用 `i<j` 且 `p[i]>p[j]` 建图：置换与其逆置换的反序图在重新标号后同构，差值只会整体换号，而题目最大化的是绝对值，所以答案数量不变。

#### 用加入顺序表示排列

把图的 $n$ 个顶点按所分配的数值从小到大依次加入。

令 `mask` 表示已经得到最小的 $|mask|$ 个值的顶点集合。若现在加入顶点 $x$，则 $x$ 比 `mask` 中的每个顶点 $y$ 都大，因此所有连接 $x,y$ 的边贡献都已经确定。

代码预处理有向权值 $w[x][y]$：

- 若 $x,y$ 不是反序关系，$w[x][y]=0$；
- 若 $x$ 后加入会让该边产生正贡献，$w[x][y]=2$；
- 否则 $w[x][y]=-2$。

使用 $\pm2$ 只是把真实差值整体乘了 $2$，不会改变绝对值最大的排列及其数量。

加入 $x$ 时新增的分数为

$$
add(mask,x)=\sum_{y\in mask}w[x][y]
$$

每一种顶点加入顺序都唯一对应一个排列：第一个加入的顶点填 $1$，第二个填 $2$，依此类推。因此子集 DP 不重不漏地枚举了全部 $n!$ 个排列。

#### 同时维护最大值、最小值和方案数

由于最后要最大化差值的绝对值，需要同时知道每个状态可达到的最大分数和最小分数。

定义：

- `mx[mask]`：到达 `mask` 的最大分数；
- `dp[mask]`：达到最大分数的方案数；
- `mn[mask]`：到达 `mask` 的最小分数；
- `dpm[mask]`：达到最小分数的方案数。

从 `mask` 加入未出现的 $x$，转移到 `tar=mask|(1<<x)`：

$$
mx[tar]=\max(mx[tar],mx[mask]+add(mask,x))
$$

最小值同理。出现更优值时覆盖方案数，出现相同值时把方案数相加并取模。

在全集状态中比较 $|mx|$ 和 $|mn|$：

- 较大的一侧就是幸运排列数量；
- 若两者绝对值相等且数值不同，把两侧方案数相加；
- 若 `mx==mn`，两边其实是同一批方案，只统计一次。

#### 快速计算新增贡献

如果每次转移都遍历 `mask` 中的所有顶点，复杂度会多出一个 $n$。代码把最多 $22$ 个二进制位拆成低 $11$ 位和高 $11$ 位，预处理

$$
\sum_{y\in mask}w[x][y]
$$

在两个半区间上的值。一次转移只需查询两张表并相加，即可在 $O(1)$ 时间得到 `add(mask,x)`。

### 正确性说明

反序关系图恰好保留了打乱前后逆序对数之差的所有非零贡献。按数值从小到大加入顶点时，一条边会在较大端点加入的唯一时刻确定贡献，因此每条边被计算恰好一次。每个加入顺序又与一个排列一一对应，所以 DP 枚举了所有排列的完整分数。分别维护全体排列中的最大和最小分数后，比较两者绝对值并统计相应方案，得到的正是全部幸运排列数量。

### 复杂度

共有 $2^n$ 个状态，每个状态尝试至多 $n$ 个新顶点，时间复杂度为

$$
O(n2^n)
$$

四个主 DP 数组的空间复杂度为 $O(2^n)$，两张半区间贡献表占用 $O(n2^{n/2})$ 空间。

### 参考代码

<details>
<summary>查看 AC 代码：L.cpp</summary>

```cpp title="L.cpp"
#include <bits/stdc++.h>
#define f(i, a, b) for (int i = a; i <= b; i++)
#define df(i, a, b) for (int i = a; i >= b; i--)
#define cmax(a, b) a = max(a, b)
#define cmin(a, b) a = min(a, b)
#define lowbit(x) ((x) & (-(x)))
#define lowzero(x) ((x + 1) & (~(x)))
#define cntbit(x) __builtin_popcount(x)
using namespace std;
typedef long long ll;
const int N = 2e5 + 10;
const ll M = 998244353;
int TT = 1;

ll qp(ll a, ll x)
{
    ll res = 1;
    for (; x; x >>= 1, a = a * a % M)
        (x & 1) && (res = a * res % M);
    return res;
}

int n;
int p[23];
int dp[(1 << 22) + 10];
int mx[(1 << 22) + 10];
int mn[(1 << 22) + 10];
int dpm[(1 << 22) + 10];
int nxt1[(1 << 11) + 10][23];
int nxt2[(1 << 11) + 10][23];
int mxt[25][25];

void solve()
{
    cin >> n;
    f(i, 1, n) cin >> p[i];

    f(i, 0, (1 << n) - 1) mx[i] = -1e9, dp[i] = 0, mn[i] = 1e9, dpm[i] = 0;
    mx[0] = 0;
    dp[0] = 1;
    mn[0] = 0;
    dpm[0] = 1;
    int t = 1;
    unordered_map<int, int> mp;
    f(i, 1, 22)
    {
        mp[t] = i;
        t *= 2;
    }

    vector<vector<int>> v(n + 3);

    f(i, 1, n)
    {
        f(j, 1, n)
        {
            mxt[i][j] = 0;
            if (i == j)
                continue;
            if (i > j && p[i] < p[j])
                mxt[i][j] = -2;
            else if (i < j && p[i] > p[j])
                mxt[i][j] = 2;
            // cerr<<i<<" "<<p[i]<<" "<<j<<" "<<p[j]<<endl;
            // cerr<<mxt[i][j]<<endl;
        }
    }
    // for (int i=1;i<=n;i++)
    // {
    //     for (int j=1;j<=n;j++)
    //     {
    //         cerr<<mxt[i][j]<<" ";
    //     }
    //     cerr<<endl;
    // }
    f(i, 0, (1 << n) - 1)
    {
        v[cntbit(i) + 1].push_back(i);
    }
    int mask = (1 << 11) - 1;
    f(j, 1, (1 << n) - 1)
    {
        // cerr << j << endl;
        // cerr << (j & mask) << endl;
        // cerr << (j >> 11) << endl;
        f(i, 1, n)
        {
            int loc = lowbit(j);
            // cerr<<(j^loc)<<" "<<j<<" "<<i<<endl;

            if (mp[loc] <= 11)
            {
                nxt1[j & mask][i] = nxt1[((j & mask) ^ loc)][i] + mxt[i][mp[loc]];
            }
            else
            {

                nxt2[(j >> 11)][i] = nxt2[(j >> 11) ^ (loc >> 11)][i] + mxt[i][mp[loc]];
            }
            // cerr<<nxt1[j^loc][i]<<" "<<nxt1[j][i]<<endl;
        }
    }

    f(i, 1, n)
    {
        for (auto j : v[i])
        {
            // cerr<<i<<" "<<j<<"\n";
            f(x, 1, n)
            {

                if (((j >> (x - 1)) & 1) == 0)
                {
                    int tar = (j | (1 << (x - 1)));
                    // cerr<<j<<" "<<tar<<endl;
                    // cerr<<mx[j]<<" "<<nxt[j][x]<<endl;
                    // cerr<<mn[j]<<" "<<nxt[j][x]<<endl;
                    auto add = nxt1[j & mask][x] + nxt2[(j >> 11)][x];
                    // cerr<<j<<" "<<x<<" "<<add<<endl;
                    // cerr<<mx[j]<<" "<<mn[j]<<endl;
                    if (mx[j] + add > mx[tar])
                    {
                        mx[tar] = mx[j] + add;
                        dp[tar] = dp[j];
                    }
                    else if (mx[j] + add == mx[tar])
                    {
                        dp[tar] = (dp[tar] + dp[j]) % M;
                    }
                    if (mn[j] + add < mn[tar])
                    {
                        mn[tar] = mn[j] + add;
                        dpm[tar] = dpm[j];
                    }
                    else if (mn[j] + add == mn[tar])
                    {
                        dpm[tar] = (dpm[tar] + dpm[j]) % M;
                    }
                }
            }
        }
    }

    int e = (1 << n) - 1;
    if (abs(mx[e]) == abs(mn[e]))
    {
        if (mx[e] == mn[e])
        {
            cout << dp[e] << "\n";
        }
        else
        {
            cout << (dp[e] + dpm[e]) % M << "\n";
        }
    }
    else if (abs(mx[e]) > abs(mn[e]))
    {
        cout << dp[e] << "\n";
    }
    else
    {
        cout << dpm[e] << "\n";
    }
}

int main()
{
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);
    // cin>>TT;
    while (TT--)
        solve();
    return 0;
}
```

</details>

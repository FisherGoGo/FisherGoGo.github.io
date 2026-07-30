---
title: "2026 牛客暑期多校第三场题解"
published: 2026-07-30
description: "收录 2026 牛客暑期多校第三场的 7 道题：Problem A、Problem B、Problem F、Problem I、Problem J、Problem K、Problem L，包含完整思路、正确性说明、复杂度分析与 AC 代码。"
tags: ["ACM", "题解", "牛客多校", "2026 暑假集训"]
category: "竞赛题解"
sourceLink: "https://ac.nowcoder.com/acm/contest/133878"
draft: false
comment: true
lang: "zh_CN"
---

本篇整理自队伍的 2026 暑假集训记录，共收录 **7** 道已通过题目。每题均包含题意、核心思路、正确性说明、复杂度分析和对应的 AC 代码。

比赛链接：[2026 牛客暑期多校第三场](https://ac.nowcoder.com/acm/contest/133878)

## 题目索引

| 题目 | 核心算法 |
| --- | --- |
| Problem A. 连续 1 段与全局位运算 | 位运算、状态维护、贡献法 |
| Problem B. 喝饮料 | 概率、组合数学、Raney 引理、循环引理 |
| Problem F. 三色网格 | 状态压缩、矩阵快速幂、图染色、对称性 |
| Problem I. 交换大师（Swap Master） | 贪心、绝对值、贡献法、分类讨论、前缀最值 |
| Problem J. 带祖先限制的树重构 | 树、贪心、优先队列、启发式合并 |
| Problem K. 路口转向 | 计算几何、叉积 |
| Problem L. 登山博弈 | 博弈论、DAG、动态规划、拓扑序 |

## Problem A. 连续 1 段与全局位运算

### 题意

定义 $f(x)$ 为非负整数 $x$ 的二进制表示中，极长连续 $1$ 段的数量。

给定 $n$ 个数，需要依次执行 $m$ 次全局操作。每次操作给出 `type` 和 $x$：

- `type=1`：令所有 $a_i\leftarrow a_i\mathbin{\&}x$；
- `type=2`：令所有 $a_i\leftarrow a_i\mathbin{|}x$；
- `type=3`：令所有 $a_i\leftarrow a_i\mathbin{\oplus}x$。

每次操作后输出

$$
\sum_{i=1}^{n}f(a_i)
$$

数值和操作数均可达到 $3\times 10^5$，不能逐个修改所有 $a_i$。

### 思路

#### 把连续段数写成相邻位的贡献

把 $x$ 的第 $j$ 个二进制位记作 $b_j$，并在最高位之外补一个恒为 $0$ 的虚拟位 $b_{30}=0$。

每一段连续 $1$ 都有唯一的最高位。若这段的最高位是 $j$，则恰好满足

$$
b_{j+1}=0,\qquad b_j=1
$$

反过来，每一组相邻位 $01$ 也恰好对应一段连续 $1$ 的开头。因此

$$
f(x)=\sum_{j=0}^{29}[b_{j+1}=0\land b_j=1]
$$

问题只与每一对相邻二进制位有关，不必保存完整的数。

#### 代码中的局部状态

代码从高位向低位数连续段：

- 对最高的两位 $(b_{29},b_{28})$，只要状态不是 `00`，就在这两位中出现了一段连续 $1$，贡献为 $1$；
- 对每个 $1\le j\le28$，保存三位 $(b_{j+1},b_j,b_{j-1})$。当且仅当 $b_j=0,b_{j-1}=1$ 时出现一段新的连续 $1$，对应编码 `001` 和 `101`；
- 最低位置不再有新的一位需要接入，因此不产生额外贡献。

`dp[j][s]` 表示有多少个 $a_i$ 在位置 $j$ 的局部二进制状态为 $s$。最高位置有 $4$ 种两位状态，其余有效位置有 $8$ 种三位状态。

这种写法与统计全部相邻位 `01` 完全等价，只是把最高两位中的第一段单独计算。

#### 一次全局操作如何转移

按位与、按位或、按位异或的每一位彼此独立。对固定位置 $j$，把 $x$ 在相同两位或三位上的局部状态记为 `mask`，原状态 $s$ 会确定地变成

$$
s\mathbin{\&}mask,\qquad
s\mathbin{|}mask,\qquad
s\mathbin{\oplus}mask
$$

中的一个。

因此只需枚举当前局部状态，把 `dp[j][s]` 整体转移到 `ndp[j][newState]`。完成所有位置的转移后：

- 最高位置按 `highest` 表统计贡献；
- 中间位置按 `mid` 表统计贡献。

这些贡献之和就是本次操作后的答案。

### 正确性说明

每个极长连续 $1$ 段都有且仅有一个最高位 $j$，并且该位置满足 $(b_{j+1},b_j)=(0,1)$；每个这样的相邻位对也唯一确定一个连续 $1$ 段。因此，对状态 `01` 的计数之和恰好等于 $f(x)$。

对一次全局位运算，任意局部两位或三位状态的新值只由它的原状态和 $x$ 在相同位置的状态决定。算法把处于每种原状态的所有数完整地转移到唯一的新状态，所以转移后的计数仍与所有实际数一一对应。最高两位的非零贡献加上其余位置中 $0\to1$ 边界的贡献，恰好把每个连续 $1$ 段计算一次，故答案正确。

### 复杂度

初始化时间复杂度为 $O(30n)$。每次操作只处理 $30\times4$ 个状态，时间复杂度为 $O(30)$；总时间复杂度为

$$
O(30(n+m))
$$

空间复杂度为 $O(30\times8)$。

### 参考代码

<details>
<summary>查看 AC 代码：A.cpp</summary>

```cpp title="A.cpp"
#include<bits/stdc++.h>
using namespace std;
typedef long long ll;
unordered_map<int,int>highest={{0,0},{1,1},{2,1},{3,1}};
unordered_map<int,int>mid={{0,0},{1,1},{2,0},{3,0},{4,0},{5,1},{6,0},{7,0}};
unordered_map<int,int>lowerest={{0,0},{1,0},{2,0},{3,0}};
ll dp[35][10];
ll ndp[35][10];
void solve()
{
    int n;
    cin>>n;
    vector<int>v(n,0);
    int ans=0;
    for (int i=0;i<=30;i++)
    {
        for (int j=0;j<=8;j++)
        {
            dp[i][j]=ndp[i][j]=0;
        }
    }
    for (int i=0;i<n;i++)
    {
        cin>>v[i];
        for (int j=29;j>=0;j--)
        {
            if(j==29)
            {
                int cnt=0;
                if((v[i]>>29)&1)
                {
                    cnt+=2;
                }
                if((v[i]>>28)&1)
                {
                    cnt+=1;
                }
                dp[j][cnt]++;
                ans+=highest[cnt];
            }
            else if(j!=0)
            {
                int cnt=0;
                if((v[i]>>(j+1))&1)
                {
                    cnt+=4;
                }
                if((v[i]>>j)&1)
                {
                    cnt+=2;
                }
                if((v[i]>>(j-1))&1)
                {
                    cnt++;
                }
                dp[j][cnt]++;
                ans+=mid[cnt];
            }
            else
            {
                int cnt=0;
                if((v[i]>>(1))&1)
                {
                    cnt+=2;
                }
                if((v[i]>>0)&1)
                {
                    cnt++;
                }
                dp[j][cnt]++;
                ans+=lowerest[cnt];
            }

        }

    }
    // cout<<ans<<"\n";
    int m;
    cin>>m;
    while(m--)
    {
        int op,x;
        cin>>op>>x;
        if(op==1)
        {

            for (int j=29;j>=0;j--)
            {
                if(j==29)
                {
                    int cnt=0;
                    if((x>>29)&1)
                    {
                    cnt+=2;
                    }
                    if((x>>28)&1)
                    {
                    cnt+=1;
                    }
                    for (int i=0;i<4;i++)
                    {

                        ndp[j][(cnt&i)]+=dp[j][i];
                    }
                }
                else if(j==0)
                {

                }
                else
                {
                int cnt=0;
                if((x>>(j+1))&1)
                {
                    cnt+=4;
                }
                if((x>>j)&1)
                {
                    cnt+=2;
                }
                if((x>>(j-1))&1)
                {
                    cnt++;
                }
                for (int i=0;i<8;i++)
                {
                    ndp[j][(i&cnt)]+=dp[j][i];
                }
                }
            }
        }
        else if(op==2)
        {
            for (int j=29;j>=0;j--)
            {
                if(j==29)
                {
                    int cnt=0;
                    if((x>>29)&1)
                    {
                    cnt+=2;
                    }
                    if((x>>28)&1)
                    {
                    cnt+=1;
                    }
                    for (int i=0;i<4;i++)
                    {

                        ndp[j][(cnt|i)]+=dp[j][i];
                    }
                }
                else if(j==0)
                {

                }
                else
                {
                int cnt=0;
                if((x>>(j+1))&1)
                {
                    cnt+=4;
                }
                if((x>>j)&1)
                {
                    cnt+=2;
                }
                if((x>>(j-1))&1)
                {
                    cnt++;
                }
                for (int i=0;i<8;i++)
                {
                    ndp[j][(i|cnt)]+=dp[j][i];
                }
                }
            }
        }
        else
        {
            for (int j=29;j>=0;j--)
            {
                if(j==29)
                {
                    int cnt=0;
                    if((x>>29)&1)
                    {
                    cnt+=2;
                    }
                    if((x>>28)&1)
                    {
                    cnt+=1;
                    }
                    for (int i=0;i<4;i++)
                    {

                        ndp[j][(cnt^i)]+=dp[j][i];
                    }
                }
                else if(j==0)
                {

                }
                else
                {
                int cnt=0;
                if((x>>(j+1))&1)
                {
                    cnt+=4;
                }
                if((x>>j)&1)
                {
                    cnt+=2;
                }
                if((x>>(j-1))&1)
                {
                    cnt++;
                }
                for (int i=0;i<8;i++)
                {
                    ndp[j][(i^cnt)]+=dp[j][i];
                }
                }
            }
        }
        int ret=0;
        for (int i=0;i<=29;i++)
        {
            for (int j=0;j<=8;j++)
            {
                dp[i][j]=ndp[i][j];
                ndp[i][j]=0;
                if(i==0)
                {

                }
                else if(i==29)
                {
                    ret+=dp[i][j]*highest[j];
                }
                else
                {
                    ret+=dp[i][j]*mid[j];
                }
            }
        }
        cout<<ret<<"\n";
    }
}
int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    int t=1;
    // cin>>t;
    while(t--)
    {
        solve();
    }
}
```

</details>

---

## Problem B. 喝饮料

### 题意

一瓶饮料售价 $1$ 元。小明喝完一瓶后，以概率

$$
p=\frac ab
$$

中奖并获得 $c$ 元，否则没有收入。各次中奖事件相互独立。

小明初始有 $n$ 元，求他恰好喝完 $m$ 瓶后钱变为 $0$ 并停止的概率，对 $998244353$ 取模。

### 思路

#### 先确定中奖次数

设前 $m$ 瓶中一共中奖 $k$ 次。最终剩余的钱为

$$
n-m+ck
$$

要在第 $m$ 瓶后恰好变为 $0$，必须满足

$$
k=\frac{m-n}{c}
$$

所以当 $m<n$ 或 $m-n$ 不能被 $c$ 整除时，答案为 $0$。

在其余情况下，中奖次数 $k$ 已经唯一确定。每一种合法中奖序列的概率都相同，为

$$
p^k(1-p)^{m-k}
$$

接下来只需计算合法排列的数量。

#### 把余额变化看成一条路径

每喝一瓶都先花费 $1$ 元：

- 中奖时余额净变化为 $c-1$；
- 未中奖时余额净变化为 $-1$。

合法序列要求前 $m-1$ 步后的余额始终大于 $0$，并在第 $m$ 步后第一次到达 $0$。

#### 特判 $c=1$

此时中奖后的净变化为 $0$，只有未中奖会令余额减少 $1$。

要从 $n$ 元减到 $0$，必须恰好有 $n$ 次未中奖，而且最后一瓶必须是第 $n$ 次未中奖。前 $m-1$ 个位置中选择其余 $n-1$ 次未中奖即可，合法序列数为

$$
\binom{m-1}{n-1}
$$

因此答案为

$$
\binom{m-1}{n-1}
p^{m-n}(1-p)^n
$$

#### 当 $c>1$ 时使用 Raney 引理

把余额变化序列倒序并取相反数。此时：

- 未中奖对应 $+1$；
- 中奖对应 $1-c\le -1$；
- 全部 $m$ 项之和为 $n$。

原序列在最后一步前余额始终为正，等价于新序列的每个前缀和都为正。

Raney 引理说明：若一个长度为 $m$ 的整数序列中每项不超过 $1$，且总和为正整数 $n$，那么它的全部循环移位中，恰有 $n$ 个循环移位的所有前缀和都为正。

对所有含 $k$ 次中奖的序列及其循环起点进行计数，可得合法序列数占全部

$$
\binom{m}{k}
$$

种序列的 $\frac nm$，所以合法序列数为

$$
\frac nm\binom{m}{k}
$$

最终答案是

$$
\frac nm\binom{m}{k}
p^k(1-p)^{m-k}
$$

其中

$$
p=a\cdot b^{-1},\qquad
1-p=(b-a)\cdot b^{-1}
$$

都在模 $998244353$ 意义下计算。

#### 组合数预处理

由于 $n,m,c\le2\times10^6$，预处理阶乘和逆阶乘：

$$
\binom xy=\frac{x!}{y!(x-y)!}
$$

即可在 $O(1)$ 时间计算每个组合数。所有除法通过费马小定理求模逆元完成。

### 正确性说明

终止时余额为 $0$ 强制确定了中奖次数 $k=(m-n)/c$，不满足整除或大小条件时没有合法序列。

当 $c=1$ 时，余额只会在未中奖时下降。最后一瓶必须是第 $n$ 次未中奖，而前 $m-1$ 瓶中任意安排其余 $n-1$ 次未中奖都合法，因此组合数公式准确。

当 $c>1$ 时，倒序取反后，合法条件等价于所有前缀和为正。Raney 引理保证全部固定中奖次数的排列中恰有 $\frac nm$ 的排列合法。再乘上每种排列共同的概率 $p^k(1-p)^{m-k}$，即得到所求概率。

### 复杂度

阶乘与逆阶乘预处理的时间、空间复杂度均为 $O(2\times10^6)$。

每组数据进行常数次快速幂，时间复杂度为 $O(\log 998244353)$，额外空间复杂度为 $O(1)$。

### 参考代码

<details>
<summary>查看 AC 代码：B.cpp</summary>

```cpp title="B.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll mod = 998244353;
const int N=2e6;
ll fac[N+5];
ll invfac[N+5];
ll qpow(ll a,ll b)
{
    ll ans=1;
    while(b)
    {
        if(b%2)
        {
            ans=(ans*a)%mod;
        }
        a=(a*a)%mod;
        b/=2;
    }
    return ans;
}
void init()
{
    fac[0]=1;
    for (int i=1;i<=N;i++)
    {
        fac[i]=fac[i-1]*i;
        fac[i]%=mod;
    }
    invfac[N]=qpow(fac[N],mod-2);
    for (int i=N;i>=1;i--)
    {
        invfac[i-1]=(invfac[i]*i)%mod;
    }
}
ll C(ll n,ll m)
{
    return fac[n]*invfac[m]%mod*invfac[n-m]%mod;
}
ll inv(ll x)
{
    return qpow(x,mod-2);
}

void solve()
{
    ll n,m,c,a,b;
    cin>>n>>m>>c>>a>>b;

    if((m-n)%c||(n>m))
    {
        cout<<0<<"\n";
        return ;
    }
    ll k=(m-n)/c;
    if(c==1)
    {
        cout<<C(m-1,n-1)%mod*qpow((a*inv(b)%mod),m-n)%mod*qpow((b-a)*inv(b)%mod,n)%mod<<"\n";
        return ;
    }
    cout<<n*inv(m)%mod*C(m,k)%mod*qpow((a*inv(b)%mod),k)%mod*qpow((b-a)*inv(b)%mod,m-k)%mod<<"\n";
}
int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    int t = 1;
    cin >> t;
    init();
    // cerr<<1<<endl;
    while (t--)
    {
        solve();
    }
    return 0;
}
```

</details>

---

## Problem F. 三色网格

### 题意

给一个 $n\times m$ 的网格，每个格子填入 $0,1,2$ 中的一个整数。要求任意两个共边格子的数字不同，求合法填法数模 $998244353$。

数据范围为 $1\le n<10$，而 $m$ 可以很大。

### 思路

#### 单独处理 $n=1$

第一格有 $3$ 种选择，此后每一格只需与左边不同，各有 $2$ 种选择。因此

$$
ans=3\cdot2^{m-1}
$$

下面考虑 $n\ge2$。

#### 利用颜色置换压缩一列的状态

一列内部相邻格颜色不同。先暂时固定这一列的前两个颜色为

$$
0,1
$$

从第三个格子开始，若前一个颜色是 $x$，当前格只能选择另外两种颜色，即

$$
x+1\pmod3
$$

或

$$
x+2\pmod3
$$

所以后面的每一行只需一个二进制位表示，一共有

$$
S=2^{n-2}
$$

种标准状态。

任意一列合法的实际染色，其前两个颜色互不相同。总能通过一个颜色置换把它们唯一地变成 $0,1$，所以每个标准状态恰好对应 $3!=6$ 种实际染色。

#### 标准状态之间的转移

设两个标准列状态分别为 $A,B$。当前实际列可以先通过统一重命名还原成 $A$。下一列是对标准状态 $B$ 施加某个颜色置换 $\pi$ 后得到的。

两列能够相邻，当且仅当每一行都满足

$$
A_i\ne \pi(B_i)
$$

枚举 $0,1,2$ 的全部 $6$ 个置换，定义

$$
T_{A,B}
=
\#\left\{
\pi\in S_3\mid
\forall i,\ A_i\ne\pi(B_i)
\right\}
$$

它表示当前列处于标准类型 $A$ 时，下一列选择标准类型 $B$ 的合法实际染色数。

由于条件只关心颜色是否相等，对当前列做过什么整体颜色置换不会影响这个转移数。

#### 矩阵快速幂

第一列可以选择任意标准状态，并且每个标准状态对应 $6$ 种实际染色。因此初始向量的每一项都是 $6$。

经过其余 $m-1$ 列后，答案为

$$
6\sum_{A=1}^{S}\sum_{B=1}^{S}
\left(T^{m-1}\right)_{A,B}
$$

使用矩阵快速幂计算 $T^{m-1}$ 即可。

当 $m=1$ 时无需转移，答案直接为

$$
6S
$$

### 正确性说明

每个合法列染色都能唯一分解为“一个前两格为 $0,1$ 的标准状态”和“一个颜色置换”，所以状态压缩没有遗漏或重复。

对任意相邻两列，在固定当前列标准类型和下一列标准类型后，它们的相对颜色关系唯一由一个颜色置换描述。转移矩阵枚举全部六个置换，并且仅保留每行颜色都不同的置换，因此 $T_{A,B}$ 恰好等于这两类列之间的合法转移数。

矩阵乘法依次枚举每一列的标准状态及合法相对置换；第一列的系数 $6$ 枚举它的全部实际染色。因此最终求和与所有合法网格染色一一对应。

### 复杂度

令

$$
S=2^{n-2}\le128
$$

构造转移矩阵的时间复杂度为 $O(6nS^2)$，矩阵快速幂的时间复杂度为

$$
O(S^3\log m)
$$

空间复杂度为 $O(S^2)$。

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
ll m;

int a[20],b[20];

struct Matrix {
    int r, c;
    vector<vector<ll>> mt;

    Matrix(int _r, int _c) {
        r = _r, c = _c;
        mt.resize(r + 1, vector<ll>(c + 1));

        for (int i = 1; i <= r; i++)
            for (int j = 1; j <= c; j++)
                mt[i][j] = 0;
    }

    Matrix operator*(const Matrix& other) const {
        Matrix res(r, other.c);
        res.r = r, res.c = c;

        for (int i = 1; i <= r; i++) {
            for (int j = 1; j <= other.c; j++) {
                for (int p = 1; p <= c; p++) {
                    // res.mt[i][j] += mt[i][p] * other.mt[p][j];
                    res.mt[i][j] =(res.mt[i][j]+mt[i][p] * other.mt[p][j]%M)%M;
                }
            }
        }

        return res;
    }
};

int nn;

Matrix QP(Matrix x,ll m){
    Matrix ans(nn+1,nn+1);
    int flag=0;
    while(m>0){
        if(m%2==1){
            if(!flag) ans=x,flag=1;
            else ans=ans*x;
        }
        x=x*x;
        m/=2;
    }
    return ans;
}

void solve(){
    cin>>n>>m;

    if(n==1){
        cout<<3*qp(2ll,m-1)%M<<"\n";
        return ;
    }
    if(m==1){
        cout<<6*(nn+1)<<"\n";
        return ;
    }

    nn=(1<<(n-2))-1;

    Matrix T(nn+1,nn+1);

    f(i,0,nn){
        f(j,0,nn){
            a[1]=b[1]=0;
            a[2]=b[2]=1;
            f(x,0,n-3){
                if((i>>x)&1) a[x+3]=(a[x+2]+2)%3;
                else a[x+3]=(a[x+2]+1)%3;
            }
            f(x,0,n-3){
                if((j>>x)&1) b[x+3]=(b[x+2]+2)%3;
                else b[x+3]=(b[x+2]+1)%3;
            }
            vector<int> p={0,1,2};
            do{
                int flag=1;
                f(I,1,n){
                    // if((a[I]+A)%3==(b[I]+B)%3) flag=0;
                    if((a[I])%3==(p[b[I]])%3) flag=0;
                }
                // cerr<<flag<<"\n";
                T.mt[i+1][j+1]+=flag;
            }while(next_permutation(p.begin(),p.end()));
            // f(A,0,2){

            // }
        }
    }



    T=QP(T,m-1);
    ll ans=0;
    f(i,1,nn+1){
        f(j,1,nn+1){
            ans=(ans+6*T.mt[i][j]%M)%M;
        }
    }
    cout<<ans<<"\n";
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

## Problem I. 交换大师（Swap Master）

### 题意

定义数组 $a_1,a_2,\dots,a_n$ 的价值为

$$
V(a)=\sum_{i=1}^{n-1}|a_i-a_{i+1}|.
$$

可以选择两个不同的位置交换其中的元素，至多操作一次，也可以不交换。求能够得到的最大数组价值。

### 思路

#### 一次交换只影响相邻边

先计算原数组价值

$$
S=\sum_{i=1}^{n-1}|a_i-a_{i+1}|.
$$

交换位置 $i,j$ 后，只有与 $i,j$ 相邻的边可能改变。因此可以先在线性时间内直接枚举以下特殊情况：

- 两个位置相邻；
- 至少一个位置是数组端点；
- 两个端点互换。

这些情况每次只需删除原来的至多三条边，再加入交换后的边，总枚举量为 $O(n)$。

剩下只需处理两个互不相邻、并且都不是端点的位置。此时两个位置影响的边互不重叠，可以分别计算局部贡献。

#### 内部位置的局部贡献

对于内部位置 $i$，记

$$
L_i=\min(a_{i-1},a_{i+1}),\qquad
R_i=\max(a_{i-1},a_{i+1}),
$$

并定义把该位置上的数替换为 $x$ 后，两条相邻边的贡献为

$$
F_i(x)=|x-a_{i-1}|+|x-a_{i+1}|.
$$

绝对值函数可以写成

$$
F_i(x)=R_i-L_i+2\max(L_i-x,\ 0,\ x-R_i).
$$

原来的局部贡献为 $F_i(a_i)$。若交换两个互不相邻的内部位置 $i,j$，总价值增量为

$$
\Delta(i,j)=F_i(a_j)-F_i(a_i)+F_j(a_i)-F_j(a_j).
$$

令

$$
C_i=R_i-L_i-F_i(a_i),
$$

则

$$
F_i(x)-F_i(a_i)
=C_i+2\max(L_i-x,\ 0,\ x-R_i).
$$

#### 展开成九种可分离形式

两个 `max` 各有三项，所以共有 $3\times3=9$ 种组合。固定其中一种后，增量可以拆成

$$
A_t(i)+B_t(j),\qquad 1\le t\le9,
$$

其中一项只依赖位置 $i$，另一项只依赖位置 $j$。

例如，两边都选择第三项时有

$$
\begin{aligned}
&C_i+C_j+2[(a_j-R_i)+(a_i-R_j)]\\
={}&[C_i+2(a_i-R_i)]+[C_j+2(a_j-R_j)].
\end{aligned}
$$

一边选择中间项、另一边选择第三项时，则会得到形如

$$
[C_i+2a_i]+[C_j-2R_j]
$$

的形式。其余情况同理。

对每一种形式从左到右扫描，并维护前面位置对应项的最大值，就能在线性时间内求出最优位置对。为了让两次局部修改互不重叠，作为另一端的内部位置至少延迟两个下标加入候选。

现有代码中的九段 `maxA`、`maxB` 循环，分别对应上述九种线性形式。再与提前枚举的端点及相邻交换情况取最大值即可。

### 正确性说明

任意一次交换只会改变与两个交换位置相邻的边。算法直接枚举了所有包含端点或相邻位置的交换，因此这些情况不会遗漏。

对于两个互不相邻的内部位置，它们影响的边集不相交，交换后的价值增量恰好等于两个局部贡献变化之和，即 $\Delta(i,j)$。公式

$$
F_i(x)=R_i-L_i+2\max(L_i-x,0,x-R_i)
$$

对任意 $x$ 都成立，因此把两个最大值展开为九种组合后，其最大值与原增量完全相同。每种组合又被拆成两个只依赖单个位置的部分，线性扫描能够找出该组合下的最优位置对。

九种组合覆盖了两个最大值的全部取法，所以算法求出了所有非相邻内部交换中的最大增量。最后同时保留原数组价值，故也覆盖“不进行交换”的选择，所得答案即为最大可能价值。

### 复杂度

特殊交换和九种内部形式都只进行常数次线性扫描。

- 时间复杂度：$O(n)$；
- 空间复杂度：$O(n)$。

### 参考代码

<details>
<summary>查看 AC 代码：I.cpp</summary>

```cpp title="I.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
void solve()
{
    int n;
    cin >> n;
    vector<ll> v(n + 1, 0);
    for (int i = 1; i <= n; i++)
    {
        cin >> v[i];
    }
    ll sum = 0;
    for (int i = 1; i < n; i++)
    {
        sum += abs(v[i + 1] - v[i]);
    }
    ll ans = sum;
    // cerr<<ans<<endl;
    for (int i = 2; i < n - 1; i++)
    {
        ans = max(ans, sum - abs(v[i + 2] - v[i + 1]) - abs(v[i] - v[i - 1]) + abs(v[i + 2] - v[i]) + abs(v[i + 1] - v[i - 1]));
    }
    // cerr<<ans<<endl;
    ans = max(ans, sum - abs(v[1] - v[2]) - abs(v[n] - v[n - 1]) + abs(v[2] - v[n]) + abs(v[1] - v[n - 1]));
    if(n>=3)
    {
        ans=max(ans,sum-abs(v[3]-v[2])+abs(v[3]-v[1]));
        ans=max(ans,sum-abs(v[n-1]-v[n-2])+abs(v[n]-v[n-2]));
    }
    for (int i = 3; i < n; i++)
    {
        ans = max(ans, sum - abs(v[2] - v[1]) - abs(v[i] - v[i - 1]) - abs(v[i + 1] - v[i]) + abs(v[i] - v[2]) + abs(v[1] - v[i - 1]) + abs(v[i + 1] - v[1]));
    }
    // cerr<<ans<<endl;
    for (int i = 2; i < n - 1; i++)
    {
        ans = max(ans, sum - abs(v[n] - v[n - 1]) - abs(v[i] - v[i - 1]) - abs(v[i + 1] - v[i]) + abs(v[i] - v[n - 1]) + abs(v[n] - v[i - 1]) + abs(v[n] - v[i + 1]));
    }
    // cerr<<ans<<endl;
    auto L = [&](int i)
    {
        return min(v[i + 1], v[i - 1]);
    };
    auto R = [&](int i)
    {
        return max(v[i + 1], v[i - 1]);
    };
    auto val = [&](int i)
    {
        return abs(v[i + 1] - v[i]) + abs(v[i - 1] - v[i]);
    };
    // cerr<<ans<<endl;
    ll maxA = -1e18, maxB = -1e18;
    for (int i = 2; i < n; i++) // 1
    {
        maxA = max(R(i) - L(i) - val(i) + 2 * (v[i] - R(i)), maxA);
        if (i >= 4)
            maxB = max(R(i - 2) - L(i - 2) - val(i - 2) + 2 * (v[i - 2] - R(i - 2)), maxB);
        ans = max(ans, sum + maxA + maxB);
    }
    maxA = -1e18, maxB = -1e18;
    for (int i = 2; i < n; i++) // 2
    {
        maxA = max(R(i) - L(i) - val(i) + 2 * (-R(i)), maxA);
        if (i >= 4)
            maxB = max(R(i - 2) - L(i - 2) - val(i - 2) + 2 * (v[i - 2]), maxB);
        ans = max(ans, sum + maxA + maxB);
    }
    maxA = -1e18, maxB = -1e18;
    for (int i = 2; i < n; i++) // 3
    {
        maxA = max(R(i) - L(i) - val(i) + 2 * (-R(i) - v[i]), maxA);
        if (i >= 4)
            maxB = max(R(i - 2) - L(i - 2) - val(i - 2) + 2 * (L(i - 2) + v[i - 2]), maxB);
        ans = max(ans, sum + maxA + maxB);
    }
    maxA = -1e18, maxB = -1e18;
    for (int i = 2; i < n; i++) // 4
    {
        maxA = max(R(i) - L(i) - val(i) + 2 * (v[i]), maxA);

        if (i >= 4)
            maxB = max(R(i - 2) - L(i - 2) - val(i - 2) + 2 * (-R(i - 2)), maxB);
        ans = max(ans, sum + maxA + maxB);
    }
    maxA = -1e18, maxB = -1e18;
    for (int i = 2; i < n; i++) // 4
    {
        maxA = max(R(i) - L(i) - val(i), maxA);
        if (i >= 4)
            maxB = max(R(i - 2) - L(i - 2) - val(i - 2), maxB);
        ans = max(ans, sum + maxA + maxB);
    }
    maxA = -1e18, maxB = -1e18;
    for (int i = 2; i < n; i++) // 6
    {
        maxA = max(R(i) - L(i) - val(i) + 2 * (-v[i]), maxA);
        if (i >= 4)
            maxB = max(R(i - 2) - L(i - 2) - val(i - 2) + 2 * (L(i - 2)), maxB);
        ans = max(ans, sum + maxA + maxB);
    }
    maxA = -1e18, maxB = -1e18;
    for (int i = 2; i < n; i++) // 7
    {
        maxA = max(R(i) - L(i) - val(i) + 2 * (v[i] + L(i)), maxA);
        if (i >= 4)
            maxB = max(R(i - 2) - L(i - 2) - val(i - 2) + 2 * (-R(i - 2) - v[i - 2]), maxB);
        ans = max(ans, sum + maxA + maxB);
    }
    maxA = -1e18, maxB = -1e18;
    for (int i = 2; i < n; i++) // 8
    {
        maxA = max(R(i) - L(i) - val(i) + 2 * (L(i)), maxA);
        if (i >= 4)
            maxB = max(R(i - 2) - L(i - 2) - val(i - 2) + 2 * (-v[i - 2]), maxB);
        ans = max(ans, sum + maxA + maxB);
    }
    maxA = -1e18, maxB = -1e18;
    for (int i = 2; i < n; i++)
    {
        maxA = max(R(i) - L(i) - val(i) + 2 * (L(i) - v[i]), maxA);
        if (i >= 4)
            maxB = max(R(i - 2) - L(i - 2) - val(i - 2) + 2 * (L(i - 2) - v[i - 2]), maxB);
        ans = max(ans, sum + maxA + maxB);
    }
    cout << ans << "\n";
}

int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    int t=1;
    cin >> t;
    while (t--)
    {
        solve();
    }
}
```

</details>

---

## Problem J. 带祖先限制的树重构

### 题意

给定一棵以 $1$ 为根的原树，需要在相同点集上构造一棵仍以 $1$ 为根的新树。

新树中每个点 $x\ne1$ 的父亲必须是 $x$ 在原树中的某个祖先。另外有 $q$ 条限制 $(u,v)$，要求新树中 $v$ 是 $u$ 的祖先。

设新树中点 $i$ 的深度为 $dep_i$，最小化

$$
\sum_{i=1}^{n}dep_i
$$

### 思路

#### 新树中的祖先链是原祖先链的子序列

因为每条新树父边都从一个点连向它的原树祖先，所以从任意点不断跳新父亲时，始终沿原树向上走。

对限制 $(u,v)$，新树从 $u$ 向根的链上必须实际经过 $v$。如果在某次连父亲时直接跳到了 $v$ 的上方，那么以后不可能再回到 $v$，这条限制就无法满足。

#### 自底向上维护尚未满足的限制

按原树深度从大到小处理顶点。

对正在处理的点 $x$，维护一个集合 $H_x$。其中保存已经归入新树中 $x$ 的子树、但尚未满足的所有限制目标 $v$。

这些目标一定都是 $x$ 的原树祖先：

- 一开始，限制 $(x,v)$ 中的 $v$ 本来就是 $x$ 的祖先；
- 子树中的限制向上合并时，已经先删除了目标为 $x$ 的限制，剩下的目标都在 $x$ 上方。

因此 $H_x$ 中的所有点都位于同一条原树祖先链上，可以直接按原树深度比较。

#### 父亲必须选择最深的未满足目标

若 $H_x$ 非空，令 $p$ 为其中原树深度最大的点。

为了让 $p$ 成为 $x$ 及其新树子树内所有相关点的祖先，新父链必须经过 $p$：

- 若把 $x$ 直接连到 $p$ 上方，就会跳过 $p$，限制无法满足；
- 若把 $x$ 连到 $x$ 与 $p$ 之间的其他点，会无故多增加一层深度。

所以最优选择被唯一确定为

$$
parent_{\text{new}}(x)=p
$$

连边后，所有目标恰好为 $p$ 的限制都已经满足，将它们删除。其余目标都在 $p$ 上方，继续合并进 $H_p$。

若 $H_x$ 为空，就没有任何限制要求保留中间祖先。此时直接令新父亲为根 $1$，显然能使深度最小。

#### 用优先队列和启发式合并维护集合

每个限制对应堆中的一个元素，关键字是目标点在原树中的深度。需要支持：

- 合并两个集合；
- 查询最深目标；
- 删除堆顶。

代码为每个点维护一个大根优先队列 `before[x]`。处理 $x$ 时，`adj2[x]` 中已经保存了新树里确定挂在 $x$ 下方的儿子：

1. 先在 `before[x]` 和所有儿子的堆中找到最大的一个，通过交换让它留在 `before[x]`；
2. 再把其余较小堆逐个弹出并插入 `before[x]`。

这样始终把小堆合并进大堆。一个限制元素每次被搬运后，所在集合的大小至少翻倍，因此最多被搬运 $O(\log q)$ 次。

确定新父亲 $p$ 后，把 $x$ 加入 `adj2[p]`。等处理到 $p$ 时，`before[x]` 中剩余的限制会随儿子堆一起合并到 `before[p]`。

所有新边确定后，再从根遍历新树，累加每个点的深度。

### 正确性说明

处理点 $x$ 时，堆中恰好保存其新树子树内全部尚未满足的限制目标，并且所有目标都是 $x$ 的原树祖先。设最深目标为 $p$。任何可行方案都不能让 $x$ 的父边跳到 $p$ 上方，否则新父链永远不会经过 $p$；选择 $p$ 与 $x$ 之间的点则只会增加深度。因此把 $x$ 直接连到 $p$ 是所有可行选择中深度最小的。

该连边恰好满足目标为 $p$ 的全部限制。其余目标均为 $p$ 的祖先，把它们继续交给 $p$ 处理保持了维护集合的不变式。若没有未满足限制，直接连接根是允许的最浅选择。

按照原树深度自底向上重复上述过程，每一步都是在此前已确定子树的前提下不可替代的最优选择，因此最终新树满足全部限制，并使所有点深度之和最小。

### 复杂度

计算原树深度并排序顶点需要 $O(n\log n)$ 时间。一个限制元素最多在启发式合并中移动 $O(\log q)$ 次，每次优先队列插入、删除需要 $O(\log q)$ 时间，总时间复杂度为

$$
O(n\log n+q\log^2q)
$$

空间复杂度为 $O(n+q)$。

### 参考代码

<details>
<summary>查看 AC 代码：J.cpp</summary>

```cpp title="J.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
void solve()
{
    int n, q;
    cin >> n >> q;
    vector<vector<int>> adj(n + 1);
    vector<int> dep(n + 1, 0);
    vector<priority_queue<array<int, 2>>> before(n + 1);
    vector<vector<int>> adj2(n + 1);
    for (int i = 2; i <= n; i++)
    {
        int fa;
        cin >> fa;
        adj[fa].push_back(i);
    }
    // cerr<<1<<endl;
    auto dfs = [&](int u, int fa, auto &&self) -> void
    {
        dep[u] = dep[fa] + 1;
        for (auto v : adj[u])
        {
            self(v, u, self);
        }
    };
    dfs(1, 0, dfs);
    // cerr<<1<<endl;
    vector<int> v(n, 0);
    for (int i = 0; i < n; i++)
    {
        v[i] = i + 1;
    }
    // cerr<<1<<endl;
    sort(v.begin(), v.end(), [&](int a, int b)
         { return dep[a] > dep[b]; });
    while (q--)
    {
        int u, v;
        cin >> u >> v;
        // cerr<<u<<" "<<v<<endl;
        before[u].push({dep[v], v});
    }
    // cerr<<1<<endl;
    for (int i = 0; i < n; i++)
    {
        auto x = v[i];
        if (x == 1)
            continue;
        for (auto v : adj2[x])
        {
            if (before[v].size() > before[x].size())
            {
                swap(before[v], before[x]);
            }
        }
        for (auto v : adj2[x])
        {
            while (before[v].size())
            {
                before[x].push(before[v].top());
                before[v].pop();
            }
        }
        if (before[x].empty())
        {
            adj2[1].push_back(x);
        }
        else
        {

            auto p = before[x].top()[1];
            while (before[x].size() && before[x].top()[1] == p)
            {
                before[x].pop();
            }
            adj2[p].push_back(x);
        }
    }
    ll res = 0;
    auto dfs2 = [&](int u, int dep, auto &&self) -> void
    {
        res += (ll)dep;
        for (auto v : adj2[u])
        {
            self(v, dep + 1, self);
        }
    };
    dfs2(1, 0, dfs2);
    cout << res << "\n";
}

int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    int t = 1;
    // cin >> t;
    // cerr<<1<<endl;
    while (t--)
    {
        solve();
    }
    return 0;
}
```

</details>

---

## Problem K. 路口转向

### 题意

汽车依次经过平面上的 $n$ 个点 $P_1,P_2,\dots,P_n$。

对每个中间点 $P_i$，判断汽车从方向 $P_{i-1}\to P_i$ 转到方向 $P_i\to P_{i+1}$ 时是左转、右转还是直行。题目保证不会掉头。

### 思路

在点 $P_i$ 处，进入和离开的方向向量分别为

$$
\vec a=P_i-P_{i-1}
$$

和

$$
\vec b=P_{i+1}-P_i
$$

计算二维叉积

$$
\vec a\times\vec b
=a_xb_y-a_yb_x
$$

根据叉积的几何意义：

- 若 $\vec a\times\vec b>0$，从 $\vec a$ 到 $\vec b$ 需要逆时针旋转，输出 `LEFT`；
- 若 $\vec a\times\vec b<0$，需要顺时针旋转，输出 `RIGHT`；
- 若 $\vec a\times\vec b=0$，两个向量共线。

共线时本来还可能同向或反向，但题目保证汽车不会掉头，所以此时一定是同向直行，输出 `STRAIGHT`。

坐标绝对值不超过 $10^9$，坐标差可达到 $2\times10^9$，叉积必须使用 `long long`。

### 正确性说明

二维叉积的符号准确表示从进入方向向量旋转到离开方向向量的方向：正数对应逆时针，负数对应顺时针，分别就是左转和右转。叉积为零时两个方向共线；排除题目保证不存在的反向情况后，只可能保持原方向，所以是直行。因此算法对每个中间点都输出正确结果。

### 复杂度

每个中间点只计算一次叉积。单组数据的时间复杂度为 $O(n)$，保存所有点时空间复杂度为 $O(n)$。

### 参考代码

<details>
<summary>查看 AC 代码：K.cpp</summary>

```cpp title="K.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
struct node
{
    ll x,y;
    friend ll operator*(const node &a,const node &b)
    {
        return a.x*b.y-a.y*b.x;
    }
    friend node operator-(const node &a,const node &b)
    {
        return {a.x-b.x,a.y-b.y};
    }
};
void solve()
{
    int n;
    cin>>n;
    vector<node> a(n+1,{0,0});
    for (int i=1;i<=n;i++)
    {
        cin>>a[i].x>>a[i].y;
    }

    for (int i=2;i<n;i++)
    {
        ll f=(a[i]-a[i-1])*(a[i+1]-a[i]);
        if (f>0)
        {
            cout<<"LEFT ";
        }
        else if (f<0)
        {
            cout<<"RIGHT ";
        }
        else
        {
            cout<<"STRAIGHT ";
        }
    }
    cout<<"\n";
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

</details>

---

## Problem L. 登山博弈

### 题意

给定一个 $n\times m$ 的高度网格，所有格子的高度互不相同。

两名玩家轮流把棋子移动到上下左右相邻且高度严格更大的格子。无法移动的玩家失败。每次询问给出起点，判断双方都采用最优策略时先手还是后手获胜。

### 思路

#### 把移动关系看成 DAG

从每个格子向所有相邻且更高的格子连一条有向边。

每次移动都会严格升高，因此不可能回到已经经过的格子，图中也不可能存在有向环。问题就是一个有向无环图上的经典公平组合博弈。

#### 必胜态与必败态

记 `winning[u]` 表示轮到玩家在格子 $u$ 行动时是否必胜。

- 如果 $u$ 没有任何出边，当前玩家无法移动，所以 $u$ 是必败态；
- 如果存在一条边 $u\to v$，且 $v$ 是必败态，那么当前玩家可以把局面交给对手的必败态，所以 $u$ 是必胜态；
- 如果所有能到达的状态都是必胜态，无论怎样移动都会把必胜局面交给对手，所以 $u$ 是必败态。

即

$$
winning[u]
=
\bigvee_{u\to v}\neg winning[v]
$$

#### 用大根堆按高度从大到小计算

一个格子只能走向比它更高的格子。把全部格子按高度从大到小排序后，处理格子 $u$ 时，它的所有后继状态都已经计算完成。

代码没有显式排序，而是先把所有局部最高点加入按高度排序的大根堆。这些点没有更高邻居，都是必败态。每次取出当前最高的未处理格子，并把它的所有更低邻居加入堆。

任意格子不断走向更高邻居，最终都会到达某个局部最高点，所以从全部局部最高点反向扩展能够覆盖整个网格。大根堆又保证处理某个格子时，它的全部更高邻居已经处理完毕。

此时枚举该格子的四个邻居：

- 若找到一个更高且为必败态的邻居，就把 $u$ 标记为必胜态；
- 若始终找不到，则 $u$ 保持为必败态。

预处理所有格子的胜负状态后，每次询问都可以直接回答：

- 必胜态输出 `First`；
- 必败态输出 `Second`。

### 正确性说明

高度严格增加保证了移动图是 DAG。大根堆产生的高度降序正是这个 DAG 的逆拓扑顺序，所以计算一个格子时，它的全部可达下一状态都已有正确答案。

若存在必败后继，当前玩家选择该步后，对手面对必败态，因此当前状态必胜；若所有后继都必胜，则当前玩家无论选择哪一步，对手都有必胜策略，因此当前状态必败。这与代码的状态转移完全一致。由逆拓扑序归纳可知，所有格子的胜负状态均正确。

### 复杂度

令 $N=nm$。排序时间复杂度为 $O(N\log N)$，状态转移只检查每个格子的四个邻居，时间复杂度为 $O(N)$。每次询问为 $O(1)$。

总时间复杂度为

$$
O(N\log N+q)
$$

空间复杂度为 $O(N)$。

### 参考代码

<details>
<summary>查看 AC 代码：L.cpp</summary>

```cpp title="L.cpp"
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

int n,m,Q;


int dx[5]={0,1,0,-1};
int dy[5]={1,0,-1,0};

struct node{
    int x,y;
    ll H;
};

struct cmp{
    bool operator()(const node &x,const node &y){
        return x.H<y.H;
    }
};


void solve(){
    cin>>n>>m;
    vector<vector<ll>> h(n+1,vector<ll>(m+1,0));
    vector<vector<ll>> fg(n+1,vector<ll>(m+1,-1));
    vector<vector<ll>> vis(n+1,vector<ll>(m+1,0));
    f(i,1,n) f(j,1,m) cin>>h[i][j];
    cin>>Q;


    priority_queue<node,vector<node>,cmp> q;
    f(i,1,n){
        f(j,1,m){
            int flag=1;
            f(k,0,3){
                int ni=i+dx[k],nj=j+dy[k];
                if(ni<1||ni>n||nj<1||nj>m) continue;
                if(h[ni][nj]>h[i][j]) flag=0;
            }
            if(flag==1){
                fg[i][j]=1;
                q.push({i,j,h[i][j]});
            }
        }
    }

    while(!q.empty()){
        auto [x,y,H]=q.top();
        // cerr<<x<<' '<<y<<"\n";
        q.pop();
        if(vis[x][y]) continue;
        vis[x][y]=1;
        int flag=0,cnt=0;
        f(k,0,3){
            int nx=x+dx[k],ny=y+dy[k];
            if(nx<1||nx>n||ny<1||ny>m||h[nx][ny]>=h[x][y]) continue;
            q.push({nx,ny,h[nx][ny]});
        }
        f(k,0,3){
            int nx=x+dx[k],ny=y+dy[k];
            if(nx<1||nx>n||ny<1||ny>m||h[nx][ny]<=h[x][y]) continue;
            cnt++;
            if(fg[nx][ny]==1) flag=1;
        }

        if(cnt==0) fg[x][y]=1;
        else {
            if(flag==1) fg[x][y]=0;
            else fg[x][y]=1;
        }
    }

    // f(i,1,n){
    //     f(j,1,m) cout<<fg[i][j]<<" ";
    //     cout<<"\n";
    // }

    while(Q--){
        int x,y;
        cin>>x>>y;
        if(fg[x][y]==1){
            cout<<"Second\n";
        }
        else cout<<"First\n";
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

---
title: "2026 杭电多校第一场题解"
published: 2026-07-30
description: "收录 2026 杭电多校第一场的 5 道题：1004、1005、1006、1008、1010，包含完整思路、正确性说明、复杂度分析与 AC 代码。"
tags: ["ACM", "题解", "杭电多校", "2026 暑假集训"]
category: "竞赛题解"
sourceLink: "https://acm.hdu.edu.cn/contest/problems?cid=1229"
draft: false
comment: true
lang: "zh_CN"
---

本篇整理自队伍的 2026 暑假集训记录，共收录 **5** 道已通过题目。每题均包含题意、核心思路、正确性说明、复杂度分析和对应的 AC 代码。

比赛链接：[2026 杭电多校第一场](https://acm.hdu.edu.cn/contest/problems?cid=1229)

## 题目索引

| 题目 | 核心算法 |
| --- | --- |
| 1004. 搭积木 | 贪心、并查集、优先队列、树上合并、交换论证 |
| 1005. 摩卡数 | 构造、KMP、前缀函数、字符串、贪心 |
| 1006. 开关灯 | 概率期望、线性期望、指示变量、组合数学、模逆元 |
| 1008. 数字子序列 | 动态规划、后缀数组、LCP、树状数组、字符串、最长上升子序列 |
| 1010. 游戏 | 博弈论、贪心、前缀和、模仿策略、分类讨论 |

## 1004. 搭积木

### 题意

$n$ 块积木构成一棵以 $f_i=0$ 的点为根的树。把一个已经组装好的上方结构 $X$ 放到下方结构 $Y$ 上时，要求 $X$ 中恰有一个点的父亲位于 $Y$ 中。

若 $X$ 中所有积木的 $a$ 之和为 $A_X$，$Y$ 中所有积木的 $b$ 之和为 $B_Y$，本次合并的代价为

$$
A_XB_Y.
$$

可以任意安排合法的组装顺序，求组装整棵树的最小总代价。

### 思路

#### 相邻交换得到密度顺序

考虑两个尚未合并、都可以先放到同一个下方结构 $P$ 上的结构 $X,Y$。

- 先放 $X$ 再放 $Y$，除去共同项后，多出的交叉项为 $A_YB_X$；
- 先放 $Y$ 再放 $X$，多出的交叉项为 $A_XB_Y$。

因此先放 $X$ 不劣，当且仅当

$$
A_YB_X\le A_XB_Y,
$$

也就是

$$
\frac{A_X}{B_X}\ge\frac{A_Y}{B_Y}.
$$

所以应该优先处理“密度” $A/B$ 最大的结构。比较时用交叉相乘，避免浮点误差。

#### 合并以后视为一个新结构

设当前密度最大的非根结构为 $X$，它的父亲已经属于结构 $P$。将 $X$ 放到 $P$ 上：

1. 本次产生代价 $A_XB_P$；
2. 合并后的结构属性变为

   $$
   A_P\leftarrow A_P+A_X,\qquad B_P\leftarrow B_P+B_X;
   $$

3. 新结构的密度发生变化，需要重新放入优先队列。

合并过程用并查集维护。`find(f[u])` 就是结构 $u$ 当前父亲所在的结构。

优先队列里可能还留着某个结构合并前的旧密度。代码为每次入队记录时间戳 `tim`，弹出时若不是该结构的最新版本，就直接跳过。

### 正确性说明

在任意合法方案中，如果密度较小的可合并结构 $Y$ 排在密度较大的结构 $X$ 前面，可以把 $X$ 不断向前交换。每次交换只会把交叉项 $A_XB_Y$ 换成不更大的 $A_YB_X$，不会破坏树上的父子约束，也不会增大总代价。

因此一定存在一个最优方案，其下一次操作就是合并当前密度最大的非根结构。合并后，上下两个结构在后续操作中不可再分，将它们缩成一个点不会改变剩余问题。对缩点后的问题重复上述论证，便得到代码的整个贪心过程，所以最终总代价最小。

### 复杂度

每次合并会产生至多一个新的优先队列元素，共进行 $n-1$ 次有效合并。

- 时间复杂度：$O(n\log n)$；
- 空间复杂度：$O(n)$。

### 参考代码

```cpp title="1004.cpp"
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
int f[N];
ll a[N],b[N];
vector<int> to[N];
int ne[N];

ll ans=0;

struct Node{
    int u;
    ll a,b;
    int tim;

    friend bool operator<(Node x,Node y){
        return x.b*y.a>x.a*y.b;
        // return b[x.u]*a[y.u]>a[x.u]*b[y.u];
    }
};

int fa[N];
int find(int x){
    if(x==fa[x]) return x;
    else return fa[x]=find(fa[x]);
}
void unio(int x,int y,ll xa,ll xb){
    x=find(x),y=find(y);
    fa[x]=y;
    a[y]+=xa;
    b[y]+=xb;
}


void solve(){
    cin>>n;
    ans=0;
    f(i,1,n) cin>>a[i],fa[i]=i;
    f(i,1,n) cin>>b[i],to[i].clear();
    int rt=0;
    f(i,1,n) {
        cin>>f[i];
        if(f[i]==0){
            rt=i;
        }
        else to[f[i]].push_back(i);
    }
    // cerr<<rt<<"\n";

    priority_queue<Node> q;
    f(i,1,n){
        if(i==rt) continue;
        q.push({i,a[i],b[i],i});
        ne[i]=i;
    }
    int tot=n;

    while(!q.empty()){
        auto [u,xa,xb,tim]=q.top();
        // cerr<<u<<"\n";
        q.pop();
        if(ne[u]>tim) continue;
        int F=find(fa[f[u]]);
        ans+=b[F]*xa;
        unio(u,F,xa,xb);
        if(F==rt) continue;
        tot++;
        q.push({F,a[F],b[F],tot});
        ne[F]=tot;
    }

    cout<<ans<<"\n";
}



int main(){
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);
    cin>>TT;
    while(TT--) solve();
    return 0;
}
```

---

## 1005. 摩卡数

### 题意

题目给出一种建立 KMP 自动机的算法。对每个状态和每个字母，算法会沿前缀函数的失配边不断跳转，并把所有 `while` 循环的执行次数之和定义为字符串的摩卡数。

给定 $k$，构造长度不超过 $10^5$ 的字符串 $S$ 和字符集大小 $\sigma\le26$，使 $S$ 的摩卡数恰好为 $k$。

### 思路

只使用两个字符 `a`、`b`。代码逐段构造形如

$$
b,a,a\cdots a
$$

的临时串，最后把第一个字符改成 `a`，并在末尾补一个 `b`。

#### 构造块的贡献

直接沿 KMP 的失配链分析这种二元串，可以得到下面的构造引理：

- 开始一个新块时放入 `b`，可以确定地贡献 $1$；
- 当前位于块内第 $i$ 个位置时，继续放入普通的 `a`，可以贡献 $i$；
- 若不再继续增长当前块，放入一个结束用的 `a`，贡献 $1$。

这里的“贡献”是最终把首字符改成 `a`、末尾补上 `b` 后，所有状态转移沿失配边跳转次数的增量。上述结论可由前缀函数定义逐项检查：这种串的真前后缀只会沿当前的连续 `a` 段逐级缩短，所以跳转层数正好等于表中的数值。

于是只要不断从剩余的 $k$ 中减去这些可控贡献即可：

1. 每个新块先减去 $1$ 并放一个 `b`；
2. 对 $i=2,3,\ldots$，若减去 $i$ 后还能给后续构造至少留下 $1$，就减去 $i$ 并继续放 `a`；
3. 否则只减去 $1$，放一个结束用的 `a`，转到下一个块；
4. 当剩余值变成 $0$ 时结束，修正首字符并补上末尾的 `b`。

代码中的条件 `k >= i + 1`，正是在判断“当前取走 $i$ 后，是否还能至少保留 $1$ 给下一步”。

### 正确性说明

构造过程中每次从 $k$ 中减去的数，都与构造引理中的一种局部贡献一一对应，并且三种操作不会引入额外的失配跳转。循环只在剩余贡献为 $0$ 时停止，因此所有记录贡献之和恰好等于输入的 $k$。

最后把首字符由临时分隔符改为 `a`、再补终止字符 `b`，正好把首尾两个不完整块补成构造引理所描述的完整字符串。因此输出字符串的摩卡数恰为 $k$。

每个外层循环至少消耗 $1$，所以过程一定结束。一个长块依次可以消耗 $1,2,3,\ldots$ 量级的贡献，块长为 $O(\sqrt{k})$；后续块处理的剩余量继续快速减小。对 $k\le10^9$，输出长度远小于 $10^5$。

### 复杂度

设输出字符串长度为 $L$。

- 时间复杂度：$O(L)$，且 $L=O(\sqrt{k})$；
- 空间复杂度：$O(L)$。

### 参考代码

```cpp title="1005.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll mod=998244353;
const int N=2e5;
ll muled[N+5][2];
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
void solve()
{
    int k;
    cin>>k;
    string ans;
    while(k)
    {
        for (int i=1;;i++)
        {
            if(i==1)
            {
                k-=1;
                ans.push_back('b');
                if(k==0)
                {
                    break;
                }
            }
            else if(k>=i+1)
            {
                k-=i;
                ans.push_back('a');
            }
            else
            {
                k-=1;
                ans.push_back('a');
                break;
            }
        }
    }
    ans[0]='a';
    ans.push_back('b');
    cout<<ans.size()<<" "<<2<<"\n";
    cout<<ans<<"\n";
}
int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    int t;
    cin >> t;
    while (t--)
    {
        solve();
    }
}
```

---

## 1006. 开关灯

### 题意

有 $n$ 盏灯，第 $i$ 盏灯权值为 $a_i$。所有灯最初关闭，随后按一个等概率随机排列依次打开。

打开第 $i$ 盏灯后，若当前亮灯形成了 $c$ 个极大连续段，就获得 $a_i c$ 分。求最终总得分的期望，对 $998244353$ 取模。

### 思路

由期望的线性性，只需求“某个位置被打开时，亮灯连续段数的期望”。

#### 用指示变量表示连续段数

在第 $i$ 盏灯刚被打开的时刻，设亮灯段数为 $C$。每个亮灯段都由它最左侧的灯唯一确定，因此

$$
C=[1\text{ 已亮}]+\sum_{j=2}^{n}[j\text{ 已亮且 }j-1\text{ 未亮}].
$$

随机排列中只需比较少数几盏灯的相对先后顺序：

- 对第一项，如果 $i=1$，概率为 $1$；否则灯 $1$ 比灯 $i$ 先开，概率为 $1/2$；
- 对边界 $(j-1,j)$：
  - 若 $i=j$，灯 $j$ 此时刚开，而 $j-1$ 还没开，概率为 $1/2$；
  - 若 $i=j-1$，条件不可能成立，概率为 $0$；
  - 若 $i$ 与二者都不同，需要相对顺序为 $j,i,j-1$，在三盏灯的 $3!$ 种相对顺序中占一种，概率为 $1/6$。

把这些概率相加可得：

$$
\mathbb E[C_i]=
\begin{cases}
\dfrac{n+4}{6},&i=1\text{ 或 }i=n,\\[6pt]
\dfrac{n+3}{6},&1<i<n.
\end{cases}
$$

当 $n=1$ 时，唯一一盏灯打开后只有一个连续段，答案就是 $a_1$。

所以 $n\ge2$ 时答案为

$$
(a_1+a_n)\frac{n+4}{6}
+\left(\sum_{i=2}^{n-1}a_i\right)\frac{n+3}{6}.
$$

#### 与代码预处理的关系

代码没有直接乘 $6^{-1}$，而是预处理所有 $n!$ 个排列中两类位置的连续段数总和：

- `muled[n][0]` 对应端点，其值为 $n!\cdot(n+4)/6$；
- `muled[n][1]` 对应内部点，其值为 $n!\cdot(n+3)/6$。

最后乘 `invfac[n]`，也就是除以排列总数 $n!$，得到期望。

### 正确性说明

连续段数被准确拆成了“每个位置是否为某个亮灯段左端点”的指示变量之和。代码分别计算这些指示变量在灯 $i$ 打开时为 $1$ 的概率，再由期望线性性求和，因此得到的系数就是 $\mathbb E[C_i]$。

总得分为 $\sum_i a_iC_i$，再次使用期望线性性后，端点和内部点分别乘上对应系数即可，故公式和代码输出均为正确期望。

### 复杂度

当前代码对每个阶乘单独快速幂求逆：

- 预处理时间复杂度：$O(N\log 998244353)$；
- 所有测试的时间复杂度：$O(\sum n)$；
- 空间复杂度：$O(N)$。

### 参考代码

```cpp title="1006.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll mod=998244353;
const int N=2e5;
ll muled[N+5][2];
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
void solve()
{
    int n;
    cin>>n;
    vector<ll>v(n,0);
    ll sum0=0;
    ll sum1=0;
    for (int i=0;i<n;i++)
    {
        cin>>v[i];
    }
    if(n==1)
    {
        cout<<v[0]<<"\n";
    }
    else
    {
        sum0=(v[0]+v[n-1])%mod;
        for (int i=1;i<n-1;i++)
        {
            sum1=(sum1+v[i])%mod;
        }
        cout<<(sum0*muled[n][0]%mod*invfac[n]%mod+sum1*muled[n][1]%mod*invfac[n]%mod)%mod<<"\n";
    }
}
int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    int t;
    cin >> t;
    muled[1][0]=1;
    muled[2][0]=2;
    muled[3][0]=7;
    muled[3][1]=6;
    ll beadd=1;
    for (ll i=4;i<=N;i++)
    {
        beadd=beadd*i;
        beadd%=mod;
        muled[i][0]=((muled[i-1][0]*i)%mod+beadd)%mod;
        muled[i][1]=((muled[i-1][1]*i)%mod+beadd)%mod;
    }
    fac[0]=1;
    invfac[0]=1;
    for (int i=1;i<=N;i++)
    {
        fac[i]=fac[i-1]*i;
        fac[i]%=mod;
        invfac[i]=qpow(fac[i],mod-2);
    }
    while (t--)
    {
        solve();
    }
}
```

---

## 1008. 数字子序列

### 题意

给定一个数字串 $D$。选择若干个互不相交、从左到右排列的非空子串，把每个子串按十进制解释成一个整数，要求这些整数严格递增。

多位数不能含前导零，单独的 `0` 合法。求最多能选择多少个整数。

### 思路

这是“区间不能相交”的最长上升子序列。难点有两个：大整数不能直接转换成数值，以及不能枚举全部 $O(n^2)$ 个子串。

#### 为什么只需考虑不超过 500 位的数

因为

$$
1+2+\cdots+500=125250>10^5.
$$

考虑任意可行方案中由长数字组成的后缀。如果其中出现超过 500 位的数字，就从后往前取一段，并把这段中第 $j$ 个数字替换成它的一个前缀，使这些前缀的长度依次为

$$
500-q+1,500-q+2,\ldots,500.
$$

只要继续向前扩展这段，便能保证每个原子串都足够长。新数字的位数严格递增，所以数值也严格递增；它们还是原区间的前缀，因此不会破坏不相交关系。

若一直无法停止而需要 $q=500$，原串至少要容纳长度为 $1,2,\ldots,500$ 的这些子串，总长已经超过 $10^5$，矛盾。因此所有超过 500 位的部分都能这样压缩，且答案不变。

所以枚举长度 $len=1\ldots\min(500,n)$ 足够。

#### 后缀数组比较等长大整数

对于没有前导零且长度相同的两个十进制串，数值大小就是字典序大小。

先建立原串的后缀数组 `sa` 和相邻后缀的最长公共前缀 `height`。固定长度 $len$ 后，按后缀数组顺序扫描：

- 若相邻后缀的 LCP 至少为 $len$，它们的前 $len$ 位相同，赋相同编号；
- 否则开始一个新编号。

于是 `num[pos]` 就是从 `pos` 开始、长度为 $len$ 的数字的离散排名。排名越小，数值越小。

#### 动态规划

固定当前长度 $len$。

- `f[i]`：最后一个数字长度恰为 $len$，且在位置 $i$ 结束时，最多能选多少个数；
- `g[i]`：只使用已经处理过的长度，且所有区间都位于前缀 $[0,i]$ 内时的最大答案。

设当前数字区间为 $[l,i]$，其中 $l=i-len+1$。

##### 从更短的数字转移

如果当前串首位不是 `0`，所有位数小于 $len$ 的合法数字都严格小于它。因此可以接在位置 $l$ 之前的最优方案后面：

$$
f[i]\leftarrow g[l-1]+1.
$$

代码的零下标写法对应 `g[i-len]+1`。

##### 从同长度数字转移

同长度时必须要求上一个数字的排名严格小于当前排名。用树状数组维护

$$
\text{rank}\longmapsto\max f,
$$

查询排名区间 $[1,\text{num}[l)-1]$ 的最大值，再加一即可。

树状数组只加入已经完全位于当前区间左侧的子串，所以同时满足区间不相交。查询 `rank-1` 则保证数值严格递增，而不是非递减。

单个 `0` 可以作为序列起点；长度大于 $1$ 且首位为 `0` 的子串直接跳过。

处理完当前长度后，把所有 `f[i]` 合并到 `g[i]`，再对 `g` 做前缀最大值，供更长数字转移。

### 正确性说明

按数字位数从小到大归纳。处理长度 $len$ 前，`g` 已包含所有最后一个数字位数小于 $len$ 的最优方案。

对任意以当前区间结尾的最优方案，其倒数第二个数字只有两种情况：

1. 位数更短，此时一定更小，且由 `g[l-1]` 完整覆盖；
2. 位数相同，此时必须字典序更小，树状数组查询恰好枚举所有排名更小且不相交的状态。

两种转移覆盖全部可能，且每个被转移的状态都满足严格递增和区间不相交，所以 `f` 正确。合并并取前缀最大值后 `g` 也保持定义。结合 500 位压缩结论，最终 `g` 的最大值就是原问题答案。

### 复杂度

设 $B=\min(500,n)$。

- 建立后缀数组：$O(n\log n)$；
- 每个长度进行一次排名扫描和树状数组 DP：$O(n\log n)$；
- 总时间复杂度：$O(Bn\log n)$；
- 空间复杂度：$O(n)$。

### 参考代码

```cpp title="1008.cpp"
#include <bits/stdc++.h>
using namespace std;
constexpr int inf = 1e9;
struct SA
{
    int n;
    vector<int> sa, rk, lc;
    SA(const string &s)
    {
        n = s.size();
        sa.resize(n);
        lc.resize(n - 1);
        rk.resize(n);
        iota(sa.begin(), sa.end(), 0);
        sort(sa.begin(), sa.end(), [&](int a, int b)
             { return s[a] < s[b]; });
        rk[sa[0]] = 0;
        for (int i = 1; i < n; i++)
        {
            rk[sa[i]] = rk[sa[i - 1]] + (s[sa[i]] != s[sa[i - 1]]);
        }
        int k = 1;
        vector<int> tmp, cnt(n);
        tmp.reserve(n);
        while (rk[sa[n - 1]] < n - 1)
        {
            tmp.clear();
            for (int i = 0; i < k; i++)
            {
                tmp.push_back(n - k + i);
            }
            for (auto i : sa)
            {
                if (i >= k)
                {
                    tmp.push_back(i - k);
                }
            }
            fill(cnt.begin(), cnt.end(), 0);
            for (int i = 0; i < n; i++)
            {
                cnt[rk[i]]++;
            }
            for (int i = 1; i < n; i++)
            {
                cnt[i] += cnt[i - 1];
            }
            for (int i = n - 1; i >= 0; i--)
            {
                sa[--cnt[rk[tmp[i]]]] = tmp[i];
            }
            swap(rk, tmp);
            rk[sa[0]] = 0;
            for (int i = 1; i < n; i++)
            {
                int x = sa[i - 1], y = sa[i];
                bool same = (tmp[x] == tmp[y]) &&
                            (x + k < n) == (y + k < n) &&
                            (x + k >= n || tmp[x + k] == tmp[y + k]);
                rk[y] = rk[x] + !same;
            }
            k *= 2;
        }
        // 计算 height
        for (int i = 0, j = 0; i < n; i++)
        {
            if (rk[i] == 0)
            {
                j = 0;
                continue;
            }
            if (j > 0) j--;
            while (i + j < n && sa[rk[i] - 1] + j < n && s[i + j] == s[sa[rk[i] - 1] + j])
            {
                j++;
            }
            lc[rk[i] - 1] = j;
        }
    }
};
template <typename T>
struct Fenwick
{
    int n;
    vector<T> a;
    Fenwick(int n_ = 0) { init(n_); }
    void init(int n_)
    {
        n = n_;
        // 1-based 需要开 n + 1 的空间
        a.assign(n + 1,T{});
    }
    void add(int x, const T &v)
    {
        // 直接使用 x，不再需要 x + 1
        for (int i = x; i <= n; i += i & -i)
        {
            a[i] = max(a[i] ,v);
        }
    }
    T sum(int x)
    {
        T ans{};
        // 直接使用 x，不再需要 i - 1
        for (int i = x; i > 0; i -= i & -i)
        {
            ans = max(ans , a[i]);
        }
        return ans;
    }
    T rangeSum(int l, int r) { return sum(r) - sum(l - 1); }
    int select(const T &k)//最大的位置 x，使得前缀和 sum(x) <= k
    {
        int x = 0;
        T cur{};
        for (int i = 1 << __lg(n); i; i /= 2)
        {
            // 内部逻辑相应调整为 1-based 访问
            if (x + i <= n && cur + a[x + i] <= k)
            {
                x += i;
                cur = cur + a[x];
            }
        }
        return x;
    }
};
const int N=1e5;
int f[N+5];
int g[N+5];
int num[N+5];
void solve()
{
    string s;
    cin >> s;
    int n = s.size();
    SA sa(s);
    auto suf = sa.sa;
    auto height = sa.lc;
    for (int i=0;i<=n;i++)
    {
        f[i]=g[i]=0;
        num[i]=0;
    }
    // cerr<<n<<endl;
    int res=0;
    for (int len = 1; len <= min(500, n); len++)
    {


        int p = 1;
        for (int i = 0; i < n; i++)
        {
            if (i == 0)
            {
                num[suf[i]] = ++p;
            }
            else
            {
                if (height[i - 1] < len)
                    num[suf[i]] = ++p;
                else
                    num[suf[i]] = p;
            }

        }
        Fenwick<int>tr(p+1);
        for (int i = len - 1; i<n; i++)
        {
            if (s[i-len+1] != '0')f[i]=tr.sum(num[i-len+1]-1)+1;
            if(s[i-len+1]=='0'&&len==1)f[i]=1;
            if(i>=len&&s[i-len+1]!='0')
            f[i]=max(f[i],g[i-len]+1);
            else f[i]=max(f[i],1);
            if(i-len+1-len+1>=0)
            tr.add(num[i-len+1-len+1],f[i-len+1]);
        }
        for (int i=len-1;i<n;i++)
        {
            g[i]=max(g[i],f[i]);
        }
        for (int i=0;i<n;i++)
        {
            g[i+1]=max(g[i],g[i+1]);
        }
        for (int i=0;i<=n;i++)
        {
            f[i]=0;
            res=max(res,g[i]);
        }
    }
    cout<<res<<"\n";
}
int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    int t;
    cin >> t;
    while (t--)
    {
        solve();
    }
}
```

---

## 1010. 游戏

### 题意

有 $n$ 堆石子从左到右排列，第 $i$ 堆有 $x_i$ 颗石子。

- Alice 每回合从当前最左堆取至少一颗，移到它右边一堆；
- Bob 每回合从当前最右堆取至少一颗，移到它左边一堆；
- 当前玩家无法操作时输。

双方都采用最优策略，判断先手 Alice 是否必胜。

### 思路

一侧清空若干外层石堆时，真正限制它的是这些石堆的石子总量。因为每次至少移动一颗，玩家可以通过“每次只移一颗”拖延，也可以一次清空当前边界堆加速推进。

#### 累计石子比较引理

把左右两侧向中间推进时的累计石子数分别记为 $L_i,R_i$。对称模仿策略给出：

- 如果当前累计量相同，后手可以完全模仿先手在另一侧移动的数量，胜负继续由更内一层决定；
- 如果当前累计量不同，累计量较大的一侧可以先模仿，等较小一侧耗尽后仍保留一次操作，从而夺得这一层的主动权。

因此应从靠近中间的最大累计范围向外比较。最内层出现的第一个不同累计和决定胜负；若始终相同，则由中心剩余堆数，也就是 $n$ 的奇偶性决定。

代码用从外向内扫描并不断覆盖 `flag` 的方式实现这一比较：每遇到新的不等关系，就用它替换旧关系，所以最终保留的正是下标最大的那次差异。

#### $n$ 为奇数

设 $n=2m+1$，中间有一堆不属于任何一侧。定义

$$
L_i=\sum_{j=1}^{i+1}x_j,\qquad
R_i=\sum_{j=n-i}^{n}x_j,\qquad 0\le i<m.
$$

比较序列

$$
(L_{m-1},L_{m-2},\ldots,L_0)
$$

与

$$
(R_{m-1},R_{m-2},\ldots,R_0)
$$

的字典序。左侧严格更大时 Alice 必胜；如果所有累计和都相等，Alice 不能取得最后的额外操作，因此判负。

#### $n$ 为偶数

设 $n=2m$。中心没有单独的一堆，先手在中心对峙时多出一次主动权。代码把最左两堆作为第一个左侧累计量：

$$
L_i=\sum_{j=1}^{i+2}x_j,\qquad
R_i=\sum_{j=n-i}^{n}x_j,\qquad 0\le i<m-1.
$$

仍从下标最大的累计和开始比较。左侧更大时 Alice 必胜；所有累计和相等时也由 Alice 获胜，所以这里采用非严格比较。

边界情况：$n=1$ 时 Alice 无法操作，答案为 `NO`；$n=2$ 时 Alice 可以直接取得主动权，答案为 `YES`。

### 正确性说明

对已经剥去的外层堆数归纳。累计量相等时，模仿策略使双方在这一层消耗同样多的回合，问题缩小为内层同类局面；累计量不等时，较大一侧可以覆盖较小一侧的全部操作并多保留一次合法移动，因此这一层的大小关系覆盖所有更外层的关系。

所以最后一个不相等的累计和，即最靠近中间的有效差异，唯一决定胜负。若不存在差异，奇数堆时 Alice 先无合法操作，偶数堆时 Bob 先无合法操作。代码对奇偶两类构造相应累计和并保留最后一次差异，恰好实现了上述判定。

### 复杂度

每组数据只需线性扫描一次。

- 时间复杂度：$O(n)$；
- 空间复杂度：$O(n)$（累计和也可以压缩到 $O(1)$）。

### 参考代码

```cpp title="1010.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
void solve()
{
    int n;
    cin>>n;
    vector<ll>v(n,0);
    for (int i=0;i<n;i++)
    {
        cin>>v[i];
    }
    if(n==2)
    {
        cout<<"YES\n";
    }
    else if(n==1)
    {
        cout<<"NO\n";
    }
    else if (n%2==1)
    {
        int lt=n/2;
        int rt=n/2;
        vector<ll> suml(n,0);
        vector<ll> sumr(n,0);
        bool flag=0;//0 xian,1 hou
        suml[0]=v[0];
        for (int i=1;i<lt;i++)
        {
            suml[i]=suml[i-1]+v[i];
        }
        sumr[0]=v[n-1];
        for (int i=1;i<rt;i++)
        {
            sumr[i]=sumr[i-1]+v[n-i-1];
        }
        for (int i=0;i<lt;i++)
        {
            if (flag==1)
            {
                if (suml[i]<sumr[i])flag=0;
            }
            else
            {
                if (suml[i]>sumr[i])flag=1;
            }
        }
        if(flag==1)
        {
            if(sumr[rt-1]>suml[lt-1])
            {
                cout<<"NO\n";
            }
            else
            {
                cout<<"YES\n";
            }
        }
        else
        {
            if(sumr[rt-1]>=suml[lt-1])
            {
                cout<<"NO\n";
            }
            else
            {
                cout<<"YES\n";
            }
        }
    }
    else
    {
        int lt=n/2-1;
        int rt=n/2-1;
        vector<ll> suml(n,0);
        vector<ll> sumr(n,0);
        bool flag=1;//0 xian,1 hou
        suml[0]=v[0]+v[1];
        for (int i=1;i<lt;i++)
        {
            suml[i]=suml[i-1]+v[i+1];
        }
        sumr[0]=v[n-1];
        for (int i=1;i<rt;i++)
        {
            sumr[i]=sumr[i-1]+v[n-i-1];
        }
        for (int i=0;i<lt;i++)
        {
            if (flag==1)
            {
                if (suml[i]<sumr[i])flag=0;
            }
            else
            {
                if (suml[i]>sumr[i])flag=1;
            }
        }
        if(flag)
        {
            if(sumr[rt-1]>suml[lt-1])
            {
                cout<<"NO\n";
            }
            else
            {
                cout<<"YES\n";
            }
        }
        else
        {
            if(sumr[rt-1]>=suml[lt-1])
            {
                cout<<"NO\n";
            }
            else
            {
                cout<<"YES\n";
            }
        }
    }
}
int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    int t;
    cin >> t;
    while (t--)
    {
        solve();
    }
}
```

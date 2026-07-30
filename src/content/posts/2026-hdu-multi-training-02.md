---
title: "2026 杭电多校第二场题解"
published: 2026-07-30
description: "收录 2026 杭电多校第二场的 10 道题：1001、1002、1003、1004、1005、1006、1007、1008、1010、1011，包含完整思路、正确性说明、复杂度分析与 AC 代码。"
tags: ["ACM", "题解", "杭电多校", "2026 暑假集训"]
category: "竞赛题解"
sourceLink: "https://acm.hdu.edu.cn/contest/problems?cid=1230"
draft: false
comment: true
lang: "zh_CN"
---

本篇整理自队伍的 2026 暑假集训记录，共收录 **10** 道已通过题目。每题均包含题意、核心思路、正确性说明、复杂度分析和对应的 AC 代码。

比赛链接：[2026 杭电多校第二场](https://acm.hdu.edu.cn/contest/problems?cid=1230)

## 题目索引

| 题目 | 核心算法 |
| --- | --- |
| 1001. xyz 问题 | 2-SAT、强连通分量、布尔逻辑、构造 |
| 1002. 表达式 2 | 动态规划、生成函数、矩阵乘法、分治、NTT |
| 1003. 张力 | 字典树、动态规划、区间最值、ST表、lowbit |
| 1004. 坪测鸡 | 模拟、调度、线段树、优先队列、多队列 |
| 1005. 减数游戏 2 | 博弈论、mex、容斥原理、组合计数、NTT |
| 1006. 合成大 hdu | 构造、字符串、子序列计数、数学 |
| 1007. 另一个 shu 论问题 | 树、最大公约数、莫比乌斯反演、DSU on Tree、约数 |
| 1008. 最遥远的距离 | 构造、树、树的直径、离心率、分类讨论 |
| 1010. 幻灵战队 2 | 贪心、凸函数、min-plus卷积、优先队列、Huffman合并 |
| 1011. 键盘杀手 | 动态规划、路径、删除顺序、边定向、相邻关系 |

## 1001. xyz 问题

### 题意

有 $n$ 张数字牌和 $m$ 张运算牌：

- 数字牌 $x_i$ 需要填入 $0$ 或 $1$；
- 运算牌 $op_j$ 需要填入 `&`、`|`、`^` 之一。

给出 $k$ 个条件 $(i,j,y,z)$，要求

$$
x_i\ op_j\ y=z,
$$

其中 $y,z\in\{0,1\}$。需要输出任意一组满足全部条件的填写方案，或判断无解。

### 思路

#### 把每张运算牌压缩为两个候选

运算牌原本有三种取值，不能直接作为布尔变量。考虑同一张运算牌出现过的条件类型。

如果它曾出现在 $(y,z)=(1,0)$ 的条件中，即要求

$$
x_i\ op_j\ 1=0,
$$

那么按位或不可能得到 $0$，所以必有

$$
op_j\in\{\&,\ ^\}.
$$

如果没有出现过 $(1,0)$，则可以排除异或，保留

$$
op_j\in\{\&,\ |\}.
$$

原因如下：

- 当 $y=0$ 时，`|` 与 `^` 的结果都等于 $x_i$；
- 当 $y=1$ 时，由于没有 $(1,0)$，只可能要求结果为 $1$，此时 `|` 恒能满足；
- 所以任何选择 `^` 的可行方案，都可以把该运算牌改成 `|` 而不破坏条件。

因此每张运算牌都只剩两个候选值，可以用一个布尔变量表示。

#### 把不合法组合转化为 2-SAT 子句

现在共有 $n+m$ 个布尔变量：

- 一个变量表示数字牌 $x_i$ 的值；
- 一个变量表示运算牌 $op_j$ 选择两个候选中的哪一个。

对于一个条件 $(i,j,y,z)$，枚举 $x_i$ 与运算牌布尔变量的四种组合。如果组合 $(x_i=\alpha,op_j=\beta)$ 不能使等式成立，就必须禁止二者同时出现：

$$
\neg(x_i=\alpha\land op_j=\beta).
$$

它等价于 2-SAT 子句

$$
(x_i\ne\alpha)\lor(op_j\ne\beta),
$$

再加入对应的两条蕴含边即可。

现有代码没有显式枚举四种组合，而是用 `buildand`、`buildor`、`buildxor` 按真值表直接加入相同的蕴含关系。

#### SCC 求解并还原答案

对蕴含图运行 Tarjan 强连通分量算法。

若某个变量的真、假两个文字位于同一个强连通分量，则它们可以互相推出，问题无解。

否则按照 SCC 缩点后的逆拓扑顺序为每个变量选择真或假，即可得到一组可行解。输出数字牌字符串后，再根据每张运算牌所属的候选集合把布尔值还原为 `&`、`|` 或 `^`。

### 正确性说明

对出现过 $(1,0)$ 的运算牌，`|` 必然非法，所以候选集合 $\{\&,\ ^\}$ 不会遗漏可行解。对未出现 $(1,0)$ 的运算牌，任何使用 `^` 的可行方案都能安全替换为 `|`，因此候选集合 $\{\&,\ |\}$ 至少保留一组可行解。

压缩后，每个条件只涉及一个数字牌布尔变量和一个运算牌布尔变量。算法对每个不能满足该条件的取值组合加入一个恰好禁止该组合的 2-SAT 子句，所以一个布尔赋值满足蕴含图，当且仅当它满足所有原条件。

2-SAT 的 SCC 判定保证：某个变量的真、假文字同属一个 SCC 时无解；否则按缩点拓扑序选择文字一定得到满足全部蕴含关系的赋值。将运算牌布尔值还原后，得到的就是原问题的一组合法方案。

### 复杂度

蕴含图有 $2(n+m)$ 个有效文字，每个条件只添加常数条边。

- 时间复杂度：$O(n+m+k)$；
- 空间复杂度：$O(n+m+k)$。

### 参考代码

```cpp title="1001.cpp"
#include<bits/stdc++.h>
using namespace std;
struct SCC
{
    int n;
    vector<vector<int>> adj;
    vector<int> stk;
    vector<int> dfn, low, bel;
    int cur, cnt;
    SCC() {}
    SCC(int n) { init(n); }
    void init(int n)
    {
        this->n = n;
        adj.assign(n, {});
        dfn.assign(n, -1);
        low.resize(n);
        bel.assign(n, -1);
        stk.clear();
        cur = cnt = 0;
    }
    void addEdge(int u, int v) { adj[u].push_back(v); }
    void dfs(int x)
    {
        dfn[x] = low[x] = cur++;
        stk.push_back(x);
        for (auto y : adj[x])
        {
            if (dfn[y] == -1)
            {
                dfs(y);
                low[x] = min(low[x], low[y]);
            }
            else if (bel[y] == -1)
            {
                low[x] = min(low[x], dfn[y]);
            }
        }
        if (dfn[x] == low[x])
        {
            int y;
            do
            {
                y = stk.back();
                bel[y] = cnt;
                stk.pop_back();
            } while (y != x);
            cnt++;
        }
    }
    vector<int> work()
    {
        for (int i = 0; i < n; i++)
        {
            if (dfn[i] == -1)
            {
                dfs(i);
            }
        }
        return bel;
    }
};
void solve()
{
    int n,m,k;
    cin>>n>>m>>k;
    SCC scc(2*n+2*m+1);
    vector<array<int,4>>v(k);
    map<int,int>counted;
    for (int t=0;t<k;t++)
    {
        cin>>v[t][0]>>v[t][1]>>v[t][2]>>v[t][3];
        if(v[t][2]==1&&v[t][3]==0)
        {
            counted[v[t][1]]=1;
        }
    }
    // cerr<<1<<endl;
    auto idxnt=[&](int x)
    {
        return 2*x-1;
    };
    auto idxnf=[&](int x)
    {
        return 2*x;
    };
    auto idxmt=[&](int x)
    {
        return 2*n+2*x-1;
    };
    auto idxmf=[&](int x)
    {
        return 2*n+2*x;
    };
    auto buildand=[&](int x,int op,int y,int z)->void
    {
        if(y==0&&z==0)
        {

        }
        else if(y==0&&z==1)
        {
            scc.addEdge(idxmt(op),idxmf(op));
        }
        else if(y==1&&z==0)
        {
            scc.addEdge(idxmt(op), idxnf(x));
            scc.addEdge(idxnt(x), idxmf(op));
        }
        else
        {
            scc.addEdge(idxmt(op), idxnt(x));
            scc.addEdge(idxnf(x), idxmf(op));
        }
    };
    auto buildor=[&](int x,int op,int y,int z)->void
    {
        if(y==0&&z==0)
        {
             scc.addEdge(idxnt(x),idxmt(op));
             scc.addEdge(idxmf(op),idxnf(x));
        }
        else if(y==0&&z==1)
        {
            scc.addEdge(idxnf(x),idxmt(op));
            scc.addEdge(idxmf(op),idxnt(x));
        }
        else if(y==1&&z==0)
        {
            scc.addEdge(idxmf(op),idxmt(op));
        }
        else
        {

        }
    };
    auto buildxor=[&](int x,int op,int y,int z)->void
    {
        if(y==0&&z==0)
        {
            scc.addEdge(idxnt(x),idxmt(op));
            scc.addEdge(idxmf(op),idxnf(x));
        }
        else if(y==0&&z==1)
        {
            scc.addEdge(idxnf(x),idxmt(op));
            scc.addEdge(idxmf(op),idxnt(x));
        }
        else if(y==1&&z==0)
        {
            scc.addEdge(idxnf(x),idxmt(op));
            scc.addEdge(idxmf(op),idxnt(x));
        }
        else
        {
            scc.addEdge(idxnt(x),idxmt(op));
            scc.addEdge(idxmf(op),idxnf(x));
        }

    };
    // cerr<<1<<endl;
    for (int i=0;i<k;i++)
    {
        if(counted.count(v[i][1]))
        {
            buildand(v[i][0],v[i][1],v[i][2],v[i][3]);
            buildxor(v[i][0],v[i][1],v[i][2],v[i][3]);
        }
        else
        {
            buildand(v[i][0],v[i][1],v[i][2],v[i][3]);
            buildor(v[i][0],v[i][1],v[i][2],v[i][3]);
        }
    }
    // cerr<<1<<endl;
    for (int i=1;i<=2*n+2*m;i++)
    {
        if(scc.dfn[i]==-1)
        {
            scc.dfs(i);
        }
    }
    for (int i=2;i<=2*n+2*m;i+=2)
    {
        if(scc.bel[i]==scc.bel[i-1])
        {
            cout<<"NO"<<"\n";
            return ;
        }
    }
    cout<<"YES"<<"\n";
    for (int i=2;i<=2*n;i+=2)
    {
        if(scc.bel[i]>scc.bel[i-1])
        {
            cout<<1;
        }
        else
        {
            cout<<0;
        }
    }
    cout<<"\n";
    for (int i=2*n+2;i<=2*n+2*m;i+=2)
    {
        if(counted.count((i-2*n)/2))
        {
            if(scc.bel[i]>scc.bel[i-1])
            {
                cout<<"&";
            }
            else
            {
                cout<<"^";
            }
        }
        else
        {
             if(scc.bel[i]>scc.bel[i-1])
            {
                cout<<"&";
            }
            else
            {
                cout<<"|";
            }
        }
    }
    cout<<"\n";
}
int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    int t;
    cin>>t;

    while(t--)
    {
        solve();
    }
}
```

---

## 1002. 表达式 2

### 题意

给定一个由 $n$ 个非零数字组成的数字串 $S$。

对于每个 $0\le k<n$，在相邻数字之间恰好插入 $k$ 个乘号。每种插入方案会得到一个乘法表达式，求所有方案的表达式结果之和，答案对 $998244353$ 取模。

### 思路

#### 朴素 DP

设 $d_i$ 为第 $i$ 个数字。

定义：

- $f(i,k)$：前 $i$ 个数字插入 $k$ 个乘号时，所有表达式结果之和；
- $g(i,k)$：这些表达式中，除去最后一个数字段后，其余各段乘积之和。

考虑在 $d_i$ 前是否插入乘号。

不插入乘号时，最后一个数字段末尾追加 $d_i$。若原表达式为“前面各段乘积 $P$”乘“最后一段 $x$”，新结果为

$$
P(10x+d_i)=10Px+d_iP.
$$

因此

$$
\begin{aligned}
f(i,k)&\mathrel{+}=10f(i-1,k)+d_i g(i-1,k),\\
g(i,k)&\mathrel{+}=g(i-1,k).
\end{aligned}
$$

插入乘号时，$d_i$ 成为新的最后一段：

$$
\begin{aligned}
f(i,k)&\mathrel{+}=d_i f(i-1,k-1),\\
g(i,k)&\mathrel{+}=f(i-1,k-1).
\end{aligned}
$$

直接计算需要 $O(n^2)$，无法通过。

#### 用生成函数同时表示所有 $k$

定义多项式

$$
F_i(x)=\sum_{k=0}^{i-1}f(i,k)x^k,
\qquad
G_i(x)=\sum_{k=0}^{i-1}g(i,k)x^k.
$$

乘以 $x$ 就表示新增一个乘号。上述转移可以写成

$$
\begin{bmatrix}F_i&G_i\end{bmatrix}
=
\begin{bmatrix}F_{i-1}&G_{i-1}\end{bmatrix}
\begin{bmatrix}
10+d_ix & x\\
d_i & 1
\end{bmatrix}.
$$

记右侧矩阵为 $M_i$。初始时

$$
F_1=d_1,\qquad G_1=1.
$$

所以最终需要计算

$$
\begin{bmatrix}d_1&1\end{bmatrix}
M_2M_3\cdots M_n.
$$

结果中第一项多项式的第 $k$ 次项系数就是所求的 $ans_k$。

#### 分治乘多项式矩阵

每个 $M_i$ 的元素都只是一次多项式，但顺序相乘后次数会不断增长。

使用分治计算一段矩阵乘积：

1. 递归求出左半段矩阵积；
2. 递归求出右半段矩阵积；
3. 用多项式矩阵乘法合并。

长度为 $m$ 的区间中，矩阵元素次数为 $O(m)$。使用 NTT 完成多项式卷积，每层分治的总计算量为 $O(n\log n)$，共有 $O(\log n)$ 层。

### 正确性说明

朴素 DP 按最后一个空隙是否插入乘号划分全部方案，两类方案互不重叠且覆盖所有插入方式。相应公式准确描述了最后数字段被追加数字或新建数字段时，表达式结果与前缀乘积的变化。

生成函数的第 $k$ 次项与 DP 中插入 $k$ 个乘号的状态一一对应；乘以 $x$ 恰好把乘号数量增加一。因此矩阵 $M_i$ 与朴素 DP 的转移完全等价。

分治只改变矩阵连乘的括号位置，不改变矩阵的原有顺序。矩阵乘法满足结合律，所以最终得到的乘积与依次执行全部 DP 转移相同。故输出多项式的各项系数正是所有 $ans_k$。

### 复杂度

设 NTT 乘法复杂度为 $M(n)=O(n\log n)$。分治矩阵连乘的复杂度为

$$
O(M(n)\log n)=O(n\log^2 n).
$$

空间复杂度为 $O(n)$。

### 参考代码

```cpp title="1002.cpp"
#include <bits/stdc++.h>
using namespace std;

using i64 = long long;

template<class T>
constexpr T power(T a, i64 b) {
    T res = 1;
    for (; b; b /= 2, a *= a) {
        if (b % 2) {
            res *= a;
        }
    }
    return res;
}

template<int P>
struct MInt {
    int x;
    constexpr MInt() : x{} {}
    constexpr MInt(i64 x) : x{norm(x % getMod())} {}
    static int Mod;
    constexpr static int getMod() {
        if (P > 0) {
            return P;
        } else {
            return Mod;
        }
    }
    constexpr static void setMod(int Mod_) {
        Mod = Mod_;
    }
    constexpr int norm(int x) const {
        if (x < 0) {
            x += getMod();
        }
        if (x >= getMod()) {
            x -= getMod();
        }
        return x;
    }
    constexpr int val() const {
        return x;
    }
    explicit constexpr operator int() const {
        return x;
    }
    constexpr MInt operator-() const {
        MInt res;
        res.x = norm(getMod() - x);
        return res;
    }
    constexpr MInt inv() const {
        assert(x != 0);
        return power(*this, getMod() - 2);
    }
    constexpr MInt &operator*=(MInt rhs) & {
        x = 1LL * x * rhs.x % getMod();
        return *this;
    }
    constexpr MInt &operator+=(MInt rhs) & {
        x = norm(x + rhs.x);
        return *this;
    }
    constexpr MInt &operator-=(MInt rhs) & {
        x = norm(x - rhs.x);
        return *this;
    }
    constexpr MInt &operator/=(MInt rhs) & {
        return *this *= rhs.inv();
    }
    friend constexpr MInt operator*(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res *= rhs;
        return res;
    }
    friend constexpr MInt operator+(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res += rhs;
        return res;
    }
    friend constexpr MInt operator-(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res -= rhs;
        return res;
    }
    friend constexpr MInt operator/(MInt lhs, MInt rhs) {
        MInt res = lhs;
        res /= rhs;
        return res;
    }
    friend constexpr std::istream &operator>>(std::istream &is, MInt &a) {
        i64 v;
        is >> v;
        a = MInt(v);
        return is;
    }
    friend constexpr std::ostream &operator<<(std::ostream &os, const MInt &a) {
        return os << a.val();
    }
    friend constexpr bool operator==(MInt lhs, MInt rhs) {
        return lhs.val() == rhs.val();
    }
    friend constexpr bool operator!=(MInt lhs, MInt rhs) {
        return lhs.val() != rhs.val();
    }
};

template<>
int MInt<0>::Mod = 998244353;

template<int V, int P>
constexpr MInt<P> CInv = MInt<P>(V).inv();

constexpr int P = 998244353;
using Z = MInt<P>;

std::vector<int> rev;
template<int P>
std::vector<MInt<P>> roots{0,1};

template<int P>
constexpr MInt<P> findPrimitiveRoot() {
    MInt<P> i = 2;
    int k = __builtin_ctz(P - 1);
    while (true) {
        if (power(i, (P - 1) / 2) != 1) {
            break;
        }
        i += 1;
    }
    return power(i, (P - 1) >> k);
}

template<int P>
constexpr MInt<P> primitiveRoot = findPrimitiveRoot<P>();

template<>
constexpr MInt<998244353> primitiveRoot<998244353> {3};

template<int P>
constexpr void dft(std::vector<MInt<P>> &a) {
    int n = a.size();
    if (int(rev.size()) != n) {
        int k = __builtin_ctz(n) - 1;
        rev.resize(n);
        for (int i = 0; i < n; i++) {
            rev[i] = rev[i >> 1] >> 1 | (i & 1) << k;
        }
    }
    for (int i = 0; i < n; i++) {
        if (rev[i] < i) {
            std::swap(a[i], a[rev[i]]);
        }
    }
    if (roots<P>.size() < n) {
        int k = __builtin_ctz(roots<P>.size());
        roots<P>.resize(n);
        while ((1LL << k) < n) {
            auto e = power(primitiveRoot<P>, ((P-1)>>(k+1)));
            for (int i = 1 << (k - 1); i < (1 << k); i++) {
                roots<P>[2 * i] = roots<P>[i];
                roots<P>[2 * i + 1] = roots<P>[i] * e;
            }
            k++;
        }
    }
    for (int k = 1; k < n; k *= 2) {
        for (int i = 0; i < n; i += 2 * k) {
            for (int j = 0; j < k; j++) {
                MInt<P> u = a[i + j];
                MInt<P> v = a[i + j + k] * roots<P>[k + j];
                a[i + j] = u + v;
                a[i + j + k] = u - v;
            }
        }
    }
}

template<int P>
constexpr void idft(std::vector<MInt<P>> &a) {
    int n = a.size();
    std::reverse(a.begin() + 1, a.end());
    dft(a);
    MInt<P> inv =  (MInt<P>)(1-P)/ n;
    for (int i = 0; i < n; i++) {
        a[i] *= inv;
    }
}

template<int P = 998244353>
struct Poly : public std::vector<MInt<P>> {
    using Value = MInt<P>;
    Poly() : std::vector<Value>() {}
    explicit constexpr Poly(int n) : std::vector<Value>(n) {}
    explicit constexpr Poly(const std::vector<Value> &a) : std::vector<Value>(a) {}
    constexpr Poly(const std::initializer_list<Value> &a) : std::vector<Value>(a) {}
    template<class InputIt, class = std::_RequireInputIter<InputIt>>
    explicit constexpr Poly(InputIt first, InputIt last) : std::vector<Value>(first, last) {}
    template<class F>
    explicit constexpr Poly(int n, F f) : std::vector<Value>(n) {
        for (int i = 0; i < n; i++) {
            (*this)[i] = f(i);
        }
    }
    constexpr Poly shift(int k) const {
        if (k >= 0) {
            auto b = *this;
            b.insert(b.begin(), k, 0);
            return b;
        } else if (this->size() <= -k) {
            return Poly();
        } else {
            return Poly(this->begin() + (-k), this->end());
        }
    }
    constexpr Poly trunc(int k) const {
        Poly f = *this;
        f.resize(k);
        return f;
    }
    constexpr friend Poly operator+(const Poly &a, const Poly &b) {
        Poly res(std::max(a.size(), b.size()));
        for (int i = 0; i < a.size(); i++) {
            res[i] += a[i];
        }
        for (int i = 0; i < b.size(); i++) {
            res[i] += b[i];
        }
        return res;
    }
    constexpr friend Poly operator-(const Poly &a, const Poly &b) {
        Poly res(std::max(a.size(), b.size()));
        for (int i = 0; i < a.size(); i++) {
            res[i] += a[i];
        }
        for (int i = 0; i < b.size(); i++) {
            res[i] -= b[i];
        }
        return res;
    }
    constexpr friend Poly operator-(const Poly &a) {
        std::vector<Value> res(a.size());
        for (int i = 0; i < int(res.size()); i++) {
            res[i] = -a[i];
        }
        return Poly(res);
    }
    constexpr friend Poly operator*(Poly a, Poly b) {
        if (a.size() == 0 || b.size() == 0) {
            return Poly();
        }
        if (a.size() < b.size()) {
            std::swap(a, b);
        }
        int n = 1, tot = a.size() + b.size() - 1;
        while (n < tot) {
            n *= 2;
        }
        a.resize(n);
        b.resize(n);
        dft(a);
        dft(b);
        for (int i = 0; i < n; ++i) {
            a[i] *= b[i];
        }
        idft(a);
        a.resize(tot);
        return a;
    }
    constexpr friend Poly operator*(Value a, Poly b) {
        for (int i = 0; i < int(b.size()); i++) {
            b[i] *= a;
        }
        return b;
    }
    constexpr friend Poly operator*(Poly a, Value b) {
        for (int i = 0; i < int(a.size()); i++) {
            a[i] *= b;
        }
        return a;
    }
    constexpr friend Poly operator/(Poly a, Value b) {
        for (int i = 0; i < int(a.size()); i++) {
            a[i] /= b;
        }
        return a;
    }
    constexpr Poly &operator+=(Poly b) {
        return (*this) = (*this) + b;
    }
    constexpr Poly &operator-=(Poly b) {
        return (*this) = (*this) - b;
    }
    constexpr Poly &operator*=(Poly b) {
        return (*this) = (*this) * b;
    }
    constexpr Poly &operator*=(Value b) {
        return (*this) = (*this) * b;
    }
    constexpr Poly &operator/=(Value b) {
        return (*this) = (*this) / b;
    }
    constexpr Poly deriv() const {
        if (this->empty()) {
            return Poly();
        }
        Poly res(this->size() - 1);
        for (int i = 0; i < this->size() - 1; ++i) {
            res[i] = (i + 1) * (*this)[i + 1];
        }
        return res;
    }
    constexpr Poly integr() const {
        Poly res(this->size() + 1);
        for (int i = 0; i < this->size(); ++i) {
            res[i + 1] = (*this)[i] / (i + 1);
        }
        return res;
    }
    constexpr Poly inv(int m) const {
        Poly x{(*this)[0].inv()};
        int k = 1;
        while (k < m) {
            k *= 2;
            x = (x * (Poly{2} - trunc(k) * x)).trunc(k);
        }
        return x.trunc(m);
    }
    constexpr Poly log(int m) const {
        return (deriv() * inv(m)).integr().trunc(m);
    }
    constexpr Poly exp(int m) const {
        Poly x{1};
        int k = 1;
        while (k < m) {
            k *= 2;
            x = (x * (Poly{1} - x.log(k) + trunc(k))).trunc(k);
        }
        return x.trunc(m);
    }
    constexpr Poly pow(int k, int m) const {
        int i = 0;
        while (i < this->size() && (*this)[i] == 0) {
            i++;
        }
        if (i == this->size() || 1LL * i * k >= m) {
            return Poly(m);
        }
        Value v = (*this)[i];
        auto f = shift(-i) * v.inv();
        return (f.log(m - i * k) * k).exp(m - i * k).shift(i * k) * power(v, k);
    }
    constexpr Poly sqrt(int m) const {
        Poly x{1};
        int k = 1;
        while (k < m) {
            k *= 2;
            x = (x + (trunc(k) * x.inv(k)).trunc(k)) * CInv<2, P>;
        }
        return x.trunc(m);
    }
    constexpr Poly mulT(Poly b) const {
        if (b.size() == 0) {
            return Poly();
        }
        int n = b.size();
        std::reverse(b.begin(), b.end());
        return ((*this) * b).shift(-(n - 1));
    }
    constexpr std::vector<Value> eval(std::vector<Value> x) const {
        if (this->size() == 0) {
            return std::vector<Value>(x.size(), 0);
        }
        const int n = std::max(x.size(), this->size());
        std::vector<Poly> q(4 * n);
        std::vector<Value> ans(x.size());
        x.resize(n);
        std::function<void(int, int, int)> build = [&](int p, int l, int r) {
            if (r - l == 1) {
                q[p] = Poly{1, -x[l]};
            } else {
                int m = (l + r) / 2;
                build(2 * p, l, m);
                build(2 * p + 1, m, r);
                q[p] = q[2 * p] * q[2 * p + 1];
            }
        };
        build(1, 0, n);
        std::function<void(int, int, int, const Poly &)> work = [&](int p, int l, int r, const Poly &num) {
            if (r - l == 1) {
                if (l < int(ans.size())) {
                    ans[l] = num[0];
                }
            } else {
                int m = (l + r) / 2;
                work(2 * p, l, m, num.mulT(q[2 * p + 1]).resize(m - l));
                work(2 * p + 1, m, r, num.mulT(q[2 * p]).resize(r - m));
            }
        };
        work(1, 0, n, mulT(q[1].inv(n)));
        return ans;
    }
};

template<int P = 998244353>
Poly<P> berlekampMassey(const Poly<P> &s) {
    Poly<P> c;
    Poly<P> oldC;
    int f = -1;
    for (int i = 0; i < s.size(); i++) {
        auto delta = s[i];
        for (int j = 1; j <= c.size(); j++) {
            delta -= c[j - 1] * s[i - j];
        }
        if (delta == 0) {
            continue;
        }
        if (f == -1) {
            c.resize(i + 1);
            f = i;
        } else {
            auto d = oldC;
            d *= -1;
            d.insert(d.begin(), 1);
            MInt<P> df1 = 0;
            for (int j = 1; j <= d.size(); j++) {
                df1 += d[j - 1] * s[f + 1 - j];
            }
            assert(df1 != 0);
            auto coef = delta / df1;
            d *= coef;
            Poly<P> zeros(i - f - 1);
            zeros.insert(zeros.end(), d.begin(), d.end());
            d = zeros;
            auto temp = c;
            c += d;
            if (i - temp.size() > f - oldC.size()) {
                oldC = temp;
                f = i;
            }
        }
    }
    c *= -1;
    c.insert(c.begin(), 1);
    return c;
}

template<int P = 998244353>
MInt<P> linearRecurrence(Poly<P> p, Poly<P> q, i64 n) {
    int m = q.size() - 1;
    while (n > 0) {
        auto newq = q;
        for (int i = 1; i <= m; i += 2) {
            newq[i] *= -1;
        }
        auto newp = p * newq;
        newq = q * newq;
        for (int i = 0; i < m; i++) {
            p[i] = newp[i * 2 + n % 2];
        }
        for (int i = 0; i <= m; i++) {
            q[i] = newq[i * 2];
        }
        n /= 2;
    }
    return p[0] / q[0];
}

struct Comb {
    int n;
    std::vector<Z> _fac;
    std::vector<Z> _invfac;
    std::vector<Z> _inv;
    Comb() : n{0}, _fac{1}, _invfac{1}, _inv{0} {}
    Comb(int n) : Comb() {
        init(n);
    }
    void init(int m) {
        m = std::min(m, Z::getMod() - 1);
        if (m <= n) return;
        _fac.resize(m + 1);
        _invfac.resize(m + 1);
        _inv.resize(m + 1);
        for (int i = n + 1; i <= m; i++) {
            _fac[i] = _fac[i - 1] * i;
        }
        _invfac[m] = _fac[m].inv();
        for (int i = m; i > n; i--) {
            _invfac[i - 1] = _invfac[i] * i;
            _inv[i] = _invfac[i] * _fac[i - 1];
        }
        n = m;
    }
    Z fac(int m) {
        if (m > n) init(2 * m);
        return _fac[m];
    }
    Z invfac(int m) {
        if (m > n) init(2 * m);
        return _invfac[m];
    }
    Z inv(int m) {
        if (m > n) init(2 * m);
        return _inv[m];
    }
    Z binom(int n, int m) {
        if (n < m || m < 0) return 0;
        return fac(n) * invfac(m) * invfac(n - m);
    }
} comb;

Poly<P> get(int n, int m) {
    if (m == 0) {
        return Poly(n + 1);
    }
    if (m % 2 == 1) {
        auto f = get(n, m - 1);
        Z p = 1;
        for (int i = 0; i <= n; i++) {
            f[n - i] += comb.binom(n, i) * p;
            p *= m;
        }
        return f;
    }
    auto f = get(n, m / 2);
    auto fm = f;
    for (int i = 0; i <= n; i++) {
        fm[i] *= comb.fac(i);
    }
    Poly pw(n + 1);
    pw[0] = 1;
    for (int i = 1; i <= n; i++) {
        pw[i] = pw[i - 1] * (m / 2);
    }
    for (int i = 0; i <= n; i++) {
        pw[i] *= comb.invfac(i);
    }
    fm = fm.mulT(pw);
    for (int i = 0; i <= n; i++) {
        fm[i] *= comb.invfac(i);
    }
    return f + fm;
}

i64 qpow(i64 a,i64 b)
{
    i64 res=1;
    while(b)
    {
        if(b%2)res=(res*a)%P;
        a=(a*a)%P;
        b/=2;
    }
    return res;
}
struct martix
{
    Poly<P>p[2][2];

};
void solve()
{
    int n;
    cin>>n;
    string s;
    cin>>s;
    vector<martix>v(n+1);
    for (int i=1;i<n;i++)
    {
        v[i+1].p[0][0]={10,s[i]-'0'};
        v[i+1].p[0][1]={0,1};
        v[i+1].p[1][0]={s[i]-'0'};
        v[i+1].p[1][1]={1};
    }
    auto sol=[&](int l,int r,auto &&self)->martix
    {
        if(l==r)
        {
            return v[l];
        }
        int mid=(l+r)/2;
        martix lf=self(l,mid,self);
        martix rf=self(mid+1,r,self);
        martix res;
        res.p[0][0]=lf.p[0][0]*rf.p[0][0]+lf.p[0][1]*rf.p[1][0];
        res.p[0][1]=lf.p[0][0]*rf.p[0][1]+lf.p[0][1]*rf.p[1][1];
        res.p[1][0]=lf.p[1][0]*rf.p[0][0]+lf.p[1][1]*rf.p[1][0];
        res.p[1][1]=lf.p[1][0]*rf.p[0][1]+lf.p[1][1]*rf.p[1][1];
        return res;
    };
    if(n==1)
    {
        cout<<s[0]-'0'<<"\n";
        return ;
    }
    auto ret=sol(2,n,sol);
    Poly ans=(s[0]-'0')*(ret.p[0][0])+ret.p[1][0];
    for (int i=0;i<n;i++)
    {
        cout<<ans[i]<<" ";
    }
    cout<<"\n";
}
int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    int t;
    cin>>t;
    while(t--)
    {
        solve();
    }
}
```

---

## 1003. 张力

### 题意

给定 $n$ 个非负整数，可以将它们任意重排为 $b_1,b_2,\dots,b_n$。最小化

$$
\sum_{i=1}^{n-1}\operatorname{lowbit}(b_i\oplus b_{i+1}),
$$

其中规定 $\operatorname{lowbit}(0)=0$。

### 思路

#### 从低位到高位建立 01 Trie

$\operatorname{lowbit}(x\oplus y)$ 只取决于 $x,y$ 从低到高第一个不同的二进制位。

因此把所有数按照二进制位从低到高插入 01 Trie。若两个数在深度 $h$ 的节点处分到不同儿子，那么它们的最低不同位就是第 $h$ 位，从而

$$
\operatorname{lowbit}(x\oplus y)=2^h.
$$

问题变成在 Trie 上安排叶子顺序，并统计相邻元素第一次分叉所在节点的代价。

#### 子树 DP

定义

$$
dp[u][k]
$$

表示 Trie 节点 $u$ 子树中的全部元素，在最终序列中形成 $k$ 个极长连续段时，子树内部能够达到的最小代价。

相同数字位于同一个 Trie 叶子。它们之间的代价为 $0$，并且可以被外部元素分隔成任意数量的段，所以叶子 $u$ 对所有

$$
1\le k\le siz_u
$$

都有 $dp[u][k]=0$。

若 $u$ 只有一个非空儿子，直接继承该儿子的 DP。

#### 合并左右儿子

设节点 $u$ 的深度为 $h$，左右儿子分别形成 $i,j$ 个连续段。

把这些段重新排列时，只有来自不同儿子的段才能首尾拼接。若最后得到 $k$ 个段，则一共进行了

$$
i+j-k
$$

次跨儿子拼接，每次拼接的相邻数字在第 $h$ 位第一次不同，代价均为 $2^h$。

两个来源的段可以交替排列。最终段数 $k$ 的可行范围为

$$
\max(1,|i-j|)\le k\le i+j.
$$

因此转移为
$$
dp[u][k]=\min_{i,j}{dp[L][i]+dp[R][j]+(i+j-k)2^{h}}
$$

根节点最终形成一个完整序列，所以答案为 $dp[root][1]$。

#### ST 表优化转移

直接枚举 $k,i,j$ 为立方复杂度。

不妨令左儿子较小。固定 $k,i$ 后，合法的 $j$ 构成连续区间

$$
\max(1,|k-i|)
\le j\le
\min(siz_R,k+i).
$$

转移中与 $j$ 有关的部分是

$$
dp[R][j]+j2^h.
$$

为这个数组建立 ST 表，就能在 $O(1)$ 时间查询合法区间最小值。于是只需枚举 $k$ 和较小儿子的 $i$。

### 正确性说明

任意两个数字的代价由它们在低位优先 Trie 上第一次走向不同儿子的深度唯一确定。因此，在节点 $u$ 合并左右儿子时，每个跨儿子的相邻边代价都恰好为 $2^h$，而儿子内部的代价已经由其 DP 统计。

左右儿子的 $i,j$ 个段通过交替排列，能够形成的段数恰好满足 $\max(1,|i-j|)\le k\le i+j$；形成 $k$ 段必然且只会产生 $i+j-k$ 次跨儿子拼接。因此转移完整枚举了所有排列结构，并准确计算其代价。

ST 表只加速合法 $j$ 区间中的最小值查询，没有改变转移集合。由 Trie 自底向上归纳，所有 `dp` 状态均正确，根节点的一段状态就是全部数字的最优排列。

### 复杂度

DP 转移总时间为 $O(n^2)$；各节点建立区间最值结构的总开销为 $O(n\log n\log A)$，其中 $A<2^{50}$。总时间复杂度可写为

$$
O(n^2+n\log n\log A).
$$

所有 Trie 节点的 DP 状态总数为 $O(n\log A)$，额外 ST 表空间为 $O(n\log n)$。

### 参考代码

```cpp title="1003.cpp"
#include<bits/stdc++.h>
#define f(i,a,b) for(int i=a;i<=b;i++)
#define df(i,a,b) for(int i=a;i>=b;i--)
#define cmax(a,b) a=max(a,b)
#define cmin(a,b) a=min(a,b)
#define lowbit(x) ((x)&(-(x)))
#define cntbit(x) __builtin_popcount(x)
using namespace std;
typedef long long ll;
const int N=6000;
const ll INF=4e18;
const ll M=998244353;
int TT=1;

ll qp(ll a,ll x){
    ll res=1;for(;x;x>>=1,a=a*a%M)
        (x&1)&&(res=a*res%M);return res;
}

ll a[N];

int trie[N*40][2];
int cnt[N*40];
int siz[N*40];
int node=0;
int n;

void insert(ll x){
    int now=0;
    siz[now]++;
    f(i,0,49){
        int nxt=((x>>i)&1);

        if(!trie[now][nxt]) trie[now][nxt]=++node;

        now=trie[now][nxt];
        siz[now]++;
    }

    cnt[now]++;
}

vector<vector<ll>> dp;
int lg[N];

struct ST{
    vector<vector<ll>> st;
    int n_;

    ST (const vector<ll> &a,int _n){
        st.assign(_n+5,vector<ll>(32,INF));
        n_=_n;
        f(i,1,_n) st[i][0]=a[i];

        for(int j=1;(1<<j)<=_n;j++){
            for(int i=1;i+(1<<j)-1<=_n;i++){
                st[i][j]=min(st[i][j-1],st[i+(1<<(j-1))][j-1]);
            }
        }
    }

    ll q(int l,int r){
        if(l>r) return INF;
        int k=lg[r-l+1];

        return min(st[l][k],st[r-(1<<k)+1][k]);
    }
};

void dfs(int u,int dep){
    if(trie[u][0]) dfs(trie[u][0],dep+1);
    if(trie[u][1]) dfs(trie[u][1],dep+1);

    // dp[u].resize(siz[u+1],1e18);

    if(!trie[u][0]&&!trie[u][1]){
        f(i,1,siz[u]) dp[u][i]=0;
    }
    else if(!trie[u][0]){
        dp[u]=dp[trie[u][1]];
    }
    else if(!trie[u][1]){
        dp[u]=dp[trie[u][0]];
    }
    else {
        int ls=trie[u][0],rs=trie[u][1];

        if(siz[ls]>siz[rs]) swap(ls,rs);

        vector<ll> v;
        v.push_back(0);
        ll two=(1ll<<dep);

        f(i,1,siz[rs]) v.push_back(dp[rs][i]+(ll)i*two);
        auto st=ST(v,siz[rs]);


        f(k,1,siz[u]){
            f(i,1,siz[ls]){
                int l=max(1,abs(k-i));
                int r=min(siz[rs],k+i);
                if(l>r) continue;
                cmin(dp[u][k],(dp[ls][i]+(ll)i*two)-(ll)k*two+st.q(l,r));
            }
        }

    }
}

void solve(){
    cin>>n;
    f(i,1,n) cin>>a[i];

    f(i,0,node) trie[i][0]=trie[i][1]=cnt[i]=siz[i]=0;


    node=0;
    f(i,1,n){
        insert(a[i]);
    }

    dp.clear();
    dp.resize(node+1);

    f(i,0,node){
        dp[i].assign(siz[i]+1,INF);
    }

    dfs(0,0);

    cout<<dp[0][1]<<"\n";
}



int main(){
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);


    lg[1]=0;
    f(i,2,N-5){
        lg[i]=lg[i/2]+1;
    }

    cin>>TT;
    while(TT--) solve();
    return 0;
}
```

---

## 1004. 坪测鸡

### 题意

有 $n$ 支队伍、$m$ 次提交和 $k$ 台评测机。第 $i$ 次提交属于队伍 $a_i$，在 $b_i$ 时刻到达，需要连续评测 $c_i$ 秒，其中

$$
b_1<b_2<\cdots<b_m.
$$

每支队伍同一时刻至多有一份提交正在评测。每当存在空闲评测机时，系统在所属队伍当前没有提交正在评测的等待任务中，选择提交时间最早的一份开始评测。

若提交到达与已有评测结束发生在同一时刻，先处理这些事件，再进行调度。求每份提交实际开始评测的时刻。

### 思路

#### 每支队伍只需保留队首提交

同一支队伍的提交按 $b_i$ 递增。假设这支队伍当前空闲，那么在它所有尚未评测的提交中，系统一定先选择提交时间最早的一份；一旦这份提交开始评测，该队又会变为忙碌状态。

因此，每支队伍用一个队列保存提交编号，任意时刻只有队首可能成为候选任务。

设候选提交 $i$ 的最早可开始时间为 $r_i$：

- 如果它是该队第一份提交，则 $r_i=b_i$；
- 如果同队上一份提交在 $f$ 时刻结束，则

$$
r_i=\max(b_i,f).
$$

#### 根据最早空闲评测机决定下一份任务

用小根堆维护所有评测机的空闲时间。设当前最早空闲的评测机在 $q$ 时刻可用。

只需分两种情况：

1. 存在 $r_i\le q$ 的候选提交。

   这些任务在 $q$ 时刻都已经可以评测。按照题目规则，应选择其中提交时间最早的一份。由于 $b_i$ 严格递增，这等价于选择编号最小的候选提交。

2. 所有候选提交都满足 $r_i>q$。

   此时评测机只能等待。最早能发生下一次调度的时刻是

   $$
   \min_i r_i.
   $$

   若有多个任务同时变为可评测状态，仍选择编号最小的一份。

#### 线段树维护候选提交

在线段树的第 $i$ 个叶子中维护：

- 若 $i$ 是所属队伍当前的队首，存 $r_i$；
- 否则存正无穷。

每个区间维护最小的 $r_i$，于是可以完成两种查询：

- 根节点得到全局最小值，并向下找到最左侧的最小值位置；
- 若全局最小值不大于 $q$，向下找到最左侧满足 $r_i\le q$ 的位置。

现有代码的评测机堆使用 `priority_queue<ll>` 存储空闲时间的相反数，因此堆顶的相反数就是最早空闲时间。

调度提交 $i$ 后：

1. 记录开始时间 `ans[i]`；
2. 将 `ans[i]+c_i` 放回评测机堆；
3. 在线段树中删除提交 $i$；
4. 弹出队伍 $a_i$ 的队首；
5. 若该队还有下一份提交 $j$，以

   $$
   r_j=\max(b_j,ans_i+c_i)
   $$

   激活它。

### 正确性说明

始终维护如下不变式：线段树中的有限叶子恰好对应每支队伍的队首提交，其值是该提交的最早可开始时间；优先队列堆顶对应最早空闲的评测机。

设其空闲时间为 $q$。若存在 $r_i\le q$，则在 $q$ 之前没有空闲评测机，下一次调度只能发生在 $q$；题目要求从当时可评测的任务中选择提交时间最早者，线段树找到的最左侧可行叶子正是该任务。

若不存在 $r_i\le q$，则任何任务在 $\min r_i$ 之前都不能开始。到达该时刻后，线段树选择最左侧的最小值位置，也就是同时可评测任务中提交时间最早者。因此两种情况下选出的任务和开始时间都与题目调度过程完全一致。

一次调度结束后，代码删除已选队首并按其结束时间激活同队下一份提交，所以不变式继续成立。归纳可知，输出的全部开始时间均正确。

### 复杂度

每份提交只会被激活、查询和删除各一次。

- 时间复杂度：$O(m\log m+m\log k)$；
- 空间复杂度：$O(n+m+k)$。

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

int n,m,k;

struct Node{
    ll a,b,c,id;

};

ll ans[N];
struct Seg{
    #define ls x*2
    #define rs x*2+1
    #define mid ((l+r)/2)

    vector<ll> mn;
    Seg (int _n){
        mn.resize((_n+1)*4,0);
    }


    void push_up(int x,int l,int r){
        if(mn[ls]<=mn[rs]) mn[x]=mn[ls];
        else mn[x]=mn[rs];
    }


    void modify(int x,int l,int r,int pos,ll val){
        if(l==r){
            // mn[x]=val;
            mn[x]=val;
            return ;
        }

        if(pos<=mid) modify(ls,l,mid,pos,val);
        else modify(rs,mid+1,r,pos,val);

        push_up(x,l,r);
    }
    int find_p(int x,int l,int r,ll val){
        if(l==r){
            return l;
        }

        int p=0;
        if(mn[ls]<=val) p=find_p(ls,l,mid,val);
        else p=find_p(rs,mid+1,r,val);
        push_up(x,l,r);

        return p;
    }
    int find_mn(int x,int l,int r){
        if(l==r){
            return l;
        }

        int p=0;
        if(mn[ls]<=mn[rs]) p=find_mn(ls,l,mid);
        else p=find_mn(rs,mid+1,r);
        push_up(x,l,r);

        return p;
    }
};

queue<int> S[N];
int vis[N];
int A[N];
ll B[N],C[N];

void solve(){
    cin>>n>>m>>k;
    Seg T(m);

    f(i,1,n){
        while(!S[i].empty()) S[i].pop();
    }
    f(i,1,n) vis[i]=0;
    f(i,1,m) {
        ll a,b,c;
        cin>>a>>b>>c;
        A[i]=a;B[i]=b;C[i]=c;
        S[a].push(i);
        if(!vis[a]){
            T.modify(1,1,m,i,b);
            vis[a]=1;
        }
        else {
            T.modify(1,1,m,i,1e18);
        }
    }

    ll now=0;
    priority_queue<ll> Q;
    f(i,1,k) Q.push(0);

    f(i,1,m){
        auto qq=-Q.top();Q.pop();
        int id=0;
        if(T.mn[1]>qq){
            id=T.find_mn(1,1,m);
            ans[id]=T.mn[1];
        }
        else {
            id=T.find_p(1,1,m,qq);
            ans[id]=qq;
        }

        Q.push(-(ans[id]+C[id]));
        S[A[id]].pop();
        T.modify(1,1,m,id,1e18);
        if(!S[A[id]].empty()){
            auto nid=S[A[id]].front();
            T.modify(1,1,m,nid,max(ans[id]+C[id],B[nid]));
        }

    }

    f(i,1,m) cout<<ans[i]<<" ";
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

---

## 1005. 减数游戏 2

### 题意

一个可重集合 $S$ 由长度为 $n$ 的正整数序列组成。两名玩家轮流操作，河灵先手：

1. 选择 $1\le x\le\min S$；
2. 把集合中的所有数都减去 $x$；
3. 删除所有变成 $0$ 的数；
4. 如果本次删除了至少一个数，则对方获得一分。

集合为空时结束。若河灵得分不少于对方，则河灵获胜。

现在序列中部分位置未知，用 $0$ 表示。每个未知位置可以独立替换为 $1\sim n$ 中任意整数。求有多少种替换方案能使河灵在双方均最优时获胜，答案对 $998244353$ 取模。

### 思路

#### 胜负只由正 mex 的奇偶性决定

重复元素会在同一次操作中一起被删除，所以先把集合去重，设不同元素为

$$
e_1<e_2<\cdots<e_k,
$$

并令 $e_0=0$、$d_i=e_i-e_{i-1}$。

当当前差值 $d_i=1$ 时，操作被迫跨过这一层：对方得到一分，并交换先后手。若 $d_i\ge2$，当前玩家可以在减去 $d_i$ 与 $d_i-1$ 之间选择，从而控制到达下一处大于 $1$ 的差值时由谁先手，并保证这一段的净得分不劣。

因此真正决定胜负的是开头连续出现了多少个差值 $1$，也就是集合是否依次包含 $1,2,\dots$。令

$$
\operatorname{mex}^+(S)
$$

表示不在 $S$ 中的最小正整数，则最优策略下河灵获胜当且仅当

$$
\operatorname{mex}^+(S)\text{ 为奇数}.
$$

问题转化为统计补全后正 mex 为奇数的方案数。

#### 固定 mex 后做容斥

设未知位置共有 $b$ 个。枚举候选正 mex $p$。

要使 $\operatorname{mex}^+(S)=p$，必须满足：

- 已知数中不能出现 $p$；
- $1\sim p-1$ 的每个数最终都至少出现一次；
- 未知位置不能填 $p$。

设 $1\sim p-1$ 中有 $r$ 个数尚未在已知位置出现。未知位置可选的数原本有 $n-1$ 个，再要求这 $r$ 个缺失值全部至少出现一次。

由容斥原理，方案数为

$$
H(r)=\sum_{i=0}^{r}(-1)^i
\binom ri
(n-1-i)^b.
$$

只需对所有奇数 $p\le n$ 且已知数中没有 $p$ 的情况，把对应的 $H(r)$ 加入答案。

#### 把所有 $H(r)$ 化为一次卷积

展开组合数：

$$
H(r)
=r!\sum_{i=0}^{r}
\frac{(-1)^i(n-1-i)^b}{i!}
\frac1{(r-i)!}.
$$

定义

$$
A_i=\frac{(-1)^i(n-1-i)^b}{i!},
\qquad
B_i=\frac1{i!}.
$$

若 $C=A*B$，则

$$
H(r)=r!C_r.
$$

所以使用一次 NTT 卷积，就能同时求出所有可能的 $r$。

用前缀和维护每个前缀中有多少个数尚未在已知位置出现。对于候选 $p$，有

$$
r=\operatorname{missing}(1,p-1).
$$

#### 特判 mex 为 $n+1$

若 $1\sim n$ 最终全部出现，则正 mex 为 $n+1$。只有 $n+1$ 为奇数时才应统计。

设 $1\sim n$ 中有 $r$ 个值未在已知位置出现。此时未知位置仍可填写全部 $n$ 种数，容斥式变为

$$
\sum_{i=0}^{r}(-1)^i\binom ri(n-i)^b.
$$

现有代码单独计算这一项。

### 正确性说明

对去重后的差分序列分析可知，差值为 $1$ 的开头部分会强制交换回合并给对方得分；第一次出现不小于 $2$ 的差值后，当前玩家可以控制后续节奏且不损失分差。因此胜负条件恰为正 mex 为奇数。

固定 $p\le n$ 后，算法排除已知数中已经出现 $p$ 的情况，并禁止所有未知位置填入 $p$。容斥公式从其余 $n-1$ 个值的全部填写方案中，减去至少遗漏一个必需值的方案，所以恰好统计正 mex 为 $p$ 的补全。不同 mex 对应的方案互不相交。

卷积只是对同一个容斥公式的代数变形，不改变计数。最后再单独加入正 mex 为 $n+1$ 的合法方案，便覆盖了所有河灵获胜且仅覆盖这些补全方案。

### 复杂度

预处理缺失值前缀和需要 $O(n)$，卷积需要 $O(n\log n)$；快速幂部分在固定模数下需要 $O(n\log b)$。

- 时间复杂度：$O(n\log n+n\log b)$；
- 空间复杂度：$O(n)$。

### 参考代码

```cpp title="1005.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll mod = 998244353;
const ll G=3;
const int N=5e5+5;
ll fac[N];
ll invfac[N];
ll qpow(ll a, ll b)
{
    ll ans = 1;
    while (b > 0)
    {
        if (b % 2 == 1)
        {
            ans *= a;
            ans %= mod;
        }
        a *= a;
        a %= mod;
        b /= 2;
    }
    return ans;
}
void init()
{
    fac[0]=1;
    invfac[0]=1;
    for (int i=1;i<=500000;i++)
    {
        fac[i]=i*fac[i-1];
        fac[i]%=mod;
        invfac[i]=qpow(fac[i],mod-2);
        invfac[i]%=mod;
    }
}
void ntt(vector<ll> &a, int inv)
{
    int n = a.size();
    for (ll i = 1, j = 0; i < n; i++)
    {
        ll bit = n >> 1;
        for (; j & bit; bit >>= 1)
            j ^= bit;
        j ^= bit;
        if (i < j)
            swap(a[i], a[j]);
    }
    for (ll len = 2; len <= n; len <<= 1)
    {
        ll half = len / 2;
        ll g = qpow(G, (mod - 1) / len);
        if (inv)
            g = qpow(g, mod - 2);
        for (ll i = 0; i < n; i += len)
        {
            ll w = 1;
            for (ll j = 0; j < half; j++)
            {
                ll x = a[i + j];
                ll y = (w * a[i + j + half]) % mod;
                a[i + j] = (x + y) % mod;
                a[i + j + half] = (x - y + mod) % mod;
                w = (w * g) % mod;
            }
        }
    }
    if (inv)
    {
        ll n_inv = qpow(n, mod - 2);
        for (auto &x : a)
            x = (x * n_inv) % mod;
    }
}
vector<ll> mul(vector<ll> &a, vector<ll> &b)
{
    int len_a = a.size() - 1, len_b = b.size() - 1;
    int len = len_a + len_b;
    int n = 1;
    while (n <= len)
        n <<= 1;
    a.resize(n);
    b.resize(n);
    ntt(a, 0);
    ntt(b, 0);
    vector<ll> c(n);
    for(int i=0;i<n;i++) { c[i] = (a[i] * b[i]) % mod; }
    ntt(c, 1);
    c.resize(len + 1);
    return c;
}
void solve()
{
    int n;
    cin>>n;
    vector<ll> v(n+1,0);
    vector<ll> a(n+1,0);
    vector<ll> b(n+1,0);
    vector<int> mp(n+1,1);
    vector<ll> pre(n+1,0);
    int ct=0;
    for (int i=1;i<=n;i++)
    {
        cin>>v[i];
        if (v[i]==0)ct++;
        mp[v[i]]=0;
    }
    for (int i=1;i<=n;i++)
    {
        pre[i]=pre[i-1]+mp[i];
    }
    for (int i=0;i<=n;i++)
    {
        b[i]=invfac[i];
        if (i%2==1)
        {
            a[i]=((mod-1)%mod)*(invfac[i]%mod)%mod*(qpow((n-1-i+mod)%mod,ct)%mod)%mod;
        }
        else
        {
            a[i]=(invfac[i]%mod)%mod*(qpow((n-1-i+mod)%mod,ct)%mod)%mod;
        }
    }
    vector<ll> c=mul(a,b);
    ll ans=0;
    for (int i=1;i<=n;i++)
    {
        if (i%2==0||mp[i]==0)continue;
        ll r=pre[i-1];
        ans=(ans+c[r]%mod*(fac[r]%mod)%mod)%mod;
    }

    for (int i=0;i<=pre[n];i++)
    {
        if ((n+1)%2==0)break;
        ll cnt=1;
        if (i%2==1)cnt=mod-1;
        cnt=((cnt*(invfac[i]%mod)%mod)*(qpow((n-i+mod)%mod,ct)%mod)%mod*(invfac[pre[n]-i])%mod*(fac[pre[n]]%mod)%mod)%mod;
        ans=(ans+cnt)%mod;
    }

    cout<<ans<<'\n';
}

int main()
{
    ios::sync_with_stdio(0);
    cin.tie(0);
    cout.tie(0);
    int t = 1;
    cin >> t;
    init();
    while (t--)
    {
        solve();
    }
    return 0;
}
```

---

## 1006. 合成大 hdu

### 题意

给定 $1\le n\le10^9$，构造一个只包含 `h`、`d`、`u` 的字符串 $S$，使其不同子序列 `hdu` 的数量恰好为 $n$。

要求

$$
1\le |S|\le3001.
$$

### 思路

#### 如何计算 `hdu` 子序列数量

从左到右扫描字符串，维护：

- $H$：子序列 `h` 的数量；
- $HD$：子序列 `hd` 的数量；
- $HDU$：子序列 `hdu` 的数量。

追加一个字符时：

$$
\begin{array}{c|c}
\text{字符}&\text{状态变化}\\ \hline
h&H\leftarrow H+1\\
d&HD\leftarrow HD+H\\
u&HDU\leftarrow HDU+HD
\end{array}
$$

因此可以通过控制不同位置的 `d` 和 `u` 所看到的 `h`、`hd` 数量，精确拼出目标值。

下面用 $h^r$ 表示连续写 $r$ 个字符 `h`，其余字符同理。

#### 较小的 $n$：以 1500 为基底

当

$$
n\le1500^2
$$

时，写成

$$
n=1500q+r,\qquad0\le r<1500.
$$

若 $r=0$，构造

$$
h^{1500}d^qu.
$$

最后一个 `u` 之前共有 $1500q=n$ 个 `hd` 子序列。

若 $r>0$，构造

$$
h^r d\ h^{1500-r}d^q u.
$$

第一个 `d` 贡献 $r$ 个 `hd`，后面的每个 `d` 都看到全部 $1500$ 个 `h`，所以最终 `hd` 数为

$$
r+1500q=n.
$$

最后追加一个 `u`，便得到恰好 $n$ 个 `hdu`。

#### 较大的 $n$：以 1000 和 999 为基底

当 $n>1500^2$ 时，把 $n$ 分解为

$$
n=999r+1000(999q+s),
$$

其中希望

$$
1\le r\le1000,\qquad0\le s\le999.
$$

先选择 $r$ 使

$$
n-999r\equiv0\pmod{1000}.
$$

由于 $-999r\equiv r\pmod{1000}$，可取

$$
r\equiv-n\pmod{1000},
$$

并在余数为 $0$ 时取 $r=1000$。

令

$$
m=\frac{n-999r}{1000},
$$

再写成

$$
m=999q+s.
$$

构造字符串

$$
h^r d\ h^{1000-r}d^q u^{999-s}d u^s.
$$

第一个 `u` 段之前，`hd` 数量为

$$
r+1000q.
$$

再加入一个 `d` 后，`hd` 数量增加 $1000$。因此整个字符串的 `hdu` 数量为

$$
\begin{aligned}
&(999-s)(r+1000q)+s(r+1000q+1000)\\
={}&999r+1000(999q+s)=n.
\end{aligned}
$$

在 $n\le10^9$ 的范围内可以保证 $q\le1000$，所以字符串总长度为

$$
2001+q\le3001.
$$

### 正确性说明

在第一种构造中，最后一个 `u` 之前的 `hd` 子序列数被精确构造成 $1500q+r=n$，且字符串中没有其他 `u`，所以 `hdu` 子序列总数恰为 $n$。

在第二种构造中，前 $999-s$ 个 `u` 各自看到 $r+1000q$ 个 `hd`，最后 $s$ 个 `u` 各自看到增加一个 `d` 后的 $r+1000q+1000$ 个 `hd`。代数化简得到的总贡献恰为预先分解的 $n$。

两种情况都只使用 `h`、`d`、`u`，并满足长度上限，所以算法总能输出合法构造。

### 复杂度

构造和输出字符串所需时间、空间都与字符串长度成正比：

- 时间复杂度：$O(|S|)$；
- 空间复杂度：$O(|S|)$；
- 且 $|S|\le3001$。

### 参考代码

```cpp title="1006.cpp"
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

void solve()
{
    ll n;
    cin>>n;
    ll a=0,b=0,c=0;
    string s1;
    if (n<=1500*1500)
    {
        ll r=n/1500;
        ll g=n%1500;
        for (int i=1;i<=g;i++)
        {
            s1+='h';
        }
        if (g>0)s1+='d';
        for (int i=1;i<=1500-g;i++)s1+='h';
        for (int i=1;i<=r;i++)s1+='d';
        s1+='u';
    }
    else
    {
        ll r=((1000-n)%1000+1000)%1000;
        if (r==0)r=1000;
        ll m=(n-999*r)/1000;
        // cerr<<r<<" "<<m<<"\n";
        ll q=0,s=0;
        for (int i=999;i>=0;i--)
        {
            if ((m-i)%999==0)
            {
                q=(m-i)/999;
                s=i;
                break;
            }
        }
        // cerr<<r<<" "<<q<<" "<<s<<"\n";
        for (int i=1;i<=r;i++)
        {
            s1+='h';
        }
        if (r>0)s1+='d';
        for (int i=1;i<=1000-r;i++)
        {
            s1+='h';
        }
        for (int i=1;i<=q;i++)
        {
            s1+='d';
        }

        for (int i=1;i<=999-s;i++)
        {
            s1+='u';
        }
        s1+='d';
        for (int i=1;i<=s;i++)s1+='u';
    }
    cout<<s1<<"\n";
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

## 1007. 另一个 shu 论问题

### 题意

给定一棵以 $1$ 为根、节点编号为 $1\sim n$ 的树。求满足下式的点对数量：

$$
1\le x<y\le n,
\qquad
\gcd(x,y)=\operatorname{lca}(x,y).
$$

### 思路

#### 在 LCA 处统计点对

固定节点 $u$，只统计满足

$$
\operatorname{lca}(x,y)=u
$$

的点对，称为 $u$ 处的好点对。

定义：

- $f_u(d)$：好点对中满足 $\gcd(x,y)=d$ 的数量；
- $g_u(d)$：好点对中两个端点都为 $d$ 的倍数的数量。

显然

$$
g_u(d)=\sum_{d\mid t}f_u(t).
$$

由莫比乌斯反演，所求的 $f_u(u)$ 为

$$
f_u(u)=\sum_{u\mid d}\mu\left(\frac du\right)g_u(d).
$$

#### 增量统计一个新点的贡献

维护

$$
cnt[d]=\text{当前集合中编号为 }d\text{ 的倍数的节点数量}.
$$

现在加入一个编号为 $x$ 的新点，并希望统计它与当前集合中节点 $y$ 满足 $\gcd(x,y)=u$ 的数量。

枚举 $x$ 的所有约数 $d$，只保留 $u\mid d$，累加

$$
cnt[d]\mu\left(\frac du\right).
$$

对于某个已经存在的点 $y$，它对该和式的贡献为

$$
\sum_{u\mid d\mid\gcd(x,y)}
\mu\left(\frac du\right)
=[\gcd(x,y)=u],
$$

这正是莫比乌斯函数的经典恒等式。因此该查询准确统计了新点与当前集合中 gcd 等于 $u$ 的点对数。

加入点 $x$ 时，再枚举它的所有约数 $d$，执行

$$
cnt[d]\leftarrow cnt[d]+1.
$$

删除时同理减一。

#### DSU on Tree 保证 LCA 恰为当前节点

在节点 $u$ 处进行 DSU on Tree：

1. 递归处理所有轻儿子，并在返回时清空它们的数据；
2. 处理重儿子并保留其子树数据；
3. 查询点 $u$ 与当前保留节点的贡献，再加入 $u$；
4. 依次处理每棵轻子树：先查询轻子树中每个点与当前集合的贡献，再把整棵轻子树加入集合。

当一棵新的轻子树被查询时，当前集合只包含：

- 节点 $u$；
- 重儿子子树；
- 之前已经加入的其他轻儿子子树。

因此新点与当前集合中任一点的 LCA 都恰好是 $u$。同一儿子子树内部的点对已经在递归过程中统计，不会重复。

#### 按约数总量选择重儿子

查询或修改一个节点 $x$ 的代价不是 $O(1)$，而是其约数个数 $\tau(x)$。

所以代码定义子树大小为

$$
siz_u=\sum_{x\in subtree(u)}\tau(x),
$$

并选择该值最大的儿子作为重儿子。这样 DSU on Tree 的小并大复杂度仍然成立。

预处理 $1\sim n$ 的莫比乌斯函数以及每个数的全部约数，即可完成所有查询和修改。

### 正确性说明

增量查询式由莫比乌斯恒等式保证：对当前集合中的每个点 $y$，其贡献为 $1$ 当且仅当 $\gcd(x,y)=u$，否则为 $0$。所以一次查询准确统计了 gcd 等于当前节点 $u$ 的新点对。

DSU on Tree 在节点 $u$ 合并不同儿子子树时，只查询新子树与先前部分之间的点对。这些点对的 LCA 必为 $u$；同一儿子内部的点对则由递归负责。点 $u$ 自身也在加入前单独查询，因此所有 LCA 为 $u$ 的点对都被统计一次且仅一次。

对所有节点执行上述过程后，每一对节点都在其唯一的 LCA 处接受检查，并仅在 gcd 等于该 LCA 时计入答案，所以最终答案正确。

### 复杂度

预处理所有约数的总量为

$$
\sum_{i=1}^{n}\tau(i)=O(n\log n).
$$

按约数总量进行 DSU on Tree 后，每个约数记录至多经过 $O(\log n)$ 次轻边合并。

- 时间复杂度：$O(n\log^2 n)$；
- 空间复杂度：$O(n\log n)$。

### 参考代码

```cpp title="1007.cpp"
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

int mu[N];
bool isnp[N];
vector <int> primes;
vector<int> D[N];
void init(int n){
	mu[1]=1;
	for(int i=2;i<=n;i++){
		if(!isnp[i]) primes.push_back(i),mu[i]=-1;
		for(int p:primes){
			if(p*i>n) break;
			isnp[p*i]=1;
			if(i%p==0){
				mu[p*i]=0;
				break;
			}
			else mu[p*i]=mu[p]*mu[i];
		}
	}

    f(i,1,n){
        for(int j=i;j<=n;j+=i){
            D[j].push_back(i);
        }
    }
}

int siz[N];
int son[N];
int flag[N];
ll cnt[N];
vector<int> to[N];
ll ans=0;

void q_node(int x,int rt){
    for(auto d:D[x]){
        if(d%rt==0){
            ans+=cnt[d]*(mu[d/rt]);
        }
    }
}
void modify_node(int x,ll val){
    for(auto d:D[x]){
        cnt[d]+=val;
    }
}

void q_tree(int u,int pre,int rt){
    q_node(u,rt);

    for(auto v:to[u]){
        if(v==pre) continue;
        q_tree(v,u,rt);
    }
}
void modify_tree(int u,int pre,int delta){
    modify_node(u,delta);

    for(auto v:to[u]){
        if(v==pre) continue;
        modify_tree(v,u,delta);
    }
}

void dfs(int u,int pre){
    siz[u]=D[u].size();
    son[u]=0;
    for(auto v:to[u]){
        if(v==pre) continue;
        dfs(v,u);
        siz[u]+=siz[v];
        if(!son[u]||siz[v]>siz[son[u]]) son[u]=v;
    }
}

void dfs2(int u,int pre,int fg){
    for(auto v:to[u]){
        if(v==pre||v==son[u]) continue;
        dfs2(v,u,0);
    }

    if(son[u]){
        dfs2(son[u],u,1);
    }

    q_node(u,u);
    modify_node(u,1);

    for(auto v:to[u]){
        if(v==pre||v==son[u]) continue;

        q_tree(v,u,u);
        modify_tree(v,u,1);
    }

    if(!fg) modify_tree(u,pre,-1);
}

int n;

void solve(){
    cin>>n;
    f(i,0,n) cnt[i]=flag[i]=son[i]=ans=0,to[i].clear();
    f(i,1,n-1){
        int u,v;
        cin>>u>>v;
        to[u].push_back(v);
        to[v].push_back(u);
    }

    dfs(1,0);
    dfs2(1,0,1);

    cout<<ans<<"\n";
}



int main(){
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);
    cin>>TT;
    init(N-5);
    while(TT--) solve();
    return 0;
}
```

---

## 1008. 最遥远的距离

### 题意

给定 $n$ 个数 $d_1,d_2,\ldots,d_n$。需要构造一棵 $n$ 个点的树，使得从点 $i$ 出发，沿不重复点的简单路径最多能经过恰好 $d_i$ 个点；如果无法构造则输出 `No`。

这里的 $d_i$ 比通常按边数定义的离心率多 $1$。

### 思路

#### 直径上的离心率分布

令

$$
D=\max_i d_i.
$$

那么树的直径按经过点数计算恰好为 $D$。树的最小 $d$ 值，也就是按点数计算的半径，为

$$
R=\left\lfloor\frac D2\right\rfloor+1.
$$

观察一条含 $D$ 个点的直径：

- 若 $D$ 为奇数，树有一个中心，值为 $R$；
- 若 $D$ 为偶数，树有两个相邻中心，它们的值都为 $R$；
- 对每个 $R<x\le D$，直径两侧各有一个值为 $x$ 的点。

树的中心只能有一个或两个，因此值为 $R$ 的点数必须分别恰好为 $1$ 或 $2$。任何非中心点的值都严格大于 $R$，所以不能出现小于 $R$ 的输入值。

另一方面，对每个 $x>R$，除了直径上必需的两个点以外，还可以存在任意多个值为 $x$ 的分支点。

特殊地：

- $D=1$ 时只能是单点树；
- $D=2$ 时只能是两个点之间连一条边。

#### 先构造一条直径

按照输入值分组保存点的编号。

先取两个值为 $D$ 的点作为直径端点，然后令 $x$ 从 $D-1$ 递减到 $R$，不断从对应分组中取点向中心延伸：

- 在中心以外的每一层，左右两侧各取一个点；
- 若 $D$ 为奇数，最后取一个值为 $R$ 的点，同时连接左右两条链；
- 若 $D$ 为偶数，最后取两个值为 $R$ 的点，将两条链通过这两个中心连接起来。

这样得到一条恰好含 $D$ 个点的直径，并用掉每一层必需的点。

#### 把其余点挂到直径上

构造直径时，对每个 $x>R$ 记录一个值为 $x-1$ 的直径点 `Nxt[x]`。

对于所有剩余的、要求值为 $x$ 的点，把它们作为叶子连接到 `Nxt[x]`：

$$
\text{leaf}\longleftrightarrow \text{Nxt}[x].
$$

`Nxt[x]` 到其最远直径端点的路径经过 $x-1$ 个点。新叶子多走一条边，因此从新叶子出发的最长简单路径恰好经过 $x$ 个点。这样的分支不会延长原直径，也不会改变其他点的目标值。

如果某一层缺少构造直径所需的点，或者存在无法找到 `Nxt` 的剩余点，则无解。

### 正确性说明

首先证明判无解的条件必要。任意树的中心只能由一个点或两个相邻点组成，且所有点的最小离心率都在中心取得。换成题目的按点数计数后，最小值为 $R=\lfloor D/2\rfloor+1$；其出现次数由 $D$ 的奇偶性唯一确定。直径两端之间的路径还保证每个 $R<x\le D$ 至少出现两次。因此缺少必需层、中心数量错误或出现小于 $R$ 的值时都不可能构造。

再证明构造充分。算法选出的骨架是一条含 $D$ 个点的简单路径，所以骨架上各点的最长路径长度正好与其输入值一致。每个额外的值为 $x$ 的点都连接到值为 $x-1$ 的指定骨架点，因而它到对应远端的最长路径恰好经过 $x$ 个点；同时它没有产生比原直径更长的路径。因此所有新点和原有骨架点的 $d$ 值都保持正确。

算法最终连接了直径上的 $D-1$ 条边，并为每个额外点增加一条边，所得图连通且共有 $n-1$ 条边，所以它确实是一棵满足要求的树。

### 复杂度

每个点只会进入和离开一次分组，并且只添加一条相关边。

- 时间复杂度：$O(n)$；
- 空间复杂度：$O(n)$。

### 参考代码

```cpp title="1008.cpp"
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
int d[N];

stack<int> S[N];
int Nxt[N];

void solve(){
    cin>>n;
    int maxn=0;
    f(i,0,n+1) {
        while(!S[i].empty()) S[i].pop();
        Nxt[i]=0;
    }
    f(i,1,n) {
        cin>>d[i];
        cmax(maxn,d[i]);
        S[d[i]].push(i);
    }

    vector<pair<int,int>> e;

    if(maxn==1){
        if(n==1){
            cout<<"Yes\n";
        }
        else cout<<"No\n";
        return ;
    }

    if(maxn==2){
        if(d[1]==2&&d[2]==2&&n==2){
            cout<<"Yes\n";
            cout<<"1 2\n";
        }
        else {
            cout<<"No\n";
        }
        return ;
    }

    if(S[maxn].size()<2) {
        cout<<"No\n";
        return ;
    }
    // cerr<<1<<"\n";

    int mid=maxn/2+1;
    int p1=S[maxn].top();
    S[maxn].pop();
    int p2=S[maxn].top();
    S[maxn].pop();

    df(i,maxn-1,mid){
        if(i==mid){
            if(maxn%2==1){
                if(S[i].empty()){
                    cout<<"No\n";
                    return ;
                }
                int n1=S[i].top();
                S[i].pop();
                e.push_back({p1,n1});
                e.push_back({p2,n1});

                Nxt[i+1]=n1;
            }
            else {
                if(S[i].empty()){
                    cout<<"No\n";
                    return ;
                }
                int n1=S[i].top();
                S[i].pop();
                e.push_back({p1,n1});
                Nxt[i+1]=n1;

                if(S[i].empty()){
                    cout<<"No\n";
                    return ;
                }
                int n2=S[i].top();
                S[i].pop();
                e.push_back({n2,p2});

                e.push_back({n1,n2});
            }
        }
        else {
            // cerr<<i<<" "<<tip[i]<<" "<<D[i].size()<<" "<<Nxt[i]<<"\n";
            if(S[i].empty()){
                cout<<"No\n";
                return ;
            }
            int n1=S[i].top();
            S[i].pop();
            e.push_back({p1,n1});
            Nxt[i+1]=n1;

            if(S[i].empty()){
                cout<<"No\n";
                return ;
            }
            int n2=S[i].top();
            S[i].pop();
            e.push_back({n2,p2});

            p1=n1;
            p2=n2;
        }
    }

    f(i,1,maxn){
        if(S[i].empty()) continue;
        // cerr<<i<<" "<<tip[i]<<" "<<D[i].size()<<" "<<Nxt[i]<<"\n";
        if(!Nxt[i]){
            cout<<"No\n";
            return ;
        }
        while(!S[i].empty()){
            int v=S[i].top();
            S[i].pop();
            e.push_back({v,Nxt[i]});
        }
        // f(j,tip[i],D[i].size()-1){
        //     e.push_back({D[i][j],Nxt[i]});
        // }
    }

    cout<<"Yes\n";
    for(auto [u,v]:e){
        cout<<u<<" "<<v<<"\n";
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

---

## 1010. 幻灵战队 2

### 题意

给定一个长度为 $n$ 的 `01` 串。`0` 表示失败，`1` 表示胜利。

一次连续失败中的第 $x$ 场失败会获得

$$
20+5x
$$

科技点，胜利会结束当前连败且不获得科技点。现在最多可以把 $k$ 个 `0` 改成 `1`，求最终科技点的最小值。

### 思路

#### 一段连续失败的代价

长度为 $x$ 的连续 `0` 段贡献为

$$
\begin{aligned}
C(x)
&=\sum_{j=1}^{x}(20+5j)\\
&=20x+\frac{5x(x+1)}2.
\end{aligned}
$$

不同 `0` 段被原有的 `1` 隔开，彼此不会影响。问题变成：把最多 $k$ 次修改分配到各个 `0` 段中。

#### 一个 `0` 段内如何修改

考虑长度为 $x$ 的 `0` 段，在其中修改恰好 $t$ 个位置。

还剩

$$
L=x-t
$$

个 `0`，它们被分进 $t+1$ 个连续段中，空段也是允许的。由于

$$
C(y+1)-C(y)=20+5(y+1)
$$

随 $y$ 递增，$C$ 是离散凸函数。若两个小段长度至少相差 $2$，从较长段移动一个 `0` 到较短段一定会减小总成本。因此最优划分中，各段长度之差不超过 $1$。

令

$$
q=\left\lfloor\frac{L}{t+1}\right\rfloor,\qquad
r=L\bmod(t+1),
$$

则有 $r$ 段长度为 $q+1$，其余 $t+1-r$ 段长度为 $q$。定义

$$
F_x(t)=(t+1-r)C(q)+rC(q+1),
\qquad 0\le t\le x.
$$

代码为每个原始 `0` 段线性求出完整数组

$$
[F_x(0),F_x(1),\ldots,F_x(x)].
$$

#### 合并不同 `0` 段

设两组独立 `0` 段的最优代价数组分别为 $A,B$。总共修改 $z$ 次时，应计算 min-plus 卷积

$$
H(z)=\min_{i+j=z}\bigl(A(i)+B(j)\bigr).
$$

由前面的离散凸性，每个数组相邻项的增量单调不减，也就是继续增加一次修改所带来的收益逐渐减小。因此可以从状态 $(0,0)$ 开始：

- 比较 `A[i+1]+B[j]` 与 `A[i]+B[j+1]`；
- 选择代价更小的下一步；
- 每次令总修改次数增加 $1$。

这样沿着最优分配边界走一遍，就能在 $O(|A|+|B|)$ 时间内求出整个卷积数组。

卷积满足结合律，所以可以按任意顺序合并所有 `0` 段。代码用优先队列每次取长度最小的两个数组合并，采用类似 Huffman 的合并顺序，避免大数组被反复扫描。

最终数组的第 $t$ 项就是恰好修改 $t$ 个 `0` 的最小科技点。多做一次修改不会使答案变差，因此：

- 若 $k$ 不超过 `0` 的总数，答案为第 $k$ 项；
- 若 $k$ 更大，可以把所有失败都改成胜利，答案为 $0$。

### 正确性说明

对于单个连续失败段，任意修改方案都对应于把剩余的 $x-t$ 个失败分配到 $t+1$ 个位置。由于 $C$ 离散凸，若两段长度相差至少 $2$，执行一次均衡操作会严格降低总成本；反复操作后得到的只能是长度为 $q$ 或 $q+1$ 的均衡划分，所以 $F_x(t)$ 正确。

不同原始失败段之间由胜利隔开，科技点贡献可以直接相加。合并两个代价数组时，枚举 $i+j=z$ 覆盖了修改次数在两部分之间的全部分配方式；离散凸数组的边际增量有序，逐次选择更小的下一增量等价于合并两条有序边际序列，因此得到的正是每个 $z$ 的最小值。反复执行 min-plus 卷积后，最终数组覆盖了修改次数在所有失败段间的全部分配方案。

所以最终取第 $\min(k,\text{零的总数})$ 项，得到的就是允许至多修改 $k$ 场时的最小科技点。

### 复杂度

所有单段数组的总长度为 $O(n)$。按长度优先合并后，每个元素参与 $O(\log n)$ 层合并。

- 时间复杂度：$O(n\log n)$；
- 空间复杂度：$O(n)$。

### 参考代码

```cpp title="1010.cpp"
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


int n,k;
string s;
ll col(ll k)
{
    if(k==0)
    {
        return 0;
    }
    ll ans=0;
    ans+=20*k;
    ans+=5*(k*(k+1)/2);
    return ans;
}
struct cmp
{
bool operator()(const vector<ll>&a,const vector<ll>&b)
{
    return a.size()>b.size();
}
};

ll g(ll x){

}
ll get(ll x,ll y){

}

void solve(){
    cin>>n>>k;
    cin>>s;
    int ct=0;
    int ct1=0;
    vector<int>tmp;
    for (int i=0;i<n;i++)
    {
        if(s[i]=='1')
        {
            if(ct)
            {
                tmp.push_back(ct);
            }
            ct=0;
        }
        else
        {
            ct++;
        }
    }
    if(ct)
    {
        tmp.push_back(ct);
        ct=0;
    }
    priority_queue<vector<ll>,vector<vector<ll>>,cmp>pq;
    for (auto x:tmp)
    {
        vector<ll>vec(x+1,0);
        for (int i=0;i<=x;i++)
        {
            if(i==0)
            {
                vec[i]=col(x);
            }
            else
            {
                ll res=x-i;
                ll a=res/(i+1);
                ll b=a+1;
                ll cntb=res-(i+1)*a;
                ll cnta=(i+1)-cntb;
                // cerr<<res<<" "<<a<<" "<<cnta<<" "<<b<<" "<<cntb<<endl;
                // cerr<<cnta*a+cntb*b<<" "<<res<<endl;
                if(res<(i+1)*a)
                {
                    vec[i]=res*col(1);
                }
                else
                {
                // cerr<<a<<" "<<b<<" "<<cnta<<" "<<cntb<<" "<<i<<endl;
                vec[i]=cnta*col(a)+cntb*col(b);
                }
                // cerr<<vec[i]<<endl;
            }
        }
        pq.push(vec);
    }
    while(pq.size()>=2)
    {
        auto dp1=pq.top();
        pq.pop();
        auto dp2=pq.top();
        pq.pop();
        int up=dp1.size()-1+dp2.size()-1;
        int n=dp1.size()-1;
        int m=dp2.size()-1;
        int x=0,y=0;
        // cerr<<n<<" "<<m<<endl;
        vector<ll>dp(up+1,0);
        dp[0]=dp1[0]+dp2[0];
        for (int i=1;i<=up;i++)
        {
            if(x==n)
            {
                y++;
                dp[i]=dp1[x]+dp2[y];
            }
            else if(y==m)
            {
                x++;
                dp[i]=dp1[x]+dp2[y];
            }
            else
            {
                if(dp1[x+1]+dp2[y]<=dp1[x]+dp2[y+1])
                {
                    x++;
                    dp[i]=dp1[x]+dp2[y];
                }
                else
                {
                    y++;
                    dp[i]=dp1[x]+dp2[y];
                }
            }
        }
        pq.push(dp);
    }
    if(pq.empty())
    {
        cout<<0<<"\n";
    }
    else
    {
        auto res=pq.top();
        if(res.size()<=k)
        {
            cout<<0<<"\n";
        }
        else
        {
            cout<<res[k]<<"\n";
        }
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

---

## 1011. 键盘杀手

### 题意

有一排 $n$ 个键帽，第 $i$ 个键帽的初始高度为 $a_i$，并规定

$$
a_0=a_{n+1}=0.
$$

拔掉位置 $i$ 的键帽时，代价为它左右相邻位置当前高度的最大值：

$$
\max(a_{i-1},a_{i+1}).
$$

拔掉后该位置高度变为 $0$。求拔掉全部键帽的最小总代价。

### 思路

#### 删除顺序只需保留相邻点的先后关系

对于每一对相邻位置 $i,i+1$，定义二进制状态

$$
x_i=
\begin{cases}
0,&i\text{ 比 }i+1\text{ 先被拔掉},\\
1,&i\text{ 比 }i+1\text{ 后被拔掉}.
\end{cases}
$$

拔掉位置 $i$ 时：

- 左侧键帽 $i-1$ 是否还在，只由 $x_{i-1}$ 决定；
- 右侧键帽 $i+1$ 是否还在，只由 $x_i$ 决定。

因此位置 $i$ 的代价只与相邻两个状态有关：

| $x_{i-1}$ | $x_i$ | 拔掉 $i$ 时仍存在的相邻键帽 | 代价 |
| --- | --- | --- | --- |
| $0$ | $0$ | 只有 $i+1$ | $a_{i+1}$ |
| $0$ | $1$ | 都已拔掉 | $0$ |
| $1$ | $0$ | $i-1$ 和 $i+1$ | $\max(a_{i-1},a_{i+1})$ |
| $1$ | $1$ | 只有 $i-1$ | $a_{i-1}$ |

#### 任意相邻关系都能对应某种删除顺序

把每条相邻边从先删除的点指向后删除的点。底层图是一条路径，而树的任意定向都不可能形成有向环，所以一定存在拓扑序。

按照这个拓扑序拔键帽，就能实现给定的全部 $x_i$。因此枚举相邻先后关系不会加入原问题中不存在的方案，也不会漏掉任何删除顺序。

#### 路径动态规划

令

$$
dp[i][b]
$$

表示已经确定 $x_i=b$，并计算完位置 $1\sim i$ 的代价时，能够得到的最小总成本。

枚举上一条边的状态 $x_{i-1}$，按照上表把位置 $i$ 的代价加入即可：

$$
\begin{aligned}
dp[i][0]
&=\min\left(
dp[i-1][0]+a_{i+1},
dp[i-1][1]+\max(a_{i-1},a_{i+1})
\right),\\
dp[i][1]
&=\min\left(
dp[i-1][0],
dp[i-1][1]+a_{i-1}
\right).
\end{aligned}
$$

代码把两端视为高度为 $0$ 的哨兵。`dp[0][0]` 与 `dp[0][1]` 均为 $0$，最后输出

$$
\min(dp[n][0],dp[n][1]).
$$

边界状态取哪一个都不会产生额外代价。

### 正确性说明

任意实际删除顺序都会唯一确定每对相邻键帽的先后关系。位置 $i$ 被拔掉时，它的左右键帽是否仍存在，恰好由 $x_{i-1}$ 和 $x_i$ 决定，因此上表准确给出了该顺序中位置 $i$ 的代价。

反过来，路径的任意定向都是有向无环图，按其拓扑序删除键帽即可实现对应的全部相邻先后关系。所以在所有二进制状态序列上优化与在所有删除顺序上优化完全等价。

动态规划枚举了相邻状态的四种组合，并对每个前缀和末状态保留最小代价。根据最优子结构，转移后 `dp[i][b]` 正确表示所有满足 $x_i=b$ 的前缀方案最优值。处理到 $n$ 后取两个末状态的较小值，便得到全部删除顺序中的最小总代价。

### 复杂度

每个位置只有两个状态和常数次转移。

- 时间复杂度：$O(n)$；
- 空间复杂度：$O(n)$，使用滚动数组可优化为 $O(1)$。

### 参考代码

```cpp title="1011.cpp"
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
ll a[N];
ll dp[N][2];

void solve(){
    cin>>n;
    f(i,0,n+1) a[i]=0;
    f(i,1,n) cin>>a[i],dp[i][0]=dp[i][1]=1e18;

    f(i,1,n){
        //0->0
        cmin(dp[i][0],dp[i-1][0]+a[i+1]);
        //0->1
        cmin(dp[i][1],dp[i-1][0]);
        //1->0
        cmin(dp[i][0],dp[i-1][1]+max(a[i-1],a[i+1]));
        //1->1
        cmin(dp[i][1],dp[i-1][1]+a[i-1]);
    }

    cout<<min(dp[n][0],dp[n][1])<<"\n";;


}



int main(){
    std::ios::sync_with_stdio(0);
    std::cin.tie(0);
    cin>>TT;
    while(TT--) solve();
    return 0;
}
```

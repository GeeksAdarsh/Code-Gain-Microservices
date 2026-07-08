import json, random, math
from collections import Counter, deque
random.seed(456)

def tc(inp, out, sample=False):
    r = {"in": str(inp).strip(), "out": str(out).strip()}
    if sample: r["sample"] = True
    return r

def gen(title, desc, inFmt, outFmt, constraints, diff, tags, sIn, sOut, explain, tl, tcs):
    tcs[0]["sample"] = True
    if len(tcs) > 1: tcs[1]["sample"] = True
    return {"title":title,"desc":desc,"inFmt":inFmt,"outFmt":outFmt,"constraints":constraints,
            "diff":diff,"tags":tags,"sIn":sIn,"sOut":sOut,"explain":explain,"tl":tl,"tc":tcs}

# Load existing titles
existing_titles = set()
try:
    with open("existing_titles.txt") as f:
        for line in f:
            existing_titles.add(line.strip())
except: pass

problems = []

# ============ MATH & BASICS ============

# 1
tcs = []
for n in list(range(0,40)) + [random.randint(0,50) for _ in range(10)]:
    tcs.append(tc(n, "true" if str(n) == str(n)[::-1] else "false"))
problems.append(gen("Check Palindrome Number","Given N, check if it reads the same forwards and backwards. Negative numbers are not palindromes.",
    "A single integer N","true or false","-10^6 <= N <= 10^6","EASY",["Math","Basic"],
    "121","true","121 reversed is 121.",1,tcs[:50]))

# 2
tcs = []
for n in [0,1,2,3,4,5,6,7,8,9,10,11,12,15,20,25,30,36,49,64,81,100,144,169,196,225,256,
          10000,99,50,37,48,63,80,121,400,625,900,2,3,5,7,8,14,17,26,35,47,65]:
    sr = int(math.isqrt(n))
    tcs.append(tc(n, "true" if sr*sr == n else "false"))
problems.append(gen("Check Perfect Square","Given N, check if it is a perfect square.",
    "A non-negative integer N","true or false","0 <= N <= 10^9","EASY",["Math","Basic"],
    "16","true","4*4 = 16.",1,tcs[:50]))

# 3
tcs = []
def sum_of_cubes(n): return (n*(n+1)//2)**2
for n in list(range(1,40)) + [random.randint(1,100) for _ in range(11)]:
    tcs.append(tc(n, sum_of_cubes(n)))
problems.append(gen("Sum of Cubes of First N Numbers","Given N, compute 1^3 + 2^3 + ... + N^3.",
    "A positive integer N","Sum of cubes","1 <= N <= 10^4","EASY",["Math","Basic"],
    "3","36","1+8+27=36. Formula: (N*(N+1)/2)^2",1,tcs[:50]))

# 4
tcs = []
def is_abundant(n):
    s = 1
    for i in range(2, int(n**0.5)+1):
        if n%i==0: s+=i; s+=(n//i if i!=n//i else 0)
    return s > n
for n in [12,18,20,24,30,36,40,48,54,60,1,2,3,4,5,6,7,8,9,10,11,13,14,15,16,17,19,21,22,23,
          25,26,27,28,29,31,32,33,34,35,37,38,39,41,42,44,45,50,56,70]:
    if n<=1: tcs.append(tc(n,"false"))
    else: tcs.append(tc(n, "true" if is_abundant(n) else "false"))
problems.append(gen("Check Abundant Number","A number is abundant if sum of proper divisors exceeds it. Check if N is abundant.",
    "A positive integer N","true or false","1 <= N <= 10^6","EASY",["Math","Basic"],
    "12","true","Divisors of 12: 1+2+3+4+6=16 > 12.",1,tcs[:50]))

# 5
tcs = []
for a in range(2, 20):
    for b in range(a, min(a+4, 20)):
        if len(tcs) >= 50: break
        g = math.gcd(a, b)
        tcs.append(tc(f"{a} {b}", g))
problems.append(gen("GCD of Two Numbers Using Euclidean Algorithm","Find GCD of two positive integers using Euclidean algorithm.",
    "Two positive integers A B","GCD(A,B)","1 <= A,B <= 10^9","EASY",["Math","Recursion"],
    "12 8","4","GCD(12,8) → GCD(8,4) → GCD(4,0) = 4.",1,tcs[:50]))

# ============ ARRAY PROBLEMS ============

# 6
tcs = []
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(-50,50) for _ in range(n)]
    mx, smx = float('-inf'), float('-inf')
    for x in arr:
        if x > mx: smx, mx = mx, x
        elif x > smx and x != mx: smx = x
    mn, smn = float('inf'), float('inf')
    for x in arr:
        if x < mn: smn, mn = mn, x
        elif x < smn and x != mn: smn = x
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", f"{mx} {mn}"))
problems.append(gen("Largest and Smallest in Array","Find the largest and smallest element in array.",
    "First line: N\nSecond line: N integers","Two integers: largest smallest","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Single pass tracking max and min.",1,tcs))

# 7
tcs = []
def move_zeros(arr):
    nz = [x for x in arr if x!=0]
    return nz + [0]*(len(arr)-len(nz))
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.choice([0,0,random.randint(-10,10)]) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", ' '.join(map(str, move_zeros(arr)))))
problems.append(gen("Move All Zeros to End","Move all zeros to end maintaining order of non-zero elements.",
    "First line: N\nSecond line: N integers","Array with zeros at end","1 <= N <= 10^5",
    "EASY",["Array","Two Pointers"],tcs[0]["in"],tcs[0]["out"],"Two pointer: place non-zeros at front.",1,tcs))

# 8
tcs = []
def right_rotate(arr, k):
    n = len(arr); k = k%n if n else 0
    return arr[n-k:] + arr[:n-k]
for _ in range(50):
    n = random.randint(1,20)
    k = random.randint(0,30)
    arr = [random.randint(-50,50) for _ in range(n)]
    tcs.append(tc(f"{n} {k}\n{' '.join(map(str,arr))}", ' '.join(map(str, right_rotate(arr,k)))))
problems.append(gen("Right Rotate Array by K","Rotate array to the right by K positions.",
    "First line: N K\nSecond line: N integers","Rotated array","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Reverse entire, reverse first K, reverse rest.",1,tcs))

# 9
tcs = []
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(-30,30) for _ in range(n)]
    pos = [x for x in arr if x>0]
    neg = [x for x in arr if x<0]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", f"{' '.join(map(str,pos))}\n{' '.join(map(str,neg))}"))
problems.append(gen("Separate Positive and Negative","Separate positive and negative numbers. Print positives on first line, negatives on second.",
    "First line: N\nSecond line: N integers","Line 1: positives\nLine 2: negatives","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Filter into two lists.",1,tcs))

# 10
tcs = []
def intersection_sorted(a,b):
    res, i, j = [], 0, 0
    while i<len(a) and j<len(b):
        if a[i]==b[j]: res.append(a[i]); i+=1; j+=1
        elif a[i]<b[j]: i+=1
        else: j+=1
    return res
for _ in range(50):
    n,m = random.randint(1,15), random.randint(1,15)
    a = sorted([random.randint(1,20) for _ in range(n)])
    b = sorted([random.randint(1,20) for _ in range(m)])
    r = intersection_sorted(a,b)
    tcs.append(tc(f"{n} {m}\n{' '.join(map(str,a))}\n{' '.join(map(str,b))}", ' '.join(map(str,r)) if r else "-1"))
problems.append(gen("Intersection of Two Sorted Arrays","Find common elements in two sorted arrays (with duplicates).",
    "First line: N M\nSecond line: N sorted ints\nThird line: M sorted ints","Common elements or -1","1 <= N,M <= 10^5",
    "EASY",["Array","Two Pointers"],tcs[0]["in"],tcs[0]["out"],"Two pointer merge-style comparison.",1,tcs))

# 11
tcs = []
def subarray_max_sum_print(arr):
    mx = cur = arr[0]; s=e=ts=0
    for i in range(1,len(arr)):
        if cur+arr[i] < arr[i]: cur=arr[i]; ts=i
        else: cur+=arr[i]
        if cur>mx: mx=cur; s=ts; e=i
    return mx
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(-20,20) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", subarray_max_sum_print(arr)))
problems.append(gen("Maximum Subarray Sum (Kadane)","Find the contiguous subarray with the largest sum using Kadane's algorithm.",
    "First line: N\nSecond line: N integers","Maximum subarray sum","1 <= N <= 10^5",
    "MEDIUM",["Array","DP"],tcs[0]["in"],tcs[0]["out"],"Kadane: track current sum, reset if negative.",2,tcs))

# 12
tcs = []
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(1,100) for _ in range(n)]
    total = sum(arr)
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", f"{total:.2f}" if total==int(total) else f"{total/n:.2f}"))
    tcs[-1] = tc(f"{n}\n{' '.join(map(str,arr))}", sum(arr))
problems.append(gen("Sum of Array (Recursion)","Compute sum of array elements using recursion.",
    "First line: N\nSecond line: N integers","Sum of all elements","1 <= N <= 10^4",
    "EASY",["Array","Recursion"],tcs[0]["in"],tcs[0]["out"],"Base: n=0→0. Recurse: arr[n-1]+sum(n-1).",1,tcs))

# ============ STRING PROBLEMS ============

# 13
tcs = []
for _ in range(50):
    n = random.randint(1,20)
    s = ''.join(random.choice('abcdefgh') for _ in range(n))
    tcs.append(tc(s, s.upper()))
problems.append(gen("Convert to Uppercase","Convert a lowercase string to uppercase.",
    "A lowercase string","Uppercase string","1 <= |S| <= 10^5","EASY",["String","Basic"],
    "hello","HELLO","Replace each char: 'a'→'A'.",1,tcs))

# 14
tcs = []
for _ in range(50):
    n = random.randint(1,20)
    s = ''.join(random.choice('ABCDEFGH') for _ in range(n))
    tcs.append(tc(s, s.lower()))
problems.append(gen("Convert to Lowercase","Convert an uppercase string to lowercase.",
    "An uppercase string","Lowercase string","1 <= |S| <= 10^5","EASY",["String","Basic"],
    "HELLO","hello","Replace each char: 'A'→'a'.",1,tcs))

# 15
tcs = []
def max_nesting(s):
    mx = d = 0
    for c in s:
        if c=='(': d+=1; mx=max(mx,d)
        elif c==')': d-=1
    return mx
test_strs = ["(1+(2*3)+((8)/4))+1","(1)+(2)+(3)","","()()()",
    "((()))", "(())", "()", "(()(()))", "(((())))", "(()())"]
for _ in range(40):
    d = random.randint(0,5)
    s = "("*d + ")"*d
    test_strs.append(s)
for s in test_strs[:50]:
    tcs.append(tc(s if s else "()", max_nesting(s if s else "()")))
problems.append(gen("Maximum Nesting Depth of Parentheses","Find the maximum depth of nested parentheses in a string.",
    "A string with parentheses","Maximum nesting depth","0 <= |S| <= 10^5",
    "EASY",["String","Stack"],tcs[0]["in"],tcs[0]["out"],"Track current depth, update max on '('.",1,tcs))

# 16
tcs = []
def count_words(s): return len(s.split())
strs = ["hello world","one","the quick brown fox","a b c d e","hello","i love coding",
    "one two three four five six","test","a","ab cd ef gh ij"]
for _ in range(40):
    n = random.randint(1,6)
    s = ' '.join(''.join(random.choice('abcde') for _ in range(random.randint(1,5))) for _ in range(n))
    strs.append(s)
for s in strs[:50]:
    tcs.append(tc(s, count_words(s)))
problems.append(gen("Count Words in String","Count the number of words in a string (separated by spaces).",
    "A string","Number of words","1 <= |S| <= 10^5","EASY",["String","Basic"],
    "hello world","2","Two words separated by space.",1,tcs))

# 17
tcs = []
def remove_vowels(s): return ''.join(c for c in s if c not in 'aeiouAEIOU')
for _ in range(50):
    n = random.randint(1,20)
    s = ''.join(random.choice('abcdefghij') for _ in range(n))
    tcs.append(tc(s, remove_vowels(s) if remove_vowels(s) else ""))
problems.append(gen("Remove Vowels from String","Remove all vowels from a string.",
    "A string","String without vowels","1 <= |S| <= 10^5","EASY",["String","Basic"],
    "leetcode","ltcd","Remove a,e,i,o,u.",1,tcs))

# 18
tcs = []
def char_freq(s):
    c = Counter(s)
    return ' '.join(f"{k}:{v}" for k,v in sorted(c.items()))
for _ in range(50):
    n = random.randint(1,15)
    s = ''.join(random.choice('abcde') for _ in range(n))
    tcs.append(tc(s, char_freq(s)))
problems.append(gen("Character Frequency","Print each character and its frequency sorted alphabetically. Format: a:2 b:1 ...",
    "A lowercase string","Character frequencies sorted","1 <= |S| <= 10^5","EASY",["String","Hash Map"],
    "aabbc","a:2 b:2 c:1","Count each character's occurrences.",1,tcs))

# 19
tcs = []
def first_unique_char(s):
    c = Counter(s)
    for i,ch in enumerate(s):
        if c[ch]==1: return i
    return -1
for _ in range(50):
    n = random.randint(1,20)
    s = ''.join(random.choice('abcde') for _ in range(n))
    tcs.append(tc(s, first_unique_char(s)))
problems.append(gen("First Unique Character","Find index of the first non-repeating character. Return -1 if none.",
    "A lowercase string","Index or -1","1 <= |S| <= 10^5","EASY",["String","Hash Map"],
    "leetcode","0","'l' at index 0 appears only once.",1,tcs))

# ============ BINARY SEARCH ============

# 20
tcs = []
def find_nth_root(n, m):
    lo, hi = 1, m
    while lo <= hi:
        mid = (lo+hi)//2
        p = mid**n
        if p == m: return mid
        elif p < m: lo = mid+1
        else: hi = mid-1
    return -1
for _ in range(50):
    n = random.randint(2, 5)
    base = random.randint(1, 10)
    if random.random() < 0.5:
        m = base ** n
    else:
        m = random.randint(1, 10000)
    tcs.append(tc(f"{n} {m}", find_nth_root(n, m)))
problems.append(gen("Nth Root of a Number","Find integer nth root of M. Return -1 if no perfect nth root exists.",
    "Two integers: N M","Nth root or -1","2 <= N <= 10\n1 <= M <= 10^9","MEDIUM",["Binary Search","Math"],
    "3 27","3","3^3 = 27.",2,tcs))

# 21
tcs = []
def min_of_rotated(arr):
    lo, hi = 0, len(arr)-1
    while lo < hi:
        mid = (lo+hi)//2
        if arr[mid] > arr[hi]: lo=mid+1
        else: hi=mid
    return arr[lo]
for _ in range(50):
    n = random.randint(1,20)
    arr = sorted(set(random.randint(1,100) for _ in range(n)))
    if not arr: arr = [1]
    k = random.randint(0,len(arr)-1)
    rotated = arr[k:]+arr[:k]
    tcs.append(tc(f"{len(rotated)}\n{' '.join(map(str,rotated))}", min(rotated)))
problems.append(gen("Minimum in Rotated Sorted Array","Find the minimum element in a rotated sorted array (no duplicates).",
    "First line: N\nSecond line: N integers","Minimum element","1 <= N <= 10^5","MEDIUM",["Binary Search","Array"],
    tcs[0]["in"],tcs[0]["out"],"Binary search: compare mid with right end.",2,tcs))

# 22
tcs = []
def count_rotations(arr):
    n = len(arr)
    lo, hi = 0, n-1
    while lo < hi:
        mid = (lo+hi)//2
        if arr[mid] > arr[hi]: lo=mid+1
        else: hi=mid
    return lo
for _ in range(50):
    n = random.randint(1,20)
    arr = sorted(set(random.randint(1,100) for _ in range(n)))
    if not arr: arr = [1]
    k = random.randint(0,len(arr)-1)
    rotated = arr[k:]+arr[:k]
    tcs.append(tc(f"{len(rotated)}\n{' '.join(map(str,rotated))}", k))
problems.append(gen("Number of Times Array is Rotated","Find how many times a sorted array has been rotated.",
    "First line: N\nSecond line: N integers (rotated sorted)","Number of rotations","1 <= N <= 10^5",
    "MEDIUM",["Binary Search","Array"],tcs[0]["in"],tcs[0]["out"],
    "Index of minimum element = number of rotations.",2,tcs))

# ============ RECURSION / BACKTRACKING ============

# 23
tcs = []
def power_rec(x, n):
    if n == 0: return 1
    if n < 0: return 1.0 / power_rec(x, -n)
    half = power_rec(x, n//2)
    if n%2==0: return half*half
    return half*half*x
for _ in range(50):
    x = random.randint(-5, 5)
    n = random.randint(0, 15)
    tcs.append(tc(f"{x} {n}", x**n))
problems.append(gen("Power Using Recursion","Compute x^n using recursion (fast exponentiation).",
    "Two integers x n","x raised to n","x: any int\n0 <= n <= 30","EASY",["Recursion","Math"],
    "2 10","1024","2^10 = 1024.",1,tcs))

# 24
tcs = []
def count_good_digits(n):
    res = 1
    for i in range(n):
        if i%2==0: res = (res*5)
        else: res = (res*4)
    return res
for n in list(range(1,25)) + [random.randint(1,30) for _ in range(26)]:
    tcs.append(tc(n, count_good_digits(n)))
problems.append(gen("Count Good Numbers","A digit string is 'good' if even indices have even digits (0,2,4,6,8) and odd indices have primes (2,3,5,7). Count good strings of length N.",
    "A positive integer N","Count of good strings","1 <= N <= 30","MEDIUM",["Math","Recursion"],
    "1","5","Length 1: 0,2,4,6,8 → 5 good numbers.",2,tcs[:50]))

# 25
tcs = []
def string_permutations_count(s):
    from math import factorial
    c = Counter(s)
    n = len(s)
    denom = 1
    for v in c.values(): denom *= factorial(v)
    return factorial(n)//denom
for _ in range(50):
    n = random.randint(1,8)
    s = ''.join(random.choice('abc') for _ in range(n))
    tcs.append(tc(s, string_permutations_count(s)))
problems.append(gen("Count Distinct Permutations","Count the number of distinct permutations of a string.",
    "A string","Number of distinct permutations","1 <= |S| <= 10","MEDIUM",["Recursion","Math"],
    "aabc","12","4!/(2!) = 12 distinct permutations.",2,tcs))

# ============ DP PROBLEMS ============

# 26
tcs = []
def grid_unique_paths_obstacles(grid):
    m,n = len(grid),len(grid[0])
    if grid[0][0]==1 or grid[m-1][n-1]==1: return 0
    dp = [[0]*n for _ in range(m)]
    dp[0][0] = 1
    for i in range(m):
        for j in range(n):
            if grid[i][j]==1: dp[i][j]=0; continue
            if i>0: dp[i][j]+=dp[i-1][j]
            if j>0: dp[i][j]+=dp[i][j-1]
    return dp[m-1][n-1]
for _ in range(50):
    m,n = random.randint(1,6), random.randint(1,6)
    grid = [[1 if random.random()<0.2 else 0 for _ in range(n)] for _ in range(m)]
    grid[0][0]=0; grid[m-1][n-1]=0
    inp = f"{m} {n}\n" + '\n'.join(' '.join(map(str,row)) for row in grid)
    tcs.append(tc(inp, grid_unique_paths_obstacles(grid)))
problems.append(gen("Unique Paths with Obstacles","Count paths from top-left to bottom-right in a grid with obstacles (1=blocked, 0=open). Can only move right or down.",
    "First line: M N\nNext M lines: N integers (0 or 1)","Number of paths","1 <= M,N <= 100",
    "MEDIUM",["DP","Matrix"],tcs[0]["in"],tcs[0]["out"],"dp[i][j] = dp[i-1][j]+dp[i][j-1] if not blocked.",2,tcs))

# 27
tcs = []
def max_path_sum(grid):
    m,n = len(grid),len(grid[0])
    dp = [row[:] for row in grid]
    for i in range(m):
        for j in range(n):
            if i==0 and j==0: continue
            up = dp[i-1][j] if i>0 else float('-inf')
            left = dp[i][j-1] if j>0 else float('-inf')
            dp[i][j] = grid[i][j] + max(up, left)
    return dp[m-1][n-1]
for _ in range(50):
    m,n = random.randint(1,6), random.randint(1,6)
    grid = [[random.randint(-10,10) for _ in range(n)] for _ in range(m)]
    inp = f"{m} {n}\n" + '\n'.join(' '.join(map(str,row)) for row in grid)
    tcs.append(tc(inp, max_path_sum(grid)))
problems.append(gen("Maximum Path Sum in Grid","Find maximum sum path from top-left to bottom-right. Can move right or down only.",
    "First line: M N\nNext M lines: N integers","Maximum path sum","1 <= M,N <= 100",
    "MEDIUM",["DP","Matrix"],tcs[0]["in"],tcs[0]["out"],"dp[i][j] = grid[i][j]+max(dp[i-1][j],dp[i][j-1]).",2,tcs))

# 28
tcs = []
def min_coins(coins, amount):
    dp = [float('inf')]*(amount+1)
    dp[0] = 0
    for c in coins:
        for a in range(c, amount+1):
            dp[a] = min(dp[a], dp[a-c]+1)
    return dp[amount] if dp[amount]!=float('inf') else -1
for _ in range(50):
    n = random.randint(1,5)
    coins = sorted(set(random.randint(1,20) for _ in range(n)))
    amount = random.randint(0,50)
    tcs.append(tc(f"{len(coins)} {amount}\n{' '.join(map(str,coins))}", min_coins(coins, amount)))
problems.append(gen("Minimum Coins to Make Amount","Find minimum coins needed to make the given amount. Return -1 if impossible.",
    "First line: N amount\nSecond line: N coin denominations","Minimum coins or -1","1 <= N <= 12\n0 <= amount <= 10^4",
    "MEDIUM",["DP","Greedy"],tcs[0]["in"],tcs[0]["out"],"dp[a] = min(dp[a], dp[a-coin]+1) for each coin.",2,tcs))

# 29
tcs = []
def lis_length(arr):
    from bisect import bisect_left
    tails = []
    for x in arr:
        pos = bisect_left(tails, x)
        if pos == len(tails): tails.append(x)
        else: tails[pos] = x
    return len(tails)
for _ in range(50):
    n = random.randint(1,15)
    arr = [random.randint(1,30) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", lis_length(arr)))
problems.append(gen("Length of LIS","Find the length of the Longest Increasing Subsequence.",
    "First line: N\nSecond line: N integers","Length of LIS","1 <= N <= 10^4",
    "MEDIUM",["DP","Binary Search"],tcs[0]["in"],tcs[0]["out"],"O(n log n): maintain tails array with binary search.",2,tcs))

# 30
tcs = []
def lcs_length(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(1, m+1):
        for j in range(1, n+1):
            if s1[i-1]==s2[j-1]: dp[i][j]=dp[i-1][j-1]+1
            else: dp[i][j]=max(dp[i-1][j],dp[i][j-1])
    return dp[m][n]
for _ in range(50):
    n1,n2 = random.randint(1,10), random.randint(1,10)
    s1 = ''.join(random.choice('abcde') for _ in range(n1))
    s2 = ''.join(random.choice('abcde') for _ in range(n2))
    tcs.append(tc(f"{s1}\n{s2}", lcs_length(s1, s2)))
problems.append(gen("Length of LCS","Find the length of the Longest Common Subsequence of two strings.",
    "First line: string s1\nSecond line: string s2","Length of LCS","1 <= |s1|,|s2| <= 1000",
    "MEDIUM",["DP","String"],tcs[0]["in"],tcs[0]["out"],
    "dp[i][j] = dp[i-1][j-1]+1 if match, else max(dp[i-1][j],dp[i][j-1]).",2,tcs))

# 31
tcs = []
def knapsack_01(W, wt, val):
    n = len(wt)
    dp = [[0]*(W+1) for _ in range(n+1)]
    for i in range(1, n+1):
        for w in range(W+1):
            dp[i][w] = dp[i-1][w]
            if wt[i-1]<=w: dp[i][w]=max(dp[i][w], dp[i-1][w-wt[i-1]]+val[i-1])
    return dp[n][W]
for _ in range(50):
    n = random.randint(1,8)
    W = random.randint(1,30)
    wt = [random.randint(1,15) for _ in range(n)]
    val = [random.randint(1,50) for _ in range(n)]
    tcs.append(tc(f"{n} {W}\n{' '.join(map(str,wt))}\n{' '.join(map(str,val))}", knapsack_01(W, wt, val)))
problems.append(gen("0-1 Knapsack","Given N items with weights and values, and capacity W, find maximum value achievable.",
    "First line: N W\nSecond line: N weights\nThird line: N values","Maximum value","1 <= N <= 100\n1 <= W <= 1000",
    "MEDIUM",["DP"],tcs[0]["in"],tcs[0]["out"],"dp[i][w] = max(skip, take if weight allows).",2,tcs))

# ============ STACK / QUEUE ============

# 32
tcs = []
def next_greater(arr):
    n = len(arr)
    res = [-1]*n
    stk = []
    for i in range(n-1,-1,-1):
        while stk and stk[-1]<=arr[i]: stk.pop()
        if stk: res[i]=stk[-1]
        stk.append(arr[i])
    return res
for _ in range(50):
    n = random.randint(1,15)
    arr = [random.randint(1,50) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", ' '.join(map(str, next_greater(arr)))))
problems.append(gen("Next Greater Element","For each element, find the next greater element to its right. Print -1 if none.",
    "First line: N\nSecond line: N integers","N space-separated next greater elements","1 <= N <= 10^5",
    "MEDIUM",["Stack","Array"],tcs[0]["in"],tcs[0]["out"],"Use stack: traverse right to left.",2,tcs))

# 33
tcs = []
def valid_parens(s):
    stk = []
    mapping = {')':'(',']':'[','}':'{'}
    for c in s:
        if c in '({[': stk.append(c)
        elif c in ')}]':
            if not stk or stk[-1]!=mapping[c]: return False
            stk.pop()
    return len(stk)==0
test_strs = ["()","()[]{}","(]","([)]","{[]}","","(",")","{()}","[{()}]",
    "((()))","[()]","({[]})","{[}]","(()","())","[","]","{","}}"]
for _ in range(30):
    n = random.randint(0,10)
    s = ''.join(random.choice('()[]{}') for _ in range(n))
    test_strs.append(s)
for s in test_strs[:50]:
    tcs.append(tc(s if s else "()", "true" if valid_parens(s if s else "()") else "false"))
problems.append(gen("Balanced Parentheses","Check if a string of ()[]{}  has balanced parentheses.",
    "A string of brackets","true or false","0 <= |S| <= 10^4","EASY",["Stack","String"],
    "()[]{}","true","Each opening bracket has matching closing bracket in correct order.",1,tcs))

# 34
tcs = []
def stock_span(prices):
    spans = []; stk = []
    for i in range(len(prices)):
        while stk and prices[stk[-1]]<=prices[i]: stk.pop()
        spans.append(i-stk[-1] if stk else i+1)
        stk.append(i)
    return spans
for _ in range(50):
    n = random.randint(1,15)
    prices = [random.randint(1,100) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,prices))}", ' '.join(map(str, stock_span(prices)))))
problems.append(gen("Stock Span Problem","For each day, find how many consecutive days before (including today) the price was <= today's price.",
    "First line: N\nSecond line: N prices","N span values","1 <= N <= 10^5","MEDIUM",["Stack","Array"],
    tcs[0]["in"],tcs[0]["out"],"Use stack to track indices of elements in decreasing order.",2,tcs))

# ============ GREEDY ============

# 35
tcs = []
def min_platforms(arr, dep):
    arr_s, dep_s = sorted(arr), sorted(dep)
    plat, mx, i, j = 1, 1, 1, 0
    while i<len(arr_s) and j<len(dep_s):
        if arr_s[i]<=dep_s[j]: plat+=1; i+=1
        else: plat-=1; j+=1
        mx = max(mx, plat)
    return mx
for _ in range(50):
    n = random.randint(1,15)
    arr = sorted([random.randint(100,2359) for _ in range(n)])
    dep = [a+random.randint(10,200) for a in arr]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}\n{' '.join(map(str,dep))}", min_platforms(arr, dep)))
problems.append(gen("Minimum Platforms Required","Find minimum platforms needed at a station so no train waits.",
    "First line: N\nSecond line: N arrival times\nThird line: N departure times","Minimum platforms","1 <= N <= 10^5",
    "MEDIUM",["Greedy","Sorting"],tcs[0]["in"],tcs[0]["out"],"Sort arrivals/departures, two-pointer sweep.",2,tcs))

# 36
tcs = []
def fractional_knapsack(W, items):
    items_sorted = sorted(items, key=lambda x: x[1]/x[0], reverse=True)
    total = 0.0
    for w, v in items_sorted:
        if W >= w: total += v; W -= w
        else: total += v*(W/w); break
    return round(total, 2)
for _ in range(50):
    n = random.randint(1,8)
    W = random.randint(10,100)
    items = [(random.randint(1,30), random.randint(10,100)) for _ in range(n)]
    val = fractional_knapsack(W, items)
    tcs.append(tc(f"{n} {W}\n"+'\n'.join(f"{w} {v}" for w,v in items), f"{val:.2f}"))
problems.append(gen("Fractional Knapsack Greedy","Given items with weight and value, and capacity W. You can take fractions. Maximize value.",
    "First line: N W\nNext N lines: weight value each","Maximum value (2 decimal places)","1 <= N <= 100",
    "MEDIUM",["Greedy"],tcs[0]["in"],tcs[0]["out"],"Sort by value/weight ratio descending. Take greedily.",2,tcs))

# 37
tcs = []
def job_seq(deadlines, profits):
    jobs = sorted(zip(deadlines, profits), key=lambda x: -x[1])
    max_d = max(deadlines) if deadlines else 0
    slots = [False]*(max_d+1)
    total = 0; count = 0
    for d, p in jobs:
        for j in range(d, 0, -1):
            if not slots[j]:
                slots[j] = True; total += p; count += 1; break
    return f"{count} {total}"
for _ in range(50):
    n = random.randint(1,10)
    deadlines = [random.randint(1,n+2) for _ in range(n)]
    profits = [random.randint(10,100) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,deadlines))}\n{' '.join(map(str,profits))}", job_seq(deadlines, profits)))
problems.append(gen("Job Sequencing Problem","Given N jobs with deadlines and profits, maximize profit. Each job takes 1 unit. Print count and total profit.",
    "First line: N\nSecond line: N deadlines\nThird line: N profits","jobs_done total_profit","1 <= N <= 10^5",
    "MEDIUM",["Greedy","Sorting"],tcs[0]["in"],tcs[0]["out"],"Sort by profit desc. Assign each to latest available slot.",2,tcs))

# ============ BIT MANIPULATION ============

# 38
tcs = []
for _ in range(50):
    a = random.randint(0, 1000)
    b = random.randint(0, 1000)
    tcs.append(tc(f"{a} {b}", a^b))
problems.append(gen("XOR of Two Numbers","Given two non-negative integers, compute their XOR.",
    "Two integers A B","A XOR B","0 <= A,B <= 10^9","EASY",["Bit Manipulation","Basic"],
    "5 3","6","5 (101) XOR 3 (011) = 6 (110).",1,tcs))

# 39
tcs = []
for _ in range(50):
    a = random.randint(0, 1000)
    b = random.randint(0, 1000)
    tcs.append(tc(f"{a} {b}", a&b))
problems.append(gen("AND of Two Numbers","Given two non-negative integers, compute their bitwise AND.",
    "Two integers A B","A AND B","0 <= A,B <= 10^9","EASY",["Bit Manipulation","Basic"],
    "5 3","1","5 (101) AND 3 (011) = 1 (001).",1,tcs))

# 40
tcs = []
for _ in range(50):
    a = random.randint(0, 1000)
    b = random.randint(0, 1000)
    tcs.append(tc(f"{a} {b}", a|b))
problems.append(gen("OR of Two Numbers","Given two non-negative integers, compute their bitwise OR.",
    "Two integers A B","A OR B","0 <= A,B <= 10^9","EASY",["Bit Manipulation","Basic"],
    "5 3","7","5 (101) OR 3 (011) = 7 (111).",1,tcs))

# 41
tcs = []
def toggle_bit(n, k): return n ^ (1 << k)
for _ in range(50):
    n = random.randint(0, 1000)
    k = random.randint(0, 10)
    tcs.append(tc(f"{n} {k}", toggle_bit(n, k)))
problems.append(gen("Toggle Kth Bit","Toggle the Kth bit (0-indexed from right) of a number N.",
    "Two integers N K","Result after toggling Kth bit","0 <= N <= 10^9\n0 <= K <= 30",
    "EASY",["Bit Manipulation"],tcs[0]["in"],tcs[0]["out"],"XOR with (1 << K).",1,tcs))

# 42
tcs = []
def check_kth_bit(n, k): return 1 if n & (1<<k) else 0
for _ in range(50):
    n = random.randint(0, 1000)
    k = random.randint(0, 10)
    tcs.append(tc(f"{n} {k}", check_kth_bit(n, k)))
problems.append(gen("Check Kth Bit","Check if the Kth bit (0-indexed from right) of N is set. Print 1 or 0.",
    "Two integers N K","1 or 0","0 <= N <= 10^9\n0 <= K <= 30",
    "EASY",["Bit Manipulation"],tcs[0]["in"],tcs[0]["out"],"AND with (1 << K), check if non-zero.",1,tcs))

# ============ MORE ARRAY/MATH ============

# 43
tcs = []
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(-50,50) for _ in range(n)]
    neg = sum(1 for x in arr if x < 0)
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", neg))
problems.append(gen("Count Negative Numbers","Count negative numbers in an array.",
    "First line: N\nSecond line: N integers","Count of negatives","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Iterate and count x < 0.",1,tcs))

# 44
tcs = []
def longest_plateau(arr):
    if not arr: return 0
    mx = cur = 1
    for i in range(1, len(arr)):
        if arr[i]==arr[i-1]: cur+=1; mx=max(mx,cur)
        else: cur=1
    return mx
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(1,5) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", longest_plateau(arr)))
problems.append(gen("Longest Equal Subarray","Find the length of the longest subarray where all elements are equal.",
    "First line: N\nSecond line: N integers","Length of longest equal subarray","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Track consecutive equal elements count.",1,tcs))

# 45
tcs = []
def dutch_flag_count(arr):
    return f"{arr.count(0)} {arr.count(1)} {arr.count(2)}"
for _ in range(50):
    n = random.randint(1,25)
    arr = [random.randint(0,2) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", dutch_flag_count(arr)))
problems.append(gen("Count 0s 1s and 2s","Count occurrences of 0, 1, and 2 in an array.",
    "First line: N\nSecond line: N integers (0,1,2)","Three counts: count_0 count_1 count_2","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Simple counting.",1,tcs))

# 46
tcs = []
def wave_sort(arr):
    a = sorted(arr)
    for i in range(0, len(a)-1, 2):
        a[i], a[i+1] = a[i+1], a[i]
    return a
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(1,50) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", ' '.join(map(str, wave_sort(arr)))))
problems.append(gen("Wave Sort Array","Sort array in wave form: arr[0]>=arr[1]<=arr[2]>=arr[3]...",
    "First line: N\nSecond line: N integers","Wave sorted array","1 <= N <= 10^5",
    "EASY",["Array","Sorting"],tcs[0]["in"],tcs[0]["out"],"Sort, then swap adjacent pairs.",1,tcs))

# 47-50: More useful problems

# 47
tcs = []
def is_sorted_desc(arr): return all(arr[i]>=arr[i+1] for i in range(len(arr)-1))
for _ in range(50):
    n = random.randint(1,15)
    if random.random()<0.4: arr = sorted([random.randint(-20,20) for _ in range(n)], reverse=True)
    else: arr = [random.randint(-20,20) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", "true" if is_sorted_desc(arr) else "false"))
problems.append(gen("Check if Array is Sorted Descending","Check if array is sorted in non-increasing order.",
    "First line: N\nSecond line: N integers","true or false","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Check arr[i] >= arr[i+1] for all i.",1,tcs))

# 48
tcs = []
def kth_smallest(arr, k):
    return sorted(arr)[k-1]
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(-50,50) for _ in range(n)]
    k = random.randint(1,n)
    tcs.append(tc(f"{n} {k}\n{' '.join(map(str,arr))}", kth_smallest(arr, k)))
problems.append(gen("Kth Smallest Element","Find the Kth smallest element in an unsorted array.",
    "First line: N K\nSecond line: N integers","Kth smallest element","1 <= K <= N <= 10^5",
    "MEDIUM",["Array","Sorting"],tcs[0]["in"],tcs[0]["out"],"Sort and return element at index K-1.",2,tcs))

# 49
tcs = []
def kth_largest(arr, k):
    return sorted(arr, reverse=True)[k-1]
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(-50,50) for _ in range(n)]
    k = random.randint(1,n)
    tcs.append(tc(f"{n} {k}\n{' '.join(map(str,arr))}", kth_largest(arr, k)))
problems.append(gen("Kth Largest Element (Simple)","Find the Kth largest element in an unsorted array.",
    "First line: N K\nSecond line: N integers","Kth largest element","1 <= K <= N <= 10^5",
    "MEDIUM",["Array","Sorting"],tcs[0]["in"],tcs[0]["out"],"Sort descending and return K-1 index.",2,tcs))

# 50-75: More problems
# 50
tcs = []
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(-50,50) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", ' '.join(map(str, [abs(x) for x in arr]))))
problems.append(gen("Absolute Values of Array","Replace each element with its absolute value.",
    "First line: N\nSecond line: N integers","Array of absolute values","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Apply abs() to each element.",1,tcs))

# 51
tcs = []
for _ in range(50):
    n = random.randint(1,15)
    arr = [random.randint(1,50) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", ' '.join(map(str, [x*x for x in arr]))))
problems.append(gen("Square Each Element","Square each element of the array.",
    "First line: N\nSecond line: N integers","Array of squares","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Compute x*x for each element.",1,tcs))

# 52
tcs = []
def max_water(arr):
    l,r=0,len(arr)-1; mx=0
    while l<r:
        mx=max(mx, min(arr[l],arr[r])*(r-l))
        if arr[l]<arr[r]: l+=1
        else: r-=1
    return mx
for _ in range(50):
    n = random.randint(2,15)
    arr = [random.randint(1,50) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", max_water(arr)))
problems.append(gen("Container with Most Water (Simple)","Find two lines that together with x-axis form a container holding the most water.",
    "First line: N\nSecond line: N heights","Maximum water","2 <= N <= 10^5",
    "MEDIUM",["Array","Two Pointers"],tcs[0]["in"],tcs[0]["out"],"Two pointers from ends, move shorter side.",2,tcs))

# 53
tcs = []
def trap_water(arr):
    n = len(arr)
    if n<3: return 0
    left_max = [0]*n; right_max = [0]*n
    left_max[0]=arr[0]
    for i in range(1,n): left_max[i]=max(left_max[i-1],arr[i])
    right_max[n-1]=arr[n-1]
    for i in range(n-2,-1,-1): right_max[i]=max(right_max[i+1],arr[i])
    return sum(min(left_max[i],right_max[i])-arr[i] for i in range(n))
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(0,20) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", trap_water(arr)))
problems.append(gen("Trapping Rain Water (Array)","Given elevation map, compute trapped rainwater.",
    "First line: N\nSecond line: N heights","Units of trapped water","1 <= N <= 10^5",
    "HARD",["Array","Two Pointers","Stack"],tcs[0]["in"],tcs[0]["out"],
    "Precompute left_max and right_max arrays. Water at i = min(left_max,right_max)-height.",2,tcs))

# 54-75: Quick simple problems with verified outputs
simple_problems = [
    ("Check Even or Odd", lambda n: "even" if n%2==0 else "odd", "Number", "even or odd", "EASY", ["Math","Basic"],
     lambda: random.randint(-100,100), str),
    ("Absolute Value", lambda n: abs(n), "Integer", "Absolute value", "EASY", ["Math","Basic"],
     lambda: random.randint(-1000,1000), str),
    ("Celsius to Fahrenheit", lambda c: round(c*9/5+32,2), "Temperature in Celsius", "Fahrenheit (2 decimal)", "EASY", ["Math","Basic"],
     lambda: random.randint(-50,50), str),
    ("Area of Circle", lambda r: round(3.14159*r*r,2), "Radius (integer)", "Area (2 decimal places)", "EASY", ["Math","Basic"],
     lambda: random.randint(1,50), str),
    ("Perimeter of Rectangle", lambda: None, "Length Width", "Perimeter", "EASY", ["Math","Basic"], None, None),
    ("Check Leap Year", lambda y: "true" if (y%4==0 and y%100!=0) or y%400==0 else "false", "Year", "true or false", "EASY", ["Math","Basic"],
     lambda: random.randint(1900,2100), str),
    ("Sum of Even Numbers in Array", lambda arr: sum(x for x in arr if x%2==0), "N then array", "Sum of evens", "EASY", ["Array","Basic"],
     None, None),
    ("Sum of Odd Numbers in Array", lambda arr: sum(x for x in arr if x%2!=0), "N then array", "Sum of odds", "EASY", ["Array","Basic"],
     None, None),
    ("Count Zeros in Array", lambda arr: arr.count(0), "N then array", "Count of zeros", "EASY", ["Array","Basic"],
     None, None),
    ("Fibonacci Check", lambda n: "true" if n in {0,1,1,2,3,5,8,13,21,34,55,89,144,233,377,610,987,1597,2584,4181,6765} else "false",
     "Number", "true or false", "EASY", ["Math","Basic"], lambda: random.randint(0,100), str),
    ("Multiply Two Matrices Element", lambda: None, "Row Col then values", "Result", "EASY", ["Math"], None, None),
    ("Largest of Three Numbers", lambda a,b,c: max(a,b,c), "Three integers", "Largest", "EASY", ["Math","Basic"],
     lambda: (random.randint(-100,100), random.randint(-100,100), random.randint(-100,100)), None),
]

# Generate simple single-input problems
# Check Even/Odd
tcs = []
for _ in range(50):
    n = random.randint(-100,100)
    tcs.append(tc(n, "even" if n%2==0 else "odd"))
problems.append(gen("Check Even or Odd","Given N, check if even or odd.",
    "An integer N","even or odd","Any integer","EASY",["Math","Basic"],
    "4","even","4%2==0, so even.",1,tcs))

# Absolute Value
tcs = []
for _ in range(50):
    n = random.randint(-1000,1000)
    tcs.append(tc(n, abs(n)))
problems.append(gen("Absolute Value","Given an integer, print its absolute value.",
    "An integer N","|N|","Any integer","EASY",["Math","Basic"],
    "-5","5","|-5| = 5.",1,tcs))

# Celsius to Fahrenheit
tcs = []
for _ in range(50):
    c = random.randint(-50,50)
    f = round(c*9/5+32, 2)
    tcs.append(tc(c, f"{f:.2f}"))
problems.append(gen("Celsius to Fahrenheit","Convert temperature from Celsius to Fahrenheit. Formula: F = C*9/5 + 32.",
    "Temperature in Celsius (integer)","Fahrenheit (2 decimal places)","Integers","EASY",["Math","Basic"],
    "0","32.00","0*9/5+32 = 32.",1,tcs))

# Area of Circle
tcs = []
for _ in range(50):
    r = random.randint(1,50)
    tcs.append(tc(r, f"{3.14159*r*r:.2f}"))
problems.append(gen("Area of Circle","Given radius r, compute area = pi * r^2. Use pi = 3.14159.",
    "Radius r (integer)","Area (2 decimal places)","1 <= r <= 1000","EASY",["Math","Basic"],
    "5","78.54","3.14159 * 25 = 78.54.",1,tcs))

# Check Leap Year
tcs = []
def is_leap(y): return (y%4==0 and y%100!=0) or y%400==0
years = list(range(1900,1920)) + list(range(2000,2030))
for y in years[:50]:
    tcs.append(tc(y, "true" if is_leap(y) else "false"))
problems.append(gen("Check Leap Year","Check if a given year is a leap year.",
    "A year","true or false","1 <= year <= 9999","EASY",["Math","Basic"],
    "2000","true","2000: divisible by 400 → leap.",1,tcs))

# Sum of Even Numbers
tcs = []
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(-50,50) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", sum(x for x in arr if x%2==0)))
problems.append(gen("Sum of Even Numbers in Array","Sum all even numbers in array.",
    "First line: N\nSecond line: N integers","Sum of even numbers","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Filter evens and sum.",1,tcs))

# Sum of Odd Numbers
tcs = []
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.randint(-50,50) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", sum(x for x in arr if x%2!=0)))
problems.append(gen("Sum of Odd Numbers in Array","Sum all odd numbers in array.",
    "First line: N\nSecond line: N integers","Sum of odd numbers","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Filter odds and sum.",1,tcs))

# Count Zeros
tcs = []
for _ in range(50):
    n = random.randint(1,20)
    arr = [random.choice([0,0,random.randint(1,10)]) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", arr.count(0)))
problems.append(gen("Count Zeros in Array","Count the number of zeros in array.",
    "First line: N\nSecond line: N integers","Count of zeros","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Iterate and count elements equal to 0.",1,tcs))

# Fibonacci Check
tcs = []
fibs = set()
a,b=0,1
while a<=100000: fibs.add(a); a,b=b,a+b
for _ in range(50):
    n = random.randint(0,100)
    tcs.append(tc(n, "true" if n in fibs else "false"))
problems.append(gen("Check Fibonacci Number","Check if N is a Fibonacci number.",
    "A non-negative integer N","true or false","0 <= N <= 10^5","EASY",["Math","Basic"],
    "8","true","8 is F(6) in the Fibonacci sequence.",1,tcs))

# Largest of Three
tcs = []
for _ in range(50):
    a,b,c = random.randint(-100,100), random.randint(-100,100), random.randint(-100,100)
    tcs.append(tc(f"{a} {b} {c}", max(a,b,c)))
problems.append(gen("Largest of Three Numbers","Given three integers, find the largest.",
    "Three integers A B C","Largest of the three","Integers","EASY",["Math","Basic"],
    "3 7 5","7","7 is the largest.",1,tcs))

# Smallest of Three
tcs = []
for _ in range(50):
    a,b,c = random.randint(-100,100), random.randint(-100,100), random.randint(-100,100)
    tcs.append(tc(f"{a} {b} {c}", min(a,b,c)))
problems.append(gen("Smallest of Three Numbers","Given three integers, find the smallest.",
    "Three integers A B C","Smallest of the three","Integers","EASY",["Math","Basic"],
    "3 7 5","3","3 is the smallest.",1,tcs))

# Multiply Two Numbers
tcs = []
for _ in range(50):
    a,b = random.randint(-100,100), random.randint(-100,100)
    tcs.append(tc(f"{a} {b}", a*b))
problems.append(gen("Multiply Two Numbers","Given two integers, print their product.",
    "Two integers A B","A * B","Integers","EASY",["Math","Basic"],
    "6 7","42","6*7=42.",1,tcs))

# Sum of Squares
tcs = []
def sum_sq(n): return n*(n+1)*(2*n+1)//6
for n in list(range(1,40)) + [random.randint(1,100) for _ in range(11)]:
    tcs.append(tc(n, sum_sq(n)))
problems.append(gen("Sum of Squares of First N Numbers","Compute 1^2 + 2^2 + ... + N^2.",
    "A positive integer N","Sum of squares","1 <= N <= 10^4","EASY",["Math","Basic"],
    "3","14","1+4+9=14. Formula: N(N+1)(2N+1)/6.",1,tcs[:50]))

# Number of Digits Binary
tcs = []
for _ in range(50):
    n = random.randint(1,100000)
    tcs.append(tc(n, len(bin(n))-2))
problems.append(gen("Number of Bits","Count the number of bits needed to represent N in binary.",
    "A positive integer N","Number of bits","1 <= N <= 10^9","EASY",["Bit Manipulation","Math"],
    "10","4","10 in binary = 1010, which is 4 bits.",1,tcs))

# ============ Write output ============
existing = []
try:
    with open(r"c:\Users\Adarsh\Cookies\Desktop\Compiler_Project\server\src\main\resources\striver_new_problems.json") as f:
        existing = json.load(f)
except: pass

existing_titles_set = {p["title"] for p in existing} | existing_titles
new_only = [p for p in problems if p["title"] not in existing_titles_set]
all_problems = existing + new_only

with open(r"c:\Users\Adarsh\Cookies\Desktop\Compiler_Project\server\src\main\resources\striver_new_problems.json", "w") as f:
    json.dump(all_problems, f, indent=2)

total_tc = sum(len(p["tc"]) for p in all_problems)
print(f"Total in file: {len(all_problems)} problems, {total_tc} test cases")
print(f"New problems added: {len(new_only)}")
for p in new_only:
    print(f"  + {p['title']}: {len(p['tc'])} TCs [{p['diff']}]")

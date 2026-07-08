import json, random, math
from collections import Counter
random.seed(123)

def tc(inp, out, sample=False):
    r = {"in": str(inp).strip(), "out": str(out).strip()}
    if sample: r["sample"] = True
    return r

def gen(title, desc, inFmt, outFmt, constraints, diff, tags, sIn, sOut, explain, tl, tcs):
    tcs[0]["sample"] = True
    if len(tcs) > 1: tcs[1]["sample"] = True
    return {"title":title,"desc":desc,"inFmt":inFmt,"outFmt":outFmt,"constraints":constraints,
            "diff":diff,"tags":tags,"sIn":sIn,"sOut":sOut,"explain":explain,"tl":tl,"tc":tcs}

problems = []

# 1. Rearrange Array by Sign
def rearrange_sign(arr):
    pos = [x for x in arr if x > 0]
    neg = [x for x in arr if x < 0]
    res = []
    for i in range(len(pos)):
        res.append(pos[i]); res.append(neg[i])
    return res
tcs = []
for _ in range(50):
    n = random.randint(1, 15) * 2
    pos = [random.randint(1, 100) for _ in range(n//2)]
    neg = [random.randint(-100, -1) for _ in range(n//2)]
    arr = pos + neg; random.shuffle(arr)
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", ' '.join(map(str, rearrange_sign(arr)))))
problems.append(gen("Rearrange Array Elements by Sign",
    "Given an array of N integers with equal positive and negative numbers, rearrange so that positive and negative numbers alternate, starting with positive. Maintain relative order within positives and negatives.",
    "First line: N (even)\nSecond line: N integers","Rearranged array space-separated",
    "2 <= N <= 10^4\nEqual positive and negative count","MEDIUM",["Array","Two Pointers"],
    tcs[0]["in"],tcs[0]["out"],"Separate pos/neg, interleave starting with positive.",2,tcs))

# 2. Pascal's Triangle Row
tcs = []
def pascal_row(n):
    row = [1]
    for k in range(1, n+1):
        row.append(row[-1] * (n - k + 1) // k)
    return row
for n in list(range(0, 30)) + [random.randint(0,25) for _ in range(20)]:
    tcs.append(tc(n, ' '.join(map(str, pascal_row(n)))))
problems.append(gen("Pascal's Triangle Row",
    "Given a non-negative integer N, return the Nth row (0-indexed) of Pascal's Triangle.",
    "A single integer N","Space-separated integers of the Nth row","0 <= N <= 30",
    "EASY",["Math","Array"],"4","1 4 6 4 1","Row 4: C(4,0)=1, C(4,1)=4, C(4,2)=6, C(4,3)=4, C(4,4)=1",1,tcs[:50]))

# 3. Floor in Sorted Array
tcs = []
def floor_val(arr, x):
    res = -1
    lo, hi = 0, len(arr)-1
    while lo <= hi:
        mid = (lo+hi)//2
        if arr[mid] <= x: res = arr[mid]; lo = mid+1
        else: hi = mid-1
    return res
for _ in range(50):
    n = random.randint(1, 20)
    arr = sorted(set(random.randint(-50,50) for _ in range(n)))
    x = random.randint(-60, 60)
    tcs.append(tc(f"{len(arr)} {x}\n{' '.join(map(str,arr))}", floor_val(arr, x)))
problems.append(gen("Floor in Sorted Array",
    "Given a sorted array and a target x, find the floor of x (largest element <= x). Print -1 if no floor exists.",
    "First line: N x\nSecond line: N sorted integers","Floor value or -1",
    "1 <= N <= 10^5","EASY",["Binary Search","Array"],tcs[0]["in"],tcs[0]["out"],
    "Binary search: if arr[mid] <= x, update ans and go right.",1,tcs))

# 4. Ceil in Sorted Array
tcs = []
def ceil_val(arr, x):
    res = -1
    lo, hi = 0, len(arr)-1
    while lo <= hi:
        mid = (lo+hi)//2
        if arr[mid] >= x: res = arr[mid]; hi = mid-1
        else: lo = mid+1
    return res
for _ in range(50):
    n = random.randint(1, 20)
    arr = sorted(set(random.randint(-50,50) for _ in range(n)))
    x = random.randint(-60, 60)
    tcs.append(tc(f"{len(arr)} {x}\n{' '.join(map(str,arr))}", ceil_val(arr, x)))
problems.append(gen("Ceil in Sorted Array",
    "Given a sorted array and a target x, find the ceil of x (smallest element >= x). Print -1 if no ceil exists.",
    "First line: N x\nSecond line: N sorted integers","Ceil value or -1",
    "1 <= N <= 10^5","EASY",["Binary Search","Array"],tcs[0]["in"],tcs[0]["out"],
    "Binary search: if arr[mid] >= x, update ans and go left.",1,tcs))

# 5. Count Occurrences in Sorted Array
tcs = []
for _ in range(50):
    n = random.randint(1, 25)
    arr = sorted([random.randint(1,10) for _ in range(n)])
    x = random.randint(1, 12)
    tcs.append(tc(f"{n} {x}\n{' '.join(map(str,arr))}", arr.count(x)))
problems.append(gen("Count Occurrences in Sorted Array",
    "Given a sorted array and a target x, count how many times x appears.",
    "First line: N x\nSecond line: N sorted integers","Count of x in array",
    "1 <= N <= 10^5","EASY",["Binary Search","Array"],tcs[0]["in"],tcs[0]["out"],
    "Use binary search to find first and last occurrence. Count = last - first + 1.",1,tcs))

# 6. Single Element in Sorted Array
tcs = []
def single_elem(arr):
    for i in range(len(arr)):
        if i == 0 and (len(arr)==1 or arr[0]!=arr[1]): return arr[0]
        elif i == len(arr)-1 and arr[i]!=arr[i-1]: return arr[i]
        elif arr[i]!=arr[i-1] and arr[i]!=arr[i+1]: return arr[i]
    return arr[0]
for _ in range(50):
    n = random.randint(1, 10)
    vals = sorted(random.sample(range(1,50), n))
    single_idx = random.randint(0, n-1)
    result = []
    for i, v in enumerate(vals):
        if i == single_idx: result.append(v)
        else: result.extend([v, v])
    result.sort()
    tcs.append(tc(f"{len(result)}\n{' '.join(map(str,result))}", vals[single_idx]))
problems.append(gen("Single Element in Sorted Array",
    "Given a sorted array where every element appears exactly twice except one, find that single element.",
    "First line: N (odd)\nSecond line: N sorted integers","The single element",
    "1 <= N <= 10^5\nArray is sorted","MEDIUM",["Binary Search","Array"],tcs[0]["in"],tcs[0]["out"],
    "Use binary search on indices. Check if mid is part of a pair going left or right.",2,tcs))

# 7. Remove Outermost Parentheses
tcs = []
def remove_outer(s):
    res, depth = [], 0
    for c in s:
        if c == '(':
            if depth > 0: res.append(c)
            depth += 1
        else:
            depth -= 1
            if depth > 0: res.append(c)
    return ''.join(res)
test_strs = ["(()())(())", "(()())(())(()(()))", "()()", "(()(()))", "(())", "(())(())", "((()))", "(()())",
    "()()()", "(())()(())", "(((())))", "((())())", "(()()())", "()(())", "(())(())(())", "(()())()",
    "(()(())())", "(())(()())", "()(()())", "((()))()"]
for _ in range(30): 
    parts = random.randint(1,4)
    s = ""
    for _ in range(parts):
        depth = random.randint(1,3)
        inner = "()" * random.randint(0,2)
        s += "(" * depth + inner + ")" * depth
    test_strs.append(s)
for s in test_strs[:50]:
    tcs.append(tc(s, remove_outer(s) if remove_outer(s) else ""))
problems.append(gen("Remove Outermost Parentheses",
    "Given a valid parentheses string, remove the outermost parentheses of each primitive group and return the result.",
    "A valid parentheses string","String after removing outermost parentheses",
    "1 <= |S| <= 10^4","EASY",["String","Stack"],tcs[0]["in"],tcs[0]["out"],
    "Track depth. Only add characters when depth > 0 for '(' and before depth becomes 0 for ')'.",1,tcs))

# 8. Largest Odd Number in String
tcs = []
def largest_odd(s):
    for i in range(len(s)-1, -1, -1):
        if int(s[i]) % 2 == 1: return s[:i+1]
    return ""
test_nums = ["52","4206","35427","0","1","24680","13579","999","1000","2468",
    "123456789","9876543210","11111","22222","10203","50607","80901","33333","44444","55555",
    "777","888","111","222","333","444","555","666","999","100",
    "200","300","401","502","603","704","805","906","1234567","7654321",
    "2468024","1357913","9999999","0000","12340","56780","99998","11110","33330","77770"]
for s in test_nums[:50]:
    out = largest_odd(s)
    tcs.append(tc(s, out if out else ""))
problems.append(gen("Largest Odd Number in String",
    "Given a string of digits, find the largest odd number that is a prefix (substring from start). Return empty string if none.",
    "A string of digits","Largest odd prefix or empty string","1 <= |S| <= 10^5",
    "EASY",["String","Math"],tcs[0]["in"],tcs[0]["out"],
    "Find the rightmost odd digit. Everything up to and including it forms the largest odd number.",1,tcs))

# 9. Check Subsequence
tcs = []
def is_subseq(s, t):
    i = 0
    for c in t:
        if i < len(s) and c == s[i]: i += 1
    return i == len(s)
test_data = [("abc","ahbgdc"),("axc","ahbgdc"),("","abc"),("a","a"),("abc","abc"),
    ("ace","abcde"),("aec","abcde"),("b","abc"),("z","abc"),("ab","ab"),
    ("abc","aXbYcZ"),("xyz","xyz"),("xy","xay"),("ba","abc"),("aa","aaa")]
for _ in range(35):
    slen = random.randint(0, 5)
    tlen = random.randint(slen, slen+10)
    chars = 'abcde'
    s = ''.join(random.choice(chars) for _ in range(slen))
    t = ''.join(random.choice(chars) for _ in range(tlen))
    test_data.append((s, t))
for s, t in test_data[:50]:
    tcs.append(tc(f"{s}\n{t}", "true" if is_subseq(s, t) else "false"))
problems.append(gen("Is Subsequence",
    "Given two strings s and t, check if s is a subsequence of t.",
    "First line: string s\nSecond line: string t","true or false","0 <= |s| <= 100\n0 <= |t| <= 10^4",
    "EASY",["String","Two Pointers"],tcs[0]["in"],tcs[0]["out"],
    "Use two pointers. Walk through t, match characters of s in order.",1,tcs))

# 10. Print 1 to N
tcs = []
for n in list(range(1, 31)) + [random.randint(1, 50) for _ in range(20)]:
    tcs.append(tc(n, ' '.join(map(str, range(1, n+1)))))
problems.append(gen("Print 1 to N",
    "Given N, print numbers from 1 to N space-separated. Use recursion.",
    "A single integer N","Numbers 1 to N space-separated","1 <= N <= 10^4",
    "EASY",["Recursion","Basic"],"5","1 2 3 4 5","Simple recursion: print(n-1) first, then n.",1,tcs[:50]))

# 11. Print N to 1
tcs = []
for n in list(range(1, 31)) + [random.randint(1, 50) for _ in range(20)]:
    tcs.append(tc(n, ' '.join(map(str, range(n, 0, -1)))))
problems.append(gen("Print N to 1",
    "Given N, print numbers from N down to 1 space-separated. Use recursion.",
    "A single integer N","Numbers N to 1 space-separated","1 <= N <= 10^4",
    "EASY",["Recursion","Basic"],"5","5 4 3 2 1","Print n first, then recurse for n-1.",1,tcs[:50]))

# 12. Minimum Cost Climbing Stairs
tcs = []
def min_cost_stairs(cost):
    n = len(cost)
    if n <= 1: return 0
    dp = [0]*(n+1)
    for i in range(2, n+1):
        dp[i] = min(dp[i-1]+cost[i-1], dp[i-2]+cost[i-2])
    return dp[n]
for _ in range(50):
    n = random.randint(2, 20)
    cost = [random.randint(0, 100) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,cost))}", min_cost_stairs(cost)))
problems.append(gen("Minimum Cost Climbing Stairs",
    "Given an array cost where cost[i] is the cost of step i, find the minimum cost to reach the top. You can start from step 0 or 1, and can climb 1 or 2 steps at a time.",
    "First line: N\nSecond line: N costs","Minimum cost to reach top","2 <= N <= 1000",
    "EASY",["DP","Array"],"3\n10 15 20","15","Start at index 1 (cost 15), jump 2 steps to top. Total: 15.",1,tcs))

# 13. Tribonacci Number
tcs = []
def tribonacci(n):
    if n == 0: return 0
    if n <= 2: return 1
    a, b, c = 0, 1, 1
    for _ in range(3, n+1):
        a, b, c = b, c, a+b+c
    return c
for n in list(range(0, 38)) + [random.randint(0, 35) for _ in range(12)]:
    tcs.append(tc(n, tribonacci(n)))
problems.append(gen("Tribonacci Number",
    "The Tribonacci sequence: T(0)=0, T(1)=1, T(2)=1, T(n)=T(n-1)+T(n-2)+T(n-3). Given n, find T(n).",
    "A single integer n","T(n)","0 <= n <= 37",
    "EASY",["DP","Math"],"4","4","T(4) = T(3)+T(2)+T(1) = 2+1+1 = 4",1,tcs[:50]))

# 14. Count Ways to Climb Stairs
tcs = []
def count_ways(n):
    if n <= 1: return 1
    a, b = 1, 1
    for _ in range(2, n+1): a, b = b, a+b
    return b
for n in list(range(1, 35)) + [random.randint(1, 40) for _ in range(16)]:
    tcs.append(tc(n, count_ways(n)))
problems.append(gen("Count Ways to Climb Stairs",
    "Given N stairs, count ways to reach the top if you can climb 1 or 2 stairs at a time.",
    "A single integer N","Number of distinct ways","1 <= N <= 45",
    "EASY",["DP","Recursion"],"4","5","For 4 stairs: {1111, 112, 121, 211, 22} = 5 ways.",1,tcs[:50]))

# 15. Maximum Sum Non-Adjacent
tcs = []
def max_non_adj(arr):
    if not arr: return 0
    if len(arr) == 1: return max(0, arr[0])
    incl, excl = max(0, arr[0]), 0
    for i in range(1, len(arr)):
        incl, excl = excl + max(0, arr[i]), max(incl, excl)
    return max(incl, excl)
for _ in range(50):
    n = random.randint(1, 20)
    arr = [random.randint(-10, 50) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", max_non_adj(arr)))
problems.append(gen("Maximum Sum of Non-Adjacent Elements",
    "Given an array, find the maximum sum of elements such that no two selected elements are adjacent.",
    "First line: N\nSecond line: N integers","Maximum non-adjacent sum","1 <= N <= 10^5",
    "MEDIUM",["DP","Array"],tcs[0]["in"],tcs[0]["out"],
    "DP: at each index, choose max(include current + dp[i-2], exclude = dp[i-1]).",2,tcs))

# 16. Frog Jump Min Cost
tcs = []
def frog_jump(heights):
    n = len(heights)
    if n <= 1: return 0
    dp = [0]*n
    dp[1] = abs(heights[1]-heights[0])
    for i in range(2, n):
        dp[i] = min(dp[i-1]+abs(heights[i]-heights[i-1]), dp[i-2]+abs(heights[i]-heights[i-2]))
    return dp[-1]
for _ in range(50):
    n = random.randint(2, 20)
    h = [random.randint(1, 50) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,h))}", frog_jump(h)))
problems.append(gen("Frog Jump",
    "A frog wants to cross N stones. From stone i, it can jump to i+1 or i+2. The cost of jumping from i to j is |height[i]-height[j]|. Find minimum cost to reach the last stone.",
    "First line: N\nSecond line: N heights","Minimum cost","2 <= N <= 10^5",
    "MEDIUM",["DP","Array"],tcs[0]["in"],tcs[0]["out"],
    "dp[i] = min(dp[i-1]+|h[i]-h[i-1]|, dp[i-2]+|h[i]-h[i-2]|)",2,tcs))

# 17. Minimum Falling Path Sum
tcs = []
def min_falling(mat):
    n = len(mat)
    dp = [row[:] for row in mat]
    for i in range(1, n):
        for j in range(n):
            up = dp[i-1][j]
            ul = dp[i-1][j-1] if j > 0 else float('inf')
            ur = dp[i-1][j+1] if j < n-1 else float('inf')
            dp[i][j] = mat[i][j] + min(up, ul, ur)
    return min(dp[-1])
for _ in range(50):
    n = random.randint(1, 8)
    mat = [[random.randint(-20, 20) for _ in range(n)] for _ in range(n)]
    inp = f"{n}\n" + '\n'.join(' '.join(map(str, row)) for row in mat)
    tcs.append(tc(inp, min_falling(mat)))
problems.append(gen("Minimum Falling Path Sum",
    "Given an N x N matrix, find the minimum falling path sum. A falling path starts from any element in the first row and picks one element from each row, moving to the element directly below or diagonally left/right below.",
    "First line: N\nNext N lines: N integers each","Minimum falling path sum","1 <= N <= 100",
    "MEDIUM",["DP","Matrix"],tcs[0]["in"],tcs[0]["out"],
    "dp[i][j] = mat[i][j] + min(dp[i-1][j-1], dp[i-1][j], dp[i-1][j+1]).",2,tcs))

# 18. Rotate String
tcs = []
def is_rotation(s, goal):
    return len(s) == len(goal) and goal in s + s
test_data = [("abcde","cdeab"),("abcde","abced"),("a","a"),("aa","aa"),("ab","ba"),
    ("abc","bca"),("abc","cab"),("abc","abc"),("abcd","cdab"),("abcd","dabc")]
for _ in range(40):
    n = random.randint(1, 10)
    s = ''.join(random.choice('abcde') for _ in range(n))
    if random.random() < 0.5:
        k = random.randint(0, n-1)
        goal = s[k:] + s[:k]
    else:
        goal = ''.join(random.choice('abcde') for _ in range(n))
    test_data.append((s, goal))
for s, g in test_data[:50]:
    tcs.append(tc(f"{s}\n{g}", "true" if is_rotation(s, g) else "false"))
problems.append(gen("Rotate String",
    "Given two strings s and goal, check if goal is a rotation of s.",
    "First line: string s\nSecond line: string goal","true or false","1 <= |s|, |goal| <= 100",
    "EASY",["String","Basic"],"abcde\ncdeab","true",
    "Trick: goal is a rotation of s iff goal is a substring of s+s and lengths match.",1,tcs))

# 19. Pair with Given Sum in Sorted Array
tcs = []
def pair_sum(arr, target):
    l, r = 0, len(arr)-1
    while l < r:
        s = arr[l] + arr[r]
        if s == target: return f"{arr[l]} {arr[r]}"
        elif s < target: l += 1
        else: r -= 1
    return "-1"
for _ in range(50):
    n = random.randint(2, 20)
    arr = sorted(set(random.randint(-50, 50) for _ in range(n)))
    if len(arr) < 2: arr = [1, 2]
    if random.random() < 0.6:
        i, j = sorted(random.sample(range(len(arr)), 2))
        target = arr[i] + arr[j]
    else:
        target = random.randint(-100, 100)
    tcs.append(tc(f"{len(arr)} {target}\n{' '.join(map(str,arr))}", pair_sum(arr, target)))
problems.append(gen("Pair with Given Sum",
    "Given a sorted array and a target sum, find a pair of elements that add up to the target. Print the two elements. If no pair exists, print -1.",
    "First line: N target\nSecond line: N sorted integers","Two elements or -1","2 <= N <= 10^5",
    "EASY",["Array","Two Pointers"],tcs[0]["in"],tcs[0]["out"],
    "Two pointer: start from both ends, move inward.",1,tcs))

# 20. N Meetings in One Room
tcs = []
def max_meetings(start, end):
    meetings = sorted(zip(end, start))
    count, last_end = 0, -1
    for e, s in meetings:
        if s > last_end: count += 1; last_end = e
    return count
for _ in range(50):
    n = random.randint(1, 15)
    start = [random.randint(1, 30) for _ in range(n)]
    end = [s + random.randint(1, 10) for s in start]
    tcs.append(tc(f"{n}\n{' '.join(map(str,start))}\n{' '.join(map(str,end))}", max_meetings(start, end)))
problems.append(gen("N Meetings in One Room",
    "Given N meetings with start and end times, find the maximum number of meetings that can be held in one room (no overlap).",
    "First line: N\nSecond line: N start times\nThird line: N end times","Maximum meetings",
    "1 <= N <= 10^5","EASY",["Greedy","Sorting"],tcs[0]["in"],tcs[0]["out"],
    "Sort by end time. Greedily pick meetings that don't overlap.",1,tcs))

# 21. Alternating Characters
tcs = []
def min_del_alt(s):
    count = 0
    for i in range(1, len(s)):
        if s[i] == s[i-1]: count += 1
    return count
for _ in range(50):
    n = random.randint(1, 30)
    s = ''.join(random.choice('AB') for _ in range(n))
    tcs.append(tc(s, min_del_alt(s)))
problems.append(gen("Alternating Characters",
    "Given a string of A's and B's, find the minimum number of deletions to make no two adjacent characters the same.",
    "A string of A's and B's","Minimum deletions","1 <= |S| <= 10^5",
    "EASY",["String","Greedy"],"AABAAB","2","Delete positions to get ABAB. Remove 2 characters.",1,tcs))

# 22. String Compression
tcs = []
def compress(s):
    if not s: return ""
    res, count, cur = [], 1, s[0]
    for i in range(1, len(s)):
        if s[i] == cur: count += 1
        else:
            res.append(cur if count == 1 else f"{cur}{count}")
            cur, count = s[i], 1
    res.append(cur if count == 1 else f"{cur}{count}")
    return ''.join(res)
test_strs = ["aabcccccaaa","abc","aaa","a","ab","aaabbb","abcd","aaaa","aabb","abcabc"]
for _ in range(40):
    n = random.randint(1, 20)
    s = ''.join(random.choice('abcde') for _ in range(n))
    test_strs.append(s)
for s in test_strs[:50]:
    tcs.append(tc(s, compress(s)))
problems.append(gen("String Compression",
    "Compress a string: consecutive repeated characters are replaced by the character followed by count. If count is 1, just write the character.",
    "A string S","Compressed string","1 <= |S| <= 10^5",
    "EASY",["String","Basic"],"aabcccccaaa","a2bc5a3","a appears 2 times, b once, c 5 times, a 3 times.",1,tcs))

# 23. Next Smaller Element
tcs = []
def next_smaller(arr):
    n = len(arr)
    res = [-1]*n
    stack = []
    for i in range(n-1, -1, -1):
        while stack and stack[-1] >= arr[i]: stack.pop()
        if stack: res[i] = stack[-1]
        stack.append(arr[i])
    return res
for _ in range(50):
    n = random.randint(1, 15)
    arr = [random.randint(1, 50) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", ' '.join(map(str, next_smaller(arr)))))
problems.append(gen("Next Smaller Element",
    "For each element in the array, find the next smaller element to its right. If none exists, print -1.",
    "First line: N\nSecond line: N integers","N space-separated next smaller elements",
    "1 <= N <= 10^5","MEDIUM",["Stack","Array"],tcs[0]["in"],tcs[0]["out"],
    "Use a stack. Traverse from right to left, pop elements >= current.",2,tcs))

# 24. Smallest Divisor Given Threshold
tcs = []
def smallest_divisor(nums, threshold):
    lo, hi = 1, max(nums)
    while lo < hi:
        mid = (lo+hi)//2
        s = sum(math.ceil(x/mid) for x in nums)
        if s <= threshold: hi = mid
        else: lo = mid+1
    return lo
for _ in range(50):
    n = random.randint(1, 10)
    nums = [random.randint(1, 100) for _ in range(n)]
    threshold = sum(nums) // max(1, random.randint(1, max(nums))) + n
    threshold = max(n, threshold)
    tcs.append(tc(f"{n} {threshold}\n{' '.join(map(str,nums))}", smallest_divisor(nums, threshold)))
problems.append(gen("Smallest Divisor Given Threshold",
    "Given an array of integers and a threshold, find the smallest divisor such that the sum of ceil(nums[i]/divisor) is <= threshold.",
    "First line: N threshold\nSecond line: N integers","Smallest divisor","1 <= N <= 10^5",
    "MEDIUM",["Binary Search","Math"],tcs[0]["in"],tcs[0]["out"],
    "Binary search on the divisor value from 1 to max(nums).",2,tcs))

# 25. Maximum of Subarrays of Size K
tcs = []
def max_subarrays_k(arr, k):
    from collections import deque
    dq, res = deque(), []
    for i in range(len(arr)):
        while dq and dq[0] < i-k+1: dq.popleft()
        while dq and arr[dq[-1]] <= arr[i]: dq.pop()
        dq.append(i)
        if i >= k-1: res.append(arr[dq[0]])
    return res
for _ in range(50):
    n = random.randint(1, 20)
    k = random.randint(1, n)
    arr = [random.randint(-20, 20) for _ in range(n)]
    tcs.append(tc(f"{n} {k}\n{' '.join(map(str,arr))}", ' '.join(map(str, max_subarrays_k(arr, k)))))
problems.append(gen("Maximum of All Subarrays of Size K",
    "Given an array and window size K, find the maximum element in every contiguous subarray of size K.",
    "First line: N K\nSecond line: N integers","Space-separated max of each window","1 <= K <= N <= 10^5",
    "HARD",["Sliding Window","Deque"],tcs[0]["in"],tcs[0]["out"],
    "Use a deque to maintain a decreasing window of useful elements.",2,tcs))

# 26. Longest Common Substring
tcs = []
def lcs_str(s1, s2):
    n, m = len(s1), len(s2)
    best = 0
    dp = [[0]*(m+1) for _ in range(n+1)]
    for i in range(1, n+1):
        for j in range(1, m+1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
                best = max(best, dp[i][j])
    return best
for _ in range(50):
    n1, n2 = random.randint(1, 10), random.randint(1, 10)
    s1 = ''.join(random.choice('abcde') for _ in range(n1))
    s2 = ''.join(random.choice('abcde') for _ in range(n2))
    tcs.append(tc(f"{s1}\n{s2}", lcs_str(s1, s2)))
problems.append(gen("Longest Common Substring",
    "Given two strings, find the length of the longest common substring (contiguous).",
    "First line: string s1\nSecond line: string s2","Length of longest common substring",
    "1 <= |s1|, |s2| <= 1000","MEDIUM",["DP","String"],tcs[0]["in"],tcs[0]["out"],
    "DP: dp[i][j] = dp[i-1][j-1]+1 if chars match, else 0. Track maximum.",2,tcs))

# 27. Stock with Transaction Fee
tcs = []
def stock_fee(prices, fee):
    cash, hold = 0, -prices[0]
    for i in range(1, len(prices)):
        cash = max(cash, hold + prices[i] - fee)
        hold = max(hold, cash - prices[i])
    return cash
for _ in range(50):
    n = random.randint(2, 20)
    prices = [random.randint(1, 100) for _ in range(n)]
    fee = random.randint(1, 10)
    tcs.append(tc(f"{n} {fee}\n{' '.join(map(str,prices))}", stock_fee(prices, fee)))
problems.append(gen("Best Time to Buy and Sell Stock with Transaction Fee",
    "Given stock prices and a transaction fee, find the maximum profit. You can make multiple transactions but pay fee for each sell.",
    "First line: N fee\nSecond line: N prices","Maximum profit","2 <= N <= 10^5",
    "MEDIUM",["DP","Greedy"],tcs[0]["in"],tcs[0]["out"],
    "Track cash (not holding) and hold (holding stock) states.",2,tcs))

# 28-30: More simple problems
# 28. Count Characters
tcs = []
for _ in range(50):
    n = random.randint(1, 30)
    s = ''.join(random.choice('abcdefghij') for _ in range(n))
    tcs.append(tc(s, len(s)))
problems.append(gen("Length of String",
    "Given a string, find its length.","A string S","Length of S","1 <= |S| <= 10^5",
    "EASY",["String","Basic"],tcs[0]["in"],tcs[0]["out"],"Count all characters.",1,tcs))

# 29. Sum of Array
tcs = []
for _ in range(50):
    n = random.randint(1, 25)
    arr = [random.randint(-100, 100) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", sum(arr)))
problems.append(gen("Sum of Array Elements",
    "Given an array of N integers, compute and print the sum of all elements.",
    "First line: N\nSecond line: N integers","Sum of all elements","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Iterate and accumulate the sum.",1,tcs))

# 30. Product of Array
tcs = []
for _ in range(50):
    n = random.randint(1, 10)
    arr = [random.randint(-5, 5) for _ in range(n)]
    prod = 1
    for x in arr: prod *= x
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", prod))
problems.append(gen("Product of Array Elements",
    "Given an array of N integers, compute the product of all elements.",
    "First line: N\nSecond line: N integers","Product of all elements","1 <= N <= 20\n-5 <= arr[i] <= 5",
    "EASY",["Array","Math"],tcs[0]["in"],tcs[0]["out"],"Multiply all elements together.",1,tcs))

# 31. Maximum Product of Two Numbers
tcs = []
for _ in range(50):
    n = random.randint(2, 20)
    arr = [random.randint(-50, 50) for _ in range(n)]
    best = max(arr[i]*arr[j] for i in range(n) for j in range(i+1, n))
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", best))
problems.append(gen("Maximum Product of Two Elements",
    "Given an array, find the maximum product of any two elements.",
    "First line: N\nSecond line: N integers","Maximum product of two elements","2 <= N <= 10^5",
    "EASY",["Array","Math"],tcs[0]["in"],tcs[0]["out"],"Sort and check max of first two or last two products.",1,tcs))

# 32. Count Even and Odd
tcs = []
for _ in range(50):
    n = random.randint(1, 20)
    arr = [random.randint(1, 100) for _ in range(n)]
    evens = sum(1 for x in arr if x % 2 == 0)
    odds = n - evens
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", f"{evens} {odds}"))
problems.append(gen("Count Even and Odd Numbers",
    "Given an array, count how many numbers are even and how many are odd.",
    "First line: N\nSecond line: N integers","Two integers: even_count odd_count","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Check each number with modulo 2.",1,tcs))

# 33. Check Perfect Number
tcs = []
def is_perfect(n):
    if n <= 1: return False
    s = 1
    for i in range(2, int(n**0.5)+1):
        if n % i == 0:
            s += i
            if i != n // i: s += n // i
    return s == n
for n in [6, 28, 496, 8128, 1, 2, 3, 4, 5, 7, 10, 12, 15, 20, 25, 100, 128, 256, 500, 1000,
          8, 9, 11, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 29, 30, 33, 36, 40,
          50, 60, 70, 80, 90, 99, 120, 200, 300, 400]:
    tcs.append(tc(n, "true" if is_perfect(n) else "false"))
problems.append(gen("Check Perfect Number",
    "A perfect number equals the sum of its proper divisors (excluding itself). Given N, check if it's perfect.",
    "A single positive integer N","true or false","1 <= N <= 10^6",
    "EASY",["Math","Basic"],"28","true","28 = 1+2+4+7+14. Sum of proper divisors = 28.",1,tcs[:50]))

# 34. Absolute Difference of Array
tcs = []
for _ in range(50):
    n = random.randint(2, 20)
    arr = [random.randint(-100, 100) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", abs(max(arr)-min(arr))))
problems.append(gen("Difference Between Max and Min",
    "Given an array, find the absolute difference between the maximum and minimum elements.",
    "First line: N\nSecond line: N integers","Absolute difference","2 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],"Find max and min, return max-min.",1,tcs))

# 35. Check Sorted and Rotated
tcs = []
def is_sorted_rotated(arr):
    n = len(arr)
    count = 0
    for i in range(n):
        if arr[i] > arr[(i+1)%n]: count += 1
    return count <= 1
for _ in range(50):
    n = random.randint(1, 15)
    if random.random() < 0.5:
        arr = sorted([random.randint(1, 20) for _ in range(n)])
        k = random.randint(0, n-1)
        arr = arr[k:] + arr[:k]
    else:
        arr = [random.randint(1, 20) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", "true" if is_sorted_rotated(arr) else "false"))
problems.append(gen("Check if Array is Sorted and Rotated",
    "Given an array, check if it was originally sorted in non-decreasing order and then rotated some positions.",
    "First line: N\nSecond line: N integers","true or false","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],
    "Count the number of 'breaks' where arr[i] > arr[i+1]. At most 1 break allowed.",1,tcs))

# 36-50: More diverse problems
# 36. Equilibrium Index
tcs = []
def equilibrium(arr):
    total = sum(arr)
    left = 0
    for i in range(len(arr)):
        total -= arr[i]
        if left == total: return i
        left += arr[i]
    return -1
for _ in range(50):
    n = random.randint(1, 20)
    arr = [random.randint(-20, 20) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", equilibrium(arr)))
problems.append(gen("Equilibrium Index",
    "Find the equilibrium index of an array where the sum of left elements equals sum of right elements. Return -1 if none.",
    "First line: N\nSecond line: N integers","Equilibrium index or -1","1 <= N <= 10^5",
    "MEDIUM",["Array","Prefix Sum"],tcs[0]["in"],tcs[0]["out"],
    "Track left sum and right sum (total - left - current). Compare at each index.",2,tcs))

# 37. Dutch National Flag (Sort 0,1,2) - not Sort Colors since it exists
tcs = []
for _ in range(50):
    n = random.randint(1, 25)
    arr = [random.randint(0, 2) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", ' '.join(map(str, sorted(arr)))))
problems.append(gen("Sort Array of 0s 1s and 2s",
    "Given an array containing only 0s, 1s, and 2s, sort it in-place using the Dutch National Flag algorithm.",
    "First line: N\nSecond line: N integers (0,1,2)","Sorted array","1 <= N <= 10^5",
    "MEDIUM",["Array","Two Pointers"],tcs[0]["in"],tcs[0]["out"],
    "Three pointers: low, mid, high. Swap elements to partition into 0s, 1s, 2s.",2,tcs))

# 38. Reverse Words in String
tcs = []
def reverse_words(s):
    return ' '.join(s.split()[::-1])
test_strs = ["the sky is blue", "hello world", "a", "hello", "I love programming",
    "one two three", "abc def ghi", "code campus rocks", "test case here", "single"]
for _ in range(40):
    n = random.randint(1, 5)
    words = [''.join(random.choice('abcdefgh') for _ in range(random.randint(1,6))) for _ in range(n)]
    test_strs.append(' '.join(words))
for s in test_strs[:50]:
    tcs.append(tc(s, reverse_words(s)))
problems.append(gen("Reverse Words",
    "Given a string of words separated by spaces, reverse the order of words.",
    "A string of words","Words in reverse order","1 <= |S| <= 10^4",
    "EASY",["String","Basic"],"the sky is blue","blue is sky the",
    "Split by spaces, reverse the array of words, join back.",1,tcs))

# 39. Majority Element (N/3) variant - Count elements appearing > N/3 times
tcs = []
def majority_n3(arr):
    n = len(arr)
    c = Counter(arr)
    res = sorted([k for k, v in c.items() if v > n//3])
    return ' '.join(map(str, res)) if res else "-1"
for _ in range(50):
    n = random.randint(1, 20)
    arr = [random.randint(1, 5) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", majority_n3(arr)))
problems.append(gen("Majority Element N by 3",
    "Find all elements that appear more than N/3 times in the array. Print them sorted, or -1 if none.",
    "First line: N\nSecond line: N integers","Elements appearing > N/3 times, or -1","1 <= N <= 10^5",
    "MEDIUM",["Array","Hash Map"],tcs[0]["in"],tcs[0]["out"],
    "Boyer-Moore Voting for at most 2 candidates, then verify counts.",2,tcs))

# 40. XOR of Array
tcs = []
for _ in range(50):
    n = random.randint(1, 20)
    arr = [random.randint(0, 100) for _ in range(n)]
    xor = 0
    for x in arr: xor ^= x
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", xor))
problems.append(gen("XOR of All Elements",
    "Given an array of N non-negative integers, compute the XOR of all elements.",
    "First line: N\nSecond line: N integers","XOR of all elements","1 <= N <= 10^5",
    "EASY",["Bit Manipulation","Array"],tcs[0]["in"],tcs[0]["out"],
    "XOR all elements: a ^ b ^ c ^ ...",1,tcs))

# 41. Average of Array
tcs = []
for _ in range(50):
    n = random.randint(1, 20)
    arr = [random.randint(-100, 100) for _ in range(n)]
    avg = sum(arr) / n
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", f"{avg:.2f}"))
problems.append(gen("Average of Array Elements",
    "Given an array, compute the average rounded to 2 decimal places.",
    "First line: N\nSecond line: N integers","Average to 2 decimal places","1 <= N <= 10^5",
    "EASY",["Array","Math"],tcs[0]["in"],tcs[0]["out"],"Sum all elements and divide by N.",1,tcs))

# 42. Count Pairs with Given Difference
tcs = []
def count_pairs_diff(arr, k):
    s = set(arr)
    count = 0
    for x in s:
        if x + k in s: count += 1
    return count
for _ in range(50):
    n = random.randint(2, 15)
    arr = [random.randint(1, 30) for _ in range(n)]
    k = random.randint(1, 10)
    tcs.append(tc(f"{n} {k}\n{' '.join(map(str,arr))}", count_pairs_diff(arr, k)))
problems.append(gen("Count Pairs with Given Difference",
    "Given an array and K, count pairs of distinct elements with absolute difference K.",
    "First line: N K\nSecond line: N integers","Count of pairs","1 <= N <= 10^5",
    "EASY",["Array","Hash Map"],tcs[0]["in"],tcs[0]["out"],
    "For each element x, check if x+K exists in a set.",1,tcs))

# 43. Cumulative Sum
tcs = []
for _ in range(50):
    n = random.randint(1, 20)
    arr = [random.randint(-20, 20) for _ in range(n)]
    prefix = []
    s = 0
    for x in arr: s += x; prefix.append(s)
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", ' '.join(map(str, prefix))))
problems.append(gen("Prefix Sum Array",
    "Given an array, compute the prefix sum array where prefix[i] = sum of elements from 0 to i.",
    "First line: N\nSecond line: N integers","Prefix sum array space-separated","1 <= N <= 10^5",
    "EASY",["Array","Prefix Sum"],tcs[0]["in"],tcs[0]["out"],
    "Running sum: prefix[i] = prefix[i-1] + arr[i].",1,tcs))

# 44. Running Maximum
tcs = []
for _ in range(50):
    n = random.randint(1, 20)
    arr = [random.randint(-20, 20) for _ in range(n)]
    running = []
    mx = float('-inf')
    for x in arr: mx = max(mx, x); running.append(mx)
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", ' '.join(map(str, running))))
problems.append(gen("Running Maximum Array",
    "Given an array, compute the running maximum where result[i] = max(arr[0..i]).",
    "First line: N\nSecond line: N integers","Running maximum array","1 <= N <= 10^5",
    "EASY",["Array","Basic"],tcs[0]["in"],tcs[0]["out"],
    "Track maximum as you iterate from left to right.",1,tcs))

# 45. Smallest and Largest Digit of a Number
tcs = []
for _ in range(50):
    n = random.randint(1, 999999)
    digits = [int(d) for d in str(n)]
    tcs.append(tc(n, f"{min(digits)} {max(digits)}"))
problems.append(gen("Smallest and Largest Digit",
    "Given a positive integer, find its smallest and largest digits.",
    "A positive integer N","Two integers: smallest_digit largest_digit","1 <= N <= 10^9",
    "EASY",["Math","Basic"],tcs[0]["in"],tcs[0]["out"],
    "Extract digits and find min/max.",1,tcs))

# 46. Binary to Decimal
tcs = []
for _ in range(50):
    n = random.randint(0, 1023)
    binary = bin(n)[2:]
    tcs.append(tc(binary, n))
problems.append(gen("Binary to Decimal",
    "Given a binary number as a string, convert it to decimal.",
    "A binary string","Decimal equivalent","0 <= result <= 10^9",
    "EASY",["Math","Bit Manipulation"],tcs[0]["in"],tcs[0]["out"],
    "Multiply each bit by 2^position and sum up.",1,tcs))

# 47. Decimal to Binary
tcs = []
for _ in range(50):
    n = random.randint(0, 1000)
    tcs.append(tc(n, bin(n)[2:]))
problems.append(gen("Decimal to Binary",
    "Given a decimal number, convert it to binary.",
    "A non-negative integer N","Binary representation as string","0 <= N <= 10^9",
    "EASY",["Math","Bit Manipulation"],tcs[0]["in"],tcs[0]["out"],
    "Repeatedly divide by 2 and collect remainders.",1,tcs))

# 48. Merge Two Sorted Arrays
tcs = []
for _ in range(50):
    n = random.randint(1, 15)
    m = random.randint(1, 15)
    a = sorted([random.randint(-20, 20) for _ in range(n)])
    b = sorted([random.randint(-20, 20) for _ in range(m)])
    merged = sorted(a + b)
    tcs.append(tc(f"{n} {m}\n{' '.join(map(str,a))}\n{' '.join(map(str,b))}", ' '.join(map(str, merged))))
problems.append(gen("Merge Two Sorted Arrays into One",
    "Given two sorted arrays, merge them into a single sorted array (may contain duplicates).",
    "First line: N M\nSecond line: N sorted integers\nThird line: M sorted integers",
    "Merged sorted array","1 <= N, M <= 10^5",
    "EASY",["Array","Two Pointers"],tcs[0]["in"],tcs[0]["out"],
    "Two pointer merge like in merge sort.",1,tcs))

# 49. Swap Two Numbers Without Temp
tcs = []
for _ in range(50):
    a, b = random.randint(-100, 100), random.randint(-100, 100)
    tcs.append(tc(f"{a} {b}", f"{b} {a}"))
problems.append(gen("Swap Two Numbers",
    "Given two integers A and B, swap them and print B A.",
    "Two space-separated integers A B","B A (swapped)","Integers in range",
    "EASY",["Math","Basic"],tcs[0]["in"],tcs[0]["out"],
    "Use XOR: a=a^b, b=a^b, a=a^b. Or use temp variable.",1,tcs))

# 50. Neon Number Check
tcs = []
def is_neon(n):
    return sum(int(d) for d in str(n*n)) == n
for n in list(range(0, 30)) + [random.randint(0, 100) for _ in range(20)]:
    tcs.append(tc(n, "true" if is_neon(n) else "false"))
problems.append(gen("Check Neon Number",
    "A neon number is a number where the sum of digits of its square equals the number itself. Given N, check if it's neon.\n\nExample: 9^2 = 81, 8+1 = 9 = N. So 9 is neon.",
    "A non-negative integer N","true or false","0 <= N <= 10^5",
    "EASY",["Math","Basic"],"9","true","9^2 = 81, digit sum = 8+1 = 9 = N.",1,tcs[:50]))

# Read existing file and append
existing = []
try:
    with open(r"c:\Users\Adarsh\Cookies\Desktop\Compiler_Project\server\src\main\resources\striver_new_problems.json") as f:
        existing = json.load(f)
except: pass

existing_titles = {p["title"] for p in existing}
new_only = [p for p in problems if p["title"] not in existing_titles]
all_problems = existing + new_only

with open(r"c:\Users\Adarsh\Cookies\Desktop\Compiler_Project\server\src\main\resources\striver_new_problems.json", "w") as f:
    json.dump(all_problems, f, indent=2)

total_tc = sum(len(p["tc"]) for p in all_problems)
print(f"Total: {len(all_problems)} problems, {total_tc} test cases")
print(f"New problems added: {len(new_only)}")
for p in new_only:
    print(f"  + {p['title']}: {len(p['tc'])} test cases")

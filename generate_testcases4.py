import json, random, math
from collections import Counter
random.seed(789)

def tc(inp, out, sample=False):
    r = {"in": str(inp).strip(), "out": str(out).strip()}
    if sample: r["sample"] = True
    return r

def gen(title, desc, inFmt, outFmt, constraints, diff, tags, sIn, sOut, explain, tl, tcs):
    tcs[0]["sample"] = True
    if len(tcs) > 1: tcs[1]["sample"] = True
    return {"title":title,"desc":desc,"inFmt":inFmt,"outFmt":outFmt,"constraints":constraints,
            "diff":diff,"tags":tags,"sIn":sIn,"sOut":sOut,"explain":explain,"tl":tl,"tc":tcs}

existing_titles = set()
with open("existing_titles.txt", encoding="utf-8") as f:
    for line in f: existing_titles.add(line.strip())

problems = []

# === KEY MISSING STRIVER PROBLEMS ===

# 1. Longest Substring with K Distinct Characters
tcs = []
def longest_k_distinct(s, k):
    best, l, freq = 0, 0, {}
    for r in range(len(s)):
        freq[s[r]] = freq.get(s[r], 0) + 1
        while len(freq) > k:
            freq[s[l]] -= 1
            if freq[s[l]] == 0: del freq[s[l]]
            l += 1
        best = max(best, r - l + 1)
    return best
for _ in range(50):
    n = random.randint(1, 20)
    k = random.randint(1, 5)
    s = ''.join(random.choice('abcde') for _ in range(n))
    tcs.append(tc(f"{s}\n{k}", longest_k_distinct(s, k)))
problems.append(gen("Longest Substring with K Distinct Characters",
    "Find the length of the longest substring with at most K distinct characters.",
    "First line: string\nSecond line: K","Length of longest substring",
    "1 <= |S| <= 10^5\n1 <= K <= 26","MEDIUM",["String","Sliding Window"],
    tcs[0]["in"],tcs[0]["out"],"Sliding window with frequency map.",2,tcs))

# 2. Subarray with Given Sum (positives only)
tcs = []
def subarray_sum_positive(arr, s):
    cur, l = 0, 0
    for r in range(len(arr)):
        cur += arr[r]
        while cur > s and l <= r:
            cur -= arr[l]; l += 1
        if cur == s: return f"{l+1} {r+1}"
    return "-1"
for _ in range(50):
    n = random.randint(1, 20)
    arr = [random.randint(1, 20) for _ in range(n)]
    s = random.randint(1, sum(arr))
    tcs.append(tc(f"{n} {s}\n{' '.join(map(str,arr))}", subarray_sum_positive(arr, s)))
problems.append(gen("Subarray with Given Sum",
    "Find a contiguous subarray with given sum S (all elements positive). Print 1-based start and end indices. Print -1 if not found.",
    "First line: N S\nSecond line: N positive integers","start end (1-based) or -1",
    "1 <= N <= 10^5","EASY",["Array","Sliding Window"],
    tcs[0]["in"],tcs[0]["out"],"Sliding window: expand right, shrink left if sum exceeds.",1,tcs))

# 3. Smallest Window Containing All Characters
tcs = []
def smallest_window(s, p):
    from collections import Counter
    need = Counter(p)
    have, required = 0, len(need)
    l, best, best_range = 0, float('inf'), (-1,-1)
    window = {}
    for r in range(len(s)):
        c = s[r]
        window[c] = window.get(c, 0) + 1
        if c in need and window[c] == need[c]: have += 1
        while have == required:
            if r-l+1 < best: best = r-l+1; best_range = (l,r)
            lc = s[l]
            window[lc] -= 1
            if lc in need and window[lc] < need[lc]: have -= 1
            l += 1
    return best if best != float('inf') else -1
for _ in range(50):
    n = random.randint(3, 15)
    s = ''.join(random.choice('abcde') for _ in range(n))
    m = random.randint(1, min(4, n))
    p = ''.join(random.choice('abcde') for _ in range(m))
    tcs.append(tc(f"{s}\n{p}", smallest_window(s, p)))
problems.append(gen("Smallest Window Containing All Characters",
    "Find the length of the smallest window in S that contains all characters of P. Return -1 if not possible.",
    "First line: string S\nSecond line: string P","Length of smallest window or -1",
    "1 <= |S|, |P| <= 10^5","HARD",["String","Sliding Window"],
    tcs[0]["in"],tcs[0]["out"],"Sliding window with character frequency tracking.",2,tcs))

# 4. Count Subarrays with Sum K
tcs = []
def count_subarrays_sum(arr, k):
    prefix_count = {0: 1}
    cur, count = 0, 0
    for x in arr:
        cur += x
        count += prefix_count.get(cur - k, 0)
        prefix_count[cur] = prefix_count.get(cur, 0) + 1
    return count
for _ in range(50):
    n = random.randint(1, 15)
    arr = [random.randint(-5, 5) for _ in range(n)]
    k = random.randint(-5, 5)
    tcs.append(tc(f"{n} {k}\n{' '.join(map(str,arr))}", count_subarrays_sum(arr, k)))
problems.append(gen("Count Subarrays with Sum K",
    "Count the number of contiguous subarrays that sum to K.",
    "First line: N K\nSecond line: N integers","Count of subarrays",
    "1 <= N <= 10^5","MEDIUM",["Array","Hash Map","Prefix Sum"],
    tcs[0]["in"],tcs[0]["out"],"Prefix sum + hashmap: count prefix[j]-prefix[i]=K.",2,tcs))

# 5. Longest Subarray with Sum 0
tcs = []
def longest_zero_sum(arr):
    prefix = {}; cur = 0; best = 0
    for i in range(len(arr)):
        cur += arr[i]
        if cur == 0: best = i + 1
        elif cur in prefix: best = max(best, i - prefix[cur])
        else: prefix[cur] = i
    return best
for _ in range(50):
    n = random.randint(1, 20)
    arr = [random.randint(-5, 5) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", longest_zero_sum(arr)))
problems.append(gen("Longest Subarray with Sum Zero",
    "Find the length of the longest subarray with sum 0.",
    "First line: N\nSecond line: N integers","Length (0 if none)",
    "1 <= N <= 10^5","MEDIUM",["Array","Hash Map"],
    tcs[0]["in"],tcs[0]["out"],"Track prefix sums in hashmap. Same prefix sum means zero-sum subarray between.",2,tcs))

# 6. Pow(x,n) with negatives
tcs = []
def my_pow(x, n):
    if n < 0: return round(1.0 / pow(x, -n), 5)
    return pow(x, n)
for _ in range(50):
    x = random.randint(-5, 5)
    n = random.randint(-10, 10)
    if x == 0 and n < 0: n = abs(n)
    r = my_pow(x, n)
    if isinstance(r, float): tcs.append(tc(f"{x} {n}", f"{r:.5f}"))
    else: tcs.append(tc(f"{x} {n}", r))
problems.append(gen("Power Function (x^n)",
    "Compute x raised to n, where n can be negative. For negative n, return 1/x^|n| with 5 decimal places.",
    "Two integers x n","x^n (integer or 5 decimals if negative n)",
    "-100 <= x <= 100\n-30 <= n <= 30","MEDIUM",["Math","Recursion"],
    "2 -3","0.12500","2^-3 = 1/8 = 0.125.",2,tcs))

# 7. Sort Array by Parity
tcs = []
def sort_parity(arr):
    evens = [x for x in arr if x%2==0]
    odds = [x for x in arr if x%2!=0]
    return evens + odds
for _ in range(50):
    n = random.randint(1, 20)
    arr = [random.randint(0, 50) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", ' '.join(map(str, sort_parity(arr)))))
problems.append(gen("Sort Array by Parity (Custom)",
    "Rearrange array so all even numbers come before odd numbers. Maintain relative order within evens and odds.",
    "First line: N\nSecond line: N integers","Evens first then odds",
    "1 <= N <= 10^5","EASY",["Array","Two Pointers"],
    tcs[0]["in"],tcs[0]["out"],"Separate into evens/odds lists, concatenate.",1,tcs))

# 8. Maximum Sum Circular Subarray
tcs = []
def max_circular(arr):
    def kadane_max(a):
        mx = cur = a[0]
        for x in a[1:]: cur = max(x, cur+x); mx = max(mx, cur)
        return mx
    def kadane_min(a):
        mn = cur = a[0]
        for x in a[1:]: cur = min(x, cur+x); mn = min(mn, cur)
        return mn
    max_normal = kadane_max(arr)
    total = sum(arr)
    min_sub = kadane_min(arr)
    if total == min_sub: return max_normal
    return max(max_normal, total - min_sub)
for _ in range(50):
    n = random.randint(1, 15)
    arr = [random.randint(-20, 20) for _ in range(n)]
    tcs.append(tc(f"{n}\n{' '.join(map(str,arr))}", max_circular(arr)))
problems.append(gen("Maximum Sum Circular Subarray",
    "Find the maximum subarray sum, considering the array as circular (last connects to first).",
    "First line: N\nSecond line: N integers","Maximum circular subarray sum",
    "1 <= N <= 10^5","HARD",["Array","DP"],
    tcs[0]["in"],tcs[0]["out"],"max(normal_kadane, total - min_kadane). Handle all-negative edge case.",2,tcs))

# 9. Number of Subsequences with Given Sum
tcs = []
def count_subseq_sum(arr, target):
    count = 0
    n = len(arr)
    for mask in range(1, 1<<n):
        s = sum(arr[i] for i in range(n) if mask & (1<<i))
        if s == target: count += 1
    return count
for _ in range(50):
    n = random.randint(1, 12)
    arr = [random.randint(1, 10) for _ in range(n)]
    target = random.randint(1, 15)
    tcs.append(tc(f"{n} {target}\n{' '.join(map(str,arr))}", count_subseq_sum(arr, target)))
problems.append(gen("Count Subsequences with Given Sum",
    "Count the number of subsequences of array that sum to target.",
    "First line: N target\nSecond line: N positive integers","Count of subsequences",
    "1 <= N <= 20","MEDIUM",["Recursion","Backtracking"],
    tcs[0]["in"],tcs[0]["out"],"Use recursion/backtracking: include or exclude each element.",2,tcs))

# 10. Reverse String Word by Word
tcs = []
for _ in range(50):
    n = random.randint(1, 6)
    words = [''.join(random.choice('abcdefgh') for _ in range(random.randint(2,6))) for _ in range(n)]
    s = ' '.join(words)
    tcs.append(tc(s, ' '.join(words[::-1])))
problems.append(gen("Reverse String Word by Word",
    "Given a string, reverse the order of words.",
    "A string of words separated by spaces","Words in reversed order",
    "1 <= |S| <= 10^4","EASY",["String","Basic"],
    tcs[0]["in"],tcs[0]["out"],"Split, reverse array, join.",1,tcs))

# 11. Implement atoi (String to Integer)
tcs = []
def my_atoi(s):
    s = s.strip()
    if not s: return 0
    sign = 1; i = 0
    if s[0] == '-': sign = -1; i = 1
    elif s[0] == '+': i = 1
    result = 0
    while i < len(s) and s[i].isdigit():
        result = result * 10 + int(s[i]); i += 1
    result *= sign
    return max(-2**31, min(2**31-1, result))
test_strs = ["42","-42","   -42","4193 with words","words 987","","+1","+-12",
    "0","00123","-0","2147483647","-2147483648","999999999999","  +0 123",
    "123abc","  456","789 ","  -123abc","0000"]
for _ in range(30):
    test_strs.append(str(random.randint(-10000, 10000)))
for s in test_strs[:50]:
    tcs.append(tc(s if s else "0", my_atoi(s if s else "0")))
problems.append(gen("Implement atoi",
    "Convert a string to integer. Handle signs, leading spaces, trailing non-digits. Clamp to 32-bit range.",
    "A string","The integer value (clamped to [-2^31, 2^31-1])",
    "String input","MEDIUM",["String","Math"],
    "42","42","Parse digits, handle sign and overflow.",2,tcs))

# 12. Majority Element (Moore's Voting)
tcs = []
def majority(arr):
    c, count = arr[0], 1
    for x in arr[1:]:
        if count == 0: c = x; count = 1
        elif x == c: count += 1
        else: count -= 1
    ct = arr.count(c)
    return c if ct > len(arr)//2 else -1
for _ in range(50):
    n = random.randint(1, 20)
    if random.random() < 0.6:
        m = random.randint(1, 10)
        arr = [m] * (n//2 + 1) + [random.randint(1, 10) for _ in range(n - n//2 - 1)]
        random.shuffle(arr)
    else:
        arr = [random.randint(1, 5) for _ in range(n)]
    tcs.append(tc(f"{len(arr)}\n{' '.join(map(str,arr))}", majority(arr)))
problems.append(gen("Majority Element (Moore Voting)",
    "Find element appearing more than N/2 times using Moore's Voting Algorithm. Print -1 if no majority.",
    "First line: N\nSecond line: N integers","Majority element or -1",
    "1 <= N <= 10^5","EASY",["Array","Hash Map"],
    tcs[0]["in"],tcs[0]["out"],"Boyer-Moore: candidate tracking with count.",1,tcs))

# 13. Aggressive Cows / Magnetic Balls
tcs = []
def aggressive_cows(pos, c):
    pos.sort()
    lo, hi, ans = 1, pos[-1]-pos[0], 0
    while lo <= hi:
        mid = (lo+hi)//2
        placed, last = 1, pos[0]
        for i in range(1, len(pos)):
            if pos[i] - last >= mid: placed += 1; last = pos[i]
        if placed >= c: ans = mid; lo = mid+1
        else: hi = mid-1
    return ans
for _ in range(50):
    n = random.randint(3, 15)
    pos = sorted(set(random.randint(1, 100) for _ in range(n)))
    if len(pos) < 3: pos = [1, 5, 10]
    c = random.randint(2, min(len(pos), 5))
    tcs.append(tc(f"{len(pos)} {c}\n{' '.join(map(str,pos))}", aggressive_cows(pos, c)))
problems.append(gen("Aggressive Cows (Binary Search)",
    "Place C cows in N stalls to maximize the minimum distance between any two cows.",
    "First line: N C\nSecond line: N stall positions","Maximum minimum distance",
    "2 <= C <= N <= 10^5","HARD",["Binary Search","Greedy"],
    tcs[0]["in"],tcs[0]["out"],"Binary search on answer. Check if C cows can be placed with min distance mid.",2,tcs))

# 14. Rat in a Maze (count paths)
tcs = []
def count_maze_paths(grid):
    n = len(grid)
    if grid[0][0] == 0 or grid[n-1][n-1] == 0: return 0
    dp = [[0]*n for _ in range(n)]
    dp[0][0] = 1
    for i in range(n):
        for j in range(n):
            if grid[i][j] == 0: dp[i][j] = 0; continue
            if i > 0: dp[i][j] += dp[i-1][j]
            if j > 0: dp[i][j] += dp[i][j-1]
    return dp[n-1][n-1]
for _ in range(50):
    n = random.randint(1, 6)
    grid = [[1 if random.random() < 0.7 else 0 for _ in range(n)] for _ in range(n)]
    grid[0][0] = 1; grid[n-1][n-1] = 1
    inp = f"{n}\n" + '\n'.join(' '.join(map(str, row)) for row in grid)
    tcs.append(tc(inp, count_maze_paths(grid)))
problems.append(gen("Rat in a Maze (Count Paths)",
    "Count paths from top-left to bottom-right in an NxN grid. 1=open, 0=blocked. Can move right or down only.",
    "First line: N\nNext N lines: N integers (0 or 1)","Number of paths",
    "1 <= N <= 20","MEDIUM",["DP","Matrix","Backtracking"],
    tcs[0]["in"],tcs[0]["out"],"dp[i][j] = dp[i-1][j]+dp[i][j-1] if cell is open.",2,tcs))

# 15. Detect Loop Length
tcs = []
# Simulated: given array where arr[i] = next index, find cycle length
def cycle_length_arr(arr, start):
    slow = fast = start
    while True:
        slow = arr[slow]
        fast = arr[arr[fast]]
        if slow == fast: break
    count = 1
    fast = arr[slow]
    while fast != slow: fast = arr[fast]; count += 1
    return count
# Actually let's do simpler: given positions on number line, find GCD-based cycle
# Simpler problem: Count digits that repeat
def count_repeating_digits(n):
    d = str(n)
    c = Counter(d)
    return sum(1 for v in c.values() if v > 1)
for _ in range(50):
    n = random.randint(10, 999999)
    tcs.append(tc(n, count_repeating_digits(n)))
problems.append(gen("Count Repeating Digits",
    "Given a number, count how many distinct digits appear more than once.",
    "A positive integer N","Count of digits that repeat",
    "10 <= N <= 10^9","EASY",["Math","Hash Map"],
    tcs[0]["in"],tcs[0]["out"],"Count frequency of each digit, count those with freq > 1.",1,tcs))

# 16. Matrix Rotation by 90 Degrees
tcs = []
def rotate_90(mat):
    n = len(mat)
    return [[mat[n-1-j][i] for j in range(n)] for i in range(n)]
for _ in range(50):
    n = random.randint(1, 6)
    mat = [[random.randint(-10, 10) for _ in range(n)] for _ in range(n)]
    inp = f"{n}\n" + '\n'.join(' '.join(map(str, row)) for row in mat)
    rotated = rotate_90(mat)
    out = '\n'.join(' '.join(map(str, row)) for row in rotated)
    tcs.append(tc(inp, out))
problems.append(gen("Rotate Matrix 90 Degrees Clockwise",
    "Rotate an NxN matrix 90 degrees clockwise.",
    "First line: N\nNext N lines: N integers each","Rotated matrix",
    "1 <= N <= 100","MEDIUM",["Matrix","Array"],
    tcs[0]["in"],tcs[0]["out"],"Transpose then reverse each row, or direct mapping.",2,tcs))

# 17. Search in 2D Matrix
tcs = []
def search_2d(mat, target):
    m, n = len(mat), len(mat[0])
    lo, hi = 0, m*n-1
    while lo <= hi:
        mid = (lo+hi)//2
        val = mat[mid//n][mid%n]
        if val == target: return "true"
        elif val < target: lo = mid+1
        else: hi = mid-1
    return "false"
for _ in range(50):
    m, n = random.randint(1, 5), random.randint(1, 5)
    vals = sorted(random.sample(range(1, 100), min(m*n, 50)))
    mat = [vals[i*n:(i+1)*n] for i in range(m)]
    if len(mat[-1]) < n: mat[-1].extend([vals[-1]+1]*(n-len(mat[-1])))
    target = random.choice(vals) if random.random() < 0.6 else random.randint(1, 100)
    inp = f"{m} {n} {target}\n" + '\n'.join(' '.join(map(str, row)) for row in mat)
    tcs.append(tc(inp, search_2d(mat, target)))
problems.append(gen("Search in 2D Sorted Matrix",
    "Search for target in a row-wise and column-wise sorted matrix. Each row is sorted and first element of each row > last of previous.",
    "First line: M N target\nNext M lines: N integers","true or false",
    "1 <= M,N <= 100","MEDIUM",["Binary Search","Matrix"],
    tcs[0]["in"],tcs[0]["out"],"Treat as 1D sorted array, binary search on virtual index.",2,tcs))

# 18-25: More Striver essentials

# 18. Valid Anagram
tcs = []
for _ in range(50):
    n = random.randint(1, 15)
    s1 = ''.join(random.choice('abcde') for _ in range(n))
    if random.random() < 0.5:
        s2 = list(s1); random.shuffle(s2); s2 = ''.join(s2)
    else:
        s2 = ''.join(random.choice('abcde') for _ in range(n))
    tcs.append(tc(f"{s1}\n{s2}", "true" if sorted(s1)==sorted(s2) else "false"))
problems.append(gen("Valid Anagram Check",
    "Check if two strings are anagrams (same characters, different order).",
    "First line: string s1\nSecond line: string s2","true or false",
    "1 <= |s| <= 10^5","EASY",["String","Hash Map"],
    tcs[0]["in"],tcs[0]["out"],"Sort both and compare, or use frequency count.",1,tcs))

# 19. Maximum Points on a Line (simplified - collinear check)
tcs = []
def max_points(points):
    if len(points) <= 2: return len(points)
    best = 2
    for i in range(len(points)):
        slopes = {}
        for j in range(i+1, len(points)):
            dx = points[j][0]-points[i][0]
            dy = points[j][1]-points[i][1]
            g = math.gcd(abs(dx), abs(dy)) if (dx or dy) else 1
            key = (dx//g, dy//g) if g else (0,0)
            slopes[key] = slopes.get(key, 1) + 1
            best = max(best, slopes[key])
    return best
for _ in range(50):
    n = random.randint(1, 8)
    points = [(random.randint(-10,10), random.randint(-10,10)) for _ in range(n)]
    inp = f"{n}\n" + '\n'.join(f"{x} {y}" for x,y in points)
    tcs.append(tc(inp, max_points(points)))
problems.append(gen("Maximum Points on a Line",
    "Given N points on a 2D plane, find the maximum number of points that lie on the same straight line.",
    "First line: N\nNext N lines: x y coordinates","Maximum collinear points",
    "1 <= N <= 300","HARD",["Math","Hash Map"],
    tcs[0]["in"],tcs[0]["out"],"For each point, compute slopes to all others. Track max same slope.",2,tcs))

# 20. Two Sum (Sorted Array variant)
tcs = []
for _ in range(50):
    n = random.randint(2, 20)
    arr = sorted(set(random.randint(-50, 50) for _ in range(n)))
    if len(arr) < 2: arr = [1, 2]
    if random.random() < 0.7:
        i, j = sorted(random.sample(range(len(arr)), 2))
        target = arr[i] + arr[j]
        out = f"{i+1} {j+1}"
    else:
        target = random.randint(-100, 100)
        found = False
        for i in range(len(arr)):
            for j in range(i+1, len(arr)):
                if arr[i]+arr[j]==target: out=f"{i+1} {j+1}"; found=True; break
            if found: break
        if not found: out = "-1"
    tcs.append(tc(f"{len(arr)} {target}\n{' '.join(map(str,arr))}", out))
problems.append(gen("Two Sum in Sorted Array",
    "Given a sorted array and target, find two numbers that add to target. Print 1-based indices. Print -1 if not found.",
    "First line: N target\nSecond line: N sorted integers","Two 1-based indices or -1",
    "2 <= N <= 10^5","EASY",["Array","Two Pointers"],
    tcs[0]["in"],tcs[0]["out"],"Two pointers from both ends.",1,tcs))

# 21. Longest Palindrome Length
tcs = []
def longest_palindrome_len(s):
    c = Counter(s)
    length = 0; odd_found = False
    for v in c.values():
        length += v // 2 * 2
        if v % 2 == 1: odd_found = True
    return length + (1 if odd_found else 0)
for _ in range(50):
    n = random.randint(1, 20)
    s = ''.join(random.choice('abcdefgh') for _ in range(n))
    tcs.append(tc(s, longest_palindrome_len(s)))
problems.append(gen("Longest Palindrome from Characters",
    "Given a string, find the length of the longest palindrome that can be built from its characters.",
    "A string","Length of longest palindrome possible",
    "1 <= |S| <= 10^5","EASY",["String","Hash Map"],
    tcs[0]["in"],tcs[0]["out"],"Count chars: use all pairs + 1 odd center.",1,tcs))

# 22. Spiral Order Traversal
tcs = []
def spiral(mat):
    if not mat: return []
    res = []; top,bot,left,right = 0,len(mat)-1,0,len(mat[0])-1
    while top<=bot and left<=right:
        for i in range(left,right+1): res.append(mat[top][i])
        top+=1
        for i in range(top,bot+1): res.append(mat[i][right])
        right-=1
        if top<=bot:
            for i in range(right,left-1,-1): res.append(mat[bot][i])
            bot-=1
        if left<=right:
            for i in range(bot,top-1,-1): res.append(mat[i][left])
            left+=1
    return res
for _ in range(50):
    m,n = random.randint(1,5), random.randint(1,5)
    mat = [[random.randint(1,99) for _ in range(n)] for _ in range(m)]
    inp = f"{m} {n}\n"+'\n'.join(' '.join(map(str,row)) for row in mat)
    tcs.append(tc(inp, ' '.join(map(str, spiral(mat)))))
problems.append(gen("Spiral Matrix Traversal",
    "Print matrix elements in spiral order (clockwise from top-left).",
    "First line: M N\nNext M lines: N integers","Spiral order space-separated",
    "1 <= M,N <= 100","MEDIUM",["Matrix","Array"],
    tcs[0]["in"],tcs[0]["out"],"Track four boundaries: top/bottom/left/right. Spiral inward.",2,tcs))

# 23. Minimum Deletions to Make String Palindrome
tcs = []
def min_del_palindrome(s):
    n = len(s)
    rev = s[::-1]
    dp = [[0]*(n+1) for _ in range(n+1)]
    for i in range(1, n+1):
        for j in range(1, n+1):
            if s[i-1]==rev[j-1]: dp[i][j]=dp[i-1][j-1]+1
            else: dp[i][j]=max(dp[i-1][j],dp[i][j-1])
    return n - dp[n][n]
for _ in range(50):
    n = random.randint(1, 12)
    s = ''.join(random.choice('abcde') for _ in range(n))
    tcs.append(tc(s, min_del_palindrome(s)))
problems.append(gen("Minimum Deletions to Make Palindrome",
    "Find minimum characters to delete from a string to make it a palindrome.",
    "A string","Minimum deletions",
    "1 <= |S| <= 1000","MEDIUM",["DP","String"],
    tcs[0]["in"],tcs[0]["out"],"n - LCS(s, reverse(s)) = min deletions.",2,tcs))

# 24. Print Matrix in Snake Pattern
tcs = []
def snake(mat):
    res = []
    for i in range(len(mat)):
        if i%2==0: res.extend(mat[i])
        else: res.extend(mat[i][::-1])
    return res
for _ in range(50):
    m,n = random.randint(1,5), random.randint(1,5)
    mat = [[random.randint(1,50) for _ in range(n)] for _ in range(m)]
    inp = f"{m} {n}\n"+'\n'.join(' '.join(map(str,row)) for row in mat)
    tcs.append(tc(inp, ' '.join(map(str, snake(mat)))))
problems.append(gen("Snake Pattern Matrix",
    "Print matrix in snake pattern: left-to-right for even rows, right-to-left for odd rows.",
    "First line: M N\nNext M lines: N integers","Snake pattern space-separated",
    "1 <= M,N <= 100","EASY",["Matrix","Array"],
    tcs[0]["in"],tcs[0]["out"],"Alternate row direction based on row index parity.",1,tcs))

# 25. Median of Two Sorted Arrays
tcs = []
def median_two(a, b):
    merged = sorted(a+b)
    n = len(merged)
    if n%2==1: return f"{merged[n//2]:.1f}"
    return f"{(merged[n//2-1]+merged[n//2])/2:.1f}"
for _ in range(50):
    n1 = random.randint(1, 10)
    n2 = random.randint(1, 10)
    a = sorted([random.randint(1, 50) for _ in range(n1)])
    b = sorted([random.randint(1, 50) for _ in range(n2)])
    tcs.append(tc(f"{n1} {n2}\n{' '.join(map(str,a))}\n{' '.join(map(str,b))}", median_two(a, b)))
problems.append(gen("Median of Two Sorted Arrays (Simple)",
    "Find the median of two sorted arrays. Print with 1 decimal place.",
    "First line: N1 N2\nSecond line: N1 sorted ints\nThird line: N2 sorted ints","Median (1 decimal)",
    "1 <= N1,N2 <= 10^5","HARD",["Binary Search","Array"],
    tcs[0]["in"],tcs[0]["out"],"Merge conceptually, find middle element(s).",2,tcs))

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

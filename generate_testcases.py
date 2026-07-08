import json
import random
import math
from itertools import combinations

random.seed(42)

def gen(title, desc, inFmt, outFmt, constraints, diff, tags, sIn, sOut, explain, tl, test_cases):
    samples = test_cases[:2]
    for s in samples:
        s["sample"] = True
    return {
        "title": title, "desc": desc, "inFmt": inFmt, "outFmt": outFmt,
        "constraints": constraints, "diff": diff, "tags": tags,
        "sIn": sIn, "sOut": sOut, "explain": explain, "tl": tl, "tc": test_cases
    }

def tc(inp, out, sample=False):
    r = {"in": str(inp), "out": str(out)}
    if sample: r["sample"] = True
    return r

problems = []

# ==================== 1. Reverse a Number ====================
tcs = []
def reverse_num(n):
    sign = -1 if n < 0 else 1
    r = int(str(abs(n))[::-1])
    return sign * r

for n in [1234, -567, 0, 100, 9, -1, 120, 999999, -100200, 10, 5, -5, 12321, -99, 1000, 7, 11, -11, 500, 1001,
          98765, -43210, 111, -222, 333, 10000, 90000, -80000, 7654321, 1000000,
          -999, 42, -42, 7007, 123456, -654321, 88, -88, 12340, 50000,
          1, 2, -2, 3, -3, 99999, 10001, -10001, 505050, -999999]:
    tcs.append(tc(n, reverse_num(n)))
problems.append(gen("Reverse a Number",
    "Given an integer N, reverse its digits and print the result. If the number is negative, the reversed number should also be negative.\n\nExample: 1234 reversed is 4321, -567 reversed is -765.",
    "A single integer N", "The reversed integer", "-10^6 <= N <= 10^6",
    "EASY", ["Math", "Basic"], "1234", "4321",
    "Reverse digits: 1234 → 4321. Use modulo and division.", 1, tcs))

# ==================== 2. Count Digits ====================
tcs = []
for n in [12345, 7, 100, 99999, 1000000000, 10, 1, 999, 50000, 42,
          5, 55, 555, 5555, 55555, 100000, 9, 99, 9999, 99999,
          123, 456, 789, 1234, 56789, 111111, 222222, 3, 33, 333,
          3333, 33333, 333333, 10000000, 100000000, 23456789, 87654321, 11111, 22222, 44444,
          2, 20, 200, 2000, 20000, 200000, 2000000, 20000000, 200000000, 999999999]:
    tcs.append(tc(n, len(str(n))))
problems.append(gen("Count Digits",
    "Given a positive integer N, count the number of digits in it.\n\nExample: 12345 has 5 digits, 7 has 1 digit.",
    "A single positive integer N", "Number of digits in N", "1 <= N <= 10^9",
    "EASY", ["Math", "Basic"], "12345", "5",
    "12345 has digits 1,2,3,4,5 = 5 digits total.", 1, tcs))

# ==================== 3. Check Armstrong Number ====================
tcs = []
def is_armstrong(n):
    digits = str(n)
    d = len(digits)
    return sum(int(x)**d for x in digits) == n

armstrong_true = [1, 2, 3, 4, 5, 6, 7, 8, 9, 153, 370, 371, 407, 1634, 8208, 9474]
test_vals = list(set(armstrong_true + [10, 100, 123, 200, 999, 152, 154, 369, 372, 406, 408,
    1000, 1633, 1635, 8207, 8209, 9473, 9475, 500, 250, 111, 222, 333, 444, 555, 666, 777, 888,
    11, 22, 50, 99, 0, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105, 205, 305, 505, 605, 705]))
for n in sorted(test_vals)[:50]:
    if n <= 0: continue
    tcs.append(tc(n, "true" if is_armstrong(n) else "false"))
problems.append(gen("Check Armstrong Number",
    "Given a positive integer N, check if it is an Armstrong number. An Armstrong number of d digits is a number where the sum of each digit raised to the power d equals the number itself.\n\nPrint 'true' if Armstrong, 'false' otherwise.\n\nExample: 153 = 1^3 + 5^3 + 3^3 = 153 (Armstrong)",
    "A single positive integer N", "true or false", "1 <= N <= 10^6",
    "EASY", ["Math", "Basic"], "153", "true",
    "153 has 3 digits. 1^3 + 5^3 + 3^3 = 1 + 125 + 27 = 153. It equals itself, so Armstrong.", 1, tcs[:50]))

# ==================== 4. Print All Divisors ====================
tcs = []
def divisors(n):
    d = sorted([i for i in range(1, n+1) if n % i == 0])
    return " ".join(map(str, d))

for n in [12, 7, 1, 16, 36, 100, 2, 25, 49, 60, 13, 17, 24, 30, 48, 64, 72, 80, 90, 120,
          15, 18, 20, 28, 32, 40, 42, 50, 56, 63, 70, 75, 81, 84, 96, 99, 10, 11, 14, 21,
          23, 27, 33, 35, 37, 39, 44, 45, 55, 66]:
    tcs.append(tc(n, divisors(n)))
problems.append(gen("Print All Divisors",
    "Given a positive integer N, print all divisors of N in ascending order, space-separated.",
    "A single positive integer N", "All divisors of N in ascending order, space-separated", "1 <= N <= 10^5",
    "EASY", ["Math", "Basic"], "12", "1 2 3 4 6 12",
    "12 is divisible by 1, 2, 3, 4, 6, 12.", 1, tcs))

# ==================== 5. Check Prime Number ====================
tcs = []
def is_prime(n):
    if n < 2: return False
    if n < 4: return True
    if n % 2 == 0 or n % 3 == 0: return False
    i = 5
    while i*i <= n:
        if n % i == 0 or n % (i+2) == 0: return False
        i += 6
    return True

for n in [7, 4, 1, 2, 3, 97, 100, 999983, 15, 23, 5, 6, 8, 9, 10, 11, 13, 14, 16, 17,
          19, 20, 25, 29, 31, 37, 41, 43, 47, 49, 51, 53, 59, 61, 67, 71, 73, 79, 83, 89,
          91, 101, 103, 107, 109, 113, 127, 131, 137, 139]:
    tcs.append(tc(n, "true" if is_prime(n) else "false"))
problems.append(gen("Check Prime Number",
    "Given a positive integer N, determine if it is a prime number.\n\nPrint 'true' if N is prime, 'false' otherwise.",
    "A single positive integer N", "true or false", "1 <= N <= 10^6",
    "EASY", ["Math", "Basic"], "7", "true",
    "7 has no divisors other than 1 and 7, so it's prime.", 1, tcs))

# ==================== 6. Factorial ====================
tcs = []
for n in range(21):
    tcs.append(tc(n, math.factorial(n)))
for n in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
          0, 1, 5, 10, 15, 20]:
    pass  # already covered
# pad to 50
extra_facts = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,0,1,2,3,4,5,6,7,8,9]
for n in extra_facts[:29]:
    tcs.append(tc(n, math.factorial(n)))
problems.append(gen("Factorial of a Number",
    "Given a non-negative integer N, compute N! (N factorial).\n\n0! = 1, N! = 1 * 2 * 3 * ... * N",
    "A single non-negative integer N", "N factorial", "0 <= N <= 20",
    "EASY", ["Math", "Recursion"], "5", "120",
    "5! = 5 * 4 * 3 * 2 * 1 = 120", 1, tcs[:50]))

# ==================== 7. Sum of First N Natural Numbers ====================
tcs = []
for n in [5, 10, 1, 100, 1000, 3, 50, 999, 2, 1000000, 7, 15, 20, 25, 30, 35, 40, 45, 55, 60,
          65, 70, 75, 80, 85, 90, 95, 200, 300, 400, 500, 600, 700, 800, 900, 150, 250, 350, 450, 550,
          4, 6, 8, 9, 11, 12, 13, 14, 16, 17]:
    tcs.append(tc(n, n*(n+1)//2))
problems.append(gen("Sum of First N Natural Numbers",
    "Given a positive integer N, compute the sum 1 + 2 + 3 + ... + N.",
    "A single positive integer N", "Sum of first N natural numbers", "1 <= N <= 10^6",
    "EASY", ["Math", "Basic"], "5", "15",
    "1 + 2 + 3 + 4 + 5 = 15. Formula: N*(N+1)/2", 1, tcs))

# ==================== 8. Check Palindrome String ====================
tcs = []
def is_palindrome_str(s): return s == s[::-1]
strings = ["madam", "hello", "a", "ab", "aba", "racecar", "abcba", "abcda", "aabbaa", "abcd",
           "level", "noon", "civic", "rotor", "kayak", "refer", "deed", "radar", "repaper", "reviver",
           "abc", "xyz", "aaa", "bb", "cc", "abba", "abab", "aaaa", "bbb", "ccc",
           "abcdef", "fedcba", "xyzzyx", "xyzzy", "programming", "java", "python", "cpp",
           "anna", "hannah", "abcdefedcba", "abcddcba", "test", "tset", "pop", "poop", "deed", "peep", "noon", "maam"]
for s in strings[:50]:
    tcs.append(tc(s, "true" if is_palindrome_str(s) else "false"))
problems.append(gen("Check Palindrome String",
    "Given a string S, check if it is a palindrome (reads the same forwards and backwards). Consider only lowercase letters.\n\nPrint 'true' if palindrome, 'false' otherwise.",
    "A single string S (lowercase letters only)", "true or false", "1 <= |S| <= 10^5",
    "EASY", ["String", "Two Pointers"], "madam", "true",
    "madam reads the same forwards and backwards.", 1, tcs))

# ==================== 9-13. Sorting algorithms (all produce sorted output) ====================
def make_sort_tcs():
    tcs = []
    test_arrays = [
        [64, 25, 12, 22, 11], [3, 1, 2], [5], [4, 3, 2, 1], [-3, 5, -1, 0, 2, -7],
        [1, 2, 3, 4, 5], [0, 0, 0], [100, -100, 50, -50, 0, 25, -25], [1, 1, 1, 1], [9, 8, 7, 6, 5, 4, 3, 2],
    ]
    # Generate more random arrays
    for _ in range(40):
        n = random.randint(1, 30)
        arr = [random.randint(-100, 100) for _ in range(n)]
        test_arrays.append(arr)
    for arr in test_arrays[:50]:
        inp = f"{len(arr)}\n{' '.join(map(str, arr))}"
        out = ' '.join(map(str, sorted(arr)))
        tcs.append(tc(inp, out))
    return tcs

for title, desc_extra, diff_val in [
    ("Selection Sort", "Selection Sort works by repeatedly finding the minimum element and placing it at the beginning.", "EASY"),
    ("Bubble Sort", "Bubble Sort repeatedly swaps adjacent elements if they are in the wrong order.", "EASY"),
    ("Insertion Sort", "Insertion Sort builds the sorted array one item at a time by inserting each element in its correct position.", "EASY"),
    ("Merge Sort", "Merge Sort is a divide-and-conquer algorithm with O(N log N) time complexity.", "MEDIUM"),
    ("Quick Sort", "Quick Sort picks a pivot, partitions the array, and recursively sorts. Average O(N log N).", "MEDIUM"),
]:
    tcs = make_sort_tcs()
    problems.append(gen(title,
        f"Given an array of N integers, sort them using {title} and print the sorted array.\n\n{desc_extra}",
        "First line: N\nSecond line: N space-separated integers",
        "N space-separated integers in sorted order",
        "1 <= N <= 100\n-1000 <= arr[i] <= 1000" if diff_val == "EASY" else "1 <= N <= 10000\n-10^5 <= arr[i] <= 10^5",
        diff_val, ["Sorting", "Array"] if diff_val == "EASY" else ["Sorting", "Divide and Conquer"],
        f"{len(tcs[0]['in'].split(chr(10))[1].split())}\\n{tcs[0]['in'].split(chr(10))[1]}" if chr(10) in tcs[0]['in'] else tcs[0]['in'],
        tcs[0]['out'],
        f"Sort the array using {title}.", 1 if diff_val == "EASY" else 2, tcs))

# ==================== 14. Second Largest Element ====================
tcs = []
def second_largest(arr):
    mx = max(arr)
    filtered = [x for x in arr if x != mx]
    return max(filtered) if filtered else -1

test_arrays = [[1,2,4,7,7], [5,5,5], [1,2], [10,10,9,8], [-1,-2,-3,-4,-5,-6], [1,1,2], [100,99,98,97,96],
    [-5,-5], [0,0,0,1], [3,1,4,1,5,9,2]]
for _ in range(40):
    n = random.randint(2, 20)
    arr = [random.randint(-50, 50) for _ in range(n)]
    test_arrays.append(arr)
for arr in test_arrays[:50]:
    inp = f"{len(arr)}\n{' '.join(map(str, arr))}"
    tcs.append(tc(inp, second_largest(arr)))
problems.append(gen("Second Largest Element",
    "Given an array of N integers, find the second largest element. If no second largest exists (all elements are same), print -1.",
    "First line: N\nSecond line: N space-separated integers", "The second largest element, or -1",
    "2 <= N <= 10^5\n-10^5 <= arr[i] <= 10^5",
    "EASY", ["Array", "Basic"], "5\n1 2 4 7 7", "4",
    "Largest is 7, second largest is 4.", 1, tcs))

# ==================== 15. Check if Array is Sorted ====================
tcs = []
def is_sorted(arr): return all(arr[i] <= arr[i+1] for i in range(len(arr)-1))
test_arrays = [[1,2,3,4,5], [1,3,2,4], [1], [2,1], [1,1,1], [1,2,2,3,3], [5,4,3,2], [-5,-3,-1,0,2,4], [0,0,-1], [1,1]]
for _ in range(40):
    n = random.randint(1, 15)
    if random.random() < 0.4:
        arr = sorted([random.randint(-20, 20) for _ in range(n)])
    else:
        arr = [random.randint(-20, 20) for _ in range(n)]
    test_arrays.append(arr)
for arr in test_arrays[:50]:
    inp = f"{len(arr)}\n{' '.join(map(str, arr))}"
    tcs.append(tc(inp, "true" if is_sorted(arr) else "false"))
problems.append(gen("Check if Array is Sorted",
    "Given an array of N integers, check if it is sorted in non-decreasing order.\n\nPrint 'true' if sorted, 'false' otherwise.",
    "First line: N\nSecond line: N space-separated integers", "true or false",
    "1 <= N <= 10^5\n-10^5 <= arr[i] <= 10^5",
    "EASY", ["Array", "Basic"], "5\n1 2 3 4 5", "true",
    "Each element is <= the next, so the array is sorted.", 1, tcs))

# ==================== 16. Left Rotate by One ====================
tcs = []
test_arrays = [[1,2,3,4,5], [10,20,30], [5], [1,2], [-1,-2,-3,-4], [0,0,0,0,0,1], [100,200,300,400], [5,5,5], [7,6,5,4,3,2,1], [-10,10]]
for _ in range(40):
    n = random.randint(1, 20)
    arr = [random.randint(-50, 50) for _ in range(n)]
    test_arrays.append(arr)
for arr in test_arrays[:50]:
    inp = f"{len(arr)}\n{' '.join(map(str, arr))}"
    rotated = arr[1:] + arr[:1] if len(arr) > 1 else arr[:]
    tcs.append(tc(inp, ' '.join(map(str, rotated))))
problems.append(gen("Left Rotate Array by One",
    "Given an array of N integers, left rotate the array by one position and print the result.\n\nThe first element moves to the end.",
    "First line: N\nSecond line: N space-separated integers", "Array after left rotation by one",
    "1 <= N <= 10^5", "EASY", ["Array", "Basic"], "5\n1 2 3 4 5", "2 3 4 5 1",
    "First element 1 moves to end: [2, 3, 4, 5, 1]", 1, tcs))

# ==================== 17. Left Rotate by K ====================
tcs = []
test_data = [(5,2,[1,2,3,4,5]), (4,1,[10,20,30,40]), (3,0,[1,2,3]), (3,3,[1,2,3]), (5,7,[1,2,3,4,5]),
    (1,5,[42]), (4,2,[-1,-2,-3,-4]), (6,3,[10,20,30,40,50,60]), (2,1,[5,10]), (5,5,[1,2,3,4,5])]
for _ in range(40):
    n = random.randint(1, 20)
    k = random.randint(0, 30)
    arr = [random.randint(-50, 50) for _ in range(n)]
    test_data.append((n, k, arr))
for n, k, arr in test_data[:50]:
    inp = f"{n} {k}\n{' '.join(map(str, arr))}"
    ek = k % n if n > 0 else 0
    rotated = arr[ek:] + arr[:ek]
    tcs.append(tc(inp, ' '.join(map(str, rotated))))
problems.append(gen("Left Rotate Array by K Places",
    "Given an array of N integers and an integer K, left rotate the array by K positions and print the result.",
    "First line: N K\nSecond line: N space-separated integers", "Array after left rotation by K positions",
    "1 <= N <= 10^5\n0 <= K <= 10^5", "EASY", ["Array", "Basic"], "5 2\n1 2 3 4 5", "3 4 5 1 2",
    "Rotate left by 2: [1,2,3,4,5] → [3,4,5,1,2]", 1, tcs))

# ==================== 18. Union of Two Sorted Arrays ====================
tcs = []
def union_sorted(a, b):
    return sorted(set(a) | set(b))

test_data = [([1,2,3,4,5],[1,2,3]), ([1,3,5],[2,4,6,8]), ([1],[2]), ([1,1,1],[2,2,2]), ([1,2,3,4],[1,2,3,4]),
    ([-3,-1,0],[-2,1]), ([5],[5]), ([1,2,3,4,5],[3]), ([10,20],[5,15,25]), ([1,3,5,7],[2,4,6,8])]
for _ in range(40):
    n = random.randint(1, 15)
    m = random.randint(1, 15)
    a = sorted([random.randint(-20, 20) for _ in range(n)])
    b = sorted([random.randint(-20, 20) for _ in range(m)])
    test_data.append((a, b))
for a, b in test_data[:50]:
    inp = f"{len(a)} {len(b)}\n{' '.join(map(str, a))}\n{' '.join(map(str, b))}"
    u = union_sorted(a, b)
    tcs.append(tc(inp, ' '.join(map(str, u))))
problems.append(gen("Union of Two Sorted Arrays",
    "Given two sorted arrays A and B, find their union (all distinct elements from both arrays) in sorted order.",
    "First line: N M\nSecond line: N integers (sorted)\nThird line: M integers (sorted)",
    "Union of both arrays in sorted order, space-separated", "1 <= N, M <= 10^4",
    "EASY", ["Array", "Two Pointers"], "5 3\n1 2 3 4 5\n1 2 3", "1 2 3 4 5",
    "Union of {1,2,3,4,5} and {1,2,3} = {1,2,3,4,5}", 1, tcs))

# ==================== 19. Find Maximum ====================
tcs = []
for _ in range(50):
    n = random.randint(1, 30)
    arr = [random.randint(-1000, 1000) for _ in range(n)]
    inp = f"{n}\n{' '.join(map(str, arr))}"
    tcs.append(tc(inp, max(arr)))
problems.append(gen("Find Maximum Element",
    "Given an array of N integers, find and print the maximum element.",
    "First line: N\nSecond line: N space-separated integers", "The maximum element",
    "1 <= N <= 10^5\n-10^9 <= arr[i] <= 10^9", "EASY", ["Array", "Basic"],
    tcs[0]["in"], tcs[0]["out"], "Iterate and track the maximum.", 1, tcs))

# ==================== 20. Find Minimum ====================
tcs = []
for _ in range(50):
    n = random.randint(1, 30)
    arr = [random.randint(-1000, 1000) for _ in range(n)]
    inp = f"{n}\n{' '.join(map(str, arr))}"
    tcs.append(tc(inp, min(arr)))
problems.append(gen("Find Minimum Element",
    "Given an array of N integers, find and print the minimum element.",
    "First line: N\nSecond line: N space-separated integers", "The minimum element",
    "1 <= N <= 10^5\n-10^9 <= arr[i] <= 10^9", "EASY", ["Array", "Basic"],
    tcs[0]["in"], tcs[0]["out"], "Iterate and track the minimum.", 1, tcs))

# ==================== 21. Count Frequency ====================
tcs = []
test_data = [[2,3,2,3,5], [1,1,1,1], [1], [1,2,3], [1,2,3,4,5,6], [4,4,4,4], [1,1,2,2,3], [3,3,3], [1,1,2,2,3,3], [1,2,3,4,5,6,7]]
for _ in range(40):
    n = random.randint(1, 15)
    arr = [random.randint(1, n) for _ in range(n)]
    test_data.append(arr)
for arr in test_data[:50]:
    n = len(arr)
    inp = f"{n}\n{' '.join(map(str, arr))}"
    freq = [0] * n
    for x in arr:
        if 1 <= x <= n: freq[x-1] += 1
    tcs.append(tc(inp, ' '.join(map(str, freq))))
problems.append(gen("Count Frequency of Elements",
    "Given an array of N integers where elements are in range 1 to N, count the frequency of each element from 1 to N.\n\nPrint N space-separated integers where i-th value is the frequency of i.",
    "First line: N\nSecond line: N integers (each between 1 and N)", "N space-separated frequency values",
    "1 <= N <= 10^5\n1 <= arr[i] <= N", "EASY", ["Array", "Hash Map"],
    "5\n2 3 2 3 5", "0 2 2 0 1",
    "1 appears 0 times, 2 appears 2 times, 3 appears 2 times, 4 appears 0 times, 5 appears 1 time.", 1, tcs))

# ==================== 22. Leaders in Array ====================
tcs = []
def leaders(arr):
    result = []
    max_right = float('-inf')
    for i in range(len(arr)-1, -1, -1):
        if arr[i] >= max_right:
            result.append(arr[i])
            max_right = arr[i]
    return list(reversed(result))

test_arrays = [[16,17,4,3,5,2], [1,2,3,4,5], [10], [5,4,3,2,1], [7,7,7,7], [1,2,0], [10,22,12,3,0,6], [100,50,25,75], [1,2], [30,10,20,5,25]]
for _ in range(40):
    n = random.randint(1, 15)
    arr = [random.randint(-20, 100) for _ in range(n)]
    test_arrays.append(arr)
for arr in test_arrays[:50]:
    inp = f"{len(arr)}\n{' '.join(map(str, arr))}"
    tcs.append(tc(inp, ' '.join(map(str, leaders(arr)))))
problems.append(gen("Leaders in an Array",
    "Given an array of N integers, find all leaders. An element is a leader if it is greater than or equal to all elements to its right. The rightmost element is always a leader.\n\nPrint leaders from left to right, space-separated.",
    "First line: N\nSecond line: N space-separated integers", "Leaders from left to right, space-separated",
    "1 <= N <= 10^5", "EASY", ["Array", "Basic"], "6\n16 17 4 3 5 2", "17 5 2",
    "17 >= all right elements. 5 >= 2. 2 is rightmost.", 1, tcs))

# ==================== 23. Longest Subarray with Sum K ====================
tcs = []
def longest_subarray_sum_k(arr, k):
    best = 0
    prefix = {}
    s = 0
    for i in range(len(arr)):
        s += arr[i]
        if s == k: best = i + 1
        if s - k in prefix: best = max(best, i - prefix[s-k])
        if s not in prefix: prefix[s] = i
    return best

test_data = [([1,2,3,1,1],3), ([2,3,5,1,1,1],5), ([1,2,3],10), ([0,0,0,0],0), ([5,0,0,0,0],5),
    ([1,2,3],6), ([1,-1,2,2],3), ([1],1), ([1],2), ([1,-1,2,-2,3,-3],0)]
for _ in range(40):
    n = random.randint(1, 20)
    arr = [random.randint(-10, 10) for _ in range(n)]
    k = random.randint(-15, 15)
    test_data.append((arr, k))
for arr, k in test_data[:50]:
    inp = f"{len(arr)} {k}\n{' '.join(map(str, arr))}"
    tcs.append(tc(inp, longest_subarray_sum_k(arr, k)))
problems.append(gen("Longest Subarray with Sum K",
    "Given an array of N integers and a target sum K, find the length of the longest subarray whose sum equals K. If no such subarray exists, print 0.",
    "First line: N K\nSecond line: N space-separated integers", "Length of longest subarray with sum K",
    "1 <= N <= 10^5\n-10^5 <= arr[i] <= 10^5\n-10^9 <= K <= 10^9",
    "MEDIUM", ["Array", "Hash Map", "Prefix Sum"], "5 3\n1 2 3 1 1", "3",
    "Subarray [1,1,1] sums to 3 with length 3.", 2, tcs))

# ==================== 24. Count Inversions ====================
tcs = []
def count_inv(arr):
    count = 0
    for i in range(len(arr)):
        for j in range(i+1, len(arr)):
            if arr[i] > arr[j]: count += 1
    return count

test_arrays = [[2,4,1,3,5], [5,4,3,2,1], [1], [1,2], [2,1], [3,1,2], [1,2,3,4], [4,3,2,1], [1,1,1,1,1,1], [1,5,2,4,3]]
for _ in range(40):
    n = random.randint(1, 15)
    arr = [random.randint(1, 20) for _ in range(n)]
    test_arrays.append(arr)
for arr in test_arrays[:50]:
    inp = f"{len(arr)}\n{' '.join(map(str, arr))}"
    tcs.append(tc(inp, count_inv(arr)))
problems.append(gen("Count Inversions",
    "Given an array of N integers, count the number of inversions. An inversion is a pair (i, j) where i < j but arr[i] > arr[j].",
    "First line: N\nSecond line: N space-separated integers", "Number of inversions",
    "1 <= N <= 10^5\n-10^5 <= arr[i] <= 10^5", "HARD", ["Array", "Divide and Conquer", "Merge Sort"],
    "5\n2 4 1 3 5", "3", "Inversions: (2,1), (4,1), (4,3). Total = 3.", 2, tcs))

# ==================== 25. Matrix Transpose ====================
tcs = []
test_matrices = [
    [[1,2,3],[4,5,6],[7,8,9]], [[1,2],[3,4]], [[5]], [[0,0],[0,0]],
    [[1,0,0],[0,1,0],[0,0,1]], [[-1,2],[3,-4]],
    [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]],
    [[1,1,1],[2,2,2],[3,3,3]], [[10,20],[30,40]], [[-1,-2,-3],[-4,-5,-6],[-7,-8,-9]]
]
for _ in range(40):
    n = random.randint(1, 6)
    mat = [[random.randint(-10, 10) for _ in range(n)] for _ in range(n)]
    test_matrices.append(mat)
for mat in test_matrices[:50]:
    n = len(mat)
    inp_lines = [str(n)] + [' '.join(map(str, row)) for row in mat]
    trans = [[mat[j][i] for j in range(n)] for i in range(n)]
    out_lines = [' '.join(map(str, row)) for row in trans]
    tcs.append(tc('\n'.join(inp_lines), '\n'.join(out_lines)))
problems.append(gen("Matrix Transpose",
    "Given an N x N matrix, print its transpose. The transpose of a matrix swaps rows and columns.",
    "First line: N\nNext N lines: N space-separated integers each",
    "N lines of N space-separated integers (transposed matrix)", "1 <= N <= 100",
    "EASY", ["Matrix", "Array"], "3\n1 2 3\n4 5 6\n7 8 9", "1 4 7\n2 5 8\n3 6 9",
    "Row 1 becomes Column 1, Row 2 becomes Column 2, etc.", 1, tcs))

# ==================== 26. Power of a Number ====================
tcs = []
test_data = [(2,10), (3,5), (5,0), (0,5), (1,100), (-2,3), (-2,4), (10,3), (7,2), (2,20),
    (2,0), (2,1), (2,2), (2,3), (2,4), (2,5), (2,6), (2,7), (2,8), (2,9),
    (3,0), (3,1), (3,2), (3,3), (3,4), (4,0), (4,1), (4,2), (4,3), (4,4),
    (5,1), (5,2), (5,3), (6,2), (6,3), (7,3), (8,2), (9,2), (10,2), (10,4),
    (-1,0), (-1,1), (-1,2), (-1,3), (-3,2), (-3,3), (1,0), (1,1), (0,0), (0,1)]
for b, e in test_data[:50]:
    result = b**e if not (b == 0 and e == 0) else 1
    tcs.append(tc(f"{b} {e}", result))
problems.append(gen("Power of a Number",
    "Given two integers base and exponent, compute base^exponent.",
    "Two space-separated integers: base exponent", "base raised to the power exponent",
    "-100 <= base <= 100\n0 <= exponent <= 30", "EASY", ["Math", "Recursion"],
    "2 10", "1024", "2^10 = 1024. Use repeated squaring for O(log n).", 1, tcs))

# ==================== 27. Count Vowels ====================
tcs = []
def count_vowels(s): return sum(1 for c in s if c in 'aeiou')
strings = ["hello", "aeiou", "bcdfg", "a", "z", "programming", "education", "rhythm", "beautiful", "xyz",
    "apple", "orange", "banana", "grape", "mango", "kiwi", "plum", "pear", "fig", "date",
    "algorithm", "database", "computer", "science", "machine", "learning", "artificial", "intelligence", "neural", "network",
    "stack", "queue", "tree", "graph", "array", "string", "linked", "binary", "search", "sort",
    "dynamic", "greedy", "backtrack", "divide", "conquer", "trie", "heap", "hash", "map", "set"]
for s in strings[:50]:
    tcs.append(tc(s, count_vowels(s)))
problems.append(gen("Count Vowels in String",
    "Given a string S of lowercase English letters, count the number of vowels (a, e, i, o, u).",
    "A single string S", "Number of vowels in S", "1 <= |S| <= 10^5",
    "EASY", ["String", "Basic"], "hello", "2",
    "In 'hello', vowels are 'e' and 'o' = 2 vowels.", 1, tcs))

# ==================== 28. Remove Duplicates from Array ====================
tcs = []
test_arrays = [[1,1,2,2,3,4,4], [1,1,1,1,1], [5], [1,2,3], [-3,-3,-1,-1,0,0], [0,0,0,0],
    [1,1,2,3,3,4,5,5], [1,2], [5,5], [1,1,2,2,3,3,4,4,5,5]]
for _ in range(40):
    n = random.randint(1, 20)
    arr = sorted([random.randint(-10, 10) for _ in range(n)])
    test_arrays.append(arr)
for arr in test_arrays[:50]:
    inp = f"{len(arr)}\n{' '.join(map(str, arr))}"
    unique = sorted(set(arr))
    tcs.append(tc(inp, ' '.join(map(str, unique))))
problems.append(gen("Remove Duplicates from Array",
    "Given a sorted array of N integers, remove duplicates in-place and print only the unique elements.",
    "First line: N\nSecond line: N sorted integers", "Unique elements space-separated", "1 <= N <= 10^5",
    "EASY", ["Array", "Two Pointers"], "7\n1 1 2 2 3 4 4", "1 2 3 4",
    "Remove duplicate occurrences: [1,1,2,2,3,4,4] → [1,2,3,4]", 1, tcs))

# ==================== 29. Maximum Consecutive Ones ====================
tcs = []
def max_consec_ones(arr):
    best = cur = 0
    for x in arr:
        if x == 1: cur += 1; best = max(best, cur)
        else: cur = 0
    return best

test_arrays = [[1,1,0,1,1,1], [0,0,0,0], [1], [0], [1,1,1,1,1], [1,0,1,1,0,1,1,1], [0,1,0], [1,0,0,0,0,1], [1,1,1,0,0,1,1,1,1,0], [0,0,1,1,1,0,0]]
for _ in range(40):
    n = random.randint(1, 30)
    arr = [random.randint(0, 1) for _ in range(n)]
    test_arrays.append(arr)
for arr in test_arrays[:50]:
    inp = f"{len(arr)}\n{' '.join(map(str, arr))}"
    tcs.append(tc(inp, max_consec_ones(arr)))
problems.append(gen("Maximum Consecutive Ones",
    "Given a binary array (containing only 0s and 1s), find the maximum number of consecutive 1s.",
    "First line: N\nSecond line: N integers (0 or 1)", "Maximum consecutive 1s", "1 <= N <= 10^5",
    "EASY", ["Array", "Basic"], "6\n1 1 0 1 1 1", "3",
    "Consecutive 1s: [1,1] (length 2) and [1,1,1] (length 3). Max = 3.", 1, tcs))

# ==================== 30. Most Frequent Element ====================
tcs = []
def most_frequent(arr):
    from collections import Counter
    c = Counter(arr)
    max_freq = max(c.values())
    candidates = [k for k, v in c.items() if v == max_freq]
    elem = min(candidates)
    return f"{elem} {max_freq}"

test_arrays = [[1,2,2,3,3,3,4], [1,1,2,2,3], [5], [1,1,1], [5,5,5,3,3,3], [-1,-1,2,2], [10,20,30,40,50], [1,2,3,4,5,1,2,1], [0,0,0], [-5,-5,-5,5,5,5]]
for _ in range(40):
    n = random.randint(1, 20)
    arr = [random.randint(-10, 10) for _ in range(n)]
    test_arrays.append(arr)
for arr in test_arrays[:50]:
    inp = f"{len(arr)}\n{' '.join(map(str, arr))}"
    tcs.append(tc(inp, most_frequent(arr)))
problems.append(gen("Frequency of Most Frequent Element",
    "Given an array of N integers, find the element that appears most frequently. If there's a tie, print the smallest element.\n\nPrint the element and its frequency.",
    "First line: N\nSecond line: N space-separated integers", "Two space-separated integers: element frequency",
    "1 <= N <= 10^5\n-10^5 <= arr[i] <= 10^5", "EASY", ["Array", "Hash Map"],
    "7\n1 2 2 3 3 3 4", "3 3", "3 appears 3 times, which is the most frequent.", 1, tcs))

# ==================== 31. Sum of Digits ====================
tcs = []
for n in [1234, 999, 0, 5, 100, 9999, 12345, 111111, 1000000000, 987654321,
    1, 10, 11, 12, 99, 100, 101, 123, 456, 789,
    1111, 2222, 3333, 4444, 5555, 6666, 7777, 8888, 9999, 10000,
    11111, 22222, 33333, 44444, 55555, 66666, 77777, 88888, 99999, 100000,
    2, 20, 200, 2000, 20000, 3, 30, 300, 3000, 30000]:
    tcs.append(tc(n, sum(int(d) for d in str(n))))
problems.append(gen("Sum of Digits",
    "Given a non-negative integer N, find the sum of its digits.",
    "A single non-negative integer N", "Sum of digits of N", "0 <= N <= 10^9",
    "EASY", ["Math", "Basic"], "1234", "10", "1 + 2 + 3 + 4 = 10", 1, tcs))

# ==================== 32. Print Fibonacci Series ====================
tcs = []
def fib_series(n):
    if n == 0: return ""
    fibs = [0, 1]
    while len(fibs) < n: fibs.append(fibs[-1] + fibs[-2])
    return ' '.join(map(str, fibs[:n]))

for n in list(range(1, 31)) + list(range(1, 21)):
    tcs.append(tc(n, fib_series(n)))
problems.append(gen("Print Fibonacci Series",
    "Given a positive integer N, print the first N Fibonacci numbers space-separated.\n\nFibonacci: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)",
    "A single positive integer N", "First N Fibonacci numbers space-separated", "1 <= N <= 30",
    "EASY", ["Math", "Recursion", "DP"], "7", "0 1 1 2 3 5 8",
    "First 7 Fibonacci: 0, 1, 1, 2, 3, 5, 8", 1, tcs[:50]))

# ==================== 33. Reverse an Array ====================
tcs = []
for _ in range(50):
    n = random.randint(1, 25)
    arr = [random.randint(-100, 100) for _ in range(n)]
    inp = f"{n}\n{' '.join(map(str, arr))}"
    tcs.append(tc(inp, ' '.join(map(str, arr[::-1]))))
problems.append(gen("Reverse an Array",
    "Given an array of N integers, reverse it and print the reversed array.",
    "First line: N\nSecond line: N space-separated integers", "Reversed array, space-separated",
    "1 <= N <= 10^5", "EASY", ["Array", "Two Pointers"], "5\n1 2 3 4 5", "5 4 3 2 1",
    "Reverse [1,2,3,4,5] → [5,4,3,2,1]", 1, tcs))

# ==================== 34. LCM ====================
tcs = []
def gcd(a, b):
    while b: a, b = b, a % b
    return a
def lcm(a, b): return a * b // gcd(a, b)

test_data = [(12,18), (4,6), (1,1), (7,5), (3,3), (15,20), (100,75), (1,1000000), (17,13), (24,36),
    (2,3), (5,10), (6,8), (9,12), (14,21), (10,15), (8,12), (25,35), (16,24), (30,45),
    (7,11), (13,17), (19,23), (29,31), (37,41), (43,47), (53,59), (61,67), (71,73), (79,83),
    (100,200), (50,75), (60,90), (120,80), (36,48), (42,56), (18,27), (20,30), (33,44), (55,66),
    (2,2), (5,5), (10,10), (100,100), (7,14), (3,9), (4,16), (6,18), (8,24), (9,27)]
for a, b in test_data[:50]:
    tcs.append(tc(f"{a} {b}", lcm(a, b)))
problems.append(gen("LCM of Two Numbers",
    "Given two positive integers A and B, find their LCM (Least Common Multiple).\n\nLCM(A,B) = (A * B) / GCD(A,B)",
    "Two space-separated positive integers A B", "LCM of A and B", "1 <= A, B <= 10^6",
    "EASY", ["Math", "Basic"], "12 18", "36", "GCD(12,18) = 6. LCM = 12*18/6 = 36.", 1, tcs))

# ==================== 35. Count Set Bits ====================
tcs = []
for n in [13, 0, 1, 7, 8, 15, 255, 1023, 1000000, 2147483647,
    2, 3, 4, 5, 6, 9, 10, 11, 12, 14,
    16, 31, 32, 63, 64, 127, 128, 256, 511, 512,
    1024, 2048, 4096, 8192, 16384, 32768, 65535, 65536, 100, 200,
    300, 500, 999, 1234, 5678, 9999, 10000, 50000, 100000, 999999]:
    tcs.append(tc(n, bin(n).count('1')))
problems.append(gen("Count Set Bits",
    "Given a non-negative integer N, count the number of 1-bits (set bits) in its binary representation.",
    "A single non-negative integer N", "Number of set bits", "0 <= N <= 10^9",
    "EASY", ["Bit Manipulation", "Math"], "13", "3",
    "13 in binary = 1101. Three 1-bits.", 1, tcs))

# ==================== 36. Check Power of Two ====================
tcs = []
powers_of_2 = {2**i for i in range(31)}
for n in [16, 6, 1, 2, 3, 4, 64, 100, 1024, 1073741824,
    5, 7, 8, 9, 10, 15, 17, 31, 32, 33,
    63, 65, 127, 128, 129, 255, 256, 257, 511, 512,
    513, 1023, 1025, 2047, 2048, 2049, 4095, 4096, 4097, 8191,
    8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 12345, 99999]:
    tcs.append(tc(n, "true" if n in powers_of_2 else "false"))
problems.append(gen("Check Power of Two",
    "Given a positive integer N, check if it is a power of 2.\n\nPrint 'true' if N is a power of 2, 'false' otherwise.",
    "A single positive integer N", "true or false", "1 <= N <= 10^9",
    "EASY", ["Bit Manipulation", "Math"], "16", "true",
    "16 = 2^4, so it's a power of two. Trick: N & (N-1) == 0.", 1, tcs))

# ==================== 37. Stock Buy Sell Multiple ====================
tcs = []
def max_profit_multi(prices):
    profit = 0
    for i in range(1, len(prices)):
        if prices[i] > prices[i-1]:
            profit += prices[i] - prices[i-1]
    return profit

test_arrays = [[7,1,5,3,6,4], [1,2,3,4,5], [5,4,3,2,1], [5], [1,5,2,8], [1,1,1], [3,3,5,0,0,3], [1,2,1,2], [1,2], [2,1]]
for _ in range(40):
    n = random.randint(1, 20)
    arr = [random.randint(0, 100) for _ in range(n)]
    test_arrays.append(arr)
for arr in test_arrays[:50]:
    inp = f"{len(arr)}\n{' '.join(map(str, arr))}"
    tcs.append(tc(inp, max_profit_multi(arr)))
problems.append(gen("Stock Buy and Sell Multiple Transactions",
    "Given an array of N stock prices, find the maximum profit you can achieve. You can buy and sell multiple times (but must sell before buying again).",
    "First line: N\nSecond line: N integers (prices)", "Maximum total profit",
    "1 <= N <= 10^5\n0 <= prices[i] <= 10^4", "MEDIUM", ["Array", "Greedy"],
    "6\n7 1 5 3 6 4", "7", "Buy at 1, sell at 5 (profit 4). Buy at 3, sell at 6 (profit 3). Total = 7.", 1, tcs))

# Write output
with open(r"c:\Users\Adarsh\Cookies\Desktop\Compiler_Project\server\src\main\resources\striver_new_problems.json", "w") as f:
    json.dump(problems, f, indent=2)

# Stats
total_tc = sum(len(p["tc"]) for p in problems)
print(f"Generated {len(problems)} problems with {total_tc} total test cases")
for p in problems:
    print(f"  {p['title']}: {len(p['tc'])} test cases")

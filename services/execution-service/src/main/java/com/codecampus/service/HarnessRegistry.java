package com.codecampus.service;

import com.codecampus.model.ProgrammingLanguage;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;

/**
 * LeetCode-style "function mode" support.
 *
 * For supported problems we store, per language:
 *   - starterCode : the function-signature stub shown in the editor (the user fills only the body)
 *   - driver      : a full program that reads the problem's existing stdin test-case format,
 *                   calls the user's function, and prints output in the exact expected format.
 *
 * The driver contains the token {@code __USER_CODE__} which is replaced by the user's submitted
 * code before compilation. Problems NOT registered here keep the classic stdin/stdout behaviour.
 *
 * Most problems are wired through an ARCHETYPE ENGINE: a small set of reusable driver/starter
 * templates keyed by the problem's input/output "shape" (e.g. one int -> int, array -> value,
 * array + target -> indices). To add a problem you usually just call:
 *     arch("Problem Title", "functionName", InShape.ARR, OutShape.INT);
 * The engine generates Java / Python / JavaScript harnesses automatically. (C / C++ are only
 * provided for hand-written problems like Two Sum; otherwise those languages fall back to the
 * classic full-program template.)
 */
@Service
public class HarnessRegistry {

    public static final String USER_CODE_TOKEN = "__USER_CODE__";

    /** Input shape: what the driver reads from stdin and passes to the user's function. */
    public enum InShape { INT1, INT2, INT3, ARR, ARRINT, STR1, STR2 }
    /** Output shape: the return type of the user's function and how the driver prints it. */
    public enum OutShape { INT, BOOL, INTARR, STR }

    public record Harness(String starterCode, String driver) {}

    private final Map<String, Map<ProgrammingLanguage, Harness>> registry = new HashMap<>();

    public HarnessRegistry() {
        registerTwoSum();
        registerArchetypes();
    }

    private void register(String title, ProgrammingLanguage lang, String starter, String driver) {
        registry.computeIfAbsent(normalize(title), k -> new EnumMap<>(ProgrammingLanguage.class))
                .put(lang, new Harness(starter, driver));
    }

    private static String normalize(String title) {
        return title == null ? "" : title.trim().toLowerCase();
    }

    public boolean hasHarness(String title, ProgrammingLanguage lang) {
        Map<ProgrammingLanguage, Harness> byLang = registry.get(normalize(title));
        return byLang != null && byLang.containsKey(lang);
    }

    /** Starter stub for the editor, or {@code null} if the problem isn't in function mode. */
    public String starter(String title, ProgrammingLanguage lang) {
        Map<ProgrammingLanguage, Harness> byLang = registry.get(normalize(title));
        if (byLang == null) return null;
        Harness h = byLang.get(lang);
        return h == null ? null : h.starterCode();
    }

    /** Wrap the user's function with the hidden driver, or return it unchanged if no harness. */
    public String wrap(String title, ProgrammingLanguage lang, String userCode) {
        Map<ProgrammingLanguage, Harness> byLang = registry.get(normalize(title));
        if (byLang == null) return userCode;
        Harness h = byLang.get(lang);
        if (h == null) return userCode;
        return h.driver().replace(USER_CODE_TOKEN, userCode == null ? "" : userCode);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  ARCHETYPE ENGINE — generates Java / Python / JavaScript harnesses
    // ══════════════════════════════════════════════════════════════════════

    private void arch(String title, String func, InShape in, OutShape out) {
        register(title, ProgrammingLanguage.JAVA, javaStarter(func, in, out), javaDriver(func, in, out));
        register(title, ProgrammingLanguage.PYTHON, pyStarter(func, in), pyDriver(func, in, out));
        register(title, ProgrammingLanguage.JAVASCRIPT, jsStarter(func, in), jsDriver(func, in, out));
    }

    private static boolean numeric(InShape in) { return in != InShape.STR1 && in != InShape.STR2; }

    // ── Java ──────────────────────────────────────────────────────────────
    private String javaRet(OutShape o) {
        return switch (o) { case INT -> "long"; case BOOL -> "boolean"; case INTARR -> "int[]"; case STR -> "String"; };
    }
    private String javaParams(InShape in) {
        return switch (in) {
            case INT1 -> "long n"; case INT2 -> "long a, long b"; case INT3 -> "long a, long b, long c";
            case ARR -> "int[] arr"; case ARRINT -> "int[] arr, int x";
            case STR1 -> "String s"; case STR2 -> "String a, String b";
        };
    }
    private String javaArgs(InShape in) {
        return switch (in) {
            case INT1 -> "n"; case INT2 -> "a, b"; case INT3 -> "a, b, c";
            case ARR -> "arr"; case ARRINT -> "arr, x"; case STR1 -> "s"; case STR2 -> "a, b";
        };
    }
    private String javaStarter(String func, InShape in, OutShape out) {
        return "class Solution {\n    " + javaRet(out) + " " + func + "(" + javaParams(in)
                + ") {\n        // Write your code here\n\n    }\n}\n";
    }
    private String javaRead(InShape in) {
        return switch (in) {
            case INT1 -> "        st.nextToken(); long n=(long)st.nval;\n";
            case INT2 -> "        st.nextToken(); long a=(long)st.nval; st.nextToken(); long b=(long)st.nval;\n";
            case INT3 -> "        st.nextToken(); long a=(long)st.nval; st.nextToken(); long b=(long)st.nval; st.nextToken(); long c=(long)st.nval;\n";
            case ARR -> "        st.nextToken(); int N=(int)st.nval; int[] arr=new int[N]; for(int i=0;i<N;i++){st.nextToken(); arr[i]=(int)st.nval;}\n";
            case ARRINT -> "        st.nextToken(); int N=(int)st.nval; st.nextToken(); int x=(int)st.nval; int[] arr=new int[N]; for(int i=0;i<N;i++){st.nextToken(); arr[i]=(int)st.nval;}\n";
            case STR1 -> "        BufferedReader br=new BufferedReader(new InputStreamReader(System.in)); String s=br.readLine(); if(s==null)s=\"\";\n";
            case STR2 -> "        BufferedReader br=new BufferedReader(new InputStreamReader(System.in)); String a=br.readLine(); if(a==null)a=\"\"; String b=br.readLine(); if(b==null)b=\"\";\n";
        };
    }
    private String javaPrint(OutShape out, String call) {
        return switch (out) {
            case INT -> "        long r=" + call + ";\n        System.out.println(r);\n";
            case BOOL -> "        boolean r=" + call + ";\n        System.out.println(r);\n";
            case INTARR -> "        int[] r=" + call + ";\n        StringBuilder sb=new StringBuilder(); if(r!=null) for(int i=0;i<r.length;i++){ if(i>0) sb.append(' '); sb.append(r[i]); } System.out.println(sb.toString());\n";
            case STR -> "        String r=" + call + ";\n        System.out.println(r==null?\"\":r);\n";
        };
    }
    private String javaDriver(String func, InShape in, OutShape out) {
        StringBuilder d = new StringBuilder();
        d.append("import java.util.*;\nimport java.io.*;\n\n").append(USER_CODE_TOKEN)
                .append("\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n");
        if (numeric(in)) d.append("        StreamTokenizer st = new StreamTokenizer(new BufferedReader(new InputStreamReader(System.in)));\n");
        d.append(javaRead(in));
        d.append(javaPrint(out, "new Solution()." + func + "(" + javaArgs(in) + ")"));
        d.append("    }\n}\n");
        return d.toString();
    }

    // ── Python ────────────────────────────────────────────────────────────
    private String pyParams(InShape in) {
        return switch (in) {
            case INT1 -> "self, n"; case INT2 -> "self, a, b"; case INT3 -> "self, a, b, c";
            case ARR -> "self, arr"; case ARRINT -> "self, arr, x"; case STR1 -> "self, s"; case STR2 -> "self, a, b";
        };
    }
    private String pyArgs(InShape in) {
        return switch (in) {
            case INT1 -> "n"; case INT2 -> "a, b"; case INT3 -> "a, b, c";
            case ARR -> "arr"; case ARRINT -> "arr, x"; case STR1 -> "s"; case STR2 -> "a, b";
        };
    }
    private String pyStarter(String func, InShape in) {
        return "class Solution:\n    def " + func + "(" + pyParams(in) + "):\n        # Write your code here\n        pass\n";
    }
    private String pyRead(InShape in) {
        return switch (in) {
            case INT1 -> "    _t = sys.stdin.read().split()\n    n = int(_t[0])\n";
            case INT2 -> "    _t = sys.stdin.read().split()\n    a = int(_t[0]); b = int(_t[1])\n";
            case INT3 -> "    _t = sys.stdin.read().split()\n    a = int(_t[0]); b = int(_t[1]); c = int(_t[2])\n";
            case ARR -> "    _t = sys.stdin.read().split()\n    n = int(_t[0]); arr = list(map(int, _t[1:1+n]))\n";
            case ARRINT -> "    _t = sys.stdin.read().split()\n    n = int(_t[0]); x = int(_t[1]); arr = list(map(int, _t[2:2+n]))\n";
            case STR1 -> "    _lines = sys.stdin.read().split('\\n')\n    s = _lines[0].rstrip('\\r') if _lines else ''\n";
            case STR2 -> "    _lines = sys.stdin.read().split('\\n')\n    a = _lines[0].rstrip('\\r') if len(_lines) > 0 else ''\n    b = _lines[1].rstrip('\\r') if len(_lines) > 1 else ''\n";
        };
    }
    private String pyPrint(OutShape out, String call) {
        return switch (out) {
            case INT -> "    print(" + call + ")\n";
            case BOOL -> "    _r = " + call + "\n    print('true' if _r else 'false')\n";
            case INTARR -> "    _r = " + call + "\n    print(' '.join(map(str, _r)) if _r else '')\n";
            case STR -> "    _r = " + call + "\n    print(_r if _r is not None else '')\n";
        };
    }
    private String pyDriver(String func, InShape in, OutShape out) {
        return "import sys\n\n" + USER_CODE_TOKEN + "\n\ndef __main():\n"
                + pyRead(in) + pyPrint(out, "Solution()." + func + "(" + pyArgs(in) + ")")
                + "\n__main()\n";
    }

    // ── JavaScript ──────────────────────────────────────────────────────────
    private String jsParams(InShape in) {
        return switch (in) {
            case INT1 -> "n"; case INT2 -> "a, b"; case INT3 -> "a, b, c";
            case ARR -> "arr"; case ARRINT -> "arr, x"; case STR1 -> "s"; case STR2 -> "a, b";
        };
    }
    private String jsStarter(String func, InShape in) {
        return "var " + func + " = function(" + jsParams(in) + ") {\n    // Write your code here\n\n};\n";
    }
    private String jsRead(InShape in) {
        return switch (in) {
            case INT1 -> "const _t = _d.trim().split(/\\s+/).map(Number);\nconst n = _t[0];\n";
            case INT2 -> "const _t = _d.trim().split(/\\s+/).map(Number);\nconst a = _t[0], b = _t[1];\n";
            case INT3 -> "const _t = _d.trim().split(/\\s+/).map(Number);\nconst a = _t[0], b = _t[1], c = _t[2];\n";
            case ARR -> "const _t = _d.trim().split(/\\s+/).map(Number);\nconst n = _t[0]; const arr = _t.slice(1, 1 + n);\n";
            case ARRINT -> "const _t = _d.trim().split(/\\s+/).map(Number);\nconst n = _t[0], x = _t[1]; const arr = _t.slice(2, 2 + n);\n";
            case STR1 -> "const _l = _d.split('\\n'); const s = (_l[0] || '').replace(/\\r$/, '');\n";
            case STR2 -> "const _l = _d.split('\\n'); const a = (_l[0] || '').replace(/\\r$/, ''); const b = (_l[1] || '').replace(/\\r$/, '');\n";
        };
    }
    private String jsPrint(OutShape out, String call) {
        return switch (out) {
            case INT -> "console.log(" + call + ");\n";
            case BOOL -> "console.log(" + call + " ? 'true' : 'false');\n";
            case INTARR -> "const _r = " + call + ";\nconsole.log((_r || []).join(' '));\n";
            case STR -> "const _r = " + call + ";\nconsole.log(_r == null ? '' : _r);\n";
        };
    }
    private String jsDriver(String func, InShape in, OutShape out) {
        return "const _d = require('fs').readFileSync(0, 'utf8');\n\n" + USER_CODE_TOKEN + "\n\n"
                + jsRead(in) + jsPrint(out, func + "(" + jsArgs(in) + ")");
    }
    private String jsArgs(InShape in) { return jsParams(in); }

    // ══════════════════════════════════════════════════════════════════════
    //  PROBLEM REGISTRATIONS (verified against each problem's sample I/O)
    // ══════════════════════════════════════════════════════════════════════
    private void registerArchetypes() {
        // ---- one integer -> integer ----
        arch("Reverse a Number", "reverseNumber", InShape.INT1, OutShape.INT);
        arch("Count Digits", "countDigits", InShape.INT1, OutShape.INT);
        arch("Factorial of a Number", "factorial", InShape.INT1, OutShape.INT);
        arch("Sum of First N Natural Numbers", "sumFirstN", InShape.INT1, OutShape.INT);
        arch("Sum of Digits", "sumOfDigits", InShape.INT1, OutShape.INT);
        arch("Count Set Bits", "countSetBits", InShape.INT1, OutShape.INT);
        arch("Sum of Cubes of First N Numbers", "sumOfCubes", InShape.INT1, OutShape.INT);
        arch("Sum of Squares of First N Numbers", "sumOfSquares", InShape.INT1, OutShape.INT);
        arch("Number of Bits", "numberOfBits", InShape.INT1, OutShape.INT);
        arch("Absolute Value", "absoluteValue", InShape.INT1, OutShape.INT);
        arch("Count Repeating Digits", "countRepeatingDigits", InShape.INT1, OutShape.INT);
        arch("Climbing Stairs", "climbStairs", InShape.INT1, OutShape.INT);
        arch("Fibonacci Number", "fib", InShape.INT1, OutShape.INT);
        arch("Tribonacci Number", "tribonacci", InShape.INT1, OutShape.INT);
        arch("Count Ways to Climb Stairs", "countWays", InShape.INT1, OutShape.INT);

        // ---- one integer -> boolean ----
        arch("Palindrome Number", "isPalindrome", InShape.INT1, OutShape.BOOL);
        arch("Check Armstrong Number", "isArmstrong", InShape.INT1, OutShape.BOOL);
        arch("Check Prime Number", "isPrime", InShape.INT1, OutShape.BOOL);
        arch("Check Power of Two", "isPowerOfTwo", InShape.INT1, OutShape.BOOL);
        arch("Check Perfect Number", "isPerfect", InShape.INT1, OutShape.BOOL);
        arch("Check Neon Number", "isNeon", InShape.INT1, OutShape.BOOL);
        arch("Check Palindrome Number", "isPalindromeNumber", InShape.INT1, OutShape.BOOL);
        arch("Check Perfect Square", "isPerfectSquare", InShape.INT1, OutShape.BOOL);
        arch("Check Abundant Number", "isAbundant", InShape.INT1, OutShape.BOOL);
        arch("Check Leap Year", "isLeapYear", InShape.INT1, OutShape.BOOL);
        arch("Check Fibonacci Number", "isFibonacci", InShape.INT1, OutShape.BOOL);

        // ---- one integer -> integer array ----
        arch("Print All Divisors", "allDivisors", InShape.INT1, OutShape.INTARR);
        arch("Print Fibonacci Series", "fibSeries", InShape.INT1, OutShape.INTARR);
        arch("Pascal's Triangle Row", "pascalRow", InShape.INT1, OutShape.INTARR);
        arch("Print 1 to N", "printOneToN", InShape.INT1, OutShape.INTARR);
        arch("Print N to 1", "printNToOne", InShape.INT1, OutShape.INTARR);

        // ---- one integer -> string ----
        arch("Decimal to Binary", "decimalToBinary", InShape.INT1, OutShape.STR);
        arch("Check Even or Odd", "evenOrOdd", InShape.INT1, OutShape.STR);

        // ---- two integers -> integer ----
        arch("GCD of Two Numbers", "gcd", InShape.INT2, OutShape.INT);
        arch("LCM of Two Numbers", "lcm", InShape.INT2, OutShape.INT);
        arch("Power of a Number", "power", InShape.INT2, OutShape.INT);
        arch("XOR of Two Numbers", "xorOf", InShape.INT2, OutShape.INT);
        arch("AND of Two Numbers", "andOf", InShape.INT2, OutShape.INT);
        arch("OR of Two Numbers", "orOf", InShape.INT2, OutShape.INT);
        arch("Multiply Two Numbers", "multiply", InShape.INT2, OutShape.INT);
        arch("Power Using Recursion", "powerRec", InShape.INT2, OutShape.INT);
        arch("GCD of Two Numbers Using Euclidean Algorithm", "gcdEuclid", InShape.INT2, OutShape.INT);
        arch("Toggle Kth Bit", "toggleKthBit", InShape.INT2, OutShape.INT);
        arch("Check Kth Bit", "checkKthBit", InShape.INT2, OutShape.INT);

        // ---- three integers -> integer ----
        arch("Largest of Three Numbers", "largestOfThree", InShape.INT3, OutShape.INT);
        arch("Smallest of Three Numbers", "smallestOfThree", InShape.INT3, OutShape.INT);

        // ---- integer array -> integer ----
        arch("Best Time to Buy and Sell Stock", "maxProfit", InShape.ARR, OutShape.INT);
        arch("Single Number", "singleNumber", InShape.ARR, OutShape.INT);
        arch("Find Maximum Element", "findMax", InShape.ARR, OutShape.INT);
        arch("Find Minimum Element", "findMin", InShape.ARR, OutShape.INT);
        arch("Sum of Array Elements", "arraySum", InShape.ARR, OutShape.INT);
        arch("Product of Array Elements", "arrayProduct", InShape.ARR, OutShape.INT);
        arch("Maximum Product of Two Elements", "maxProductOfTwo", InShape.ARR, OutShape.INT);
        arch("XOR of All Elements", "xorAll", InShape.ARR, OutShape.INT);
        arch("Second Largest Element", "secondLargest", InShape.ARR, OutShape.INT);
        arch("Maximum Consecutive Ones", "maxConsecutiveOnes", InShape.ARR, OutShape.INT);
        arch("Sum of Even Numbers in Array", "sumEven", InShape.ARR, OutShape.INT);
        arch("Sum of Odd Numbers in Array", "sumOdd", InShape.ARR, OutShape.INT);
        arch("Count Zeros in Array", "countZeros", InShape.ARR, OutShape.INT);
        arch("Count Negative Numbers", "countNegatives", InShape.ARR, OutShape.INT);
        arch("Majority Element (Moore Voting)", "majorityElement", InShape.ARR, OutShape.INT);
        arch("Longest Equal Subarray", "longestEqualSubarray", InShape.ARR, OutShape.INT);
        arch("Difference Between Max and Min", "maxMinDiff", InShape.ARR, OutShape.INT);
        arch("Sum of Array (Recursion)", "arraySumRec", InShape.ARR, OutShape.INT);

        // ---- integer array -> boolean ----
        arch("Contains Duplicate", "containsDuplicate", InShape.ARR, OutShape.BOOL);
        arch("Check if Array is Sorted", "isSorted", InShape.ARR, OutShape.BOOL);
        arch("Check if Array is Sorted and Rotated", "isSortedAndRotated", InShape.ARR, OutShape.BOOL);
        arch("Check if Array is Sorted Descending", "isSortedDescending", InShape.ARR, OutShape.BOOL);

        // ---- integer array -> integer array ----
        arch("Reverse an Array", "reverseArray", InShape.ARR, OutShape.INTARR);
        arch("Selection Sort", "selectionSort", InShape.ARR, OutShape.INTARR);
        arch("Bubble Sort", "bubbleSort", InShape.ARR, OutShape.INTARR);
        arch("Insertion Sort", "insertionSort", InShape.ARR, OutShape.INTARR);
        arch("Left Rotate Array by One", "leftRotateByOne", InShape.ARR, OutShape.INTARR);
        arch("Remove Duplicates from Array", "removeDuplicates", InShape.ARR, OutShape.INTARR);
        arch("Prefix Sum Array", "prefixSum", InShape.ARR, OutShape.INTARR);
        arch("Running Maximum Array", "runningMax", InShape.ARR, OutShape.INTARR);
        arch("Leaders in an Array", "leaders", InShape.ARR, OutShape.INTARR);
        arch("Absolute Values of Array", "absoluteValues", InShape.ARR, OutShape.INTARR);
        arch("Square Each Element", "squareEach", InShape.ARR, OutShape.INTARR);
        arch("Move All Zeros to End", "moveZerosToEnd", InShape.ARR, OutShape.INTARR);
        arch("Wave Sort Array", "waveSort", InShape.ARR, OutShape.INTARR);
        arch("Sort Array by Parity (Custom)", "sortByParity", InShape.ARR, OutShape.INTARR);
        arch("Count Frequency of Elements", "countFrequency", InShape.ARR, OutShape.INTARR);

        // ---- integer array + integer -> integer ----
        arch("Binary Search", "binarySearch", InShape.ARRINT, OutShape.INT);
        arch("Floor in Sorted Array", "floorInSorted", InShape.ARRINT, OutShape.INT);
        arch("Ceil in Sorted Array", "ceilInSorted", InShape.ARRINT, OutShape.INT);
        arch("Count Occurrences in Sorted Array", "countOccurrences", InShape.ARRINT, OutShape.INT);
        arch("Count Pairs with Given Difference", "countPairsWithDiff", InShape.ARRINT, OutShape.INT);
        arch("Best Time to Buy and Sell Stock with Transaction Fee", "maxProfitWithFee", InShape.ARRINT, OutShape.INT);

        // ---- integer array + integer -> integer array ----
        arch("Left Rotate Array by K Places", "leftRotateByK", InShape.ARRINT, OutShape.INTARR);
        arch("Right Rotate Array by K", "rightRotateByK", InShape.ARRINT, OutShape.INTARR);

        // ---- string -> string ----
        arch("Reverse String", "reverseString", InShape.STR1, OutShape.STR);
        arch("Convert to Uppercase", "toUppercase", InShape.STR1, OutShape.STR);
        arch("Convert to Lowercase", "toLowercase", InShape.STR1, OutShape.STR);
        arch("Remove Vowels from String", "removeVowels", InShape.STR1, OutShape.STR);
        arch("Reverse Words", "reverseWords", InShape.STR1, OutShape.STR);
        arch("Reverse String Word by Word", "reverseWordByWord", InShape.STR1, OutShape.STR);
        arch("String Compression", "compressString", InShape.STR1, OutShape.STR);
        arch("Remove Outermost Parentheses", "removeOuterParentheses", InShape.STR1, OutShape.STR);
        arch("Largest Odd Number in String", "largestOddNumber", InShape.STR1, OutShape.STR);

        // ---- string -> boolean ----
        arch("Valid Parentheses", "isValid", InShape.STR1, OutShape.BOOL);
        arch("Check Palindrome String", "isPalindromeString", InShape.STR1, OutShape.BOOL);
        arch("Balanced Parentheses", "isBalanced", InShape.STR1, OutShape.BOOL);

        // ---- string -> integer ----
        arch("Count Vowels in String", "countVowels", InShape.STR1, OutShape.INT);
        arch("Length of String", "stringLength", InShape.STR1, OutShape.INT);
        arch("Count Words in String", "countWords", InShape.STR1, OutShape.INT);
        arch("Alternating Characters", "alternatingDeletions", InShape.STR1, OutShape.INT);
        arch("Maximum Nesting Depth of Parentheses", "maxDepth", InShape.STR1, OutShape.INT);
        arch("First Unique Character", "firstUniqChar", InShape.STR1, OutShape.INT);
        arch("Longest Palindrome from Characters", "longestPalindrome", InShape.STR1, OutShape.INT);
        arch("Binary to Decimal", "binaryToDecimal", InShape.STR1, OutShape.INT);

        // ---- two strings -> boolean ----
        // NOTE: "Is Subsequence" intentionally excluded — its seeded test data is malformed
        // (single-line cases expecting "true" with no second string), unsolvable by any correct answer.
        arch("Rotate String", "rotateString", InShape.STR2, OutShape.BOOL);
        arch("Valid Anagram Check", "isAnagram", InShape.STR2, OutShape.BOOL);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  Hand-written multi-language harness: Two Sum (includes C / C++ too)
    //  Input: line1 = "N target", line2 = N nums. Output: two indices.
    // ══════════════════════════════════════════════════════════════════════
    private void registerTwoSum() {
        String title = "Two Sum";

        register(title, ProgrammingLanguage.JAVA,
                """
                class Solution {
                    public int[] twoSum(int[] nums, int target) {
                        // Write your code here

                    }
                }
                """,
                """
                import java.util.*;
                import java.io.*;

                __USER_CODE__

                public class Main {
                    public static void main(String[] args) throws Exception {
                        StreamTokenizer in = new StreamTokenizer(new BufferedReader(new InputStreamReader(System.in)));
                        in.nextToken(); int n = (int) in.nval;
                        in.nextToken(); int target = (int) in.nval;
                        int[] nums = new int[n];
                        for (int i = 0; i < n; i++) { in.nextToken(); nums[i] = (int) in.nval; }
                        int[] res = new Solution().twoSum(nums, target);
                        StringBuilder sb = new StringBuilder();
                        if (res != null) {
                            for (int i = 0; i < res.length; i++) { if (i > 0) sb.append(' '); sb.append(res[i]); }
                        }
                        System.out.println(sb.toString());
                    }
                }
                """);

        register(title, ProgrammingLanguage.PYTHON,
                """
                class Solution:
                    def twoSum(self, nums, target):
                        # Write your code here
                        pass
                """,
                """
                import sys

                __USER_CODE__

                def __main():
                    data = sys.stdin.read().split()
                    n = int(data[0])
                    target = int(data[1])
                    nums = list(map(int, data[2:2 + n]))
                    res = Solution().twoSum(nums, target)
                    print(' '.join(map(str, res)) if res else '')

                __main()
                """);

        register(title, ProgrammingLanguage.CPP,
                """
                class Solution {
                public:
                    vector<int> twoSum(vector<int>& nums, int target) {
                        // Write your code here

                    }
                };
                """,
                """
                #include <bits/stdc++.h>
                using namespace std;

                __USER_CODE__

                int main() {
                    int n, target;
                    if (!(cin >> n >> target)) return 0;
                    vector<int> nums(n);
                    for (int i = 0; i < n; i++) cin >> nums[i];
                    vector<int> res = Solution().twoSum(nums, target);
                    for (size_t i = 0; i < res.size(); i++) { if (i) cout << ' '; cout << res[i]; }
                    cout << '\\n';
                    return 0;
                }
                """);

        register(title, ProgrammingLanguage.C,
                """
                /**
                 * Return a malloc'd array of the two indices and set *returnSize = 2.
                 */
                int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
                    // Write your code here

                }
                """,
                """
                #include <stdio.h>
                #include <stdlib.h>

                __USER_CODE__

                int main() {
                    int n, target;
                    if (scanf("%d %d", &n, &target) != 2) return 0;
                    int* nums = (int*)malloc(sizeof(int) * (n > 0 ? n : 1));
                    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
                    int returnSize = 0;
                    int* res = twoSum(nums, n, target, &returnSize);
                    for (int i = 0; i < returnSize; i++) { if (i) printf(" "); printf("%d", res[i]); }
                    printf("\\n");
                    return 0;
                }
                """);

        register(title, ProgrammingLanguage.JAVASCRIPT,
                """
                /**
                 * @param {number[]} nums
                 * @param {number} target
                 * @return {number[]}
                 */
                var twoSum = function(nums, target) {
                    // Write your code here

                };
                """,
                """
                const __t = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);

                __USER_CODE__

                const __n = __t[0];
                const __target = __t[1];
                const __nums = __t.slice(2, 2 + __n);
                const __res = twoSum(__nums, __target);
                console.log((__res || []).join(' '));
                """);
    }
}

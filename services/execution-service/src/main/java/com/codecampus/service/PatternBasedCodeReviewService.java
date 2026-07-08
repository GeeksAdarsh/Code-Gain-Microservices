package com.codecampus.service;

import com.codecampus.model.Question;
import com.codecampus.model.SubmissionStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lightweight, deterministic "code review" hints from patterns + verdict context.
 * No external AI — safe for contests (no hidden test leakage beyond what the API already exposes).
 */
@Service
public class PatternBasedCodeReviewService {

    private static final Pattern FOR_LOOP = Pattern.compile("\\bfor\\s*\\(");
    private static final Pattern WHILE_LOOP = Pattern.compile("\\bwhile\\s*\\(");
    private static final Pattern NESTED_FOR = Pattern.compile("(?s)\\bfor\\s*\\([^)]*\\)\\s*\\{[^}]*\\bfor\\s*\\(");

    /**
     * @param gradedAgainstAllTests true when this verdict is from running the full hidden test suite (submit); false for Run / custom input only
     */
    public List<String> buildHints(
            String code,
            SubmissionStatus status,
            String errorOutput,
            String judgeOutputSummary,
            String failedInput,
            String failedExpected,
            String failedActual,
            Question question,
            boolean gradedAgainstAllTests
    ) {
        if (code == null) code = "";
        String compact = code.replaceAll("//.*", "").replaceAll("/\\*([\\s\\S]*?)\\*/", "");
        String lower = compact.toLowerCase(Locale.ROOT);

        LinkedHashSet<String> hints = new LinkedHashSet<>();

        String topic = question != null ? joinTopic(question) : "";
        List<String> tags = question != null && question.getTags() != null
                ? question.getTags().stream().filter(Objects::nonNull).map(t -> t.toLowerCase(Locale.ROOT)).toList()
                : List.of();

        String fa = failedActual != null ? failedActual.trim() : "";
        boolean tle = status == SubmissionStatus.TIME_LIMIT_EXCEEDED
                || "Time Limit Exceeded".equalsIgnoreCase(fa)
                || (judgeOutputSummary != null && (judgeOutputSummary.contains("TLE")
                        || judgeOutputSummary.toLowerCase(Locale.ROOT).contains("time limit")));
        boolean accepted = status == SubmissionStatus.ACCEPTED;
        boolean ce = status == SubmissionStatus.COMPILATION_ERROR;
        boolean re = status == SubmissionStatus.RUNTIME_ERROR;

        int forCount = countMatches(FOR_LOOP, compact);
        int whileCount = countMatches(WHILE_LOOP, compact);
        boolean nestedFor = NESTED_FOR.matcher(compact).find();
        boolean heavyLooping = nestedFor || forCount >= 2 || (forCount >= 1 && whileCount >= 1);

        boolean usesHash = mentionsHashStructure(lower);
        boolean mentionsArrayOrList = lower.contains("array") || lower.contains("vector") || lower.contains("list<")
                || lower.contains("[") || topic.contains("array");

        if (accepted) {
            if (gradedAgainstAllTests) {
                hints.add("All tests passed — nice work.");
            } else {
                hints.add("Run finished successfully (exit code 0). Match your output to the expected format before you submit.");
            }
            if (heavyLooping && (tags.contains("hash-table") || tags.contains("hash map") || topic.contains("two sum")
                    || topic.contains("pair") || topic.contains("subarray"))) {
                hints.add(gradedAgainstAllTests
                        ? "Your approach may be O(n²). If constraints grow, consider a HashMap / set for O(n) lookups."
                        : "Heavy nesting is often O(n²) — if you get TLE on submit, try HashMap, two pointers, or prefix sums.");
            } else if (heavyLooping && mentionsArrayOrList) {
                hints.add(gradedAgainstAllTests
                        ? "Nested loops are often O(n²). Check whether a HashMap, sorting + two pointers, or prefix sums could help."
                        : "Nested loops may be too slow for large inputs — keep that in mind when you submit.");
            }
            if (!usesHash && (tags.contains("frequency") || tags.contains("counting") || topic.contains("frequency"))) {
                hints.add("For counting occurrences, a map from value → count is usually clearer than repeated linear scans.");
            }
            if (gradedAgainstAllTests && (topic.contains("in-place") || topic.contains("in place") || topic.contains("o(1) extra") || topic.contains("o(1) memory"))) {
                hints.add("Problem text often targets O(n) time and O(1) extra space for in-place work — compare with your approach.");
            }
            return new ArrayList<>(hints);
        }

        if (tle) {
            hints.add("Time limit exceeded — your algorithm may be too slow for large inputs.");
            if (heavyLooping) {
                hints.add("Nested loops often cause TLE. Try lowering time complexity (e.g. HashMap, single pass, binary search).");
            }
        }

        if (ce && errorOutput != null) {
            String err = errorOutput.toLowerCase(Locale.ROOT);
            if (err.contains("expected ';'") || err.contains("';' expected")) {
                hints.add("Syntax: check missing semicolons or mismatched braces.");
            }
            if (err.contains("cannot find symbol") || err.contains("undefined reference")) {
                hints.add("Compiler: undefined name — check spelling, imports, and that your class/file name matches (e.g. Main.java → class Main).");
            }
            if (err.contains("incompatible types") || err.contains("cannot convert")) {
                hints.add("Type mismatch — check return types and variable declarations against the problem output format.");
            }
        }

        if (re && errorOutput != null) {
            String err = errorOutput.toLowerCase(Locale.ROOT);
            if (err.contains("indexoutofbounds") || err.contains("string index out of range") || err.contains("list index out of range")) {
                hints.add("Index error — verify loop bounds and empty / length-1 inputs.");
            }
            if (err.contains("nullpointer") || err.contains("none type") || err.contains("cannot read property")) {
                hints.add("Possible null / undefined access — guard edge cases before dereferencing.");
            }
            if (err.contains("zerodivision") || err.contains("division by zero") || err.contains("divide by zero")
                    || err.contains("/ by zero")) {
                hints.add("Division by zero — check when the divisor can be 0.");
            }
        }

        if (status == SubmissionStatus.WRONG_ANSWER) {
            if (failedInput != null || failedExpected != null) {
                edgeCaseAndOutputHints(failedInput, failedExpected, failedActual, hints);
            } else {
                hints.add("Hidden test failed — re-read constraints and try edge cases (empty input, boundaries, duplicates).");
            }
            if (heavyLooping && !tle && (mentionsArrayOrList || tags.stream().anyMatch(t -> t.contains("array")))) {
                hints.add("Wrong answer on some cases — if your logic is brute force, re-check edge cases (empty, single element, duplicates).");
            }
        }

        if (hints.isEmpty()) {
            hints.add("Keep iterating: trace your code on a small example and compare with the expected output format.");
        }

        return new ArrayList<>(hints);
    }

    private static void edgeCaseAndOutputHints(String failedInput, String failedExpected, String failedActual, Set<String> hints) {
        if (failedExpected == null) failedExpected = "";
        if (failedActual == null) failedActual = "";

        String in = failedInput != null ? failedInput.trim() : "";
        if (in.isEmpty()) {
            hints.add("Edge case: empty or minimal input often breaks solutions — test n=0, single element, or empty lines explicitly.");
        }

        if (!failedExpected.isEmpty() && failedActual.trim().equals(failedExpected.trim())) {
            hints.add("Output matches when trimmed — check trailing/leading spaces or extra newlines vs the required format.");
        } else if (!failedExpected.isEmpty() && failedActual.replaceAll("\\s+", "").equals(failedExpected.replaceAll("\\s+", ""))) {
            hints.add("Values look right but whitespace differs — match the exact line breaks and spacing from the statement.");
        }

        if (failedActual.trim().isEmpty() && !failedExpected.trim().isEmpty()) {
            hints.add("Your program printed nothing — ensure you print/return the answer for every valid input path.");
        }
    }

    private static boolean mentionsHashStructure(String lower) {
        return lower.contains("hashmap") || lower.contains("unordered_map") || lower.contains("dictionary")
                || lower.contains("dict[") || lower.contains("map<") || lower.contains("set<")
                || lower.contains("hashset") || lower.contains("unordered_set");
    }

    private static int countMatches(Pattern p, String s) {
        int n = 0;
        Matcher m = p.matcher(s);
        while (m.find()) n++;
        return n;
    }

    private static String joinTopic(Question q) {
        StringBuilder sb = new StringBuilder();
        if (q.getTitle() != null) sb.append(q.getTitle()).append(' ');
        if (q.getDescription() != null) sb.append(q.getDescription()).append(' ');
        if (q.getConstraints() != null) sb.append(q.getConstraints());
        return sb.toString().toLowerCase(Locale.ROOT);
    }
}

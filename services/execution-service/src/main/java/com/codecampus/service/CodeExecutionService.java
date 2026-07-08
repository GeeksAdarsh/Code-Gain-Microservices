package com.codecampus.service;

import com.codecampus.dto.CodeExecutionRequest;
import com.codecampus.dto.CodeExecutionResponse;
import com.codecampus.model.*;
import com.codecampus.repository.QuestionRepository;
import com.codecampus.repository.SubmissionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

@Service
public class CodeExecutionService {

    private static final Logger log = LoggerFactory.getLogger(CodeExecutionService.class);

    @Value("${code.execution.timeout:10}")
    private int executionTimeout;

    @Value("${judge0.api.url:}")
    private String judge0Url;

    // ── Concurrency guard ──────────────────────────────────────────────────
    // Each Run/Submit spawns a compiler/interpreter process (CPU + RAM heavy).
    // On a small instance an exam-deadline spike (everyone hits Submit at once)
    // could OOM/saturate the box. We cap how many code executions run at the
    // same time; extra requests wait briefly instead of crashing the server.
    @Value("${code.execution.max-concurrent:12}")
    private int maxConcurrentExecutions;

    @Value("${code.execution.queue-timeout-seconds:60}")
    private int queueTimeoutSeconds;

    private Semaphore executionSlots;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Map<ProgrammingLanguage, Integer> JUDGE0_LANG_IDS = Map.of(
            ProgrammingLanguage.C, 50,
            ProgrammingLanguage.CPP, 54,
            ProgrammingLanguage.JAVA, 62,
            ProgrammingLanguage.PYTHON, 71,
            ProgrammingLanguage.JAVASCRIPT, 63
    );

    private boolean judge0Available = false;

    private final QuestionRepository questionRepository;
    private final SubmissionRepository submissionRepository;
    private final PatternBasedCodeReviewService patternBasedCodeReviewService;
    private final NotificationService notificationService;
    private final HarnessRegistry harnessRegistry;

    public CodeExecutionService(QuestionRepository questionRepository, SubmissionRepository submissionRepository,
                                PatternBasedCodeReviewService patternBasedCodeReviewService, NotificationService notificationService,
                                HarnessRegistry harnessRegistry) {
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
        this.patternBasedCodeReviewService = patternBasedCodeReviewService;
        this.notificationService = notificationService;
        this.harnessRegistry = harnessRegistry;
    }

    /**
     * For LeetCode-style (function mode) problems, wrap the user's function with the hidden driver.
     * For all other problems the code is returned unchanged (classic stdin/stdout mode).
     */
    private String sourceForSingleRun(CodeExecutionRequest request) {
        Long qid = request.getReviewQuestionId() != null ? request.getReviewQuestionId() : request.getQuestionId();
        if (qid == null) return request.getCode();
        Question q = questionRepository.findById(qid).orElse(null);
        if (q == null) return request.getCode();
        return harnessRegistry.wrap(q.getTitle(), request.getLanguage(), request.getCode());
    }

    @PostConstruct
    private void initExecutionSlots() {
        int permits = Math.max(1, maxConcurrentExecutions);
        executionSlots = new Semaphore(permits, true);
        log.info("⚙️ Code execution concurrency cap = {} (extra submissions queue up to {}s)", permits, queueTimeoutSeconds);
    }

    @PostConstruct
    private void checkJudge0() {
        if (judge0Url == null || judge0Url.isBlank()) {
            log.info("⚙️ Judge0 URL not configured — using local code execution");
            return;
        }
        try {
            ResponseEntity<String> resp = restTemplate.getForEntity(judge0Url + "/system_info", String.class);
            if (resp.getStatusCode().is2xxSuccessful()) {
                judge0Available = true;
                log.info("✅ Judge0 connected at {} — using Docker-based code execution", judge0Url);
            }
        } catch (Exception e) {
            log.warn("⚠️ Judge0 at {} is not reachable — falling back to local execution. Start Docker with 'docker compose up -d' to enable.", judge0Url);
        }
    }

    private boolean useJudge0() {
        return judge0Available && judge0Url != null && !judge0Url.isBlank();
    }

    // ─── Public entry point ───────────────────────────────────────────────

    public CodeExecutionResponse executeCode(CodeExecutionRequest request, User user) {
        boolean acquired = false;
        try {
            // Throttle concurrent executions so a burst of submissions can't crash the box.
            acquired = executionSlots.tryAcquire(queueTimeoutSeconds, TimeUnit.SECONDS);
            if (!acquired) {
                log.warn("Execution slot wait timed out — server is at capacity ({} concurrent)", maxConcurrentExecutions);
                return CodeExecutionResponse.builder()
                        .status(SubmissionStatus.RUNTIME_ERROR)
                        .errorOutput("Server is busy handling many submissions right now. Please try again in a few seconds.")
                        .build();
            }
            if (request.getQuestionId() != null) {
                return executeAgainstTestCases(request, user);
            }
            CodeExecutionResponse run = executeSingleRun(request);
            attachCodeReview(request, run, null, run.getOutput() != null ? run.getOutput() : "");
            return run;
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            return CodeExecutionResponse.builder().status(SubmissionStatus.RUNTIME_ERROR).errorOutput("Execution was interrupted, please retry.").build();
        } catch (Exception e) {
            log.error("Code execution error: ", e);
            return CodeExecutionResponse.builder().status(SubmissionStatus.RUNTIME_ERROR).errorOutput(e.getMessage()).build();
        } finally {
            if (acquired) executionSlots.release();
        }
    }

    // ─── Single run (no test cases) ───────────────────────────────────────

    private CodeExecutionResponse executeSingleRun(CodeExecutionRequest request) throws Exception {
        if (useJudge0()) {
            return executeSingleRunJudge0(request);
        }
        return executeSingleRunLocal(request);
    }

    private CodeExecutionResponse executeSingleRunJudge0(CodeExecutionRequest request) throws Exception {
        Judge0Result result = callJudge0(sourceForSingleRun(request), request.getLanguage(), request.getInput(), executionTimeout);
        SubmissionStatus status = mapJudge0Status(result.statusId());
        if (status == SubmissionStatus.COMPILATION_ERROR) {
            return CodeExecutionResponse.builder().status(status).errorOutput(result.compileOutput()).build();
        }
        String output = result.stdout();
        String error = result.stderr();
        if (status == SubmissionStatus.TIME_LIMIT_EXCEEDED) output = "Time Limit Exceeded";
        return CodeExecutionResponse.builder()
                .status(status).output(output).errorOutput(error)
                .executionTimeMs(result.timeMs()).memoryUsedKb(result.memoryKb())
                .build();
    }

    private CodeExecutionResponse executeSingleRunLocal(CodeExecutionRequest request) throws Exception {
        Path tempDir = Files.createTempDirectory("codecampus_");
        Path sourceFile = tempDir.resolve(getFileName(request.getLanguage()));
        Files.writeString(sourceFile, sourceForSingleRun(request));

        long startTime = System.currentTimeMillis();
        String compileError = compileCode(request.getLanguage(), tempDir, sourceFile);
        if (compileError != null) { cleanup(tempDir); return CodeExecutionResponse.builder().status(SubmissionStatus.COMPILATION_ERROR).errorOutput(compileError).build(); }

        ProcessResult result = runCode(request.getLanguage(), tempDir, sourceFile, request.getInput(), executionTimeout);
        long executionTime = System.currentTimeMillis() - startTime;
        cleanup(tempDir);

        if (result.timedOut()) return CodeExecutionResponse.builder().status(SubmissionStatus.TIME_LIMIT_EXCEEDED).executionTimeMs(executionTime).output("Time Limit Exceeded").build();
        return CodeExecutionResponse.builder()
                .status(result.exitCode() == 0 ? SubmissionStatus.ACCEPTED : SubmissionStatus.RUNTIME_ERROR)
                .output(result.stdout()).errorOutput(result.stderr()).executionTimeMs(executionTime)
                .build();
    }

    // ─── Test-case judging ────────────────────────────────────────────────

    private CodeExecutionResponse executeAgainstTestCases(CodeExecutionRequest request, User user) throws Exception {
        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Question not found"));

        if (useJudge0()) {
            return judgeWithJudge0(request, user, question);
        }
        return judgeLocally(request, user, question);
    }

    private CodeExecutionResponse judgeWithJudge0(CodeExecutionRequest request, User user, Question question) throws Exception {
        List<TestCase> testCases = question.getTestCases();
        int passed = 0;
        long maxTime = 0;
        long maxMemory = 0;
        StringBuilder output = new StringBuilder();
        String failedInput = null, failedExpected = null, failedActual = null;
        int failedNum = 0;
        boolean isContestMode = request.getTestId() != null;
        boolean compilationFailed = false;
        String sourceCode = harnessRegistry.wrap(question.getTitle(), request.getLanguage(), request.getCode());

        for (int i = 0; i < testCases.size(); i++) {
            TestCase tc = testCases.get(i);
            int timeLimit = question.getTimeLimit() > 0 ? question.getTimeLimit() : executionTimeout;
            Judge0Result result = callJudge0(sourceCode, request.getLanguage(), tc.getInput(), timeLimit);
            SubmissionStatus tcStatus = mapJudge0Status(result.statusId());

            maxTime = Math.max(maxTime, result.timeMs());
            maxMemory = Math.max(maxMemory, result.memoryKb());

            if (tcStatus == SubmissionStatus.COMPILATION_ERROR) {
                cleanup(null);
                saveSubmission(user, question, request, SubmissionStatus.COMPILATION_ERROR, 0, testCases.size(), 0, "", result.compileOutput(), 0L);
                CodeExecutionResponse ce = CodeExecutionResponse.builder().status(SubmissionStatus.COMPILATION_ERROR)
                        .errorOutput(result.compileOutput()).totalTestCases(testCases.size()).build();
                attachCodeReview(request, ce, question, "");
                return ce;
            }

            if (tcStatus == SubmissionStatus.TIME_LIMIT_EXCEEDED) {
                output.append("Test Case ").append(i + 1).append(": TLE \u2717\n");
                if (failedInput == null) { failedInput = tc.getInput(); failedExpected = nullToEmptyTrim(tc.getExpectedOutput()); failedActual = "Time Limit Exceeded"; failedNum = i + 1; }
                continue;
            }
            if (tcStatus == SubmissionStatus.RUNTIME_ERROR || tcStatus == SubmissionStatus.MEMORY_LIMIT_EXCEEDED) {
                output.append("Test Case ").append(i + 1).append(": RE \u2717\n");
                if (failedInput == null && !isContestMode) { failedInput = tc.getInput(); failedExpected = nullToEmptyTrim(tc.getExpectedOutput()); failedActual = result.stderr(); failedNum = i + 1; }
                continue;
            }

            String expected = nullToEmptyTrim(tc.getExpectedOutput());
            String actual = result.stdout().trim();
            if (expected.equals(actual)) {
                passed++;
                output.append("Test Case ").append(i + 1).append(": PASSED \u2713\n");
            } else {
                output.append("Test Case ").append(i + 1).append(": FAILED \u2717\n");
                if (failedInput == null && !isContestMode) { failedInput = tc.getInput(); failedExpected = expected; failedActual = actual; failedNum = i + 1; }
            }
        }

        SubmissionStatus status = passed == testCases.size() ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER;
        int score = testCases.isEmpty() ? 0 : (passed * 100) / testCases.size();
        saveSubmission(user, question, request, status, passed, testCases.size(), score, output.toString(), "", maxTime);

        var builder = CodeExecutionResponse.builder().status(status).output(output.toString())
                .testCasesPassed(passed).totalTestCases(testCases.size())
                .executionTimeMs(maxTime).memoryUsedKb(maxMemory).score(score);
        if (failedInput != null && !isContestMode) {
            builder.failedInput(failedInput).failedExpected(failedExpected).failedActual(failedActual).failedTestCaseNumber(failedNum);
        }
        CodeExecutionResponse judged = builder.build();
        attachCodeReview(request, judged, question, output.toString());
        return judged;
    }

    private CodeExecutionResponse judgeLocally(CodeExecutionRequest request, User user, Question question) throws Exception {
        Path tempDir = Files.createTempDirectory("codecampus_");
        Path sourceFile = tempDir.resolve(getFileName(request.getLanguage()));
        Files.writeString(sourceFile, harnessRegistry.wrap(question.getTitle(), request.getLanguage(), request.getCode()));

        String compileError = compileCode(request.getLanguage(), tempDir, sourceFile);
        if (compileError != null) {
            cleanup(tempDir);
            saveSubmission(user, question, request, SubmissionStatus.COMPILATION_ERROR, 0, question.getTestCases().size(), 0, "", compileError, 0L);
            CodeExecutionResponse ce = CodeExecutionResponse.builder().status(SubmissionStatus.COMPILATION_ERROR)
                    .errorOutput(compileError).totalTestCases(question.getTestCases().size()).build();
            attachCodeReview(request, ce, question, "");
            return ce;
        }

        List<TestCase> testCases = question.getTestCases();
        int passed = 0; long maxTime = 0;
        StringBuilder output = new StringBuilder();
        String failedInput = null, failedExpected = null, failedActual = null;
        int failedNum = 0;
        boolean isContestMode = request.getTestId() != null;

        for (int i = 0; i < testCases.size(); i++) {
            TestCase tc = testCases.get(i);
            long st = System.currentTimeMillis();
            ProcessResult result = runCode(request.getLanguage(), tempDir, sourceFile, tc.getInput(), question.getTimeLimit());
            long elapsed = System.currentTimeMillis() - st;
            maxTime = Math.max(maxTime, elapsed);

            if (result.timedOut()) {
                output.append("Test Case ").append(i + 1).append(": TLE \u2717\n");
                if (failedInput == null) { failedInput = tc.getInput(); failedExpected = nullToEmptyTrim(tc.getExpectedOutput()); failedActual = "Time Limit Exceeded"; failedNum = i + 1; }
                continue;
            }
            String expected = nullToEmptyTrim(tc.getExpectedOutput()), actual = result.stdout().trim();
            if (expected.equals(actual)) {
                passed++;
                output.append("Test Case ").append(i + 1).append(": PASSED \u2713\n");
            } else {
                output.append("Test Case ").append(i + 1).append(": FAILED \u2717\n");
                if (failedInput == null && !isContestMode) { failedInput = tc.getInput(); failedExpected = expected; failedActual = actual; failedNum = i + 1; }
            }
        }
        cleanup(tempDir);
        SubmissionStatus status = passed == testCases.size() ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER;
        int score = testCases.isEmpty() ? 0 : (passed * 100) / testCases.size();
        saveSubmission(user, question, request, status, passed, testCases.size(), score, output.toString(), "", maxTime);

        var builder = CodeExecutionResponse.builder().status(status).output(output.toString())
                .testCasesPassed(passed).totalTestCases(testCases.size()).executionTimeMs(maxTime).score(score);
        if (failedInput != null && !isContestMode) {
            builder.failedInput(failedInput).failedExpected(failedExpected).failedActual(failedActual).failedTestCaseNumber(failedNum);
        }
        CodeExecutionResponse judged = builder.build();
        attachCodeReview(request, judged, question, output.toString());
        return judged;
    }

    // ─── Judge0 API ───────────────────────────────────────────────────────

    private Judge0Result callJudge0(String sourceCode, ProgrammingLanguage language, String input, int timeLimitSeconds) throws Exception {
        Integer langId = JUDGE0_LANG_IDS.get(language);
        if (langId == null) throw new RuntimeException("Unsupported language for Judge0: " + language);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("source_code", sourceCode);
        body.put("language_id", langId);
        body.put("stdin", input != null ? input : "");
        body.put("cpu_time_limit", timeLimitSeconds);
        body.put("wall_time_limit", timeLimitSeconds * 2);
        body.put("memory_limit", 262144);

        String url = judge0Url + "/submissions?base64_encoded=false&wait=true&fields=stdout,stderr,status_id,compile_output,time,memory";

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
            JsonNode json = objectMapper.readTree(response.getBody());

            String stdout = json.has("stdout") && !json.get("stdout").isNull() ? json.get("stdout").asText() : "";
            String stderr = json.has("stderr") && !json.get("stderr").isNull() ? json.get("stderr").asText() : "";
            String compileOutput = json.has("compile_output") && !json.get("compile_output").isNull() ? json.get("compile_output").asText() : "";
            int statusId = json.get("status_id").asInt();
            long timeMs = json.has("time") && !json.get("time").isNull() ? (long) (json.get("time").asDouble() * 1000) : 0;
            long memoryKb = json.has("memory") && !json.get("memory").isNull() ? json.get("memory").asLong() : 0;

            return new Judge0Result(stdout, stderr, compileOutput, statusId, timeMs, memoryKb);
        } catch (Exception e) {
            log.error("Judge0 API call failed — falling back to local execution for this request", e);
            judge0Available = false;
            throw e;
        }
    }

    private SubmissionStatus mapJudge0Status(int statusId) {
        return switch (statusId) {
            case 3 -> SubmissionStatus.ACCEPTED;
            case 4 -> SubmissionStatus.WRONG_ANSWER;
            case 5 -> SubmissionStatus.TIME_LIMIT_EXCEEDED;
            case 6 -> SubmissionStatus.COMPILATION_ERROR;
            case 7, 8, 9, 10, 11, 12 -> SubmissionStatus.RUNTIME_ERROR;
            case 13, 14 -> SubmissionStatus.RUNTIME_ERROR;
            default -> SubmissionStatus.RUNTIME_ERROR;
        };
    }

    private record Judge0Result(String stdout, String stderr, String compileOutput, int statusId, long timeMs, long memoryKb) {}

    // ─── Local execution (fallback) ───────────────────────────────────────

    private String compileCode(ProgrammingLanguage language, Path tempDir, Path sourceFile) throws Exception {
        ProcessBuilder pb;
        boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
        String outputName = isWindows ? "output.exe" : "output";
        switch (language) {
            case C: pb = new ProcessBuilder("gcc", sourceFile.toString(), "-o", tempDir.resolve(outputName).toString()); break;
            case CPP: pb = new ProcessBuilder("g++", sourceFile.toString(), "-o", tempDir.resolve(outputName).toString()); break;
            case JAVA: pb = new ProcessBuilder("javac", sourceFile.toString()); break;
            case PYTHON: case JAVASCRIPT: return null;
            default: return "Unsupported language";
        }
        pb.directory(tempDir.toFile());
        Process process = pb.start();
        boolean completed = process.waitFor(executionTimeout, TimeUnit.SECONDS);
        if (!completed) { process.destroyForcibly(); return "Compilation timed out"; }
        if (process.exitValue() != 0) return new String(process.getErrorStream().readAllBytes());
        return null;
    }

    private ProcessResult runCode(ProgrammingLanguage language, Path tempDir, Path sourceFile, String input, int timeLimitSeconds) throws Exception {
        ProcessBuilder pb;
        boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
        switch (language) {
            case C: case CPP:
                String exe = isWindows ? tempDir.resolve("output.exe").toString() : tempDir.resolve("output").toString();
                pb = new ProcessBuilder(exe); break;
            case JAVA:
                String cn = sourceFile.getFileName().toString().replace(".java", "");
                pb = new ProcessBuilder("java", "-cp", tempDir.toString(), cn); break;
            case PYTHON:
                String pythonCmd = isWindows ? "python" : "python3";
                pb = new ProcessBuilder(pythonCmd, sourceFile.toString()); break;
            case JAVASCRIPT:
                pb = new ProcessBuilder("node", sourceFile.toString()); break;
            default: return new ProcessResult("", "Unsupported language", 1, false);
        }
        pb.directory(tempDir.toFile());
        pb.redirectErrorStream(false);
        Process process = pb.start();

        if (input != null && !input.isEmpty()) {
            final Process p = process;
            new Thread(() -> {
                try (OutputStream os = p.getOutputStream()) { os.write(input.getBytes()); os.flush(); }
                catch (Exception ignored) {}
            }).start();
        } else {
            process.getOutputStream().close();
        }

        int timeout = timeLimitSeconds > 0 ? timeLimitSeconds : executionTimeout;
        boolean completed = process.waitFor(timeout, TimeUnit.SECONDS);
        if (!completed) { process.destroyForcibly(); return new ProcessResult("", "Time Limit Exceeded", -1, true); }

        String stdout = new String(process.getInputStream().readAllBytes()).trim();
        String stderr = new String(process.getErrorStream().readAllBytes()).trim();
        return new ProcessResult(stdout, stderr, process.exitValue(), false);
    }

    private String getFileName(ProgrammingLanguage language) {
        return switch (language) { case C -> "Main.c"; case CPP -> "Main.cpp"; case JAVA -> "Main.java"; case PYTHON -> "Main.py"; case JAVASCRIPT -> "Main.js"; };
    }

    private void cleanup(Path tempDir) {
        if (tempDir == null) return;
        try { Files.walk(tempDir).sorted(java.util.Comparator.reverseOrder()).map(Path::toFile).forEach(File::delete); } catch (IOException e) { log.warn("Cleanup failed: " + tempDir); }
    }

    private record ProcessResult(String stdout, String stderr, int exitCode, boolean timedOut) {}

    // ─── Shared helpers ───────────────────────────────────────────────────

    private void attachCodeReview(CodeExecutionRequest request, CodeExecutionResponse resp, Question question, String judgeOutputSummary) {
        Question q = question;
        if (q == null && request.getReviewQuestionId() != null) {
            q = questionRepository.findById(request.getReviewQuestionId()).orElse(null);
        }
        if (q == null) return;
        boolean gradedAgainstAllTests = request.getQuestionId() != null;
        resp.setCodeReview(patternBasedCodeReviewService.buildHints(
                request.getCode(), resp.getStatus(),
                resp.getErrorOutput(), judgeOutputSummary,
                resp.getFailedInput(), resp.getFailedExpected(), resp.getFailedActual(),
                q, gradedAgainstAllTests));
    }

    private void saveSubmission(User user, Question question, CodeExecutionRequest request, SubmissionStatus status, int passed, int total, int score, String output, String errorOutput, long executionTimeMs) {
        Submission submission = Submission.builder().user(user).question(question).code(request.getCode()).language(request.getLanguage())
                .status(status).testCasesPassed(passed).totalTestCases(total).score(score).output(output).errorOutput(errorOutput).executionTimeMs(executionTimeMs).build();
        if (request.getTestId() != null) { submission.setTestId(request.getTestId()); }
        submissionRepository.save(submission);
        if (status == SubmissionStatus.ACCEPTED) {
            notificationService.notifySubmissionAccepted(user, question, request.getTestId());
        }
    }

    private static String nullToEmptyTrim(String s) {
        return s == null ? "" : s.trim();
    }
}

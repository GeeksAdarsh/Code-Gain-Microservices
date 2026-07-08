package com.codecampus.service;

import com.codecampus.model.*;
import com.codecampus.repository.QuestionRepository;
import com.codecampus.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ProblemSeeder {

    private static final Logger log = LoggerFactory.getLogger(ProblemSeeder.class);
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;

    public ProblemSeeder(QuestionRepository questionRepository, UserRepository userRepository, EntityManager entityManager) {
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public void seedProblems() {
        if (questionRepository.count() > 0) {
            log.info("\uD83D\uDCDA Problems already seeded ({} problems exist)", questionRepository.count());
            fixBadDescriptions();
            seedStriverProblems();
            return;
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream is = new ClassPathResource("problems.json").getInputStream();
            List<Map<String, Object>> problems = mapper.readValue(is, new TypeReference<>() {});

            User teacher = userRepository.findByUsername("teacher").orElse(null);
            int count = 0;

            for (Map<String, Object> p : problems) {
                try {
                    // Parse difficulty
                    Difficulty diff = Difficulty.valueOf((String) p.get("diff"));

                    // Parse tags
                    @SuppressWarnings("unchecked")
                    List<String> tags = (List<String>) p.getOrDefault("tags", new ArrayList<>());

                    // Build question
                    Question q = Question.builder()
                            .title((String) p.get("title"))
                            .description((String) p.get("desc"))
                            .inputFormat((String) p.get("inFmt"))
                            .outputFormat((String) p.get("outFmt"))
                            .constraints((String) p.get("constraints"))
                            .difficulty(diff)
                            .tags(tags)
                            .sampleInput((String) p.get("sIn"))
                            .sampleOutput((String) p.get("sOut"))
                            .explanation((String) p.get("explain"))
                            .timeLimit(p.get("tl") != null ? ((Number) p.get("tl")).intValue() : defaultTimeLimit(diff))
                            .memoryLimit(defaultMemoryLimit(diff))
                            .createdBy(teacher)
                            .build();

                    // Parse test cases
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> testCases = (List<Map<String, Object>>) p.getOrDefault("tc", new ArrayList<>());
                    List<TestCase> tcs = new ArrayList<>();

                    for (Map<String, Object> tc : testCases) {
                        boolean isSample = tc.getOrDefault("sample", false).equals(true);
                        tcs.add(TestCase.builder()
                                .input((String) tc.get("in"))
                                .expectedOutput((String) tc.get("out"))
                                .isSample(isSample)
                                .isHidden(!isSample)
                                .question(q)
                                .build());
                    }

                    q.setTestCases(tcs);
                    questionRepository.save(q);
                    count++;
                } catch (Exception e) {
                    log.warn("⚠️ Failed to seed problem: {} - {}", p.get("title"), e.getMessage());
                }
            }

            log.info("✅ Seeded {} coding problems from problems.json!", count);
            seedStriverProblems();

        } catch (Exception e) {
            log.error("❌ Failed to seed problems: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public void seedStriverProblems() {
        try {
            InputStream is = new ClassPathResource("striver_new_problems.json").getInputStream();
            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> problems = mapper.readValue(is, new TypeReference<>() {});
            User teacher = userRepository.findByUsername("teacher").orElse(null);
            int added = 0, updated = 0;

            for (Map<String, Object> p : problems) {
                String title = (String) p.get("title");

                try {
                    Difficulty diff = Difficulty.valueOf((String) p.get("diff"));
                    @SuppressWarnings("unchecked")
                    List<String> tags = (List<String>) p.getOrDefault("tags", new ArrayList<>());
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> testCases = (List<Map<String, Object>>) p.getOrDefault("tc", new ArrayList<>());

                    List<Question> existing = questionRepository.searchByKeyword(title);
                    Question q = existing.stream().filter(eq -> eq.getTitle().equals(title)).findFirst().orElse(null);

                    if (q != null) {
                        if (q.getTestCases().size() < testCases.size()) {
                            q.getTestCases().clear();
                            q.setDescription((String) p.get("desc"));
                            q.setInputFormat((String) p.get("inFmt"));
                            q.setOutputFormat((String) p.get("outFmt"));
                            q.setConstraints((String) p.get("constraints"));
                            q.setExplanation((String) p.get("explain"));
                            q.setSampleInput((String) p.get("sIn"));
                            q.setSampleOutput((String) p.get("sOut"));
                            for (Map<String, Object> tc : testCases) {
                                boolean isSample = tc.getOrDefault("sample", false).equals(true);
                                q.getTestCases().add(TestCase.builder().input((String) tc.get("in")).expectedOutput((String) tc.get("out"))
                                    .isSample(isSample).isHidden(!isSample).question(q).build());
                            }
                            questionRepository.save(q);
                            updated++;
                        }
                        continue;
                    }

                    q = Question.builder()
                        .title(title).description((String) p.get("desc"))
                        .inputFormat((String) p.get("inFmt")).outputFormat((String) p.get("outFmt"))
                        .constraints((String) p.get("constraints")).difficulty(diff).tags(tags)
                        .sampleInput((String) p.get("sIn")).sampleOutput((String) p.get("sOut"))
                        .explanation((String) p.get("explain"))
                        .timeLimit(p.get("tl") != null ? ((Number) p.get("tl")).intValue() : defaultTimeLimit(diff))
                        .memoryLimit(defaultMemoryLimit(diff)).createdBy(teacher).build();

                    List<TestCase> tcs = new ArrayList<>();
                    for (Map<String, Object> tc : testCases) {
                        boolean isSample = tc.getOrDefault("sample", false).equals(true);
                        tcs.add(TestCase.builder().input((String) tc.get("in")).expectedOutput((String) tc.get("out"))
                            .isSample(isSample).isHidden(!isSample).question(q).build());
                    }
                    q.setTestCases(tcs);
                    questionRepository.save(q);
                    added++;
                } catch (Exception e) {
                    log.warn("⚠️ Failed to process Striver problem: {} - {}", title, e.getMessage());
                }
            }
            if (added > 0 || updated > 0) log.info("🎯 Striver problems: {} added, {} updated with more test cases", added, updated);
        } catch (Exception e) {
            log.debug("No striver_new_problems.json found or error: {}", e.getMessage());
        }
    }

    private void fixBadDescriptions() {
        List<Question> all = questionRepository.findAll();
        List<Long> badIds = new ArrayList<>();
        int fixed = 0;

        for (Question q : all) {
            String desc = q.getDescription();
            if (desc == null) continue;

            boolean isBad = desc.contains("**Problem:") ||
                desc.contains("compute the required result") ||
                desc.contains("compute the sum of all elements in the array and print the result") ||
                "sample_input".equals(q.getSampleInput()) ||
                (q.getInputFormat() != null && q.getInputFormat().startsWith("See problem description"));

            if (!isBad && q.getTestCases() != null && q.getTestCases().size() > 1) {
                boolean allEcho = q.getTestCases().stream().allMatch(tc ->
                    tc.getInput() != null && tc.getInput().trim().equals(tc.getExpectedOutput() != null ? tc.getExpectedOutput().trim() : ""));
                if (allEcho) isBad = true;
            }

            if (isBad) {
                badIds.add(q.getId());
                continue;
            }

            List<TestCase> tcs = q.getTestCases();
            if (tcs != null) {
                long sampleCount = tcs.stream().filter(TestCase::isSample).count();
                if (sampleCount < 2 && tcs.size() >= 2) {
                    tcs.get(0).setSample(true); tcs.get(0).setHidden(false);
                    tcs.get(1).setSample(true); tcs.get(1).setHidden(false);
                    questionRepository.save(q);
                    fixed++;
                }
            }
        }

        if (!badIds.isEmpty()) {
            entityManager.flush();
            entityManager.clear();
            entityManager.createNativeQuery("DELETE FROM plagiarism_reports WHERE question_id IN (:ids)").setParameter("ids", badIds).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM test_questions WHERE question_id IN (:ids)").setParameter("ids", badIds).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM submissions WHERE question_id IN (:ids)").setParameter("ids", badIds).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM test_cases WHERE question_id IN (:ids)").setParameter("ids", badIds).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM question_tags WHERE question_id IN (:ids)").setParameter("ids", badIds).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM questions WHERE id IN (:ids)").setParameter("ids", badIds).executeUpdate();
            log.info("🗑️ Removed {} problems with placeholder/broken test data", badIds.size());
        }
        if (fixed > 0) log.info("🔧 Fixed {} problem sample visibility", fixed);
    }

    private static int defaultTimeLimit(Difficulty d) {
        return switch (d) { case EASY -> 1; case MEDIUM -> 2; case HARD -> 3; };
    }

    private static int defaultMemoryLimit(Difficulty d) {
        return switch (d) { case EASY -> 128; case MEDIUM -> 256; case HARD -> 512; };
    }
}

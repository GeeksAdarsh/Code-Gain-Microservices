package com.codecampus.controller;

import com.codecampus.model.*;
import com.codecampus.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/batch-section")
public class BatchSectionController {

    private static final String DEMO_BATCH_NAME = "Code-Campus-DemoBatcher";

    private final BatchRepository batchRepository;
    private final SectionRepository sectionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public BatchSectionController(BatchRepository batchRepository, SectionRepository sectionRepository,
                                   UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.batchRepository = batchRepository;
        this.sectionRepository = sectionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ──── BATCH CRUD ────

    // Public: used by the registration page to populate the Batch dropdown
    @GetMapping("/batches")
    public ResponseEntity<List<Map<String, Object>>> getAllBatches() {
        List<Batch> batches = batchRepository.findAll();
        List<Map<String, Object>> result = batches.stream().map(b -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", b.getId());
            m.put("name", b.getName());
            m.put("startYear", b.getStartYear());
            m.put("endYear", b.getEndYear());
            m.put("program", b.getProgram());
            m.put("sectionCount", b.getSections().size());
            m.put("studentCount", userRepository.findByBatchId(b.getId()).size());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/batches")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createBatch(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        int startYear = (Integer) body.get("startYear");
        int endYear = (Integer) body.get("endYear");
        String program = (String) body.getOrDefault("program", "B.Tech");

        if (batchRepository.existsByName(name)) return ResponseEntity.badRequest().body(Map.of("error", "Batch already exists"));

        Batch batch = new Batch(name, startYear, endYear, program);
        batchRepository.save(batch);
        return ResponseEntity.ok(Map.of("message", "Batch created", "id", batch.getId()));
    }

    @DeleteMapping("/batches/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteBatch(@PathVariable Long id) {
        try {
            List<User> students = userRepository.findByBatchId(id);
            userRepository.deleteAll(students);
            batchRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Deleted batch and " + students.size() + " students"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error",
                    "Could not delete batch — some students may have test submissions. Remove those first."));
        }
    }

    // ──── SECTION CRUD ────

    // Public: used by the registration page to populate the Section dropdown
    @GetMapping("/batches/{batchId}/sections")
    public ResponseEntity<List<Map<String, Object>>> getSections(@PathVariable Long batchId) {
        List<Section> sections = sectionRepository.findByBatchId(batchId);
        List<Map<String, Object>> result = sections.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("name", s.getName());
            m.put("batchId", batchId);
            m.put("batchName", s.getBatch().getName());
            putTeachers(m, s);
            m.put("studentCount", userRepository.findBySectionId(s.getId()).size());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sections")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<List<Map<String, Object>>> getAllSections(@AuthenticationPrincipal User user) {
        List<Section> sections;
        if (user.getRole() == com.codecampus.model.Role.ADMIN) {
            sections = sectionRepository.findAll();
        } else {
            sections = sectionRepository.findByTeachersId(user.getId());
        }
        return ResponseEntity.ok(sections.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("name", s.getName());
            m.put("fullName", s.getFullName());
            m.put("batchId", s.getBatch().getId());
            m.put("batchName", s.getBatch().getName());
            putTeachers(m, s);
            m.put("studentCount", userRepository.findBySectionId(s.getId()).size());
            return m;
        }).collect(Collectors.toList()));
    }

    @PostMapping("/batches/{batchId}/sections")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createSection(@PathVariable Long batchId, @RequestBody Map<String, String> body) {
        Batch batch = batchRepository.findById(batchId).orElseThrow(() -> new RuntimeException("Batch not found"));
        String name = body.get("name");
        if (sectionRepository.findByNameAndBatchId(name, batchId).isPresent())
            return ResponseEntity.badRequest().body(Map.of("error", "Section already exists in this batch"));
        Section section = new Section(name, batch);
        sectionRepository.save(section);
        return ResponseEntity.ok(Map.of("message", "Section created", "id", section.getId()));
    }

    // ──── TEACHER ASSIGNMENT ────

    // Add a teacher to a section (multiple teachers per section are supported).
    @PostMapping("/sections/{sectionId}/teachers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addTeacher(@PathVariable Long sectionId, @RequestBody Map<String, Long> body) {
        Section section = sectionRepository.findById(sectionId).orElseThrow();
        Long teacherId = body.get("teacherId");
        if (teacherId == null) return ResponseEntity.badRequest().body(Map.of("error", "teacherId is required"));
        if (section.hasTeacher(teacherId)) return ResponseEntity.ok(Map.of("message", "Teacher already assigned"));
        User teacher = userRepository.findById(teacherId).orElseThrow();
        section.addTeacher(teacher);
        sectionRepository.save(section);
        return ResponseEntity.ok(Map.of("message", "Teacher added"));
    }

    // Remove a single teacher from a section.
    @DeleteMapping("/sections/{sectionId}/teachers/{teacherId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeTeacher(@PathVariable Long sectionId, @PathVariable Long teacherId) {
        Section section = sectionRepository.findById(sectionId).orElseThrow();
        section.removeTeacher(teacherId);
        sectionRepository.save(section);
        return ResponseEntity.ok(Map.of("message", "Teacher removed"));
    }

    private void putTeachers(Map<String, Object> m, Section s) {
        List<Map<String, Object>> teacherList = s.getTeachers().stream()
            .map(t -> { Map<String, Object> tm = new LinkedHashMap<>(); tm.put("id", t.getId()); tm.put("name", t.getFullName()); return tm; })
            .collect(Collectors.toList());
        m.put("teachers", teacherList);
        // Backward-compatible fields: first teacher id + comma-joined names.
        m.put("teacherId", teacherList.isEmpty() ? null : teacherList.get(0).get("id"));
        m.put("teacherName", teacherList.isEmpty() ? null : teacherList.stream().map(t -> String.valueOf(t.get("name"))).collect(Collectors.joining(", ")));
    }

    // ──── STUDENTS IN SECTION ────

    @GetMapping("/sections/{sectionId}/students")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<List<Map<String, Object>>> getStudentsInSection(@PathVariable Long sectionId) {
        List<User> students = userRepository.findBySectionId(sectionId);
        return ResponseEntity.ok(students.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("fullName", u.getFullName());
            m.put("email", u.getEmail());
            m.put("systemId", u.getSystemId());
            m.put("enrollmentNumber", u.getEnrollmentNumber());
            m.put("track", u.getTrack());
            m.put("mobileNumber", u.getMobileNumber());
            m.put("program", u.getProgram());
            m.put("department", u.getDepartment());
            m.put("isDebarred", u.isDebarred());
            return m;
        }).collect(Collectors.toList()));
    }

    @DeleteMapping("/sections/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteSection(@PathVariable Long id) {
        try {
            List<User> students = userRepository.findBySectionId(id);
            userRepository.deleteAll(students);
            sectionRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Deleted section and " + students.size() + " students"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error",
                    "Could not delete section — some students may have test submissions."));
        }
    }

    @DeleteMapping("/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteStudent(@PathVariable Long studentId) {
        try {
            userRepository.deleteById(studentId);
            return ResponseEntity.ok(Map.of("message", "Student deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error",
                    "Could not delete — this student has test submissions/answers on record."));
        }
    }

    @PutMapping("/students/{studentId}/debar")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> toggleDebar(@PathVariable Long studentId, @RequestBody Map<String, Boolean> body) {
        User student = userRepository.findById(studentId).orElseThrow();
        student.setDebarred(body.getOrDefault("isDebarred", false));
        userRepository.save(student);
        return ResponseEntity.ok(Map.of("message", student.isDebarred() ? "Student debarred" : "Student un-debarred"));
    }

    // ──── TRACKS ────

    /** Known tracks (canonical list) merged with any tracks already present in the DB. */
    @GetMapping("/tracks")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<List<String>> getTracks() {
        LinkedHashSet<String> tracks = new LinkedHashSet<>(List.of(
                "Advance DSA + System Design",
                "DSA + FSD (Java)",
                "DSA + FSD (MERN Stack)",
                "DSA + FSD (Python)",
                "DSA + Data Science",
                "DSA + AWS Cloud & DevOps Essentials"
        ));
        tracks.addAll(userRepository.findDistinctTracks());
        return ResponseEntity.ok(new ArrayList<>(tracks));
    }

    // ──── ADD SINGLE STUDENT ────

    @PostMapping("/students")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> addStudent(@RequestBody Map<String, String> body) {
        String systemId = trim(body.get("systemId"));
        String fullName = trim(body.get("fullName"));
        String email = cleanEmail(body.get("email"));
        String sectionName = trim(body.get("section"));
        String track = trim(body.get("track"));
        String batchName = orDefault(trim(body.get("batchName")), DEMO_BATCH_NAME);

        if (systemId.isEmpty() || fullName.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "System ID and Name are required"));
        if (email.isEmpty()) email = systemId + "@ug.sharda.ac.in";

        if (userRepository.existsBySystemId(systemId))
            return ResponseEntity.badRequest().body(Map.of("error", "A student with this System ID already exists"));
        if (userRepository.existsByEmail(email))
            return ResponseEntity.badRequest().body(Map.of("error", "A student with this email already exists"));

        Batch batch = getOrCreateBatch(batchName);
        Section section = sectionName.isEmpty() ? null : getOrCreateSection(sectionName, batch);

        User student = User.builder()
                .username(uniqueUsername(systemId)).password(passwordEncoder.encode(systemId))
                .fullName(fullName).email(email).role(Role.STUDENT).systemId(systemId)
                .department(trim(body.get("department"))).program(trim(body.get("program")))
                .mobileNumber(trim(body.get("mobile"))).track(track.isEmpty() ? null : track)
                .batch(batch).section(section).enabled(true).build();
        userRepository.save(student);
        return ResponseEntity.ok(Map.of("message", "Student added", "id", student.getId(),
                "loginEmail", email, "loginPassword", systemId));
    }

    // ──── CSV IMPORT ────

    @GetMapping("/csv-template")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<String> getCsvTemplate() {
        String template = "SystemID,Name,Email,Department,Section,Track,Mobile,Program\n" +
                "2023284369,Rajeev Ranjan,2023284369.rajeev@ug.sharda.ac.in,CSE,M,Advance DSA + System Design,9310650163,B.Tech\n" +
                "2023451688,Anuj Bhakat,2023451688.anuj@ug.sharda.ac.in,CSE,I,DSA + FSD (Java),9386459326,B.Tech\n";
        return ResponseEntity.ok().header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=student_import_template.csv")
                .body(template);
    }

    /**
     * Bulk-import students. Columns (header required):
     *   SystemID, Name, Email, Department, Section, Track, Mobile, Program
     * Login = email; password = System ID. All students go into the given batch
     * (defaults to the demo batch). Each row is handled independently so one bad
     * row doesn't abort the whole import.
     */
    @PostMapping("/import-csv")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> importCsv(@RequestParam("file") MultipartFile file,
                                       @RequestParam(value = "batchName", required = false) String batchNameParam) {
        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
            String header = reader.readLine();
            if (header == null || !header.toLowerCase().contains("systemid"))
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid CSV format. Download and use the template."));

            String batchName = orDefault(trim(batchNameParam), DEMO_BATCH_NAME);
            Batch batch = getOrCreateBatch(batchName);

            int imported = 0, skipped = 0, errors = 0;
            List<String> errorMessages = new ArrayList<>();
            String line;

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] p = line.split(",", -1);
                try {
                    String systemId = trim(get(p, 0));
                    String fullName = trim(get(p, 1));
                    String email = cleanEmail(get(p, 2));
                    String department = trim(get(p, 3));
                    String sectionName = trim(get(p, 4));
                    String track = trim(get(p, 5));
                    String mobile = trim(get(p, 6));
                    String program = trim(get(p, 7));

                    if (systemId.isEmpty() || fullName.isEmpty()) { errors++; errorMessages.add("Missing System ID/Name: " + line); continue; }
                    if (email.isEmpty()) email = systemId + "@ug.sharda.ac.in";

                    if (userRepository.existsBySystemId(systemId) || userRepository.existsByEmail(email)) { skipped++; continue; }

                    Section section = sectionName.isEmpty() ? null : getOrCreateSection(sectionName, batch);

                    User student = User.builder()
                            .username(uniqueUsername(systemId)).password(passwordEncoder.encode(systemId))
                            .fullName(fullName).email(email).role(Role.STUDENT).systemId(systemId)
                            .department(department).program(program).mobileNumber(mobile)
                            .track(track.isEmpty() ? null : track)
                            .batch(batch).section(section).enabled(true).build();
                    userRepository.save(student);
                    imported++;
                } catch (Exception rowEx) {
                    errors++;
                    errorMessages.add("Row failed (" + rowEx.getMessage() + "): " + line);
                }
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("imported", imported);
            result.put("skipped", skipped);
            result.put("errors", errors);
            result.put("batch", batchName);
            if (!errorMessages.isEmpty()) result.put("errorDetails", errorMessages.subList(0, Math.min(15, errorMessages.size())));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to parse CSV: " + e.getMessage()));
        }
    }

    // ──── helpers ────

    private Batch getOrCreateBatch(String name) {
        return batchRepository.findByName(name).orElseGet(() -> batchRepository.save(new Batch(name, 2023, 2027, "B.Tech / MCA")));
    }

    private Section getOrCreateSection(String name, Batch batch) {
        return sectionRepository.findByNameAndBatchId(name, batch.getId())
                .orElseGet(() -> sectionRepository.save(new Section(name, batch)));
    }

    /** Username must be unique; base it on the system id and disambiguate if needed. */
    private String uniqueUsername(String systemId) {
        String base = systemId.toLowerCase();
        String candidate = base;
        int n = 1;
        while (userRepository.existsByUsername(candidate)) candidate = base + "-" + (n++);
        return candidate;
    }

    private static String get(String[] arr, int i) { return i < arr.length ? arr[i] : ""; }
    private static String trim(String s) { return s == null ? "" : s.trim(); }
    private static String orDefault(String s, String def) { return s == null || s.isEmpty() ? def : s; }

    /** Trim, strip stray internal whitespace, and lowercase an email; "" if clearly not an email. */
    private static String cleanEmail(String raw) {
        String e = trim(raw).replaceAll("\\s+", "").toLowerCase();
        return e.contains("@") ? e : "";
    }
}

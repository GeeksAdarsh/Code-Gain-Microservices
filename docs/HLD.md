# CodeCampus — High-Level Design (HLD)

> Online coding & assessment platform for colleges and companies.
> Full-stack: **React 19 (Vite)** front end · **Spring Boot 3.4 (Java)** back end · **MySQL 8** data store.

---

## 1. Purpose & Scope

CodeCampus lets institutions run **practice, proctored exams, and hiring assessments** on a single platform. It supports four roles — **Admin, Teacher, Student, Company** — and provides:

- A multi-language online judge (C, C++, Java, Python, JavaScript).
- **LeetCode-style "function mode"** *and* classic competitive-programming (stdin/stdout) mode.
- Coding tests + MCQ tests, with leaderboards and per-section access control.
- Proctoring (camera, fullscreen, tab-switch detection) and plagiarism detection.
- Batch / section management with CSV bulk import.
- Account self-service: email-based password reset and unique-username updates.

---

## 2. System Context

```
            ┌─────────────┐        HTTPS / REST (JSON + JWT)        ┌──────────────────┐
   Browser  │  React SPA  │  ───────────────────────────────────▶  │  Spring Boot API  │
 (Students, │  (Vite/     │  ◀───────────────────────────────────  │   (port 8080)     │
  Teachers, │   Monaco)   │                                         └─────────┬─────────┘
  Admins,   └─────────────┘                                                   │ JPA / JDBC
  Company)                                                                    ▼
                                                                     ┌──────────────────┐
                          ┌──────────────────────────┐              │     MySQL 8       │
                          │  Local Compilers /         │◀────────────│  (codecampus DB)  │
                          │  Optional Judge0 (Docker)  │  execute     └──────────────────┘
                          └──────────────────────────┘
```

- **Front end** never talks to the database directly — only via REST.
- **Code execution** runs on local toolchains (gcc/g++/javac/python/node); if a Judge0 Docker
  sandbox is reachable it is used automatically, otherwise the system falls back to local execution.

---

## 3. Layered Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ CLIENT LAYER — React 19 + Vite 6 + Tailwind + Monaco Editor          │
│   Pages (role-based) · AuthContext (JWT) · ThemeContext · Axios       │
│   ProtectedRoute (route guards) · ProctoringGuard (exam monitoring)   │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ REST (Axios interceptor adds Bearer JWT)
┌───────────────────────────────┴───────────────────────────────────────┐
│ SECURITY LAYER — Spring Security Filter Chain                         │
│   JwtAuthFilter → AuthProvider (BCrypt) → @PreAuthorize RBAC          │
│   Public: /api/auth/**, /api/batch-section/batches, /questions/**     │
└───────────────────────────────┬───────────────────────────────────────┘
┌───────────────────────────────┴───────────────────────────────────────┐
│ SERVICE LAYER — Spring Boot 3.4                                       │
│   AuthService · QuestionService · CodeExecutionService                │
│   HarnessRegistry (function-mode engine) · PlagiarismService          │
│   ProctoringService · EmailService · BatchSection/Problem Seeders     │
└───────────────────────────────┬───────────────────────────────────────┘
┌───────────────────────────────┴───────────────────────────────────────┐
│ DATA LAYER — Spring Data JPA / Hibernate → MySQL 8                    │
│   users, questions, test_cases, coding_tests, submissions,            │
│   mcq_questions, mcq_answers, batches, sections, proctoring_logs,     │
│   plagiarism_reports, test_completions, password_reset_tokens         │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 4. Core Workflows

### 4.1 Authentication & Authorization
```
Login (username OR email) → AuthService verifies BCrypt hash
  → JwtService issues HS256 token (sub, role, userId, 24h expiry)
  → Front end stores JWT → Axios attaches it to every request
  → JwtAuthFilter validates → @PreAuthorize enforces role on each endpoint
```

### 4.2 Code Execution (Run / Submit)
```
Student writes code → POST /api/code/execute (Run)  or  /submit (judge all)
  → CodeExecutionService picks source:
        function mode → HarnessRegistry.wrap(title, lang, userCode)
        classic mode  → userCode as-is
  → temp dir → compile (javac/gcc/g++) or interpret (python/node)
  → run per test case with stdin → compare stdout to expected
  → score, status (ACCEPTED / WRONG_ANSWER / ...), first-failed details
  → persist Submission → cleanup temp dir → return result
```

### 4.3 Function Mode (LeetCode-style) — *new*
```
Editor loads problem → GET /api/questions/{id}/starter?language=JAVA
  → HarnessRegistry returns { functionMode, starterCode }
  → Student fills only the function body (e.g. class Solution { ... })
On submit → hidden driver reads the problem's stdin format, calls the
  function, and prints output in the exact expected format → judged normally.
Editor offers a single toggle cycling: ƒ Function ↔ 📝 Default ↔ ⚡ CP.
```

### 4.4 Proctored Test
```
Student enters test → global navbar hidden (no navigating away)
  → ProctoringGuard: camera preview, fullscreen lock, tab-switch counter,
    copy/paste detection, periodic snapshots → POST /api/proctoring/log
  → tab-switch limit exceeded → auto-submit
  → Teacher/Admin views live dashboard + proctoring & plagiarism reports
```

### 4.5 Test Access Control
```
Teacher creates test → restrictToSections + allowedSections
Student opens Contests → server filters: section match? not debarred?
  join window open? → only eligible, live tests are shown/enterable.
```

---

## 5. Technology Stack

| Layer        | Technology                         | Version  |
|--------------|------------------------------------|----------|
| Front end    | React + Vite + Tailwind            | 19 / 6 / 3 |
| Code editor  | Monaco Editor                      | latest   |
| Back end     | Spring Boot (Java)                 | 3.4.3 / JDK 22 |
| Security     | Spring Security + JWT (HS256)      | 6.x      |
| ORM          | Hibernate (Spring Data JPA)        | 6.6      |
| Database     | MySQL                              | 8.0      |
| Build        | Maven (wrapper) / npm              | 3.9 / 11 |
| Execution    | gcc, g++, javac, python, node; opt. Judge0 (Docker) | — |
| Email        | Spring Mail (Gmail SMTP, dev console fallback) | — |

---

## 6. Non-Functional Characteristics

| Concern        | Approach |
|----------------|----------|
| **Security**   | BCrypt password hashing, stateless JWT, method-level RBAC, public surface minimized. |
| **Isolation**  | Each execution runs in a fresh temp directory; process timeout & memory caps; no network from user code. |
| **Reliability**| Auto-fallback from Judge0 to local execution; idempotent seeders guard against duplicate data. |
| **Integrity**  | Plagiarism detection (Jaccard + n-gram + LCS); proctoring event logs. |
| **Usability**  | Function mode lowers the barrier for beginners; CP mode kept for advanced users. |

---

## 7. Scalability Roadmap

| Scale        | Strategy                                              | Status      |
|--------------|-------------------------------------------------------|-------------|
| < 100K users | Single server + targeted MySQL indexes                | Implemented |
| 100K–1M      | Composite indexes `(role, section_id)`                | Implemented |
| 1M+          | MySQL partitioning by batch year; read replicas       | Planned     |
| 10M+         | Redis caching, horizontally-scaled execution workers  | Planned     |
| Execution    | Containerized Judge0 cluster behind a queue (AWS)     | Ready       |

> Current focus: rock-solid local/single-node deployment. Horizontal scale (system design + AWS) is the documented next phase.

---

*CodeCampus — High-Level Design. Prepared for technical review.*

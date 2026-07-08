# CodeCampus — System Design Document

## High-Level Design (HLD) & Low-Level Design (LLD)

---

## 1. HIGH-LEVEL DESIGN (HLD)

### 1.1 System Overview

CodeCampus is a full-stack online coding and assessment platform designed for colleges and companies. It supports 4 user roles (Admin, Teacher, Student, Company) with features including code execution, proctored testing, plagiarism detection, batch/section management, and MCQ assessments.

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│                                                                         │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│   │   React 19   │  │ Monaco Editor│  │  Tailwind CSS│                 │
│   │   + Vite 6   │  │  (Code IDE)  │  │  (Dark/Light)│                 │
│   └──────┬───────┘  └──────┬───────┘  └──────────────┘                 │
│          │                  │                                            │
│   ┌──────┴──────────────────┴──────────────────────────┐               │
│   │              Axios HTTP Client + JWT               │               │
│   │         (Interceptor adds Authorization header)    │               │
│   └──────────────────────┬─────────────────────────────┘               │
└──────────────────────────┼─────────────────────────────────────────────┘
                           │ REST API (JSON)
                           │ Port 5173 → Proxy → Port 8080
┌──────────────────────────┼─────────────────────────────────────────────┐
│                    API GATEWAY / SECURITY LAYER                         │
│                                                                         │
│   ┌──────────────────────┴─────────────────────────────┐               │
│   │           Spring Security Filter Chain              │               │
│   │   ┌─────────────┐  ┌──────────────┐               │               │
│   │   │  JWT Filter  │→│ Auth Provider│               │               │
│   │   │ (every req)  │  │(BCrypt verify│               │               │
│   │   └─────────────┘  └──────────────┘               │               │
│   │                                                     │               │
│   │   Public:  /api/auth/**, /api/batch-section/batches │               │
│   │   RBAC:    ADMIN, TEACHER, STUDENT, COMPANY         │               │
│   └─────────────────────────────────────────────────────┘               │
└──────────────────────────┼─────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────────────┐
│                     SERVICE LAYER (Spring Boot 3.4)                     │
│                                                                         │
│   ┌────────────┐ ┌────────────────┐ ┌───────────────┐ ┌────────────┐  │
│   │AuthService │ │CodingTestService│ │CodeExecution  │ │Plagiarism  │  │
│   │(login,     │ │(CRUD, filter,  │ │Service        │ │Service     │  │
│   │ register)  │ │ leaderboard)   │ │(compile, run) │ │(3 algos)   │  │
│   └────────────┘ └────────────────┘ └───────┬───────┘ └────────────┘  │
│                                              │                          │
│   ┌────────────┐ ┌────────────────┐  ┌──────┴──────┐ ┌────────────┐  │
│   │Proctoring  │ │BatchSection    │  │   Local     │ │ProblemSeeder│  │
│   │Service     │ │Seeder          │  │  Compilers  │ │(JSON→DB)   │  │
│   │(camera,tab)│ │(dummy data)    │  │gcc,g++,javac│ │            │  │
│   └────────────┘ └────────────────┘  │python, node │ └────────────┘  │
│                                       └─────────────┘                   │
└──────────────────────────┼─────────────────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────────────────┐
│                     DATA LAYER                                          │
│                                                                         │
│   ┌──────────────────────┴─────────────────────────────┐               │
│   │              Spring Data JPA + Hibernate            │               │
│   │              (ORM, Entity Mapping, JPQL)            │               │
│   └──────────────────────┬─────────────────────────────┘               │
│                          │                                               │
│   ┌──────────────────────┴─────────────────────────────┐               │
│   │                MySQL 8+ Database                    │               │
│   │                                                     │               │
│   │  Tables: users, questions, test_cases, coding_tests │               │
│   │  submissions, mcq_questions, mcq_answers, batches   │               │
│   │  sections, proctoring_logs, plagiarism_reports       │               │
│   │  test_completions, test_question_weights             │               │
│   │                                                     │               │
│   │  Views: v_admins, v_teachers, v_students            │               │
│   │  Indexes: idx_users_role, idx_users_section, etc.   │               │
│   └─────────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Request Flow

```
User Action → React Component → Axios (+ JWT header) → Spring Security Filter
  → JWT Validation → Role Check (@PreAuthorize) → Controller → Service
  → Repository (JPA) → MySQL → Response (JSON) → React State → UI Update
```

### 1.4 Code Execution Flow

```
Student writes code → POST /api/code/execute
  → CodeExecutionService.executeCode()
  → Files.createTempDirectory("codecampus_")
  → Write source code to temp file (Main.java, Main.py, etc.)
  → compileCode() → ProcessBuilder("gcc"/"javac"/...)
  → runCode() → Execute with stdin, capture stdout/stderr
  → Compare output with expected for each test case
  → Calculate score → Save Submission → Return result
  → cleanup() → Delete temp directory
```

### 1.5 Proctoring Flow

```
Student starts test → ProctoringGuard activates
  ├→ Camera required? → getUserMedia() → show preview
  │   └→ Denied? → Block test until camera allowed
  ├→ Fullscreen required? → requestFullscreen()
  │   └→ Exited? → Pause test until re-entered
  ├→ Tab switch? → visibilitychange event → log + count
  │   └→ Count >= max? → Auto-submit test
  ├→ Copy/paste? → Detect + log event
  └→ Periodic snapshots → canvas.toDataURL() → POST /api/proctoring/log
```

### 1.6 Test Visibility & Access Control

```
Teacher creates test → assigns to Section A, B
  → restrictToSections = true
  → allowedSections = [Section A, Section B]

Student (Section A) opens Contests:
  → GET /api/tests → filterForUser()
  → Check: test.allowedSections contains student.section? → SHOW
  → Check: student.isDebarred? → HIDE ALL
  → Check: joinWindow expired? → BLOCK ENTRY
```

---

## 2. LOW-LEVEL DESIGN (LLD)

### 2.1 Database Schema (ER Diagram)

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     batches       │       │     sections      │       │      users       │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │──┐    │ id (PK)          │──┐    │ id (PK)          │
│ name (UNIQUE)    │  │    │ name             │  │    │ username (UNIQUE)│
│ start_year       │  │    │ batch_id (FK)────│──┘    │ password (BCrypt)│
│ end_year         │  └───→│ teacher_id (FK)──│──┐    │ full_name        │
│ program          │       └──────────────────┘  │    │ email (UNIQUE)   │
└──────────────────┘                              │    │ role (ENUM)      │
                                                  │    │ system_id        │
                                                  │    │ enrollment_number│
                                                  │    │ is_debarred      │
                                                  │    │ batch_id (FK)    │
                                                  └───→│ section_id (FK)  │
                                                       │ profile_image    │
                                                       │ bio, urls...     │
                                                       │ enabled          │
                                                       │ created_at       │
                                                       └────────┬─────────┘
                                                                │
                    ┌───────────────────────────────────────────┘
                    │
┌───────────────────┴──┐    ┌──────────────────┐    ┌──────────────────┐
│     questions        │    │    test_cases     │    │   coding_tests   │
├──────────────────────┤    ├──────────────────┤    ├──────────────────┤
│ id (PK)              │───→│ id (PK)          │    │ id (PK)          │
│ title                │    │ input (TEXT)      │    │ title            │
│ description (TEXT)   │    │ expected_output   │    │ description      │
│ input_format         │    │ is_sample         │    │ start_time       │
│ output_format        │    │ is_hidden         │    │ end_time         │
│ constraints          │    │ question_id (FK)  │    │ duration_minutes │
│ difficulty (ENUM)    │    └──────────────────┘    │ is_active        │
│ tags (ElementColl)   │                            │ is_published     │
│ sample_input/output  │    ┌──────────────────┐    │ proctoring_*     │
│ explanation          │    │  test_questions   │    │ test_type (ENUM) │
│ time_limit           │    ├──────────────────┤    │ access_code      │
│ memory_limit         │    │ test_id (FK)─────│───→│ total_marks      │
│ created_by (FK→User) │←───│ question_id (FK) │    │ join_window_min  │
│ created_at           │    └──────────────────┘    │ restrict_sections│
└──────────────────────┘                            │ created_by (FK)  │
                                                    └────────┬─────────┘
                                                             │
                    ┌────────────────────────────────────────┘
                    │
┌───────────────────┴──┐    ┌──────────────────┐    ┌──────────────────┐
│     submissions      │    │  mcq_questions   │    │   mcq_answers    │
├──────────────────────┤    ├──────────────────┤    ├──────────────────┤
│ id (PK)              │    │ id (PK)          │    │ id (PK)          │
│ user_id (FK)         │    │ test_id (FK)     │    │ user_id (FK)     │
│ question_id (FK)     │    │ question (TEXT)   │    │ mcq_question_id  │
│ coding_test_id (FK)  │    │ option_a/b/c/d   │    │ test_id (FK)     │
│ code (TEXT)          │    │ correct_option    │    │ selected_option  │
│ language (ENUM)      │    │ explanation (TEXT)│    │ is_correct       │
│ status (ENUM)        │    │ marks            │    │ answered_at      │
│ test_cases_passed    │    │ order_index      │    └──────────────────┘
│ total_test_cases     │    └──────────────────┘
│ score                │
│ execution_time_ms    │    ┌──────────────────┐    ┌──────────────────┐
│ output (TEXT)        │    │ proctoring_logs  │    │plagiarism_reports│
│ error_output (TEXT)  │    ├──────────────────┤    ├──────────────────┤
│ submitted_at         │    │ id (PK)          │    │ id (PK)          │
└──────────────────────┘    │ user_id (FK)     │    │ test_id (FK)     │
                            │ test_id (FK)     │    │ question_id (FK) │
┌──────────────────────┐    │ event_type (ENUM)│    │ submission1 (FK) │
│  test_completions    │    │ details (TEXT)   │    │ submission2 (FK) │
├──────────────────────┤    │ snapshot (LONG)  │    │ user1_id (FK)    │
│ id (PK)              │    │ tab_switch_count │    │ user2_id (FK)    │
│ user_id (FK)         │    │ flagged          │    │ similarity_%     │
│ test_id (FK)         │    │ timestamp        │    │ matched_tokens   │
│ total_questions      │    └──────────────────┘    │ status (ENUM)    │
│ questions_attempted  │                            │ review_notes     │
│ questions_accepted   │    ┌──────────────────┐    │ detected_at      │
│ total_score          │    │  test_sections   │    └──────────────────┘
│ completed_at         │    ├──────────────────┤
└──────────────────────┘    │ test_id (FK)     │
                            │ section_id (FK)  │
                            └──────────────────┘
```

### 2.2 API Design Summary

#### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user (validates email domain) |
| POST | `/api/auth/login` | Public | Login with email or username → returns JWT |

#### Code Execution
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/code/execute` | Student | Compile & run code against test cases |
| GET | `/api/code/submissions/{qId}` | Student | Get submission history |

#### Test Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/tests` | Teacher/Admin | Create test (coding + MCQ) |
| GET | `/api/tests` | All | Get tests (filtered by section for students) |
| GET | `/api/tests/active` | All | Currently live tests |
| POST | `/api/tests/{id}/submit` | Student | Submit test |
| GET | `/api/tests/{id}/leaderboard` | All | Ranked results |

#### MCQ
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/mcq/tests/{id}/questions` | Teacher | Save MCQ questions |
| GET | `/api/mcq/tests/{id}/questions` | All | Get MCQs (answers hidden for students) |
| POST | `/api/mcq/answer` | Student | Submit MCQ answer |
| DELETE | `/api/mcq/tests/{id}/reset` | Student | Reset answers (practice mode) |

#### Batch & Section
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/batch-section/batches` | Public | List batches (for registration) |
| POST | `/api/batch-section/import-csv` | Admin | Bulk import students |
| PUT | `/api/batch-section/students/{id}/debar` | Teacher/Admin | Debar student |

### 2.3 Security Design

```
JWT Token Structure:
{
  "sub": "username",
  "role": "STUDENT",
  "userId": 123,
  "iat": 1711234567,
  "exp": 1711320967    // 24-hour expiry
}

Password Storage: BCrypt (10 rounds)
Token Algorithm: HS256
Secret Key: Base64-encoded 256-bit key
```

#### RBAC Matrix
| Feature | Admin | Teacher | Student | Company |
|---------|-------|---------|---------|---------|
| Manage users | ✓ | - | - | - |
| Manage batches/sections | ✓ | - | - | - |
| Create questions | ✓ | ✓ | - | ✓ |
| Create tests | ✓ | ✓ | - | ✓ |
| Assign sections to tests | ✓ | ✓ (own) | - | - |
| Take tests | - | - | ✓ | - |
| View leaderboard | ✓ | ✓ | ✓ | ✓ |
| View student results | ✓ | ✓ | - | ✓ |
| Proctoring reports | ✓ | ✓ | - | ✓ |
| Plagiarism detection | ✓ | ✓ | - | ✓ |
| Debar students | ✓ | ✓ | - | - |
| Reset passwords | ✓ | - | - | - |

### 2.4 Plagiarism Detection Algorithm

```
Final Score = Jaccard(40%) + N-gram(30%) + LCS(30%)

Step 1: Normalize code
  → Remove comments (// /* */ #)
  → Replace strings with "S", chars with 'C'
  → Collapse whitespace, lowercase

Step 2: Jaccard Similarity (40% weight)
  → Tokenize into identifiers/keywords
  → Score = |A ∩ B| / |A ∪ B| × 100

Step 3: N-gram Similarity (30% weight)
  → Generate 3-char sliding windows
  → Jaccard on n-gram sets

Step 4: LCS Ratio (30% weight)
  → Dynamic programming LCS
  → Ratio = LCS_length / max(len1, len2) × 100
  → Capped at 2000 chars for performance

Step 5: Flag if score ≥ 70%
  → Create PlagiarismReport with status DETECTED
```

### 2.5 Code Execution Sandbox

```
Supported Languages:
  C      → gcc Main.c -o output → ./output
  C++    → g++ Main.cpp -o output → ./output
  Java   → javac Main.java → java -cp . Main
  Python → python3 Main.py (Windows: python)
  JS     → node Main.js

Security:
  → Temp directory per execution (codecampus_XXXXX)
  → Process timeout: 10 seconds (configurable)
  → Memory limit: 256MB
  → Cleanup: recursive delete after execution
  → No network access from executed code
```

### 2.6 Frontend Architecture

```
React 19 + Vite 6
├── context/
│   ├── AuthContext.jsx      (JWT storage, login/logout, user state)
│   └── ThemeContext.jsx     (dark/light mode toggle)
├── components/
│   ├── Navbar.jsx           (role-based navigation)
│   ├── ProtectedRoute.jsx   (route guards with role check)
│   └── ProctoringGuard.jsx  (camera, fullscreen, tab monitoring)
├── services/
│   └── api.js               (Axios instance, interceptors, all API functions)
├── pages/
│   ├── Admin: AdminDashboard, BatchManagement
│   ├── Teacher: TeacherDashboard, CreateTest, CreateQuestion
│   ├── Student: StudentDashboard, Problems, ProblemDetail, TakeTest
│   ├── Shared: Profile, Contests, TestDetail, Compiler, StudyPlans
│   └── Company: CompanyDashboard, CandidateResults
└── index.css                (theme variables, glass-card, buttons)
```

### 2.7 Scalability Considerations

| Scale | Solution | Status |
|-------|----------|--------|
| < 100K users | Single server + MySQL indexes | ✅ Implemented |
| 100K - 1M | Composite indexes on (role, section_id) | ✅ Implemented |
| 1M+ | MySQL table partitioning by batch year | 📋 Planned |
| 10M+ | Read replicas + Redis caching | 📋 Planned |
| Code execution | Judge0 Docker (commented, ready to enable) | 📋 Ready |

### 2.8 Database Indexes

```sql
idx_users_role             ON users(role)
idx_users_batch            ON users(batch_id)
idx_users_section          ON users(section_id)
idx_users_system_id        ON users(system_id)
idx_users_role_section     ON users(role, section_id)
idx_submissions_user       ON submissions(user_id)
idx_submissions_test       ON submissions(coding_test_id)
```

### 2.9 Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19 |
| Build Tool | Vite | 6 |
| CSS | Tailwind CSS | 3 |
| Code Editor | Monaco Editor | Latest |
| Backend | Spring Boot | 3.4.3 |
| Language | Java | 21 (JDK 25) |
| Security | Spring Security + JWT | 6.4 |
| ORM | Hibernate (JPA) | 6.6.8 |
| Database | MySQL | 8+ |
| Build | Maven | 3.9.6 |

---

*Document generated for CodeCampus — Built by Adarsh Kumar, 2026*

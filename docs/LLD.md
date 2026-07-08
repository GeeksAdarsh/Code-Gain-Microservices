# CodeCampus — Low-Level Design (LLD)

> Component-level design: data model, APIs, the function-mode harness engine,
> security internals, and the algorithms behind execution & plagiarism.

---

## 1. Database Schema (key tables)

```
batches(id PK, name UNIQUE, start_year, end_year, program)
sections(id PK, name, batch_id FK→batches, teacher_id FK→users)

users(id PK, username UNIQUE, password[BCrypt], full_name, email UNIQUE,
      role ENUM(ADMIN,TEACHER,STUDENT,COMPANY), system_id, enrollment_number,
      is_debarred, batch_id FK, section_id FK, profile_image, bio, enabled, created_at)

questions(id PK, title, description, input_format, output_format, constraints,
          difficulty ENUM(EASY,MEDIUM,HARD), tags[ElementCollection],
          sample_input, sample_output, explanation, time_limit, memory_limit,
          created_by FK→users, created_at)

test_cases(id PK, input TEXT, expected_output TEXT, is_sample, is_hidden,
           question_id FK→questions)

coding_tests(id PK, title, description, start_time, end_time, duration_minutes,
             is_active, is_published, test_type ENUM, access_code, total_marks,
             join_window_min, restrict_to_sections, created_by FK→users)
test_questions(test_id FK, question_id FK)         -- M:N test↔question
test_sections(test_id FK, section_id FK)           -- M:N test↔section (access)

submissions(id PK, user_id FK, question_id FK, coding_test_id FK, code TEXT,
            language ENUM, status ENUM, test_cases_passed, total_test_cases,
            score, execution_time_ms, output TEXT, error_output TEXT, submitted_at)

mcq_questions(id PK, test_id FK, question TEXT, option_a/b/c/d, correct_option,
              explanation, marks, order_index)
mcq_answers(id PK, user_id FK, mcq_question_id FK, test_id FK,
            selected_option, is_correct, answered_at)

proctoring_logs(id PK, user_id FK, test_id FK, event_type ENUM, details TEXT,
                snapshot LONGTEXT, tab_switch_count, flagged, timestamp)
plagiarism_reports(id PK, test_id FK, question_id FK, submission1 FK, submission2 FK,
                   user1_id FK, user2_id FK, similarity_pct, matched_tokens,
                   status ENUM, review_notes, detected_at)
test_completions(id PK, user_id FK, test_id FK, total_questions, questions_attempted,
                 questions_accepted, total_score, completed_at)
password_reset_tokens(id PK, token UNIQUE, user_id FK, expiry_date, used)   -- new
```

Relationships: `batch 1—* section 1—* users`; `question 1—* test_cases`;
`coding_test *—* questions` and `*—* sections`; `user 1—* submissions`.

---

## 2. API Surface (selected)

### Auth — `/api/auth`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | Public | Validates email domain, unique username/email |
| POST | `/login` | Public | Accepts username **or** email → returns JWT |
| POST | `/forgot-password` | Public | Issues reset token, emails link (console fallback in dev) |
| POST | `/reset-password` | Public | Consumes token, sets new BCrypt password |

### Questions & Function Mode — `/api/questions`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | Auth | List all problems |
| GET | `/{id}` | Auth | Problem detail |
| GET | `/{id}/starter?language=JAVA` | Auth | `{ functionMode, starterCode }` for the editor |
| POST/PUT/DELETE | `/...` | Teacher/Admin/Company | Manage problems |

### Code — `/api/code`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/execute` | Auth | Run against sample/custom input |
| POST | `/submit` | Auth | Judge all (hidden) test cases → persist Submission |
| GET | `/submissions/{questionId}` | Auth | Submission history |

### Profile — `/api/profile`
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/username-available?username=` | Auth | Live uniqueness check |
| PUT | `/username` | Auth | Update username (re-issues JWT) |

Plus: `/api/tests` (CRUD, active, submit, leaderboard), `/api/mcq/**`,
`/api/batch-section/**`, `/api/proctoring/**`, `/api/plagiarism/**`.

---

## 3. Function-Mode Harness Engine  *(server/.../service/HarnessRegistry.java)*

The engine turns a normal stdin/stdout problem into a LeetCode-style "fill the function" problem
**without changing any stored problem or test-case data**.

### 3.1 Concepts
- **Starter code**: the function stub shown in the editor (user writes only the body).
- **Driver**: a hidden full program containing the token `__USER_CODE__`. Before compilation the
  user's code replaces the token. The driver parses the problem's existing stdin format, calls the
  user's function, and prints output in the exact expected format.

### 3.2 Archetype model
Instead of hand-writing a driver per problem per language (~5×N drivers), problems are mapped to an
**(input shape → output shape)** archetype, and the engine generates the starter + driver for
**Java, Python, and JavaScript** automatically.

```
InShape  : INT1 | INT2 | INT3 | ARR | ARRINT | STR1 | STR2
OutShape : INT  | BOOL  | INTARR | STR

Registration is one line, e.g.:
    arch("Binary Search",  "binarySearch", InShape.ARRINT, OutShape.INT);
    arch("Reverse an Array","reverseArray", InShape.ARR,    OutShape.INTARR);
    arch("Valid Parentheses","isValid",     InShape.STR1,   OutShape.BOOL);
```

| InShape | stdin parsed as | Java/Python/JS params |
|---|---|---|
| INT1/INT2/INT3 | 1–3 whitespace tokens | `n` / `a,b` / `a,b,c` |
| ARR | `N` then `N` ints | `int[] arr` |
| ARRINT | `N x` then `N` ints | `int[] arr, int x` |
| STR1 / STR2 | one / two lines | `s` / `a, b` |

| OutShape | printed as |
|---|---|
| INT | the number |
| BOOL | `true` / `false` (lower-cased, incl. Python) |
| INTARR | space-separated |
| STR | the string |

### 3.3 Runtime flow
```
getStarter(id, lang) → HarnessRegistry.starter(title, lang)  → editor stub
submit/run           → HarnessRegistry.wrap(title, lang, code)
                         → driver.replace("__USER_CODE__", code) → compiled & judged
problem not registered → code used verbatim (classic mode)
```

### 3.4 Coverage (this iteration)
- **~95 EASY problems** wired across the archetypes for Java / Python / JS.
- **Two Sum** keeps a hand-written 5-language harness (incl. C / C++).
- C / C++ for engine problems fall back to the classic template (no local compiler installed).
- Verified end-to-end: **23/24 sample submissions ACCEPTED**; the one failure was a problem with
  malformed seed data (`Is Subsequence`), which was excluded from function mode.
- Editor toggle cycles **ƒ Function → 📝 Default → ⚡ CP**, hiding Function when unsupported.

---

## 4. Security Design

```
JWT (HS256):  { sub: username, role, userId, iat, exp(+24h) }
Password:     BCrypt (10 rounds)
Filter chain: JwtAuthFilter → AuthenticationProvider → @PreAuthorize
```

### RBAC matrix
| Capability | Admin | Teacher | Student | Company |
|---|:---:|:---:|:---:|:---:|
| Manage users / batches / sections | ✓ | – | – | – |
| Create questions / tests | ✓ | ✓ | – | ✓ |
| Assign sections to a test | ✓ | ✓(own) | – | – |
| Take tests | – | – | ✓ | – |
| Proctoring / plagiarism reports | ✓ | ✓ | – | ✓ |
| Reset other users' passwords | ✓ | – | – | – |

> Demo accounts (`admin`/`teacher`/`student`) are created once by `DataInitializer` and **not**
> overwritten on restart, so admin-side edits (passwords, email) persist.

---

## 5. Plagiarism Detection

```
Final = 0.40·Jaccard + 0.30·N-gram(3) + 0.30·LCS-ratio
Normalize → strip comments, mask strings/chars, collapse whitespace, lowercase.
Flag pair when Final ≥ 70% → create PlagiarismReport(status=DETECTED).
LCS capped at 2000 chars for performance.
```

---

## 6. Execution Sandbox

```
C      gcc Main.c   -o out → ./out
C++    g++ Main.cpp -o out → ./out
Java   javac Main.java     → java -cp . Main
Python python Main.py
JS     node Main.js
Guards: per-run temp dir, ~10s timeout, ~256MB memory, recursive cleanup,
        no network access from user code. Auto-fallback Judge0 → local.
```

---

## 7. Front-End Structure

```
src/
├─ context/    AuthContext (JWT+updateUser), ThemeContext
├─ components/ Navbar, ProtectedRoute, ProctoringGuard
├─ services/   api.js (Axios + interceptors; getStarter, forgot/resetPassword, username APIs)
└─ pages/      Admin · Teacher · Student · Company · Shared(ProblemDetail, Compiler, …)
```

Notable behaviors:
- `ProblemDetail` fetches starter code, manages editor mode (function/default/cp), and persists
  per-problem code in `sessionStorage`.
- `App.jsx` hides the global navbar during a test (`/test/:id` or any URL with `?testId=`).

---

## 8. Database Indexes

```sql
idx_users_role          ON users(role)
idx_users_section       ON users(section_id)
idx_users_role_section  ON users(role, section_id)
idx_submissions_user    ON submissions(user_id)
idx_submissions_test    ON submissions(coding_test_id)
```

---

*CodeCampus — Low-Level Design. Prepared for technical review.*

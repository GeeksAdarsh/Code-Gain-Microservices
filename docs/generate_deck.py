"""Generates docs/CodeCampus_Presentation.pptx for stakeholder/superior review.

Run:  python docs/generate_deck.py
Requires:  pip install python-pptx
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

# ── palette ────────────────────────────────────────────────────────────────
NAVY   = RGBColor(0x0F, 0x17, 0x2A)
SLATE  = RGBColor(0x1E, 0x29, 0x3B)
ORANGE = RGBColor(0xF9, 0x73, 0x16)
LIGHT  = RGBColor(0xE2, 0xE8, 0xF0)
GREY   = RGBColor(0x94, 0xA3, 0xB8)
WHITE  = RGBColor(0xFF, 0xFF, 0xFF)
GREEN  = RGBColor(0x10, 0xB9, 0x81)

prs = Presentation()
prs.slide_width  = Inches(13.333)   # 16:9
prs.slide_height = Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[6]


def bg(slide, color):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = color


def box(slide, l, t, w, h):
    return slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h)).text_frame


def rect(slide, l, t, w, h, color):
    from pptx.enum.shapes import MSO_SHAPE
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(l), Inches(t), Inches(w), Inches(h))
    s.fill.solid(); s.fill.fore_color.rgb = color
    s.line.fill.background()
    s.shadow.inherit = False
    return s


def set_run(r, size, color, bold=False, font="Segoe UI"):
    r.font.size = Pt(size); r.font.color.rgb = color; r.font.bold = bold; r.font.name = font


def title_slide():
    s = prs.slides.add_slide(BLANK); bg(s, NAVY)
    rect(s, 0, 3.05, 13.333, 0.08, ORANGE)
    tf = box(s, 0.9, 2.0, 11.5, 1.2); tf.word_wrap = True
    p = tf.paragraphs[0]; r = p.add_run(); r.text = "CodeCampus"
    set_run(r, 54, WHITE, bold=True)
    tf2 = box(s, 0.9, 3.2, 11.5, 1.0)
    p = tf2.paragraphs[0]; r = p.add_run()
    r.text = "Online Coding & Assessment Platform"
    set_run(r, 26, ORANGE, bold=True)
    tf3 = box(s, 0.9, 4.1, 11.5, 1.2)
    for line in ["Full-stack online judge · Proctored exams · Hiring assessments",
                 "React 19  ·  Spring Boot 3.4  ·  MySQL 8"]:
        p = tf3.add_paragraph(); r = p.add_run(); r.text = line; set_run(r, 16, GREY)
    tf4 = box(s, 0.9, 6.4, 11.5, 0.6)
    p = tf4.paragraphs[0]; r = p.add_run()
    r.text = "Technical Overview — HLD / LLD / Function Mode"
    set_run(r, 13, GREY)


def content_slide(title, bullets, footer=None):
    """bullets: list of (text, level) or (text, level, color)."""
    s = prs.slides.add_slide(BLANK); bg(s, SLATE)
    rect(s, 0, 0, 13.333, 1.05, NAVY)
    rect(s, 0, 1.05, 13.333, 0.06, ORANGE)
    tf = box(s, 0.6, 0.18, 12.1, 0.8)
    p = tf.paragraphs[0]; r = p.add_run(); r.text = title
    set_run(r, 28, WHITE, bold=True)

    body = box(s, 0.7, 1.45, 12.0, 5.6); body.word_wrap = True
    first = True
    for item in bullets:
        text, level = item[0], item[1]
        color = item[2] if len(item) > 2 else (LIGHT if level == 0 else GREY)
        p = body.paragraphs[0] if first else body.add_paragraph()
        first = False
        p.level = level
        p.space_after = Pt(6)
        bullet = "▸ " if level == 0 else "•  "
        r = p.add_run(); r.text = bullet + text
        set_run(r, 19 if level == 0 else 15, color, bold=(level == 0))
    if footer:
        ftf = box(s, 0.7, 7.0, 12.0, 0.4)
        r = ftf.paragraphs[0].add_run(); r.text = footer; set_run(r, 11, GREY)


def code_slide(title, lines):
    s = prs.slides.add_slide(BLANK); bg(s, SLATE)
    rect(s, 0, 0, 13.333, 1.05, NAVY)
    rect(s, 0, 1.05, 13.333, 0.06, ORANGE)
    tf = box(s, 0.6, 0.18, 12.1, 0.8)
    r = tf.paragraphs[0].add_run(); r.text = title; set_run(r, 28, WHITE, bold=True)
    rect(s, 0.7, 1.4, 11.9, 5.5, NAVY)
    body = box(s, 0.95, 1.55, 11.5, 5.2); body.word_wrap = True
    first = True
    for ln in lines:
        p = body.paragraphs[0] if first else body.add_paragraph()
        first = False
        r = p.add_run(); r.text = ln if ln else " "
        set_run(r, 13, GREEN if ln.strip().startswith("//") else LIGHT, font="Consolas")
        p.space_after = Pt(2)


# ── slides ──────────────────────────────────────────────────────────────────
title_slide()

content_slide("What is CodeCampus?", [
    ("A single platform for practice, proctored exams, and hiring assessments", 0),
    ("Four roles, one system", 0),
    ("Admin — users, batches/sections, password resets", 1),
    ("Teacher — questions, tests, leaderboards, proctoring & plagiarism reports", 1),
    ("Student — practice problems, take tests, track progress", 1),
    ("Company — hiring assessments, candidate results", 1),
    ("Multi-language online judge: C, C++, Java, Python, JavaScript", 0),
    ("Two solving styles: LeetCode-style Function Mode + Competitive (stdin/stdout)", 0, ORANGE),
])

content_slide("Key Features", [
    ("Online judge", 0),
    ("Compile & run against sample + hidden test cases; instant verdicts", 1),
    ("Assessments", 0),
    ("Coding tests + MCQ tests, leaderboards, per-section access control", 1),
    ("Integrity", 0),
    ("Proctoring (camera, fullscreen, tab-switch, snapshots) + plagiarism detection", 1),
    ("Administration", 0),
    ("Batch/section management, CSV bulk import, role-based dashboards", 1),
    ("Account self-service", 0),
    ("Email password reset, unique-username updates", 1),
])

content_slide("High-Level Architecture", [
    ("Client — React 19 + Vite + Tailwind + Monaco editor", 0),
    ("Talks to the server only via REST (JSON); JWT attached by Axios interceptor", 1),
    ("Security — Spring Security filter chain", 0),
    ("JWT auth filter → BCrypt verify → @PreAuthorize role checks per endpoint", 1),
    ("Service — Spring Boot 3.4", 0),
    ("Auth, Question, CodeExecution, HarnessRegistry, Plagiarism, Proctoring, Email", 1),
    ("Data — Spring Data JPA / Hibernate → MySQL 8", 0),
    ("users, questions, test_cases, coding_tests, submissions, mcq_*, proctoring_logs…", 1),
    ("Execution — local compilers; optional Judge0 (Docker) with auto-fallback", 0, ORANGE),
], footer="Full diagrams in docs/HLD.md")

content_slide("Code Execution Flow", [
    ("Student clicks Run / Submit → POST /api/code/execute or /submit", 0),
    ("CodeExecutionService selects the source", 0),
    ("Function mode → wrap user function with the hidden driver", 1),
    ("Classic mode → use the user's full program as-is", 1),
    ("Fresh temp directory per run → compile or interpret", 0),
    ("Run each test case with stdin → compare stdout with expected output", 0),
    ("Compute score & status (ACCEPTED / WRONG_ANSWER / …) → persist Submission", 0),
    ("Guards: ~10s timeout, ~256MB memory, no network, recursive cleanup", 1, GREEN),
])

content_slide("Function Mode — LeetCode-style solving  (new)", [
    ("Students fill only the function body — no boilerplate I/O", 0, ORANGE),
    ("Editor loads a starter stub via GET /questions/{id}/starter?language=", 1),
    ("A hidden 'driver' reads the problem's input, calls the function, prints output", 1),
    ("No stored problem or test-case data is changed — wrapping happens at run time", 1),
    ("One editor toggle cycles three modes", 0),
    ("ƒ Function  →  📝 Default  →  ⚡ CP (competitive)", 1),
    ("Powered by an archetype engine (next slide) — adding a problem is one line", 0),
    ("Verified: 23 / 24 sample submissions ACCEPTED across Java / Python / JS", 0, GREEN),
])

code_slide("Function Mode — Archetype Engine", [
    "// Map a problem to an (input shape -> output shape) archetype.",
    "// The engine auto-generates starter + driver for Java / Python / JS.",
    "",
    "InShape  : INT1 | INT2 | INT3 | ARR | ARRINT | STR1 | STR2",
    "OutShape : INT  | BOOL | INTARR | STR",
    "",
    "arch(\"Binary Search\",    \"binarySearch\", ARRINT, INT);",
    "arch(\"Reverse an Array\", \"reverseArray\", ARR,    INTARR);",
    "arch(\"Valid Parentheses\",\"isValid\",      STR1,   BOOL);",
    "",
    "// ~95 EASY problems wired this way; Two Sum keeps a hand-written",
    "// 5-language harness (incl. C / C++).",
])

content_slide("Low-Level Design — Highlights", [
    ("Data model", 0),
    ("batch 1—* section 1—* users; question 1—* test_cases", 1),
    ("coding_test *—* questions and *—* sections (access control)", 1),
    ("APIs", 0),
    ("/auth (login by username or email, forgot/reset password)", 1),
    ("/questions/{id}/starter (function mode), /code/execute & /submit", 1),
    ("/profile/username (unique-username update, re-issues JWT)", 1),
    ("Indexes on (role, section_id) and submission FKs for scale", 0),
], footer="Full schema, API tables & engine internals in docs/LLD.md")

content_slide("Security & Access Control", [
    ("Stateless JWT (HS256): sub, role, userId, 24h expiry", 0),
    ("Passwords hashed with BCrypt (10 rounds)", 0),
    ("Method-level RBAC via @PreAuthorize", 0),
    ("Admin: users, batches, password resets", 1),
    ("Teacher: questions, tests, reports (own sections)", 1),
    ("Student: practice & take tests", 1),
    ("Company: hiring assessments & candidate results", 1),
    ("Demo accounts seeded once and preserved across restarts (admin edits persist)", 0, GREEN),
])

content_slide("Integrity — Proctoring & Plagiarism", [
    ("Proctoring during tests", 0),
    ("Global navbar hidden so students can't navigate away mid-test", 1, ORANGE),
    ("Camera preview, fullscreen lock, tab-switch counter, periodic snapshots", 1),
    ("Tab-switch limit exceeded → auto-submit; events logged for review", 1),
    ("Plagiarism detection", 0),
    ("Score = 0.40·Jaccard + 0.30·N-gram(3) + 0.30·LCS-ratio", 1),
    ("Code normalized (strip comments, mask literals); flagged at ≥ 70%", 1),
])

content_slide("Recent Updates (this iteration)", [
    ("Function Mode rolled out to ~95 problems (Java / Python / JS) via the archetype engine", 0, GREEN),
    ("Three-way editor toggle: Function / Default / CP", 0),
    ("Email-based password reset + unique-username update", 0),
    ("Registration batch/section dropdowns populated from the DB", 0),
    ("User Management grouped by role & section (searchable, collapsible)", 0),
    ("Demo logins stabilized; admin password changes now persist across restarts", 0),
    ("Navbar hidden while a test is in progress", 0),
])

content_slide("Scalability Roadmap", [
    ("< 100K users — single server + targeted MySQL indexes", 0, GREEN),
    ("100K–1M — composite indexes (role, section_id)", 0, GREEN),
    ("1M+ — MySQL partitioning by batch year, read replicas", 0),
    ("10M+ — Redis caching, horizontally-scaled execution workers", 0),
    ("Execution — containerized Judge0 cluster behind a queue (AWS)", 0, ORANGE),
    ("Current focus: solid single-node deployment; horizontal scale is the next phase", 0),
])

# closing
s = prs.slides.add_slide(BLANK); bg(s, NAVY)
rect(s, 0, 3.4, 13.333, 0.08, ORANGE)
tf = box(s, 0.9, 2.6, 11.5, 1.0)
r = tf.paragraphs[0].add_run(); r.text = "Thank you"; set_run(r, 44, WHITE, bold=True)
tf2 = box(s, 0.9, 3.7, 11.5, 1.0)
r = tf2.paragraphs[0].add_run()
r.text = "CodeCampus — built for colleges & companies. Questions welcome."
set_run(r, 18, GREY)

out = os.path.join(os.path.dirname(__file__), "CodeCampus_Presentation.pptx")
prs.save(out)
print("Saved", out, "with", len(prs.slides._sldIdLst), "slides")

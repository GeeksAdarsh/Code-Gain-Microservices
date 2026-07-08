import os

import matplotlib

matplotlib.use("Agg")
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

_BG = "#0f172a"
_CARD = "#1e293b"
_ACCENT = "#38bdf8"


def _build_hld_png(out_path: str) -> None:
    fig, ax = plt.subplots(figsize=(12, 6.4), dpi=140)
    ax.set_facecolor(_BG)
    fig.patch.set_facecolor(_BG)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7.6)
    ax.axis("off")
    layers = [
        (6.0, 6.55, 10.2, 0.78, "CLIENT LAYER", "React 19 + Vite 6 · Monaco Editor · Axios + JWT · Tailwind CSS", "#38bdf8"),
        (6.0, 5.45, 10.2, 0.78, "API & SECURITY", "Spring Security · JWT (HS256) · RBAC · REST /api", "#a78bfa"),
        (
            6.0,
            4.35,
            10.2,
            0.95,
            "SERVICE LAYER (Spring Boot 3.4)",
            "Auth · CodeExecution · PatternBasedCodeReview · CodingTest · Plagiarism · Proctoring · Notifications · Batch/MCQ",
            "#34d399",
        ),
        (6.0, 3.05, 10.2, 0.78, "DATA LAYER", "Spring Data JPA / Hibernate · MySQL 8+ · temp sandbox per run", "#fbbf24"),
    ]
    for cx, cy, w, h, title, sub, edge in layers:
        rect = mpatches.FancyBboxPatch(
            (cx - w / 2, cy - h / 2), w, h, boxstyle="round,pad=0.015,rounding_size=0.08",
            facecolor=_CARD, edgecolor=edge, linewidth=2.2,
        )
        ax.add_patch(rect)
        ax.text(cx, cy + 0.14, title, ha="center", va="center", color=edge, fontsize=11, fontweight="bold")
        ax.text(cx, cy - 0.2, sub, ha="center", va="center", color="#cbd5e1", fontsize=7.2, wrap=True)
    ax.annotate("", xy=(6, 2.35), xytext=(6, 2.65), arrowprops=dict(arrowstyle="-|>", color="#64748b", lw=1.5))
    ax.text(6, 2.05, "JSON over HTTPS · Vite dev proxy :5173 → API :8080", ha="center", color="#94a3b8", fontsize=9)
    ax.text(6, 0.45, "CodeCampus — High-Level Design (aligned with SYSTEM_DESIGN.md)", ha="center", color="#64748b", fontsize=8.5)
    fig.savefig(out_path, facecolor=_BG, edgecolor="none", bbox_inches="tight", pad_inches=0.12)
    plt.close(fig)


def _build_lld_png(out_path: str) -> None:
    fig, ax = plt.subplots(figsize=(12, 6.4), dpi=140)
    ax.set_facecolor(_BG)
    fig.patch.set_facecolor(_BG)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis("off")

    def box(x, y, w, h, title, edge="#38bdf8"):
        r = mpatches.FancyBboxPatch(
            (x - w / 2, y - h / 2), w, h, boxstyle="round,pad=0.02",
            facecolor=_CARD, edgecolor=edge, linewidth=1.8,
        )
        ax.add_patch(r)
        ax.text(x, y, title, ha="center", va="center", color="white", fontsize=9, fontweight="bold")

    box(2.0, 5.4, 2.4, 0.95, "users\n(RBAC, section)")
    box(5.2, 5.4, 2.4, 0.95, "questions\n(tags, constraints)")
    box(8.4, 5.4, 2.4, 0.95, "coding_tests\n(proctoring, access)")
    box(3.6, 3.5, 2.3, 0.9, "test_cases\n(input / expected)")
    box(7.2, 3.5, 2.5, 0.9, "submissions\n(code, status, score)")
    box(2.3, 1.7, 2.2, 0.85, "mcq_*", "#a78bfa")
    box(5.4, 1.7, 2.2, 0.85, "proctoring_logs", "#f87171")
    box(8.5, 1.7, 2.2, 0.85, "plagiarism_reports", "#fbbf24")
    for x1, x2, y in [(3.2, 4.0, 5.4), (6.4, 7.2, 5.4), (2.8, 3.6, 4.25), (6.8, 7.2, 4.25)]:
        ax.plot([x1, x2], [y, y], color="#475569", lw=1.5)
    ax.text(6, 0.45, "Low-Level Design — core entities & relations (see SYSTEM_DESIGN.md §2.1)", ha="center", color="#64748b", fontsize=8.5)
    fig.savefig(out_path, facecolor=_BG, edgecolor="none", bbox_inches="tight", pad_inches=0.12)
    plt.close(fig)


def _build_devops_png(out_path: str) -> None:
    fig, ax = plt.subplots(figsize=(12, 6.4), dpi=140)
    ax.set_facecolor(_BG)
    fig.patch.set_facecolor(_BG)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis("off")
    pipeline = [
        (1.15, 5.1, "Git", "Source\nGitHub/GitLab"),
        (3.05, 5.1, "CI/CD", "Actions / Jenkins\nmvnw + npm ci"),
        (4.95, 5.1, "Build", "Dockerfile\nmulti-stage"),
        (6.85, 5.1, "Registry", "GHCR / Docker Hub\nversioned tags"),
        (8.75, 5.1, "Deploy", "K8s / Compose\nrolling updates"),
        (10.65, 5.1, "Monitor", "Prometheus\nGrafana (future)"),
    ]
    for x, y, t1, t2 in pipeline:
        r = mpatches.FancyBboxPatch(
            (x - 0.78, y - 0.62), 1.56, 1.24, boxstyle="round,pad=0.02",
            facecolor=_CARD, edgecolor="#22d3ee", linewidth=1.6,
        )
        ax.add_patch(r)
        ax.text(x, y + 0.28, t1, ha="center", color="#22d3ee", fontsize=9.5, fontweight="bold")
        ax.text(x, y - 0.12, t2, ha="center", color="#94a3b8", fontsize=6.8)
    for i in range(len(pipeline) - 1):
        x1 = pipeline[i][0] + 0.78
        x2 = pipeline[i + 1][0] - 0.78
        ax.annotate("", xy=(x2, 5.1), xytext=(x1, 5.1), arrowprops=dict(arrowstyle="-|>", color="#64748b", lw=1.8))
    runtime = [
        (2.4, 2.35, "API", "Spring Boot\nreplicas"),
        (4.8, 2.35, "MySQL", "RDS / Cloud SQL\nbackups"),
        (7.2, 2.35, "Cache", "Redis\nsessions (future)"),
        (9.6, 2.35, "Sandboxes", "Judge0 workers\nisolated runners"),
    ]
    for x, y, t1, t2 in runtime:
        r = mpatches.FancyBboxPatch(
            (x - 0.95, y - 0.48), 1.9, 0.96, boxstyle="round,pad=0.02",
            facecolor="#172554", edgecolor="#a78bfa", linewidth=1.6,
        )
        ax.add_patch(r)
        ax.text(x, y + 0.12, t1, ha="center", color="#a78bfa", fontsize=9, fontweight="bold")
        ax.text(x, y - 0.22, t2, ha="center", color="#94a3b8", fontsize=6.8)
    ax.text(6, 0.95, "Future-ready: secrets manager · TLS ingress · HPA · blue/green · read replicas", ha="center", color="#cbd5e1", fontsize=8)
    ax.text(6, 0.35, "DevOps target architecture — not all components required on day one", ha="center", color="#64748b", fontsize=8)
    fig.savefig(out_path, facecolor=_BG, edgecolor="none", bbox_inches="tight", pad_inches=0.12)
    plt.close(fig)


def _ensure_ppt_assets() -> dict:
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ppt_assets")
    os.makedirs(base, exist_ok=True)
    paths = {
        "hld": os.path.join(base, "hld_layers.png"),
        "lld": os.path.join(base, "lld_data_model.png"),
        "devops": os.path.join(base, "devops_future.png"),
    }
    _build_hld_png(paths["hld"])
    _build_lld_png(paths["lld"])
    _build_devops_png(paths["devops"])
    return paths


prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# ─── Color Palette (clean dark theme) ───
BG_DARK      = RGBColor(0x0F, 0x17, 0x2A)
BG_CARD      = RGBColor(0x1E, 0x29, 0x3B)
BG_CARD2     = RGBColor(0x15, 0x20, 0x33)
BG_HEADER    = RGBColor(0x17, 0x1F, 0x30)
ACCENT_BLUE  = RGBColor(0x38, 0xBD, 0xF8)
ACCENT_PURPLE= RGBColor(0xA7, 0x8B, 0xFA)
ACCENT_GREEN = RGBColor(0x34, 0xD3, 0x99)
ACCENT_AMBER = RGBColor(0xFB, 0xBF, 0x24)
ACCENT_RED   = RGBColor(0xF8, 0x71, 0x71)
ACCENT_INDIGO= RGBColor(0x81, 0x8C, 0xF8)
ACCENT_CYAN  = RGBColor(0x22, 0xD3, 0xEE)
WHITE        = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_GRAY   = RGBColor(0xCB, 0xD5, 0xE1)
MED_GRAY     = RGBColor(0x94, 0xA3, 0xB8)
DIM_GRAY     = RGBColor(0x64, 0x74, 0x8B)
BORDER_COLOR = RGBColor(0x33, 0x41, 0x55)


def add_entrance_anim(slide, shape, delay_ms=0):
    timing = slide._element.find(qn('p:timing'))
    if timing is None:
        timing = slide._element.makeelement(qn('p:timing'), {})
        slide._element.append(timing)
    tn_lst = timing.find(qn('p:tnLst'))
    if tn_lst is None:
        tn_lst = timing.makeelement(qn('p:tnLst'), {})
        timing.append(tn_lst)
    par_seq = tn_lst.find(qn('p:par'))
    if par_seq is None:
        par_seq = tn_lst.makeelement(qn('p:par'), {})
        tn_lst.append(par_seq)
        c_tn_root = par_seq.makeelement(qn('p:cTn'), {'id':'1','dur':'indefinite','restart':'never','nodeType':'tmRoot'})
        par_seq.append(c_tn_root)
        child_tn_lst = c_tn_root.makeelement(qn('p:childTnLst'), {})
        c_tn_root.append(child_tn_lst)
        seq = child_tn_lst.makeelement(qn('p:seq'), {'concurrent':'1','nextAc':'seek'})
        child_tn_lst.append(seq)
        seq_ctn = seq.makeelement(qn('p:cTn'), {'id':'2','dur':'indefinite','nodeType':'mainSeq'})
        seq.append(seq_ctn)
        seq_child = seq_ctn.makeelement(qn('p:childTnLst'), {})
        seq_ctn.append(seq_child)
    else:
        c_tn_root = par_seq.find(qn('p:cTn'))
        child_tn_lst = c_tn_root.find(qn('p:childTnLst'))
        seq = child_tn_lst.find(qn('p:seq'))
        seq_ctn = seq.find(qn('p:cTn'))
        seq_child = seq_ctn.find(qn('p:childTnLst'))

    existing = seq_child.findall(qn('p:par'))
    nid = len(existing) * 6 + 3
    par_a = seq_child.makeelement(qn('p:par'), {})
    seq_child.append(par_a)
    pc = par_a.makeelement(qn('p:cTn'), {'id':str(nid),'fill':'hold'})
    par_a.append(pc)
    st = pc.makeelement(qn('p:stCondLst'), {})
    pc.append(st)
    cond = st.makeelement(qn('p:cond'), {'delay':'0'})
    st.append(cond)
    if len(existing) == 0:
        cond.set('evt','onNext'); cond.set('delay','0')
        tr = cond.makeelement(qn('p:tgtEl'), {}); cond.append(tr)
        tr.append(tr.makeelement(qn('p:sldTgt'), {}))
    ch = pc.makeelement(qn('p:childTnLst'), {}); pc.append(ch)
    ip = ch.makeelement(qn('p:par'), {}); ch.append(ip)
    ic = ip.makeelement(qn('p:cTn'), {'id':str(nid+1),'presetID':'10','presetClass':'entr','presetSubtype':'0','fill':'hold','nodeType':'withEffect'})
    ip.append(ic)
    ist = ic.makeelement(qn('p:stCondLst'), {}); ic.append(ist)
    ist.append(ist.makeelement(qn('p:cond'), {'delay':str(delay_ms)}))
    ich = ic.makeelement(qn('p:childTnLst'), {}); ic.append(ich)
    ae = ich.makeelement(qn('p:animEffect'), {'transition':'in','filter':'fade'}); ich.append(ae)
    cb = ae.makeelement(qn('p:cBhvr'), {}); ae.append(cb)
    cb.append(cb.makeelement(qn('p:cTn'), {'id':str(nid+2),'dur':'500'}))
    tgt = cb.makeelement(qn('p:tgtEl'), {}); cb.append(tgt)
    tgt.append(tgt.makeelement(qn('p:spTgt'), {'spid':str(shape.shape_id)}))


def set_bg(slide, color):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = color


def add_rect(slide, l, t, w, h, color, border=None):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t, w, h)
    s.fill.solid(); s.fill.fore_color.rgb = color
    if border: s.line.color.rgb = border; s.line.width = Pt(1)
    else: s.line.fill.background()
    return s


def add_rounded(slide, l, t, w, h, color, border=BORDER_COLOR):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    s.fill.solid(); s.fill.fore_color.rgb = color
    s.line.color.rgb = border; s.line.width = Pt(1)
    return s


def add_text(slide, l, t, w, h, text, size=18, color=WHITE, bold=False, align=PP_ALIGN.LEFT, font='Segoe UI'):
    tb = slide.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = text
    p.font.size = Pt(size); p.font.color.rgb = color; p.font.bold = bold; p.font.name = font
    p.alignment = align
    return tb


def add_multiline(slide, l, t, w, h, lines, size=14, color=LIGHT_GRAY, line_spacing=Pt(6)):
    tb = slide.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame; tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = line_spacing; p.space_before = Pt(2)
        if isinstance(line, tuple):
            bullet_color, text = line
            r1 = p.add_run(); r1.text = "\u25B8 "; r1.font.size = Pt(size); r1.font.color.rgb = bullet_color; r1.font.name = 'Segoe UI'
            r2 = p.add_run(); r2.text = text; r2.font.size = Pt(size); r2.font.color.rgb = color; r2.font.name = 'Segoe UI'
        else:
            p.text = line; p.font.size = Pt(size); p.font.color.rgb = color; p.font.name = 'Segoe UI'
    return tb


def add_circle(slide, l, t, sz, color, text, tsz=18):
    s = slide.shapes.add_shape(MSO_SHAPE.OVAL, l, t, sz, sz)
    s.fill.solid(); s.fill.fore_color.rgb = color; s.line.fill.background()
    tf = s.text_frame; tf.word_wrap = False
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    p.text = text; p.font.size = Pt(tsz); p.font.color.rgb = WHITE; p.font.bold = True; p.font.name = 'Segoe UI'
    return s


def add_line_accent(slide, l, t, w, color):
    s = add_rect(slide, l, t, w, Pt(3), color)
    return s


def add_arrow_shape(slide, l, t, w, h, color=MED_GRAY):
    s = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, l, t, w, h)
    s.fill.solid(); s.fill.fore_color.rgb = color; s.line.fill.background()
    return s


def add_down_arrow(slide, l, t, w, h, color=MED_GRAY):
    s = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, l, t, w, h)
    s.fill.solid(); s.fill.fore_color.rgb = color; s.line.fill.background()
    return s


def header(slide, title, subtitle=None):
    set_bg(slide, BG_DARK)
    add_rect(slide, Inches(0), Inches(0), prs.slide_width, Inches(1.25), BG_HEADER)
    add_rect(slide, Inches(0), Inches(1.25), prs.slide_width, Pt(2), ACCENT_BLUE)
    t = add_text(slide, Inches(0.7), Inches(0.2), Inches(10), Inches(0.6), title, size=30, color=WHITE, bold=True)
    if subtitle:
        add_text(slide, Inches(0.7), Inches(0.75), Inches(10), Inches(0.35), subtitle, size=14, color=MED_GRAY)
    return t


# ════════════════════════════════════════════════════════════════
# SLIDE 1: TITLE
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, BG_DARK)

add_rect(slide, Inches(0), Inches(0), prs.slide_width, Inches(0.08), ACCENT_BLUE)
add_rect(slide, Inches(0), Inches(7.42), prs.slide_width, Inches(0.08), ACCENT_PURPLE)

# Left accent bar
add_rect(slide, Inches(0), Inches(0), Inches(0.06), prs.slide_height, ACCENT_BLUE)

icon = add_text(slide, Inches(0), Inches(1.5), prs.slide_width, Inches(0.9),
                "</> ", size=50, color=ACCENT_BLUE, bold=True, align=PP_ALIGN.CENTER, font='Consolas')
add_entrance_anim(slide, icon, 0)

title = add_text(slide, Inches(0), Inches(2.3), prs.slide_width, Inches(1.0),
                 "CodeCampus", size=56, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
add_entrance_anim(slide, title, 200)

add_line_accent(slide, Inches(5.2), Inches(3.35), Inches(2.9), ACCENT_BLUE)

sub = add_text(slide, Inches(0), Inches(3.6), prs.slide_width, Inches(0.6),
               "A Full-Stack Online Coding & Assessment Platform", size=22, color=ACCENT_CYAN, align=PP_ALIGN.CENTER)
add_entrance_anim(slide, sub, 400)

desc = add_text(slide, Inches(2.5), Inches(4.4), Inches(8.333), Inches(0.5),
                "Practice  \u2022  Proctored tests  \u2022  Hiring  \u2022  Plagiarism  \u2022  Pattern-based Code Coach",
                size=15, color=MED_GRAY, align=PP_ALIGN.CENTER)
add_entrance_anim(slide, desc, 600)

# Tech badges at bottom
techs = ["React 19", "Spring Boot 3.4", "MySQL", "JWT", "Tailwind CSS", "Java 21"]
badge_w = Inches(1.6)
start_x = Inches(1.7)
for i, tech_name in enumerate(techs):
    x = start_x + badge_w * i
    badge = add_rounded(slide, x, Inches(5.5), Inches(1.45), Inches(0.45), BG_CARD2, BORDER_COLOR)
    add_entrance_anim(slide, badge, 700 + i * 80)
    add_text(slide, x, Inches(5.52), Inches(1.45), Inches(0.4), tech_name,
             size=11, color=ACCENT_BLUE, bold=True, align=PP_ALIGN.CENTER)

add_text(slide, Inches(0), Inches(6.5), prs.slide_width, Inches(0.4),
         "Built by Adarsh Kumar  |  2026", size=13, color=DIM_GRAY, align=PP_ALIGN.CENTER)


# ════════════════════════════════════════════════════════════════
# SLIDE 2: TABLE OF CONTENTS
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Table of Contents", "Presentation Overview")

toc = [
    ("01", "Project Overview & Objectives", ACCENT_BLUE),
    ("02", "Tech Stack \u2014 Frontend", ACCENT_PURPLE),
    ("03", "Tech Stack \u2014 Backend & Database", ACCENT_GREEN),
    ("04", "System Architecture & Flow Diagram", ACCENT_CYAN),
    ("05", "User Roles & Permissions (4 Roles)", ACCENT_AMBER),
    ("06", "Role Access Matrix", ACCENT_RED),
    ("07", "Code Execution Engine (Local, No API)", ACCENT_INDIGO),
    ("08", "Data Seeding (problems.json)", ACCENT_BLUE),
    ("09", "Proctoring System & Anti-Cheating", ACCENT_RED),
    ("10", "Plagiarism Detection Engine", ACCENT_PURPLE),
    ("11", "Coding Tests, Contests & Hiring", ACCENT_GREEN),
    ("12", "Database Schema & Models", ACCENT_AMBER),
    ("13", "Key API Endpoints", ACCENT_CYAN),
    ("14", "Features Summary", ACCENT_BLUE),
]

for i, (num, title_t, color) in enumerate(toc):
    col = 0 if i < 7 else 1
    row = i % 7
    x = Inches(0.8) if col == 0 else Inches(7.0)
    y = Inches(1.6) + Inches(row * 0.78)

    c = add_circle(slide, x, y + Inches(0.02), Inches(0.5), color, num, tsz=13)
    add_entrance_anim(slide, c, i * 60)
    t = add_text(slide, x + Inches(0.65), y + Inches(0.05), Inches(5.2), Inches(0.4),
                 title_t, size=15, color=LIGHT_GRAY)
    add_entrance_anim(slide, t, i * 60 + 30)


# ════════════════════════════════════════════════════════════════
# SLIDE 3: PROJECT OVERVIEW
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Project Overview", "What is CodeCampus?")

desc_card = add_rounded(slide, Inches(0.7), Inches(1.55), Inches(11.9), Inches(1.6), BG_CARD, BORDER_COLOR)
add_entrance_anim(slide, desc_card, 0)
add_text(slide, Inches(1.0), Inches(1.65), Inches(11.3), Inches(1.4),
    "CodeCampus is a full-stack online coding platform designed for colleges and companies. "
    "It provides a LeetCode / GeeksForGeeks-style environment where students practice coding problems, "
    "teachers create & proctor exams, companies conduct hiring tests, and admins manage the entire system.\n\n"
    "All code execution happens locally on the server using installed compilers (gcc, g++, javac, python, node) "
    "\u2014 no paid judge API required. Pattern-based Code Coach hints ship with every Run/Submit (no external LLM). "
    "Notifications on accepted submissions; Judge0 Docker path documented for future scale.",
    size=14, color=LIGHT_GRAY)

objectives = [
    ("Practice", "190+ problems in C, C++,\nJava, Python, JavaScript.\nMonaco code editor.", ACCENT_BLUE),
    ("Assess", "Teachers & companies create\ntimed, proctored coding\ntests with access codes.", ACCENT_PURPLE),
    ("Secure", "Camera monitoring, tab\ntracking, fullscreen lock,\ncopy-paste detection.", ACCENT_GREEN),
    ("Integrity", "Plagiarism detection with\nJaccard, N-gram & LCS\nalgorithms (70% threshold).", ACCENT_AMBER),
]

for i, (t, d, color) in enumerate(objectives):
    x = Inches(0.7 + i * 3.05)
    y = Inches(3.5)
    card = add_rounded(slide, x, y, Inches(2.9), Inches(3.3), BG_CARD2, BORDER_COLOR)
    add_entrance_anim(slide, card, 200 + i * 150)
    add_line_accent(slide, x + Inches(0.25), y + Inches(0.25), Inches(2.4), color)
    tt = add_text(slide, x + Inches(0.25), y + Inches(0.45), Inches(2.4), Inches(0.4), t, size=22, color=color, bold=True)
    add_entrance_anim(slide, tt, 300 + i * 150)
    add_text(slide, x + Inches(0.25), y + Inches(1.1), Inches(2.4), Inches(2.0), d, size=14, color=LIGHT_GRAY)


# ════════════════════════════════════════════════════════════════
# SLIDE 4: TECH STACK - FRONTEND
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Tech Stack \u2014 Frontend", "Client-side technologies powering the UI")

fe_items = [
    ("React 19", "Component-based UI library for interactive, dynamic views", "R", ACCENT_BLUE),
    ("Vite 6", "Lightning-fast dev server with hot module replacement", "V", ACCENT_PURPLE),
    ("Tailwind CSS 3", "Utility-first CSS framework for responsive, dark-theme design", "T", ACCENT_GREEN),
    ("Monaco Editor", "VS Code\u2019s code editor embedded in-browser (syntax highlighting, IntelliSense)", "M", ACCENT_AMBER),
    ("React Router 7", "Client-side routing with role-based ProtectedRoute component", "RR", ACCENT_RED),
    ("Axios", "HTTP client with JWT token interceptors for all API calls", "Ax", ACCENT_INDIGO),
    ("Lucide React", "Modern, consistent SVG icon library", "Li", ACCENT_CYAN),
    ("React Hot Toast", "Toast notification system for success/error/warning feedback", "HT", ACCENT_PURPLE),
]

for i, (name, desc_t, icon_t, color) in enumerate(fe_items):
    col = i % 2; row = i // 2
    x = Inches(0.7 + col * 6.15)
    y = Inches(1.55 + row * 1.4)
    card = add_rounded(slide, x, y, Inches(5.95), Inches(1.2), BG_CARD2, BORDER_COLOR)
    add_entrance_anim(slide, card, i * 80)
    c = add_circle(slide, x + Inches(0.2), y + Inches(0.2), Inches(0.7), color, icon_t, tsz=15)
    add_entrance_anim(slide, c, i * 80 + 40)
    add_text(slide, x + Inches(1.1), y + Inches(0.12), Inches(4.6), Inches(0.38), name, size=17, color=WHITE, bold=True)
    add_text(slide, x + Inches(1.1), y + Inches(0.52), Inches(4.6), Inches(0.55), desc_t, size=13, color=MED_GRAY)


# ════════════════════════════════════════════════════════════════
# SLIDE 5: TECH STACK - BACKEND
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Tech Stack \u2014 Backend & Database", "Server-side technologies")

be_items = [
    ("Spring Boot 3.4", "Java framework: auto-config, embedded Tomcat, REST controllers", "SB", ACCENT_GREEN),
    ("Java 21 (JDK 25)", "Modern Java with records, sealed classes, pattern matching", "J", ACCENT_RED),
    ("Spring Security", "Authentication & authorization framework with role-based access (RBAC)", "SS", ACCENT_BLUE),
    ("JWT (jjwt 0.12.6)", "Stateless token-based auth \u2014 HS256, 24-hour expiry", "JWT", ACCENT_AMBER),
    ("Spring Data JPA", "ORM layer (Hibernate) for entity mapping & repository pattern", "JPA", ACCENT_PURPLE),
    ("MySQL 8+", "Production relational database (H2 in-memory for development)", "DB", ACCENT_GREEN),
    ("Maven 3.9", "Build tool & dependency management via pom.xml", "Mv", ACCENT_INDIGO),
    ("Jackson", "JSON serialization \u2014 parses problems.json for data seeding", "Jk", ACCENT_CYAN),
]

for i, (name, desc_t, icon_t, color) in enumerate(be_items):
    col = i % 2; row = i // 2
    x = Inches(0.7 + col * 6.15)
    y = Inches(1.55 + row * 1.4)
    card = add_rounded(slide, x, y, Inches(5.95), Inches(1.2), BG_CARD2, BORDER_COLOR)
    add_entrance_anim(slide, card, i * 80)
    c = add_circle(slide, x + Inches(0.2), y + Inches(0.2), Inches(0.7), color, icon_t, tsz=15)
    add_entrance_anim(slide, c, i * 80 + 40)
    add_text(slide, x + Inches(1.1), y + Inches(0.12), Inches(4.6), Inches(0.38), name, size=17, color=WHITE, bold=True)
    add_text(slide, x + Inches(1.1), y + Inches(0.52), Inches(4.6), Inches(0.55), desc_t, size=13, color=MED_GRAY)


# ════════════════════════════════════════════════════════════════
# SLIDE 6: SYSTEM ARCHITECTURE - PROPER FLOW DIAGRAM
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "System Architecture & Flow Diagram", "End-to-end request lifecycle")

# --- TOP ROW: 4 Architecture Layers side-by-side ---
layers = [
    ("\U0001F310 Browser (Client)", "React 19 + Vite\nTailwind CSS\nMonaco Editor\nAxios + JWT Token\nPort: 5173", ACCENT_BLUE),
    ("\u2699 REST API Layer", "AuthController\nCodeController\nTestController\nQuestionController\nAdmin / Company / Proctoring", ACCENT_PURPLE),
    ("\U0001F527 Service Layer", "AuthService\nCodeExecutionService\nCodingTestService\nPlagiarismService\nProctoringService", ACCENT_GREEN),
    ("\U0001F5C4 Database Layer", "MySQL 8+ / H2\nSpring Data JPA\nHibernate ORM\n8 Entity Tables\nPort: 3306", ACCENT_AMBER),
]

box_w = Inches(2.55)
gap = Inches(0.15)
start_x = Inches(0.7)
y_top = Inches(1.55)
box_h = Inches(2.85)

for i, (title_t, desc_t, color) in enumerate(layers):
    x = start_x + i * (box_w + gap + Inches(0.25))
    card = add_rounded(slide, x, y_top, box_w, box_h, BG_CARD2, color)
    add_entrance_anim(slide, card, i * 150)
    add_line_accent(slide, x + Inches(0.15), y_top + Inches(0.15), box_w - Inches(0.3), color)
    tt = add_text(slide, x + Inches(0.15), y_top + Inches(0.3), box_w - Inches(0.3), Inches(0.4),
                  title_t, size=14, color=color, bold=True, align=PP_ALIGN.CENTER)
    add_entrance_anim(slide, tt, i * 150 + 75)
    add_text(slide, x + Inches(0.15), y_top + Inches(0.85), box_w - Inches(0.3), Inches(1.8),
             desc_t, size=12, color=LIGHT_GRAY, align=PP_ALIGN.CENTER)

    # Arrow between boxes
    if i < 3:
        ax = x + box_w + Inches(0.02)
        arrow = add_arrow_shape(slide, ax, y_top + Inches(1.2), Inches(0.35), Inches(0.35), DIM_GRAY)
        add_entrance_anim(slide, arrow, i * 150 + 120)

# --- BOTTOM: Request Flow (step-by-step) ---
flow_y = Inches(4.7)
add_rounded(slide, Inches(0.7), flow_y, Inches(11.9), Inches(2.5), BG_CARD, BORDER_COLOR)

flow_title = add_text(slide, Inches(1.0), flow_y + Inches(0.1), Inches(11), Inches(0.4),
                       "Request Flow: How a Code Submission Works", size=16, color=WHITE, bold=True)
add_entrance_anim(slide, flow_title, 700)

flow_steps = [
    ("1", "User writes\ncode in Monaco\nEditor", ACCENT_BLUE),
    ("2", "Click \"Run\" sends\nPOST /api/code\n+ JWT header", ACCENT_CYAN),
    ("3", "JwtFilter\nvalidates token\n& loads user", ACCENT_PURPLE),
    ("4", "CodeController\ncalls\nCodeExecutionService", ACCENT_INDIGO),
    ("5", "Code written to\ntemp file,\ncompiled locally", ACCENT_GREEN),
    ("6", "Run against\nall test cases,\ncompare output", ACCENT_AMBER),
    ("7", "Save Submission\nto DB with\nscore & status", ACCENT_RED),
    ("8", "JSON response\nreturned to\nReact UI", ACCENT_BLUE),
]

step_w = Inches(1.3)
step_h = Inches(1.45)
flow_start_x = Inches(0.85)
flow_step_y = flow_y + Inches(0.55)

for i, (num, text, color) in enumerate(flow_steps):
    sx = flow_start_x + i * Inches(1.45)
    step_card = add_rounded(slide, sx, flow_step_y, step_w, step_h, BG_CARD2, color)
    add_entrance_anim(slide, step_card, 800 + i * 80)
    nc = add_circle(slide, sx + Inches(0.4), flow_step_y + Inches(0.05), Inches(0.4), color, num, tsz=13)
    add_entrance_anim(slide, nc, 850 + i * 80)
    add_text(slide, sx + Inches(0.05), flow_step_y + Inches(0.5), step_w - Inches(0.1), Inches(0.9),
             text, size=10, color=LIGHT_GRAY, align=PP_ALIGN.CENTER)
    if i < 7:
        add_text(slide, sx + step_w - Inches(0.05), flow_step_y + Inches(0.5), Inches(0.25), Inches(0.4),
                 "\u203A", size=18, color=DIM_GRAY, bold=True)


# ════════════════════════════════════════════════════════════════
# SLIDE 7: USER ROLES
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "User Roles & Permissions", "4 distinct roles with different capabilities")

roles_data = [
    ("ADMIN", "admin / admin123", ACCENT_RED, [
        "Full platform control & monitoring",
        "View all users, questions, tests, submissions",
        "Change user roles (promote / demote)",
        "Enable / disable user accounts",
        "Dashboard: total users, questions, tests stats",
        "Access teacher & company dashboards",
        "Create questions & tests",
    ]),
    ("TEACHER", "teacher / teacher123", ACCENT_BLUE, [
        "Create coding questions with test cases",
        "Create & publish timed coding tests",
        "Configure proctoring (camera, tabs, fullscreen)",
        "View student submissions & scores",
        "Run plagiarism checks on test submissions",
        "View proctoring reports & trust scores",
        "Manage leaderboards for tests",
    ]),
    ("STUDENT", "student / student123", ACCENT_GREEN, [
        "Browse & solve 190+ coding problems",
        "Use online compiler (5 languages)",
        "Take timed, proctored coding tests",
        "View personal dashboard & progress",
        "Track progress with study plans",
        "View leaderboard & rankings",
        "Edit profile (bio, social links, avatar)",
    ]),
    ("COMPANY", "company / company123", ACCENT_AMBER, [
        "Create hiring tests for recruitment",
        "Create custom coding questions",
        "View candidate results & rankings",
        "Auto-shortlist candidates (\u2265 60% score)",
        "Run plagiarism checks on submissions",
        "View proctoring reports for candidates",
        "Company branding on test pages",
    ]),
]

for i, (role, creds, color, perms) in enumerate(roles_data):
    x = Inches(0.5 + i * 3.1)
    y = Inches(1.5)
    card = add_rounded(slide, x, y, Inches(3.0), Inches(5.6), BG_CARD2, color)
    add_entrance_anim(slide, card, i * 150)

    add_line_accent(slide, x + Inches(0.2), y + Inches(0.15), Inches(2.6), color)
    rt = add_text(slide, x + Inches(0.2), y + Inches(0.3), Inches(2.6), Inches(0.45),
                  role, size=22, color=color, bold=True, align=PP_ALIGN.CENTER)
    add_entrance_anim(slide, rt, i * 150 + 75)
    add_text(slide, x + Inches(0.2), y + Inches(0.75), Inches(2.6), Inches(0.25),
             creds, size=10, color=MED_GRAY, align=PP_ALIGN.CENTER, font='Consolas')

    bullets = [(color, p) for p in perms]
    bl = add_multiline(slide, x + Inches(0.15), y + Inches(1.15), Inches(2.7), Inches(4.2),
                       bullets, size=11, color=LIGHT_GRAY, line_spacing=Pt(5))
    add_entrance_anim(slide, bl, i * 150 + 120)


# ════════════════════════════════════════════════════════════════
# SLIDE 8: ROLE ACCESS MATRIX
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Role Access Matrix", "Who can access what \u2014 at a glance")

features = [
    "Solve Problems / Practice",
    "Online Compiler (5 Languages)",
    "Study Plans",
    "Take Coding Tests",
    "Create Questions",
    "Create / Publish Tests",
    "Create Hiring Tests",
    "View Student Submissions",
    "Proctoring Reports",
    "Plagiarism Detection",
    "Manage Users",
    "View Candidate Results",
    "Change User Roles",
    "Dashboard Analytics",
]

# access[role][feature] - Admin, Teacher, Student, Company
access = [
    [1,1,1,1, 1,1,0,1, 1,1,1,1, 1,1],
    [1,1,1,1, 1,1,0,1, 1,1,0,0, 0,1],
    [1,1,1,1, 0,0,0,0, 0,0,0,0, 0,1],
    [0,0,0,0, 1,0,1,0, 1,1,0,1, 0,1],
]
role_names = ["Admin", "Teacher", "Student", "Company"]
role_colors = [ACCENT_RED, ACCENT_BLUE, ACCENT_GREEN, ACCENT_AMBER]

tbl_left = Inches(1.2)
tbl_top = Inches(1.55)
col_feat_w = Inches(3.8)
col_role_w = Inches(1.7)
row_h = Inches(0.38)

# Header row
add_rounded(slide, tbl_left, tbl_top, col_feat_w + col_role_w * 4, row_h, BG_HEADER, BORDER_COLOR)
add_text(slide, tbl_left + Inches(0.15), tbl_top + Inches(0.02), col_feat_w, row_h,
         "Feature", size=13, color=ACCENT_BLUE, bold=True)
for j, (rn, rc) in enumerate(zip(role_names, role_colors)):
    add_text(slide, tbl_left + col_feat_w + col_role_w * j, tbl_top + Inches(0.02),
             col_role_w, row_h, rn, size=13, color=rc, bold=True, align=PP_ALIGN.CENTER)

for i, feat in enumerate(features):
    y = tbl_top + row_h * (i + 1)
    bg = BG_CARD2 if i % 2 == 0 else BG_CARD
    add_rounded(slide, tbl_left, y, col_feat_w + col_role_w * 4, row_h, bg, BORDER_COLOR)
    add_text(slide, tbl_left + Inches(0.15), y + Inches(0.02), col_feat_w, row_h,
             feat, size=11, color=LIGHT_GRAY)
    for j in range(4):
        sym = "\u2713" if access[j][i] else "\u2717"
        sc = ACCENT_GREEN if access[j][i] else RGBColor(0x4B, 0x55, 0x63)
        add_text(slide, tbl_left + col_feat_w + col_role_w * j, y + Inches(0.02),
                 col_role_w, row_h, sym, size=14, color=sc, bold=True, align=PP_ALIGN.CENTER)


# ════════════════════════════════════════════════════════════════
# SLIDE 9: CODE EXECUTION ENGINE
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Code Execution Engine", "100% local execution \u2014 no external API used")

# Important callout
imp = add_rounded(slide, Inches(0.7), Inches(1.55), Inches(11.9), Inches(1.1), RGBColor(0x1C, 0x16, 0x0A), ACCENT_AMBER)
add_entrance_anim(slide, imp, 0)
add_text(slide, Inches(1.0), Inches(1.65), Inches(11.3), Inches(0.9),
    "\u26A0  IMPORTANT: CodeCampus does NOT use any external compiler API (Judge0, Sphere Engine, etc.). "
    "All code compilation and execution happens locally on the server machine using installed compilers "
    "(gcc, g++, javac, python, node). Code is written to temp directory, compiled, executed against test cases, and cleaned up.",
    size=14, color=ACCENT_AMBER)

# 5-step flow
steps = [
    ("1", "Receive\nCode", "Frontend sends code,\nlanguage, question ID\nvia POST request", ACCENT_BLUE),
    ("2", "Write to\nTemp File", "Code written to temp\ndirectory as Main.java,\nMain.py, etc.", ACCENT_PURPLE),
    ("3", "Compile\nCode", "gcc / g++ / javac\ncompiles the code.\nPython & JS skip.", ACCENT_GREEN),
    ("4", "Run Against\nTest Cases", "Execute with each input,\ncompare stdout with\nexpected output.", ACCENT_AMBER),
    ("5", "Score &\nSave", "Calculate pass ratio,\nsave Submission entity\nto database.", ACCENT_RED),
]

for i, (num, title_t, desc_t, color) in enumerate(steps):
    x = Inches(0.6 + i * 2.5)
    y = Inches(3.0)
    card = add_rounded(slide, x, y, Inches(2.2), Inches(2.7), BG_CARD2, color)
    add_entrance_anim(slide, card, 200 + i * 120)
    c = add_circle(slide, x + Inches(0.7), y + Inches(0.12), Inches(0.65), color, num, tsz=18)
    add_entrance_anim(slide, c, 260 + i * 120)
    add_text(slide, x + Inches(0.1), y + Inches(0.85), Inches(2.0), Inches(0.5),
             title_t, size=14, color=color, bold=True, align=PP_ALIGN.CENTER)
    add_text(slide, x + Inches(0.1), y + Inches(1.4), Inches(2.0), Inches(1.1),
             desc_t, size=11, color=LIGHT_GRAY, align=PP_ALIGN.CENTER)
    if i < 4:
        add_text(slide, x + Inches(2.05), y + Inches(1.0), Inches(0.6), Inches(0.4),
                 "\u2192", size=22, color=DIM_GRAY, bold=True, align=PP_ALIGN.CENTER)

# Supported languages row
lang_y = Inches(6.0)
add_rounded(slide, Inches(0.7), lang_y, Inches(11.9), Inches(1.0), BG_CARD, BORDER_COLOR)
add_text(slide, Inches(1.0), lang_y + Inches(0.08), Inches(3), Inches(0.35),
         "Supported Languages:", size=14, color=WHITE, bold=True)
langs = [("C", "gcc", ACCENT_BLUE), ("C++", "g++", ACCENT_PURPLE), ("Java", "javac + java", ACCENT_RED),
         ("Python", "python3", ACCENT_GREEN), ("JavaScript", "node", ACCENT_AMBER)]
for i, (lang, comp, color) in enumerate(langs):
    lx = Inches(1.0 + i * 2.3)
    add_text(slide, lx, lang_y + Inches(0.45), Inches(2.1), Inches(0.4),
             f"{lang}  \u2014  {comp}", size=13, color=color, bold=True)


# ════════════════════════════════════════════════════════════════
# SLIDE 10: DATA SEEDING
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Data Seeding \u2014 Where Do Problems Come From?", "Pre-loaded from a local JSON file, not an external API")

src = add_rounded(slide, Inches(0.7), Inches(1.55), Inches(11.9), Inches(1.3), BG_CARD, BORDER_COLOR)
add_entrance_anim(slide, src, 0)
add_text(slide, Inches(1.0), Inches(1.65), Inches(11.3), Inches(1.1),
    "All 190+ coding problems are stored locally in:  server/src/main/resources/problems.json  (29,576 lines)\n"
    "On server startup, DataInitializer \u2192 ProblemSeeder reads this JSON file using Jackson ObjectMapper and "
    "inserts each problem (with title, description, tags, difficulty, test cases) into the database.\n"
    "No external API is called. Data is also NOT scraped \u2014 it is hand-curated in the JSON file.",
    size=14, color=LIGHT_GRAY)

seed_steps = [
    ("problems.json", "29,576 lines of JSON data\n190+ curated problems\nEasy / Medium / Hard\n5-15 test cases each", ACCENT_BLUE),
    ("ProblemSeeder.java", "Reads JSON via Jackson\nParses title, desc, tags\nCreates Question entities\nMaps TestCase objects", ACCENT_PURPLE),
    ("DataInitializer.java", "Runs on app startup\n(CommandLineRunner)\nSeeds users + problems\nSkips if already seeded", ACCENT_GREEN),
    ("MySQL Database", "questions table\ntest_cases table\nquestion_tags table\nReady for students!", ACCENT_AMBER),
]

for i, (title_t, desc_t, color) in enumerate(seed_steps):
    x = Inches(0.7 + i * 3.05)
    y = Inches(3.2)
    card = add_rounded(slide, x, y, Inches(2.85), Inches(3.0), BG_CARD2, color)
    add_entrance_anim(slide, card, 150 + i * 150)
    add_line_accent(slide, x + Inches(0.2), y + Inches(0.15), Inches(2.45), color)
    tt = add_text(slide, x + Inches(0.2), y + Inches(0.35), Inches(2.45), Inches(0.35),
                  title_t, size=15, color=color, bold=True, align=PP_ALIGN.CENTER)
    add_entrance_anim(slide, tt, 200 + i * 150)
    add_text(slide, x + Inches(0.2), y + Inches(0.85), Inches(2.45), Inches(1.9),
             desc_t, size=13, color=LIGHT_GRAY, align=PP_ALIGN.CENTER)
    if i < 3:
        add_text(slide, x + Inches(2.7), y + Inches(1.2), Inches(0.5), Inches(0.4),
                 "\u2192", size=22, color=DIM_GRAY, bold=True, align=PP_ALIGN.CENTER)

add_text(slide, Inches(0.7), Inches(6.5), Inches(11.9), Inches(0.4),
    "Each problem includes: title, description, input/output format, constraints, difficulty, tags, sample I/O, explanation, and hidden test cases.",
    size=12, color=MED_GRAY)


# ════════════════════════════════════════════════════════════════
# SLIDE 11: PROCTORING SYSTEM
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Proctoring System & Anti-Cheating", "Real-time exam monitoring built into the platform")

proctor_features = [
    ("Camera Monitoring", "Webcam captures periodic snapshots\nvia browser MediaDevices API.\nDetects: no face, multiple faces,\ncamera blocked.", ACCENT_BLUE),
    ("Tab Switch Tracking", "Tracks visibility changes using\nvisibilitychange API. After max\nswitches (default 3), test auto-submits.", ACCENT_RED),
    ("Fullscreen Lock", "Forces fullscreen mode via\nFullscreen API. Logs every exit.\nWarning modal on exit.", ACCENT_PURPLE),
    ("Copy-Paste Detection", "Detects copy, paste, and\nright-click events. All events\nlogged to ProctoringLog table.", ACCENT_AMBER),
]

for i, (title_t, desc_t, color) in enumerate(proctor_features):
    x = Inches(0.7 + i * 3.05)
    y = Inches(1.55)
    card = add_rounded(slide, x, y, Inches(2.85), Inches(2.7), BG_CARD2, color)
    add_entrance_anim(slide, card, i * 150)
    add_line_accent(slide, x + Inches(0.2), y + Inches(0.15), Inches(2.45), color)
    tt = add_text(slide, x + Inches(0.2), y + Inches(0.35), Inches(2.45), Inches(0.35),
                  title_t, size=15, color=color, bold=True, align=PP_ALIGN.CENTER)
    add_entrance_anim(slide, tt, i * 150 + 75)
    add_text(slide, x + Inches(0.2), y + Inches(0.85), Inches(2.45), Inches(1.6),
             desc_t, size=12, color=LIGHT_GRAY, align=PP_ALIGN.CENTER)

# Trust Score
trust_card = add_rounded(slide, Inches(0.7), Inches(4.55), Inches(5.8), Inches(2.6), BG_CARD, BORDER_COLOR)
add_entrance_anim(slide, trust_card, 700)
add_text(slide, Inches(1.0), Inches(4.65), Inches(5.2), Inches(0.35),
         "Trust Score Calculation", size=16, color=ACCENT_GREEN, bold=True)
trust_items = [
    (ACCENT_GREEN, "Base Score: 100 points"),
    (ACCENT_AMBER, "Tab Switch: \u221210 points each"),
    (ACCENT_RED, "Fullscreen Exit: \u221215 points each"),
    (ACCENT_RED, "Copy/Paste Detected: \u221220 points each"),
    (MED_GRAY, "Minimum Score: 0 points"),
]
add_multiline(slide, Inches(1.0), Inches(5.05), Inches(5.2), Inches(1.8), trust_items, size=13)

# Events
ev_card = add_rounded(slide, Inches(6.8), Inches(4.55), Inches(5.8), Inches(2.6), BG_CARD, BORDER_COLOR)
add_entrance_anim(slide, ev_card, 800)
add_text(slide, Inches(7.1), Inches(4.65), Inches(5.3), Inches(0.35),
         "All Proctoring Event Types", size=16, color=ACCENT_INDIGO, bold=True)
ev_items = [
    (ACCENT_INDIGO, "TEST_STARTED, TEST_SUBMITTED"),
    (ACCENT_RED, "TAB_SWITCH, FULLSCREEN_EXIT"),
    (ACCENT_BLUE, "CAMERA_SNAPSHOT, CAMERA_BLOCKED"),
    (ACCENT_AMBER, "COPY_PASTE_DETECTED, RIGHT_CLICK_DETECTED"),
    (ACCENT_RED, "MULTIPLE_FACES, NO_FACE, SUSPICIOUS_ACTIVITY, AUTO_SUBMITTED"),
]
add_multiline(slide, Inches(7.1), Inches(5.05), Inches(5.3), Inches(1.8), ev_items, size=12)


# ════════════════════════════════════════════════════════════════
# SLIDE 12: PLAGIARISM DETECTION
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Plagiarism Detection Engine", "Automated code similarity analysis \u2014 fully built in-house")

desc_card = add_rounded(slide, Inches(0.7), Inches(1.55), Inches(11.9), Inches(1.0), BG_CARD, BORDER_COLOR)
add_entrance_anim(slide, desc_card, 0)
add_text(slide, Inches(1.0), Inches(1.65), Inches(11.3), Inches(0.8),
    "Compares every pair of submissions for the same question within a test. Code is normalized (comments, strings, "
    "whitespace removed), then analyzed using 3 algorithms. Threshold: 70% similarity flags a PlagiarismReport. "
    "Teachers and companies can review and confirm or dismiss flagged reports.",
    size=14, color=LIGHT_GRAY)

algos = [
    ("Jaccard Similarity", "40%", "Compares unique tokens (identifiers,\nkeywords) between two code files.\nIntersection / Union of token sets.\nWeight: 40% of final score.", ACCENT_BLUE),
    ("N-gram Similarity", "30%", "Generates 3-character n-grams from\nnormalized code. Computes Jaccard\nsimilarity on n-gram sets.\nWeight: 30% of final score.", ACCENT_PURPLE),
    ("LCS Ratio", "30%", "Longest Common Subsequence between\ntwo code strings. Ratio = LCS length /\nmax(len1, len2). Capped at 2000 chars.\nWeight: 30% of final score.", ACCENT_GREEN),
]

for i, (title_t, weight, desc_t, color) in enumerate(algos):
    x = Inches(0.7 + i * 4.1)
    y = Inches(2.9)
    card = add_rounded(slide, x, y, Inches(3.9), Inches(3.2), BG_CARD2, color)
    add_entrance_anim(slide, card, 150 + i * 150)
    c = add_circle(slide, x + Inches(1.4), y + Inches(0.15), Inches(0.9), color, weight, tsz=16)
    add_entrance_anim(slide, c, 200 + i * 150)
    add_text(slide, x + Inches(0.2), y + Inches(1.15), Inches(3.5), Inches(0.35),
             title_t, size=16, color=color, bold=True, align=PP_ALIGN.CENTER)
    add_text(slide, x + Inches(0.2), y + Inches(1.55), Inches(3.5), Inches(1.5),
             desc_t, size=12, color=LIGHT_GRAY, align=PP_ALIGN.CENTER)

flow = add_rounded(slide, Inches(0.7), Inches(6.4), Inches(11.9), Inches(0.65), BG_CARD, BORDER_COLOR)
add_entrance_anim(slide, flow, 700)
add_text(slide, Inches(1.0), Inches(6.48), Inches(11.3), Inches(0.45),
    "Flow: Normalize code \u2192 Remove comments/strings \u2192 Tokenize \u2192 Run 3 algorithms \u2192 Weighted avg \u2192 Flag if \u2265 70% \u2192 Save PlagiarismReport",
    size=13, color=ACCENT_AMBER)


# ════════════════════════════════════════════════════════════════
# SLIDE 13: TESTS & CONTESTS
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Coding Tests, Contests & Hiring Tests", "Three types of assessments on one platform")

test_types = [
    ("COLLEGE Test", "Created by teachers for classroom\nassessments. Timed with start/end.\nProctoring configurable. Questions\nfrom the question bank.\nAccess code for enrollment.", ACCENT_BLUE),
    ("CONTEST / Practice", "Competitive coding contests or\npractice tests. Leaderboard-based\nranking. Open to all students.\nReal-time score tracking.", ACCENT_PURPLE),
    ("HIRING Test", "Created by companies for recruitment.\nIncludes job role, experience level.\nCandidate results with auto-shortlisting\n(\u2265 60% score). Company branding.", ACCENT_AMBER),
]

for i, (title_t, desc_t, color) in enumerate(test_types):
    x = Inches(0.7 + i * 4.1)
    y = Inches(1.55)
    card = add_rounded(slide, x, y, Inches(3.9), Inches(3.2), BG_CARD2, color)
    add_entrance_anim(slide, card, i * 150)
    add_line_accent(slide, x + Inches(0.25), y + Inches(0.15), Inches(3.4), color)
    tt = add_text(slide, x + Inches(0.25), y + Inches(0.35), Inches(3.4), Inches(0.45),
                  title_t, size=20, color=color, bold=True, align=PP_ALIGN.CENTER)
    add_entrance_anim(slide, tt, i * 150 + 75)
    add_text(slide, x + Inches(0.25), y + Inches(1.0), Inches(3.4), Inches(2.0),
             desc_t, size=13, color=LIGHT_GRAY, align=PP_ALIGN.CENTER)

feat_card = add_rounded(slide, Inches(0.7), Inches(5.1), Inches(11.9), Inches(2.0), BG_CARD, BORDER_COLOR)
add_entrance_anim(slide, feat_card, 500)
add_text(slide, Inches(1.0), Inches(5.2), Inches(11), Inches(0.35),
         "Common Test Features:", size=16, color=WHITE, bold=True)

left_items = [
    (ACCENT_BLUE, "Configurable duration, start time, end time"),
    (ACCENT_BLUE, "Access code protection for private tests"),
    (ACCENT_BLUE, "Question weightage (custom marks per question)"),
]
right_items = [
    (ACCENT_GREEN, "Real-time leaderboard with ranking by score"),
    (ACCENT_GREEN, "Auto-submit on tab limit violation"),
    (ACCENT_GREEN, "Test completion tracking (prevents re-submission)"),
]
add_multiline(slide, Inches(1.0), Inches(5.6), Inches(5.5), Inches(1.2), left_items, size=13)
add_multiline(slide, Inches(6.8), Inches(5.6), Inches(5.5), Inches(1.2), right_items, size=13)


# ════════════════════════════════════════════════════════════════
# SLIDE 14: DATABASE SCHEMA
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Database Schema & Models", "8 JPA Entities mapped to MySQL tables")

models = [
    ("User", "id, username, password, fullName,\nemail, role, department,\nenrollmentNumber, profileImage,\nbio, social links, company fields", ACCENT_BLUE),
    ("Question", "id, title, description,\ninputFormat, outputFormat,\nconstraints, difficulty, tags,\nsampleI/O, timeLimit, memoryLimit", ACCENT_PURPLE),
    ("TestCase", "id, input, expectedOutput,\nisSample, isHidden,\nquestion (FK)", ACCENT_GREEN),
    ("Submission", "id, user, question, codingTest,\ncode, language, status,\ntestCasesPassed, score,\nexecutionTimeMs", ACCENT_AMBER),
    ("CodingTest", "id, title, description,\nstartTime, endTime, duration,\nproctoringSettings, testType,\naccessCode, totalMarks", ACCENT_RED),
    ("ProctoringLog", "id, user, codingTest,\neventType, details, snapshot,\nflagged, tabSwitchCount,\ntimestamp", ACCENT_INDIGO),
    ("PlagiarismReport", "id, codingTest, question,\nsubmission1, submission2,\nuser1, user2, similarity%,\nmatchedTokens, status", ACCENT_CYAN),
    ("TestCompletion", "id, user, codingTest,\ntotalQuestions, questionsAttempted,\nquestionsAccepted, totalScore,\ncompletedAt", ACCENT_PURPLE),
]

for i, (name, fields, color) in enumerate(models):
    col = i % 4; row = i // 4
    x = Inches(0.5 + col * 3.1)
    y = Inches(1.5 + row * 3.0)
    card = add_rounded(slide, x, y, Inches(3.0), Inches(2.75), BG_CARD2, color)
    add_entrance_anim(slide, card, i * 80)
    add_line_accent(slide, x + Inches(0.15), y + Inches(0.12), Inches(2.7), color)
    tt = add_text(slide, x + Inches(0.15), y + Inches(0.25), Inches(2.7), Inches(0.35),
                  name, size=17, color=color, bold=True)
    add_entrance_anim(slide, tt, i * 80 + 40)
    add_text(slide, x + Inches(0.15), y + Inches(0.7), Inches(2.7), Inches(1.9),
             fields, size=11, color=LIGHT_GRAY, font='Consolas')


# ════════════════════════════════════════════════════════════════
# SLIDE 15: KEY API ENDPOINTS
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Key REST API Endpoints", "Spring Boot controllers exposing RESTful APIs")

api_groups = [
    ("Auth API", "/api/auth", [
        (ACCENT_BLUE, "POST /login \u2014 Authenticate & get JWT token"),
        (ACCENT_BLUE, "POST /register \u2014 Create new user account"),
    ], ACCENT_BLUE),
    ("Code Execution", "/api/code", [
        (ACCENT_GREEN, "POST /execute \u2014 Run / samples (optional reviewQuestionId)"),
        (ACCENT_GREEN, "POST /submit \u2014 Full judge + score + codeReview hints"),
        (ACCENT_GREEN, "GET /submissions/{qId} \u2014 History"),
    ], ACCENT_GREEN),
    ("Questions", "/api/questions", [
        (ACCENT_PURPLE, "GET / \u2014 List all questions (filterable)"),
        (ACCENT_PURPLE, "GET /{id} \u2014 Get question by ID"),
        (ACCENT_PURPLE, "POST / \u2014 Create question (Teacher/Admin/Company)"),
    ], ACCENT_PURPLE),
    ("Tests & Contests", "/api/tests", [
        (ACCENT_AMBER, "GET /active \u2014 Get currently active tests"),
        (ACCENT_AMBER, "POST / \u2014 Create test"),
        (ACCENT_AMBER, "GET /{id}/leaderboard \u2014 Real-time leaderboard"),
        (ACCENT_AMBER, "POST /{id}/submit \u2014 Final test submission"),
    ], ACCENT_AMBER),
    ("Admin", "/api/admin", [
        (ACCENT_RED, "GET /dashboard \u2014 Platform statistics"),
        (ACCENT_RED, "GET /users \u2014 All users list"),
        (ACCENT_RED, "PUT /users/{id}/role \u2014 Change role"),
        (ACCENT_RED, "PUT /users/{id}/toggle \u2014 Enable/disable"),
    ], ACCENT_RED),
    ("Company", "/api/company", [
        (ACCENT_INDIGO, "POST /hiring-test \u2014 Create hiring test"),
        (ACCENT_INDIGO, "GET /hiring-test/{id}/candidates \u2014 View results"),
        (ACCENT_INDIGO, "GET /dashboard \u2014 Company analytics"),
    ], ACCENT_INDIGO),
]

for i, (title_t, base, endpoints, color) in enumerate(api_groups):
    col = i % 3; row = i // 3
    x = Inches(0.5 + col * 4.15)
    y = Inches(1.5 + row * 2.95)
    card = add_rounded(slide, x, y, Inches(4.0), Inches(2.75), BG_CARD2, color)
    add_entrance_anim(slide, card, i * 100)
    tt = add_text(slide, x + Inches(0.15), y + Inches(0.1), Inches(3.7), Inches(0.3),
                  title_t, size=16, color=color, bold=True)
    add_entrance_anim(slide, tt, i * 100 + 50)
    add_text(slide, x + Inches(0.15), y + Inches(0.4), Inches(3.7), Inches(0.25),
             base, size=11, color=MED_GRAY, font='Consolas')
    add_multiline(slide, x + Inches(0.1), y + Inches(0.7), Inches(3.8), Inches(1.8),
                  endpoints, size=11, line_spacing=Pt(4))


# ════════════════════════════════════════════════════════════════
# SLIDE 16: FEATURES SUMMARY (final slide)
# ════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Key Features Summary", "Everything CodeCampus offers at a glance")

features_list = [
    ("</> Online Compiler", "Write & run code in 5 languages with Monaco Editor", ACCENT_BLUE),
    ("Code Coach (pattern hints)", "Deterministic hints after Run/Submit — complexity, edge cases, TLE", ACCENT_CYAN),
    ("190+ Coding Problems", "Pre-seeded from problems.json with hidden test cases", ACCENT_PURPLE),
    ("Proctored Exams", "Camera, tab tracking, fullscreen, copy-paste detection", ACCENT_GREEN),
    ("Plagiarism Detection", "Jaccard + N-gram + LCS algorithms (70% threshold)", ACCENT_AMBER),
    ("4 User Roles", "Admin, Teacher, Student, Company with RBAC", ACCENT_RED),
    ("Hiring Tests", "Companies create tests, view results, shortlist candidates", ACCENT_INDIGO),
    ("Real-time Leaderboard", "Live ranking during contests and tests", ACCENT_CYAN),
    ("Study Plans", "Curated learning paths loaded from studyplans.json", ACCENT_PURPLE),
    ("JWT Authentication", "Stateless, secure auth with Spring Security", ACCENT_GREEN),
    ("Dark Theme UI", "Modern, responsive UI with Tailwind CSS", ACCENT_AMBER),
    ("Profile System", "Social links, bio, profile image, university info", ACCENT_RED),
    ("Local Execution", "No external API \u2014 gcc / javac / python / node on server", ACCENT_BLUE),
]

for i, (title_t, desc_t, color) in enumerate(features_list):
    col = i % 3; row = i // 3
    x = Inches(0.5 + col * 4.15)
    y = Inches(1.5 + row * 1.45)
    card = add_rounded(slide, x, y, Inches(4.0), Inches(1.25), BG_CARD2, BORDER_COLOR)
    add_entrance_anim(slide, card, i * 60)
    tt = add_text(slide, x + Inches(0.2), y + Inches(0.1), Inches(3.6), Inches(0.35),
                  title_t, size=14, color=color, bold=True)
    add_entrance_anim(slide, tt, i * 60 + 30)
    add_text(slide, x + Inches(0.2), y + Inches(0.48), Inches(3.6), Inches(0.6),
             desc_t, size=12, color=MED_GRAY)


# ════════════════════════════════════════════════════════════════
# SLIDES 17–20: HLD / LLD / CODE COACH / DEVOPS (images + SYSTEM_DESIGN)
# ════════════════════════════════════════════════════════════════
_ppt_img = _ensure_ppt_assets()

slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "High-Level Design (HLD)", "Layered architecture — SYSTEM_DESIGN.md §1")
slide.shapes.add_picture(_ppt_img["hld"], Inches(0.45), Inches(1.42), width=Inches(12.4))
add_text(
    slide, Inches(0.6), Inches(6.85), Inches(12), Inches(0.45),
    "End-to-end: Browser \u2192 JWT-secured REST \u2192 services (including PatternBasedCodeReview) \u2192 JPA \u2192 MySQL.",
    size=11, color=DIM_GRAY,
)

slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Low-Level Design (LLD)", "Data model & components — SYSTEM_DESIGN.md §2")
slide.shapes.add_picture(_ppt_img["lld"], Inches(0.45), Inches(1.42), width=Inches(12.4))
add_multiline(
    slide, Inches(0.65), Inches(6.55), Inches(12), Inches(0.9),
    [
        (ACCENT_BLUE, "API surface: Auth, Code, Questions, Tests, MCQ, Batch/Section, Admin, Company, Proctoring, Plagiarism"),
        (ACCENT_GREEN, "Security: JWT claims (sub, role, userId) · BCrypt passwords · @PreAuthorize RBAC"),
        (ACCENT_AMBER, "Indexes on users & submissions for scale — see SYSTEM_DESIGN §2.8"),
    ],
    size=11, line_spacing=Pt(4),
)

slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "Code Execution & Code Coach", "Submit / Run flow + pattern-based review (no external LLM)")
coach_card = add_rounded(slide, Inches(0.65), Inches(1.5), Inches(12.0), Inches(2.35), BG_CARD, BORDER_COLOR)
add_multiline(
    slide, Inches(0.9), Inches(1.62), Inches(11.5), Inches(2.15),
    [
        (ACCENT_GREEN, "Submit: POST /api/code/submit with questionId → all hidden cases → Submission saved → codeReview[] in JSON"),
        (ACCENT_BLUE, "Run: POST /api/code/execute + reviewQuestionId → single stdin run → hints use problem tags without judging hidden tests"),
        (ACCENT_PURPLE, "PatternBasedCodeReviewService: nested loops / TLE / WA / compile & runtime errors · graded vs sample wording"),
    ],
    size=13, line_spacing=Pt(6),
)
flow = add_rounded(slide, Inches(0.65), Inches(4.05), Inches(12.0), Inches(2.9), BG_CARD2, BORDER_COLOR)
add_text(slide, Inches(0.9), Inches(4.15), Inches(11.5), Inches(0.35),
         "Execution sandbox (SYSTEM_DESIGN §2.5)", size=15, color=ACCENT_CYAN, bold=True)
add_multiline(
    slide, Inches(0.9), Inches(4.55), Inches(11.5), Inches(2.3),
    [
        "Temp dir per run (codecampus_*) · gcc / g++ / javac / python / node · timeout configurable",
        "Optional upgrade path: Judge0 Docker (hooks already noted in CodeExecutionService)",
        "Future: isolated containers per submission, cgroup memory/CPU limits",
    ],
    size=12, color=LIGHT_GRAY, line_spacing=Pt(5),
)

slide = prs.slides.add_slide(prs.slide_layouts[6])
header(slide, "DevOps — Future-Ready Architecture", "CI/CD, containers, and production scale-out")
slide.shapes.add_picture(_ppt_img["devops"], Inches(0.45), Inches(1.38), width=Inches(12.4))
add_multiline(
    slide, Inches(0.65), Inches(6.45), Inches(12), Inches(0.95),
    [
        (ACCENT_CYAN, "Today: single VM or laptop — JAR + static build + local MySQL"),
        (ACCENT_GREEN, "Next: pipeline builds immutable images; secrets via vault; health checks + rolling deploy"),
        (ACCENT_AMBER, "Scale: stateless API replicas; connection pooling; optional Redis; Judge0 worker pool for code runs"),
    ],
    size=11, line_spacing=Pt(4),
)

# ════════════════════════════════════════════════════════════════
# SAVE
# ════════════════════════════════════════════════════════════════
_base_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(_base_dir, "CodeCampus_Presentation_2026.pptx")
prs.save(output_path)
print(f"Presentation saved: {output_path}")
print(f"Total slides: {len(prs.slides)}")
print(f"Diagram assets: {os.path.join(_base_dir, 'ppt_assets')}")

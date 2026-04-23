import pptxgen from "pptxgenjs";
import type { Group, Module, Session } from "../../db/schema";
import {
  CHARACTER_STRENGTHS,
  CHARACTER_STRENGTH_LABELS,
  TMC_PHASES,
  TMC_PHASE_COLORS,
  TMC_PHASE_LABELS,
} from "../../constants";

function hex(c: string): string {
  return c.replace(/^#/, "").toUpperCase();
}

export async function buildDeckForSession(
  session: Session,
  context: {
    module?: Module;
    group?: Group;
    schoolName?: string;
    preparedBy?: string;
  },
): Promise<Blob> {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in

  // ── Title slide ────────────────────────────────────────────────────────
  const title = pres.addSlide();
  title.background = { color: "F5F7FA" };
  title.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 1.0,
    fill: { color: hex("#1f6feb") },
    line: { color: hex("#1f6feb") },
  });
  title.addText("TOPS · Session plan", {
    x: 0.5,
    y: 0.15,
    w: 12.33,
    h: 0.7,
    fontSize: 18,
    color: "FFFFFF",
    bold: true,
  });
  title.addText(context.module?.name ?? "Module", {
    x: 0.8,
    y: 1.5,
    w: 11.7,
    h: 1.0,
    fontSize: 36,
    bold: true,
    color: "1F2328",
  });
  title.addText(
    [
      context.group?.name ? `Group: ${context.group.name}` : null,
      session.week ? `Week: ${session.week}` : null,
      session.date ? `Date: ${session.date}` : null,
      `Duration: ${session.durationMin} min`,
      `Location: ${session.location}${session.locationDetail ? " · " + session.locationDetail : ""}`,
      context.schoolName ? `\n${context.schoolName}` : null,
      context.preparedBy ? `Prepared by: ${context.preparedBy}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    {
      x: 0.8,
      y: 2.8,
      w: 11.7,
      h: 2.5,
      fontSize: 20,
      color: "3F4850",
    },
  );
  if (session.lessonObjectives.length) {
    title.addText("Lesson objectives", {
      x: 0.8,
      y: 5.4,
      w: 11.7,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color: "1F2328",
    });
    title.addText(
      session.lessonObjectives.map((o) => ({ text: o, options: { bullet: true } })),
      {
        x: 0.8,
        y: 5.8,
        w: 11.7,
        h: 1.6,
        fontSize: 14,
        color: "3F4850",
      },
    );
  }

  // ── Phase slides ───────────────────────────────────────────────────────
  for (const phase of TMC_PHASES) {
    const body = session.phases[phase] ?? "";
    const slide = pres.addSlide();
    slide.background = { color: "F5F7FA" };
    // Left colour band.
    slide.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 0.4,
      h: 7.5,
      fill: { color: hex(TMC_PHASE_COLORS[phase]) },
      line: { color: hex(TMC_PHASE_COLORS[phase]) },
    });
    slide.addText(TMC_PHASE_LABELS[phase], {
      x: 0.8,
      y: 0.5,
      w: 12.0,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: hex(TMC_PHASE_COLORS[phase]),
    });
    slide.addText(body || " ", {
      x: 0.8,
      y: 1.6,
      w: 12.0,
      h: 5.6,
      fontSize: 20,
      color: "1F2328",
      valign: "top",
    });
  }

  // ── Embedded skills slide ──────────────────────────────────────────────
  const skills = pres.addSlide();
  skills.background = { color: "F5F7FA" };
  skills.addText("Embedded skills", {
    x: 0.8,
    y: 0.4,
    w: 12,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: "1F2328",
  });
  const skillRows: { label: string; value: string }[] = [
    { label: "Maths", value: session.embeddedMaths },
    { label: "English", value: session.embeddedEnglish },
    { label: "British Values", value: session.embeddedBritishValues },
    { label: "Differentiation", value: session.embeddedDifferentiation },
    { label: "ICT / digital", value: session.embeddedIct },
    { label: "Career links", value: session.careerLinks },
  ];
  let cursorY = 1.3;
  for (const r of skillRows) {
    skills.addText(r.label, {
      x: 0.8,
      y: cursorY,
      w: 2.5,
      h: 0.5,
      fontSize: 14,
      bold: true,
      color: "0969DA",
    });
    skills.addText(r.value || "—", {
      x: 3.4,
      y: cursorY,
      w: 9.5,
      h: 0.5,
      fontSize: 14,
      color: "1F2328",
    });
    cursorY += 0.9;
  }

  // ── Character strengths slide ──────────────────────────────────────────
  const strengths = pres.addSlide();
  strengths.background = { color: "F5F7FA" };
  strengths.addText("Character strengths", {
    x: 0.8,
    y: 0.4,
    w: 12,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: "1F2328",
  });
  const chosen = CHARACTER_STRENGTHS.filter((cs) => session.characterStrengths[cs]);
  if (chosen.length === 0) {
    strengths.addText("None selected for this session.", {
      x: 0.8,
      y: 1.3,
      w: 12,
      h: 0.5,
      fontSize: 16,
      italic: true,
      color: "6A737D",
    });
  } else {
    strengths.addText(
      chosen.map((cs) => ({ text: CHARACTER_STRENGTH_LABELS[cs], options: { bullet: true } })),
      {
        x: 0.8,
        y: 1.3,
        w: 12,
        h: 5,
        fontSize: 20,
        color: "1F2328",
      },
    );
  }

  // ── Notes slide ────────────────────────────────────────────────────────
  if (session.notes && session.notes.trim()) {
    const n = pres.addSlide();
    n.background = { color: "F5F7FA" };
    n.addText("Notes", {
      x: 0.8,
      y: 0.4,
      w: 12,
      h: 0.7,
      fontSize: 28,
      bold: true,
      color: "1F2328",
    });
    n.addText(session.notes, {
      x: 0.8,
      y: 1.3,
      w: 12,
      h: 5.5,
      fontSize: 16,
      color: "1F2328",
      valign: "top",
    });
  }

  const out = (await pres.write({ outputType: "blob" })) as Blob;
  return out;
}

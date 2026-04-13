"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";

type SheetRows = unknown[][];

export async function importQuestionsAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "content_admin") {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file uploaded");

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "buffer" });

  let imported = 0;
  let skipped = 0;

  const sv = (val: unknown) => (val !== undefined && val !== null ? String(val).trim() : null);

  await prisma.$transaction(async (tx) => {
    // 1. MCQ
    if (workbook.SheetNames.includes("MCQ")) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets["MCQ"], { header: 1 }) as SheetRows;
      for (let i = 1; i < rows.length; i++) {
        const [qText, a, b, c, d, e, f, correct, topic] = rows[i];
        const normCorrect = sv(correct)?.toUpperCase();
        if (!qText || !normCorrect || !["A", "B", "C", "D", "E", "F"].includes(normCorrect)) {
          skipped++;
          continue;
        }
        await tx.question.create({
          data: {
            qType: "mcq",
            questionText: sv(qText)!,
            optionA: sv(a),
            optionB: sv(b),
            optionC: sv(c),
            optionD: sv(d),
            optionE: sv(e),
            optionF: sv(f),
            correctAnswer: normCorrect,
            topic: sv(topic),
          },
        });
        imported++;
      }
    }

    // 2. TF
    if (workbook.SheetNames.includes("TF")) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets["TF"], { header: 1 }) as SheetRows;
      for (let i = 1; i < rows.length; i++) {
        const [qText, correct, topic] = rows[i];
        const rawCorrect = sv(correct);
        const normCorrect = rawCorrect
          ? rawCorrect.charAt(0).toUpperCase() + rawCorrect.slice(1).toLowerCase()
          : null;
        if (!qText || !normCorrect || !["True", "False"].includes(normCorrect)) {
          skipped++;
          continue;
        }
        await tx.question.create({
          data: {
            qType: "tf",
            questionText: sv(qText)!,
            correctAnswer: normCorrect,
            topic: sv(topic),
          },
        });
        imported++;
      }
    }

    // 3. Numeric
    if (workbook.SheetNames.includes("Numeric")) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets["Numeric"], { header: 1 }) as SheetRows;
      for (let i = 1; i < rows.length; i++) {
        const [qText, correct, topic] = rows[i];
        if (!qText || isNaN(Number(sv(correct)))) {
          skipped++;
          continue;
        }
        await tx.question.create({
          data: {
            qType: "numeric",
            questionText: sv(qText)!,
            correctAnswer: sv(correct)!,
            topic: sv(topic),
          },
        });
        imported++;
      }
    }

    // 4. Matching
    if (workbook.SheetNames.includes("Matching")) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets["Matching"], { header: 1 }) as SheetRows;
      for (let i = 1; i < rows.length; i++) {
        const [qText, p1, p2, p3, p4, p5, p6, topic] = rows[i];
        if (!qText || !sv(p1)) {
          skipped++;
          continue;
        }
        await tx.question.create({
          data: {
            qType: "matching",
            questionText: sv(qText)!,
            optionA: sv(p1),
            optionB: sv(p2),
            optionC: sv(p3),
            optionD: sv(p4),
            optionE: sv(p5),
            optionF: sv(p6),
            correctAnswer: "matching_logic",
            topic: sv(topic),
          },
        });
        imported++;
      }
    }

    // 5. MultiSelect
    if (workbook.SheetNames.includes("MultiSelect")) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets["MultiSelect"], { header: 1 }) as SheetRows;
      for (let i = 1; i < rows.length; i++) {
        const [qText, a, b, c, d, e, f, correct, topic] = rows[i];
        const normCorrect = sv(correct)?.split(",").map((x) => x.trim().toUpperCase()).join(",");
        if (!qText || !normCorrect) {
          skipped++;
          continue;
        }
        const letters = normCorrect.split(",");
        if (!letters.every((l) => ["A", "B", "C", "D", "E", "F"].includes(l))) {
          skipped++;
          continue;
        }
        await tx.question.create({
          data: {
            qType: "multi_select",
            questionText: sv(qText)!,
            optionA: sv(a),
            optionB: sv(b),
            optionC: sv(c),
            optionD: sv(d),
            optionE: sv(e),
            optionF: sv(f),
            correctAnswer: normCorrect,
            topic: sv(topic),
          },
        });
        imported++;
      }
    }

    // Log the activity
    await tx.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        userIdentifier: session.user.email || "unknown",
        action: "xlsx_import",
        details: `Imported ${imported} questions, skipped ${skipped} rows`,
      }
    });
  });

  return { imported, skipped };
}

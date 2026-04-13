import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "content_admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const wb = XLSX.utils.book_new();

  // Helper to create sheet with headers and sample data
  const createSheet = (name: string, headers: string[], sampleRow: string[]) => {
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  createSheet(
    "MCQ", 
    ["question", "option_a", "option_b", "option_c", "option_d", "option_e", "option_f", "correct", "topic"],
    ["2+2=?","3","4","5","6","","","B","Math"]
  );

  createSheet(
    "TF", 
    ["question", "correct", "topic"],
    ["The earth is round.", "True", "Science"]
  );

  createSheet(
    "Numeric", 
    ["question", "correct", "topic"],
    ["5x8=?", "40", "Math"]
  );

  createSheet(
    "Matching", 
    ["question", "pair_1", "pair_2", "pair_3", "pair_4", "pair_5", "pair_6", "topic"],
    ["Match colors:", "Apple=Red", "Banana=Yellow", "Sky=Blue", "Grass=Green", "Snow=White", "Coal=Black", "General"]
  );

  createSheet(
    "MultiSelect", 
    ["question", "option_a", "option_b", "option_c", "option_d", "option_e", "option_f", "correct", "topic"],
    ["Select even numbers:", "2", "3", "4", "5", "6", "8", "A,C,E,F", "Math"]
  );

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="question_template.xlsx"',
    },
  });
}

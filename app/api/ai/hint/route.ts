import { NextResponse } from "next/server";
import { getStrictSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getStrictSession();
    if (!session) {
      return NextResponse.json({ error: "Нэвтэрнэ үү." }, { status: 401 });
    }

    const { questionId } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: "Асуултын ID байхгүй байна." }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: parseInt(questionId) },
    });

    if (!question) {
      return NextResponse.json({ error: "Асуулт олдсонгүй." }, { status: 404 });
    }

    // MOCK AI INTEGRATION
    // Since we don't have an explicitly defined API key for an LLM provider,
    // we'll return a simulated/mock AI hint.
    // In production, you would pass `question.questionText` to OpenAI/Gemini here.
    
    // Simple logic to generate a mock hint based on the question text length
    const hint = `(AI Санамж) Энэхүү асуулт нь "${question.topic || "ерөнхий"}" сэдэвтэй холбоотой байна. Хариулахдаа асуултын түлхүүр үгсийг анхааралтай уншина уу.`;

    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ hint });
  } catch (error) {
    console.error("Hint API error:", error);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа." }, { status: 500 });
  }
}

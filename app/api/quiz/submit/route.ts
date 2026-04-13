import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SubmissionQuestion = {
  id: number;
  questionText: string;
  topic: string | null;
  correctAnswer: string;
};

type SubmitQuizBody = {
  answers: Record<string, string>;
  questions: SubmissionQuestion[];
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answers, questions } = (await req.json()) as SubmitQuizBody;
    const userId = parseInt(session.user.id);

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "Асуулт байхгүй байна." }, { status: 400 });
    }

    let correctCount = 0;
    const totalQuestions = questions.length;

    // First, create the QuizAttempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        totalQuestions,
        correctAnswers: 0, // Will update later
        scorePercent: 0,   // Will update later
      },
    });

    // Create details and calculate score
    const detailsData = questions.map((q) => {
      const userAnswer = answers[String(q.id)] || "";
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        attemptId: attempt.id,
        questionText: q.questionText,
        topic: q.topic,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
      };
    });

    await prisma.quizAttemptDetail.createMany({
      data: detailsData,
    });

    // Update Attempt with final scores
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        correctAnswers: correctCount,
        scorePercent,
      },
    });

    return NextResponse.json({ success: true, attemptId: attempt.id });
  } catch (error) {
    console.error("Quiz submission error:", error);
    return NextResponse.json(
      { error: "Шалгалтын дүнг хадгалахад алдаа гарлаа." },
      { status: 500 }
    );
  }
}

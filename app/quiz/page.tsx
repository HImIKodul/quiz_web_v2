import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import QuizSession from "./quiz-session";

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; count?: string; timer?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.plan === "none") redirect("/subscriptions");

  const { topic, count, timer } = await searchParams;

  const topicFilter = topic && topic !== "all" ? topic : undefined;
  const limit = count && count !== "all" ? parseInt(count) : undefined;

  const userClasses = await prisma.classroomUser.findMany({
    where: { userId: parseInt(session.user.id) },
    select: { classroomId: true }
  });
  const classIds = userClasses.map(u => u.classroomId);

  // Fetch questions
  const questions = await prisma.question.findMany({
    where: {
      AND: [
        topicFilter ? { topic: topicFilter } : {},
        { OR: [{ classroomId: null }, { classroomId: { in: classIds } }] }
      ]
    },
    take: limit,
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <QuizSession 
        questions={questions} 
        initialTimer={timer ? parseInt(timer) : 0} 
      />
    </div>
  );
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudySession from "./study-session";

export default async function StudySessionPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { topic } = await searchParams;
  const topicFilter = topic && topic !== "all" ? topic : undefined;

  const userClasses = await prisma.classroomUser.findMany({
    where: { userId: parseInt(session.user.id) },
    select: { classroomId: true }
  });
  const classIds = userClasses.map(u => u.classroomId);

  const questions = await prisma.question.findMany({
    where: {
      AND: [
        topicFilter ? { topic: topicFilter } : {},
        { OR: [{ classroomId: null }, { classroomId: { in: classIds } }] }
      ]
    },
    orderBy: { id: "asc" },
  });

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <StudySession questions={questions} />
    </div>
  );
}

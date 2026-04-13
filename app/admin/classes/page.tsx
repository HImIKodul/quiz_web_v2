import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { redirect } from "next/navigation";
import ClassesAdminClient from "./classes-client";

export default async function ClassesAdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "billing_admin") {
    redirect("/dashboard");
  }

  const classes = await prisma.classroom.findMany({
    include: {
      users: {
        include: {
          user: {
            select: { id: true, name: true, role: true, identifier: true }
          }
        }
      },
      _count: {
        select: { questions: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, role: true, identifier: true },
    where: {
      role: { in: ["student", "teacher"] }
    },
    orderBy: { name: "asc" }
  });

  return (
    <DashboardLayout>
      <ClassesAdminClient classrooms={classes} allUsers={allUsers} />
    </DashboardLayout>
  );
}

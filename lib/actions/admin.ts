"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";

async function checkAdmin(requiredRole: "content_admin" | "billing_admin" | "any" = "any") {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  
  if (requiredRole === "any") {
    if (session.user.role === "content_admin" || session.user.role === "billing_admin" || session.user.role === "teacher") return session;
  } else if (session.user.role === requiredRole || (requiredRole === "content_admin" && session.user.role === "teacher")) {
    return session;
  }
  
  return null;
}

// QUESTION ACTIONS
export async function createQuestion(formData: FormData) {
  const session = await checkAdmin("content_admin");
  if (!session) throw new Error("Unauthorized");

  const qType = formData.get("qType") as string;
  const questionText = formData.get("questionText") as string;
  const topic = formData.get("topic") as string;
  const correctAnswer = formData.get("correctAnswer") as string;
  
  // Options: empty string -> null so DB stays clean
  const optionA = (formData.get("optionA") as string)?.trim() || null;
  const optionB = (formData.get("optionB") as string)?.trim() || null;
  const optionC = (formData.get("optionC") as string)?.trim() || null;
  const optionD = (formData.get("optionD") as string)?.trim() || null;
  const optionE = (formData.get("optionE") as string)?.trim() || null;
  const optionF = (formData.get("optionF") as string)?.trim() || null;

  const imageFile = formData.get("image") as File;
  let imageFilename = null;

  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    imageFilename = `${Date.now()}-${imageFile.name}`;
    const uploadPath = path.join(process.cwd(), "public", "uploads", imageFilename);
    await writeFile(uploadPath, buffer);
  }

  const classroomIdRaw = formData.get("classroomId") as string;
  const classroomIdParsed = classroomIdRaw ? parseInt(classroomIdRaw) : null;
  const classroomId = classroomIdParsed && !isNaN(classroomIdParsed) ? classroomIdParsed : null;

  if (session.user.role === "teacher") {
    if (!classroomId) throw new Error("Teachers cannot create Global questions. Please select a classroom.");
    const isMember = await prisma.classroomUser.findUnique({
      where: { classroomId_userId: { classroomId, userId: parseInt(session.user.id) } }
    });
    if (!isMember) throw new Error("Unauthorized for this classroom");
  }

  await prisma.question.create({
    data: {
      qType,
      questionText,
      topic,
      correctAnswer,
      optionA,
      optionB,
      optionC,
      optionD,
      optionE,
      optionF,
      imageFilename,
      classroomId,
      createdBy: session.user.identifier,
    },
  });

  revalidatePath("/admin/content");
  return { success: true };
}

export async function updateQuestion(id: number, formData: FormData) {
  const session = await checkAdmin("content_admin");
  if (!session) throw new Error("Unauthorized");

  const questionText = formData.get("questionText") as string;
  const topic = formData.get("topic") as string;
  const correctAnswer = formData.get("correctAnswer") as string;
  
  // Options: empty string -> null so DB stays clean
  const optionA = (formData.get("optionA") as string)?.trim() || null;
  const optionB = (formData.get("optionB") as string)?.trim() || null;
  const optionC = (formData.get("optionC") as string)?.trim() || null;
  const optionD = (formData.get("optionD") as string)?.trim() || null;
  const optionE = (formData.get("optionE") as string)?.trim() || null;
  const optionF = (formData.get("optionF") as string)?.trim() || null;

  const removeImage = formData.get("removeImage") === "true";
  const imageFile = formData.get("image") as File;

  // Parse classroomId BEFORE teacher validation since validation uses it
  const classroomIdRaw = formData.get("classroomId") as string;
  const classroomIdParsed = classroomIdRaw ? parseInt(classroomIdRaw) : null;
  const classroomId = classroomIdParsed && !isNaN(classroomIdParsed) ? classroomIdParsed : null;
  
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) throw new Error("Question not found");

  if (session.user.role === "teacher") {
    // Teachers can only modify their own assigned classes, they cannot modify Global
    if (!existing.classroomId) throw new Error("Teachers cannot modify Global questions");
    const isMember = await prisma.classroomUser.findUnique({
      where: { classroomId_userId: { classroomId: existing.classroomId, userId: parseInt(session.user.id) } }
    });
    if (!isMember) throw new Error("Unauthorized to modify this class's question");
    
    // They also cannot assign the question to a class they aren't part of
    if (classroomId !== existing.classroomId) {
      if (!classroomId) throw new Error("Teachers cannot assign questions to Global");
      const targetMember = await prisma.classroomUser.findUnique({
        where: { classroomId_userId: { classroomId: classroomId, userId: parseInt(session.user.id) } }
      });
      if (!targetMember) throw new Error("Unauthorized target classroom");
    }
  }

  let imageFilename = existing.imageFilename;

  if (removeImage) {
    imageFilename = null;
  }

  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    imageFilename = `${Date.now()}-${imageFile.name}`;
    const uploadPath = path.join(process.cwd(), "public", "uploads", imageFilename);
    await writeFile(uploadPath, buffer);
  }

  await prisma.question.update({
    where: { id },
    data: {
      questionText,
      topic,
      correctAnswer,
      optionA,
      optionB,
      optionC,
      optionD,
      optionE,
      optionF,
      imageFilename,
      classroomId,
    },
  });

  revalidatePath("/admin/content");
  return { success: true };
}

export async function deleteQuestion(id: number) {
  const session = await checkAdmin("content_admin");
  if (!session) throw new Error("Unauthorized");

  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) throw new Error("Not tracking this question");

  if (session.user.role === "teacher") {
    if (!existing.classroomId) throw new Error("Unauthorized to delete Global content");
    const isMember = await prisma.classroomUser.findUnique({
      where: { classroomId_userId: { classroomId: existing.classroomId, userId: parseInt(session.user.id) } }
    });
    if (!isMember) throw new Error("Unauthorized to delete this class's question");
  }

  await prisma.question.delete({ where: { id } });

  revalidatePath("/admin/content");
  return { success: true };
}

export async function bulkDeleteQuestions(ids: number[]) {
  const session = await checkAdmin("content_admin");
  if (!session) throw new Error("Unauthorized");

  if (session.user.role === "teacher") {
    const toDelete = await prisma.question.findMany({ where: { id: { in: ids } } });
    const teacherClasses = await prisma.classroomUser.findMany({ where: { userId: parseInt(session.user.id) } });
    const authIds = new Set(teacherClasses.map(c => c.classroomId));

    for (const q of toDelete) {
      if (!q.classroomId || !authIds.has(q.classroomId)) {
        throw new Error("Unauthorized to delete one or more selected questions");
      }
    }
  }

  await prisma.question.deleteMany({
    where: { id: { in: ids } },
  });

  revalidatePath("/admin/content");
  return { success: true };
}

// USER ACTIONS
export async function updateUserDetails(id: number, formData: FormData) {
  const session = await checkAdmin("billing_admin");
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const plan = formData.get("plan") as string;
  const maxDevices = parseInt(formData.get("maxDevices") as string);
  const planExpireDateRaw = formData.get("planExpireDate") as string;
  const password = formData.get("password") as string;

  const data: Prisma.UserUpdateInput = {
    name: name.trim(),
    role,
    plan,
    maxDevices: isNaN(maxDevices) ? 1 : maxDevices,
    planExpireDate: planExpireDateRaw ? new Date(planExpireDateRaw) : null,
  };

  if (password && password.trim().length > 0) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/billing");
  return { success: true };
}

// CLASSROOM ACTIONS
export async function createClassroom(formData: FormData) {
  const session = await checkAdmin("billing_admin");
  if (!session) throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name || name.length === 0) throw new Error("Ангийн нэр хоосон байж болохгүй.");

  await prisma.classroom.create({
    data: { name, description }
  });

  revalidatePath("/admin/classes");
  return { success: true };
}

export async function deleteClassroom(id: number) {
  const session = await checkAdmin("billing_admin");
  if (!session) throw new Error("Unauthorized");

  await prisma.classroom.delete({ where: { id } });

  revalidatePath("/admin/classes");
  return { success: true };
}

export async function addClassUser(classroomId: number, userId: number) {
  const session = await checkAdmin("billing_admin");
  if (!session) throw new Error("Unauthorized");

  await prisma.classroomUser.create({
    data: { classroomId, userId }
  });

  revalidatePath("/admin/classes");
  return { success: true };
}

export async function removeClassUser(classroomId: number, userId: number) {
  const session = await checkAdmin("billing_admin");
  if (!session) throw new Error("Unauthorized");

  await prisma.classroomUser.delete({
    where: {
      classroomId_userId: { classroomId, userId }
    }
  });

  revalidatePath("/admin/classes");
  return { success: true };
}

export async function getTeacherClasses() {
  const session = await checkAdmin("any");
  if (!session) return [];

  if (session.user.role === "billing_admin" || session.user.role === "content_admin") {
    return prisma.classroom.findMany({ select: { id: true, name: true } });
  } else if (session.user.role === "teacher") {
    const uc = await prisma.classroomUser.findMany({
      where: { userId: parseInt(session.user.id) },
      include: { classroom: { select: { id: true, name: true } } }
    });
    return uc.map(u => u.classroom);
  }
  return [];
}

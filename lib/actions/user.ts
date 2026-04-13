"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCurrentUserStatus() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: {
      plan: true,
      planExpireDate: true,
    },
  });

  return user;
}

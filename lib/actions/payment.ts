"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function submitPaymentRequest(plan: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const userId = parseInt(session.user.id);
  
  // Create payment request
  await prisma.paymentRequest.create({
    data: {
      userId,
      requestedPlan: plan,
      status: "pending",
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      userIdentifier: session.user.identifier,
      action: "subscription_requested",
      details: `Requested plan: [${plan.toUpperCase()}]`,
    },
  });

  // Log subscription history
  await prisma.subscriptionHistory.create({
    data: {
      userId,
      action: "requested",
      plan: plan,
      note: "Payment submitted, awaiting billing admin approval",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin/billing");
  return { success: true };
}

export async function approvePaymentRequest(reqId: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "billing_admin") {
    throw new Error("Unauthorized");
  }

  const req = await prisma.paymentRequest.findUnique({
    where: { id: reqId },
    include: { user: true },
  });

  if (!req || req.status !== "pending") {
    throw new Error("Request not found or already processed");
  }

  const planExpireDate = new Date();
  planExpireDate.setDate(planExpireDate.getDate() + 30);

  const maxDevices = req.requestedPlan === "pro" ? 5 : 3;

  await prisma.$transaction([
    prisma.paymentRequest.update({
      where: { id: reqId },
      data: { status: "approved" },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: {
        plan: req.requestedPlan,
        maxDevices: maxDevices,
        planExpireDate: planExpireDate,
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        userIdentifier: session.user.identifier,
        action: "subscription_approved",
        details: `${req.user.identifier} → [${req.requestedPlan.toUpperCase()}] until ${planExpireDate.toISOString().split("T")[0]}`,
      },
    }),
    prisma.subscriptionHistory.create({
      data: {
        userId: req.userId,
        action: "approved",
        plan: req.requestedPlan,
        changedBy: session.user.identifier,
        note: `Approved by ${session.user.identifier}. Expires ${planExpireDate.toISOString().split("T")[0]}`,
      },
    }),
  ]);

  revalidatePath("/admin/billing");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectPaymentRequest(reqId: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "billing_admin") {
    throw new Error("Unauthorized");
  }

  const req = await prisma.paymentRequest.findUnique({
    where: { id: reqId },
    include: { user: true },
  });

  if (!req || req.status !== "pending") {
    throw new Error("Request not found or already processed");
  }

  await prisma.$transaction([
    prisma.paymentRequest.update({
      where: { id: reqId },
      data: { status: "rejected" },
    }),
    prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        userIdentifier: session.user.identifier,
        action: "subscription_rejected",
        details: `${req.user.identifier} → [${req.requestedPlan.toUpperCase()}] rejected`,
      },
    }),
    prisma.subscriptionHistory.create({
      data: {
        userId: req.userId,
        action: "rejected",
        plan: req.requestedPlan,
        changedBy: session.user.identifier,
        note: `Rejected by ${session.user.identifier}`,
      },
    }),
  ]);

  revalidatePath("/admin/billing");
  return { success: true };
}

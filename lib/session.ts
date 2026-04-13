import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Gets the current session and validates it against the database.
 * Auto-downgrades the user if their plan has expired.
 */
export async function getStrictSession() {
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: {
      id: true,
      plan: true,
      planExpireDate: true,
      role: true,
    }
  });

  if (!user) return null;

  // Global Expiration Check
  if (user.plan !== "none" && user.planExpireDate && new Date() > user.planExpireDate) {
    // Audit log the auto-downgrade
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userIdentifier: session.user.email || "unknown",
        action: "subscription_expired",
        details: `Plan [${user.plan.toUpperCase()}] auto-expired`,
      }
    });

    // Downgrade in database
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "none" }
    });

    // Return the updated user info
    return {
      ...session,
      user: {
        ...session.user,
        plan: "none",
      }
    };
  }

  // Return session with live DB plan/role to avoid stale JWT issues
  return {
    ...session,
    user: {
      ...session.user,
      plan: user.plan,
      role: user.role,
    }
  };
}

import { getStrictSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { format } from "date-fns";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const session = await getStrictSession();

  if (!session) {
    return null;
  }

  const userId = parseInt(session.user.id);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      devices: true,
    }
  });

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight dark:text-white">Тохиргоо</h1>
          <p className="text-slate-500 mt-2">Бүртгэл, нууц үг, харагдац болон багцын мэдээлэл.</p>
        </div>

        <SettingsClient 
          user={{
            name: user.name,
            identifier: user.identifier,
            plan: user.plan,
            planExpireDate: user.planExpireDate ? format(new Date(user.planExpireDate), "yyyy-MM-dd") : null,
            devicesCount: user.devices.length,
            maxDevices: user.maxDevices || 3
          }} 
        />
      </div>
    </DashboardLayout>
  );
}

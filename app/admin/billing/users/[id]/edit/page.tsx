import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import EditUserForm from "./edit-user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "billing_admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const userId = parseInt(id);
  
  if (isNaN(userId)) notFound();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { devices: true }
  });

  if (!user) notFound();

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/billing"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Хэрэглэгч засах</h1>
            <p className="text-slate-400 mt-1">ID: #{user.id} — {user.identifier}</p>
          </div>
        </div>

        <EditUserForm user={user} />

        <div className="glass-card p-6 border-slate-700 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Төхөөрөмжийн Түүх</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Device Token</th>
                  <th className="px-4 py-3">Бүртгүүлсэн</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {user.devices.length > 0 ? (
                  user.devices.map((device: any) => (
                    <tr key={device.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">#{device.id}</td>
                      <td className="px-4 py-3 font-mono">{device.deviceToken}</td>
                      <td className="px-4 py-3">
                        {new Date(device.registeredAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      Холбогдсон төхөөрөмж олдсонгүй.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

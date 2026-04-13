"use client";

import { useTransition, useState } from "react";
import { Plus, Trash2, Users, Settings } from "lucide-react";
import { createClassroom, deleteClassroom, addClassUser, removeClassUser } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ClassesAdminClient({ classrooms, allUsers }: { classrooms: any[], allUsers: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const selectedClass = classrooms.find(c => c.id === selectedClassId);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createClassroom(fd);
        router.refresh();
        (e.target as HTMLFormElement).reset();
      } catch (err: any) {
        alert(err.message || "Анги үүсгэхэд алдаа гарлаа.");
      }
    });
  };

  const handleDelete = (id: number, memberCount: number) => {
    const warning = memberCount > 0
      ? `Энэ ангид ${memberCount} гишүүн байна. Устгавал бүх гишүүдийг хасна. Энэ үйлдлийг үргэлжлүүлэх үү?`
      : `${classrooms.find(c => c.id === id)?.name} ангийг устгахдаа итгэлтэй байна уу?`;
    if (!confirm(warning)) return;
    startTransition(async () => {
      try {
        await deleteClassroom(id);
        if (selectedClassId === id) setSelectedClassId(null);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Анги устгахад алдаа гарлаа.");
      }
    });
  };

  const handleAddUser = (userId: number) => {
    if (!selectedClassId) return;
    startTransition(async () => {
      try {
        await addClassUser(selectedClassId, userId);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Гишүүн нэмэхэд алдаа гарлаа.");
      }
    });
  };

  const handleRemoveUser = (userId: number) => {
    if (!selectedClassId) return;
    if (!confirm("Хэрэглэгчийг ангинаас хасахдаа итгэлтэй байна уу?")) return;
    startTransition(async () => {
      try {
        await removeClassUser(selectedClassId, userId);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Гишүүн хасахад алдаа гарлаа.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Col: Classes List */}
      <div className="lg:col-span-1 space-y-6">
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus size={20} className="text-indigo-400" /> Шинэ анги нээх
          </h2>
          <div>
            <input required name="name" type="text" placeholder="Ангийн нэр" className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <textarea name="description" placeholder="Тайлбар" className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none resize-none h-20" />
          </div>
          <button disabled={isPending} type="submit" className="w-full py-3 premium-gradient font-bold rounded-xl text-white disabled:opacity-50 hover:scale-[1.02]">
            Үүсгэх
          </button>
        </form>

        <div className="glass-card p-4 space-y-2">
          <h2 className="text-lg font-bold text-white mb-4 px-2">Ангиуд ({classrooms.length})</h2>
          {classrooms.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedClassId(c.id)}
              className={cn(
                "p-4 rounded-xl cursor-pointer transition-all border flex justify-between items-center",
                selectedClassId === c.id ? "bg-indigo-500/20 border-indigo-500 text-white" : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
              )}
            >
              <div>
                <h3 className="font-bold">{c.name}</h3>
                <p className="text-xs opacity-70 flex items-center gap-1 mt-1"><Users size={12}/> {c.users.length} гишүүн</p>
              </div>
              <button 
                disabled={isPending}
                onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.users.length); }}
                className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                title="Анги устгах"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right Col: Class Details */}
      <div className="lg:col-span-2">
        {selectedClass ? (
          <div className="glass-card p-6 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h1 className="text-3xl font-bold text-white">{selectedClass.name}</h1>
              <p className="text-slate-400 mt-2">{selectedClass.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enrolled Users */}
              <div>
                <h3 className="text-emerald-400 font-bold mb-4">Бүртгэлтэй ({selectedClass.users.length})</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {selectedClass.users.map((cu: any) => (
                    <div key={cu.user.id} className="p-3 bg-white/5 rounded-lg flex items-center justify-between border border-emerald-500/20">
                       <div>
                         <p className="text-white font-medium text-sm">{cu.user.name}</p>
                         <p className="text-slate-500 text-xs flex gap-2">
                            <span>{cu.user.identifier}</span>
                            <span className={cu.user.role === "teacher" ? "text-indigo-400 font-bold" : "text-slate-400"}>({cu.user.role})</span>
                         </p>
                       </div>
                       <button 
                         disabled={isPending}
                         onClick={() => handleRemoveUser(cu.user.id)}
                         className="px-3 py-1 rounded bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20"
                       >
                         Хасах
                       </button>
                    </div>
                  ))}
                  {selectedClass.users.length === 0 && <p className="text-slate-500 text-sm">Гишүүн алга.</p>}
                </div>
              </div>

              {/* Available Users */}
              <div>
                <h3 className="text-slate-300 font-bold mb-4">Нэмэх боломжтой</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {allUsers.filter(u => !selectedClass.users.find((cu: any) => cu.user.id === u.id)).map(u => (
                    <div key={u.id} className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between border border-white/5">
                       <div>
                         <p className="text-white font-medium text-sm">{u.name}</p>
                         <p className="text-slate-500 text-xs flex gap-2">
                            <span>{u.identifier}</span>
                            <span className={u.role === "teacher" ? "text-indigo-400 font-bold" : "text-slate-400"}>({u.role})</span>
                         </p>
                       </div>
                       <button 
                         disabled={isPending}
                         onClick={() => handleAddUser(u.id)}
                         className="px-3 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs hover:bg-indigo-500/20"
                       >
                         Нэмэх
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center opacity-50 min-h-[400px]">
             <Settings size={48} className="text-slate-500 mb-4" />
             <p className="text-white text-lg">Удирдах ангиа сонгоно уу.</p>
          </div>
        )}
      </div>
    </div>
  );
}

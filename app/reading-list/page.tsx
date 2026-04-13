import DashboardLayout from "@/components/layout/dashboard-layout";
import { BookOpen, Search, ExternalLink } from "lucide-react";

const resources = [
  {
    title: "Монгол Улсын Үндсэн Хууль",
    description: "Нийт асуултуудын 20% нь Үндсэн хуулийн хүрээнд ирдэг. Заавал унших материал.",
    tag: "Legal",
    status: "Must Read",
  },
  {
    title: "Төрийн албаны тухай хууль",
    description: "Төрийн албаны ерөнхий шалгалтанд бэлтгэж буй хүмүүст зориулсан гарын авлага.",
    tag: "Law",
    status: "Recommended",
  },
  {
    title: "Иргэний хуулийн эмхэтгэл",
    description: "Иргэний эрх зүйн ерөнхий ойлголт болон гэрээний төрлүүдийн талаарх мэдээлэл.",
    tag: "Study",
    status: "Optional",
  },
];

export default function ReadingListPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Унших материал</h1>
            <p className="text-slate-400 mt-1">Шалгалтанд ирж болох бүх хууль, дүрмийн жагсаалт.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Материал хайх..." 
              className="bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500 outline-none transition-all w-full sm:w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <div key={res.title} className="glass-card group hover:border-indigo-500/30 transition-all duration-300">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                      <BookOpen size={20} />
                   </div>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                     res.status === 'Must Read' ? 'bg-red-500/20 text-red-400' : 
                     res.status === 'Recommended' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                   }`}>
                     {res.status}
                   </span>
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                     {res.title}
                   </h3>
                   <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                     {res.description}
                   </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{res.tag}</span>
                   <button className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-white transition-colors">
                     УНШИХ <ExternalLink size={12} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card p-12 flex flex-col items-center text-center space-y-4 bg-white/[0.02] border-dashed">
            <div className="p-4 rounded-full bg-slate-800 text-slate-500">
               <BookOpen size={40} />
            </div>
            <div className="max-w-md">
              <h4 className="text-xl font-bold text-white">Удахгүй шинээр нэмэгдэнэ</h4>
              <p className="text-sm text-slate-500 mt-2">
                Бид хичээлийн материалуудыг тогтмол шинэчилж байна. Та дараа дахин шалгаарай.
              </p>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

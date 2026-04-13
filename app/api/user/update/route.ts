import { NextResponse } from "next/server";
import { getStrictSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getStrictSession();
    if (!session) {
      return NextResponse.json({ error: "Нэвтэрнэ үү." }, { status: 401 });
    }

    const { name, password, newPassword } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Нэр хоосон байж болохгүй." }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "Хэрэглэгч олдсонгүй." }, { status: 404 });
    }

    const updateData: any = { name };

    // Change password if both fields provided
    if (password && newPassword) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Хуучин нууц үг буруу байна." }, { status: 400 });
      }
      
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Шинэ нууц үг 6-аас дээш тэмдэгттэй байх шаардлагатай." }, { status: 400 });
      }

      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(newPassword, salt);
    } else if (password || newPassword) {
      return NextResponse.json({ error: "Нууц үг солихын тулд хуучин болон шинэ нууц үгээ хоёуланг нь оруулна уу." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Серверийн алдаа." }, { status: 500 });
  }
}

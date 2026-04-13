import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type SignupBody = {
  name?: string;
  phone?: string;
  password?: string;
  deviceId?: string;
};

export async function POST(req: Request) {
  try {
    const { name, phone, password, deviceId } = (await req.json()) as SignupBody;

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "Name, phone, and password are required." },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { identifier: phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Энэ утасны дугаар бүртгэлтэй байна." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        identifier: phone,
        name,
        passwordHash: hashedPassword,
        devices: deviceId ? {
          create: {
            deviceToken: deviceId,
            deviceName: "Modern Web Browser",
          }
        } : undefined,
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Бүртгэл үүсгэхэд алдаа гарлаа." },
      { status: 500 }
    );
  }
}

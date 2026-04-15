import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
        deviceId: { label: "Device ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Phone number and password are required.");
        }

        let phone = credentials.identifier.trim();
        if (phone.length === 8 && /^\d+$/.test(phone)) {
          phone = "+976" + phone;
        }

        const user = await prisma.user.findUnique({
          where: { identifier: phone },
          include: { devices: true },
        });

        if (!user) {
          throw new Error("Бүртгэлтэй хэрэглэгч байхгүй байна.");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordCorrect) {
          throw new Error("Нууц үг буруу байна.");
        }

        // --- Device Tracking Logic ---
        const deviceId = credentials.deviceId;
        if (deviceId) {
          const knownDevice = user.devices.find((d) => d.deviceToken === deviceId);
          if (!knownDevice) {
            const limit = user.maxDevices ?? 3;
            if (user.devices.length >= limit) {
              throw new Error(`Та ${limit}-аас олон төхөөрөмжөөс нэвтрэх боломжгүй. Админтай холбогдоно уу.`);
            }
            
            // Register new device
            await prisma.userDevice.create({
              data: {
                userId: user.id,
                deviceToken: deviceId,
                deviceName: "Modern Web Browser", // Default, can be improved with user-agent
              },
            });
          }
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.identifier, // We use identifier (phone) as the unique email field for NextAuth
          identifier: user.identifier,
          role: user.role,
          plan: user.plan,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.plan = user.plan;
        token.identifier = user.identifier;
      }

      // Allow manual session update from client (plan sync)
      if (trigger === "update" && session?.plan) {
        token.plan = session.plan;
      }

      // Re-sync role from DB so changes by billing_admin reflect immediately
      // Only query when the token already has an id (i.e. not initial login)
      if (!user && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: parseInt(token.id as string) },
            select: { role: true, plan: true }
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.plan = dbUser.plan;
          }
        } catch {
          // Silent fail – keep existing token values
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.plan = token.plan;
        session.user.identifier = token.identifier;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

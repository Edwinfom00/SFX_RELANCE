import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/modules/auth/models";
import prisma from "@/lib/prisma";

async function getUserPermissions(userId: number): Promise<{ roles: string[]; permissions: string[] }> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: { rolePermissions: { include: { permission: true } } },
      },
    },
  });

  const roles = userRoles.map((ur) => ur.role.name);
  const permissions = [
    ...new Set(
      userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.name))
    ),
  ];

  return { roles, permissions };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await getUserByEmail(credentials.email as string);
        if (!user) return null;
        if (!(user as any).isActive) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        const { roles, permissions } = await getUserPermissions(user.id);

        return {
          id:          String(user.id),
          email:       user.email,
          name:        user.name,
          roles,
          permissions,
          mustChangePassword: (user as any).mustChangePassword ?? false,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id                 = user.id;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.id) return session;

      session.user.id = token.id as string;

      try {
        const { roles, permissions } = await getUserPermissions(Number(token.id));
        session.user.roles       = roles;
        session.user.permissions = permissions;

        const user = await prisma.user.findUnique({
          where: { id: Number(token.id) },
          select: { mustChangePassword: true, isActive: true },
        });
        (session as any).mustChangePassword = (user as any)?.mustChangePassword ?? false;
        (session as any).isActive           = (user as any)?.isActive ?? true;
      } catch {
        session.user.roles       = [];
        session.user.permissions = [];
      }

      return session;
    },
  },
});

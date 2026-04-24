import prisma from "@/lib/prisma";

export async function getUsers() {
  return prisma.user.findMany({
    include: {
      userRoles: {
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      },
    },
  });
}

export async function getRoles() {
  return prisma.role.findMany({
    include: { rolePermissions: { include: { permission: true } } },
    orderBy: { id: "asc" },
  });
}

/** Vérifie si un user a une permission donnée */
export async function hasPermission(userId: number, permission: string): Promise<boolean> {
  const count = await prisma.rolePermission.count({
    where: {
      permission: { name: permission },
      role: { userRoles: { some: { userId } } },
    },
  });
  return count > 0;
}

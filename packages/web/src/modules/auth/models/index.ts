import prisma from "@/lib/prisma";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

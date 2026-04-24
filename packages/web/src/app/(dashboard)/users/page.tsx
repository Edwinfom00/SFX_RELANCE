import { Suspense } from "react";
import { getUsers, getRoles } from "@/modules/users/models";
import { UsersView } from "@/modules/users/components/users-view";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user?.permissions?.includes("users:manage")) {
    redirect("/dashboard");
  }

  const [users, roles] = await Promise.all([getUsers(), getRoles()]);

  return (
    <div className="px-7 py-6 pb-10">
      <div className="mb-5">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] m-0 text-[#0a2540]">
          Utilisateurs
        </h2>
        <p className="text-[13px] text-[#697386] mt-1">
          Gestion des accès et des rôles
        </p>
      </div>
      <UsersView users={users as any} roles={roles as any} currentUserId={Number(session.user.id)} />
    </div>
  );
}

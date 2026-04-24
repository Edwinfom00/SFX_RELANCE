import { ChangePasswordForm } from "@/modules/users/components/change-password-form";

export default function ProfilePage() {
  return (
    <div className="px-7 py-6 pb-10">
      <div className="mb-6">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] m-0 text-[#0a2540]">
          Mon profil
        </h2>
        <p className="text-[13px] text-[#697386] mt-1">Modifier votre mot de passe</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}

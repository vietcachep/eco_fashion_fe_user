import type { Metadata } from "next";
import { ProfileScreen } from "@/features/identity/components/account/profile-screen";

export const metadata: Metadata = { title: "Hồ sơ của tôi" };

export default function ProfilePage() {
  return <ProfileScreen />;
}

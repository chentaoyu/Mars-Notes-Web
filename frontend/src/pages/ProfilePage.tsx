import { ProfilePageClient } from "../components/profile/ProfilePageClient";
import { Header } from "../components/layout/Header";

export default function ProfilePage() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <ProfilePageClient />
      </div>
    </div>
  );
}


import { NotesPageClient } from "../components/notes/NotesPageClient";
import { Header } from "../components/layout/Header";

export default function NotesPage() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 overflow-hidden">
        <NotesPageClient />
      </div>
    </div>
  );
}

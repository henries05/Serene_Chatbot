import ChatUI from "@/components/ChatUI";
import AuthGate from "@/components/AuthGate";

export default function Home() {
  return (
    <main className="w-full h-full bg-background overflow-hidden">
      <AuthGate>
        <ChatUI />
      </AuthGate>
    </main>
  );
}

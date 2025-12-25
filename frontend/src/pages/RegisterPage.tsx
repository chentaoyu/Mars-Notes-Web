import { RegisterForm } from "../components/auth/RegisterForm";
import { Toaster } from "../components/ui/toaster";

export default function RegisterPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-md border">
        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">注册</h1>
        <RegisterForm />
      </div>
      <Toaster />
    </div>
  );
}

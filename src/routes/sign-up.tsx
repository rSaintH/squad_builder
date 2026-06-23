import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <SignUp fallbackRedirectUrl="/" signInFallbackRedirectUrl="/" />
    </main>
  );
}

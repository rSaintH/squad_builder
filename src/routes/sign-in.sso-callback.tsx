import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/sso-callback")({
  component: SignInSsoCallbackPage,
});

function SignInSsoCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <SignIn fallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />
    </main>
  );
}

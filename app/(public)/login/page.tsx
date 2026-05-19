import { redirect } from "next/navigation";

import { signIn, auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { serverEnvironment } from "@/lib/config";
import { protectedHomePath } from "@/lib/constants";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(protectedHomePath);
  }

  const isGithubProviderConfigured = Boolean(
    serverEnvironment.AUTH_GITHUB_ID && serverEnvironment.AUTH_GITHUB_SECRET
  );

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="w-full max-w-md border border-[var(--border)] bg-[var(--panel)] p-8">
        <h1 className="text-3xl font-semibold">Sign in to Deepstation</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          Use the configured Auth.js provider to enter the workspace.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: protectedHomePath });
          }}
          className="mt-8"
        >
          <Button disabled={!isGithubProviderConfigured} type="submit">
            Continue with GitHub
          </Button>
        </form>
        {!isGithubProviderConfigured ? (
          <p className="mt-4 text-sm leading-6 text-[var(--warning)]">
            Configure `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` to enable sign in.
          </p>
        ) : null}
      </section>
    </main>
  );
}

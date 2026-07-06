import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { signIn, auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { isAuthenticationTemporarilyDisabled, serverEnvironment } from "@/lib/config";
import { protectedHomePath } from "@/lib/constants";

type LoginPageProps = Readonly<{
  searchParams?: Promise<{
    error?: string;
  }>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (isAuthenticationTemporarilyDisabled) {
    redirect(protectedHomePath);
  }

  const session = await auth();

  if (session?.user) {
    redirect(protectedHomePath);
  }

  const resolvedSearchParams = await searchParams;
  const hasCredentialsError = resolvedSearchParams?.error === "credentials";
  const isAppPasswordConfigured = Boolean(serverEnvironment.APP_PASSWORD);

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="w-full max-w-md border border-[var(--border)] bg-[var(--panel)] p-8">
        <h1 className="text-3xl font-semibold">Sign in to Deepstation</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          Enter the deployment password to open the workspace.
        </p>
        <form
          action={async (formData) => {
            "use server";
            let redirectUrl = protectedHomePath;

            try {
              redirectUrl = await signIn("credentials", {
                password: formData.get("password"),
                redirect: false,
                redirectTo: protectedHomePath
              });
            } catch (error) {
              if (error instanceof AuthError) {
                redirect("/login?error=credentials");
              }

              throw error;
            }

            redirect(redirectUrl);
          }}
          className="mt-8 grid gap-4"
        >
          <label className="grid gap-2 text-sm font-semibold">
            Password
            <input
              autoComplete="current-password"
              className="h-11 border border-[var(--border)] bg-[var(--background)] px-3 text-base font-normal outline-none focus:border-[var(--accent)]"
              disabled={!isAppPasswordConfigured}
              name="password"
              required
              type="password"
            />
          </label>
          <Button disabled={!isAppPasswordConfigured} type="submit">
            Continue
          </Button>
        </form>
        {hasCredentialsError ? (
          <p
            aria-live="polite"
            className="mt-4 text-sm leading-6 text-[var(--danger)]"
            role="alert"
          >
            That password did not match. Try again.
          </p>
        ) : null}
        {!isAppPasswordConfigured ? (
          <p className="mt-4 text-sm leading-6 text-[var(--warning)]">
            Configure `APP_PASSWORD` to enable sign in.
          </p>
        ) : null}
      </section>
    </main>
  );
}

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
            await signIn("credentials", {
              password: formData.get("password"),
              redirectTo: protectedHomePath
            });
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
        {!isAppPasswordConfigured ? (
          <p className="mt-4 text-sm leading-6 text-[var(--warning)]">
            Configure `APP_PASSWORD` to enable sign in.
          </p>
        ) : null}
      </section>
    </main>
  );
}

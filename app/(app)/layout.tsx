import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { authOptions } from "@/lib/auth-options";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return <AppShell>{children}</AppShell>;
}

import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { generateUUID } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/";

  const username = `guest-${Date.now()}`;
  const id = generateUUID();

  await createSession({
    id,
    email: username,
    type: "guest",
  });

  redirect(redirectUrl);
}

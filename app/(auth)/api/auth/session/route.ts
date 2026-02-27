import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session) {
    return Response.json(null);
  }

  return Response.json(session);
}

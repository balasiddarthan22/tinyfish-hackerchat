"use client";

import Form from "next/form";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type LoginActionState, login } from "../actions";

export default function Page() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    }
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: router is stable ref
  useEffect(() => {
    if (state.status === "failed") {
      toast({
        type: "error",
        description: "Failed to sign in. Please try again.",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Please enter a valid username.",
      });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    setUsername(formData.get("username") as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">
            Join the Arena
          </h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Enter a username to get started
          </p>
        </div>
        <Form
          action={handleSubmit}
          className="flex flex-col gap-4 px-4 sm:px-16"
        >
          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-zinc-600 dark:text-zinc-400"
              htmlFor="username"
            >
              Username
            </Label>

            <Input
              autoComplete="username"
              autoFocus
              className="bg-muted text-md md:text-sm"
              defaultValue={username}
              id="username"
              name="username"
              placeholder="your-username"
              required
            />
          </div>

          <SubmitButton isSuccessful={isSuccessful}>Join</SubmitButton>
        </Form>
      </div>
    </div>
  );
}

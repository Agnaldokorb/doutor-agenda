"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle } from "lucide-react";
import ResetPasswordForm from "../components/reset-password-form";

const ResetPasswordClient = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  if (!token) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Link Inválido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Este link de recuperação de senha é inválido ou está mal
                formado.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push("/authentication")}
              className="w-full"
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
};

export default ResetPasswordClient;

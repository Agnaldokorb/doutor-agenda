"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import LoginForm from "./login-form";
import SignUpForm from "./sign-up-forms";
import ForgotPasswordForm from "./forgot-password-form";

const AuthenticationClient = () => {
  const [currentView, setCurrentView] = useState<
    "login" | "register" | "forgot-password"
  >("login");

  const handleForgotPassword = () => {
    setCurrentView("forgot-password");
  };

  const handleBackToLogin = () => {
    setCurrentView("login");
  };

  if (currentView === "forgot-password") {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="w-[400px]">
          <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Tabs
        value={currentView}
        onValueChange={(value) => setCurrentView(value as "login" | "register")}
        className="w-[400px]"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Criar conta</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm onForgotPassword={handleForgotPassword} />
        </TabsContent>
        <TabsContent value="register">
          <SignUpForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthenticationClient;

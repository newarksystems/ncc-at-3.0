import { AuthProvider } from "@/context/authContext";
import { ReactNode } from "react";

export default function SigninLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AuthProvider>{children}</AuthProvider>;
}
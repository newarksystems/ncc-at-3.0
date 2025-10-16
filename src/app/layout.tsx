"use client"

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "@/context/dashboardContext";
import ZustandProvider from "@/providers/ZustandProvider";
import UserStoreProvider from "@/providers/UserStoreProvider";
import TokenExpirationWarning from "@/components/TokenExpirationWarning";
import { ToastProvider } from "@/context/toast/ToastContext";
import ToastContainer from "@/components/toast/ToastContainer";
import { useToastNotifications } from "@/hooks/useToastNotifications";
import { AuthProvider } from "@/context/authContext";
import { CallProvider } from "@/context/callContext";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function ToastEventListener() {
  const { showInfo } = useToastNotifications();
  
  useEffect(() => {
    const handleLogoutSuccess = () => {
      showInfo('Logged Out', 'You have been successfully logged out.');
    };
    
    window.addEventListener('auth-logout-success', handleLogoutSuccess);
    return () => window.removeEventListener('auth-logout-success', handleLogoutSuccess);
  }, [showInfo]);
  
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-900`}
      >
        <ToastProvider>
          <ZustandProvider>
            <UserStoreProvider>
              <AuthProvider>
                <DashboardProvider>
                  <CallProvider>
                    <ToastEventListener />
                    {children}
                    <TokenExpirationWarning />
                  </CallProvider>
                </DashboardProvider>
              </AuthProvider>
            </UserStoreProvider>
          </ZustandProvider>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
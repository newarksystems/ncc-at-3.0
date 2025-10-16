"use client";
import { AuthProvider } from "@/context/authContext";
import Sidebar from "@/components/sidebar";
import { Header } from "@/components/pages/header";
import CallModal from "@/components/callmodal";
import useCallStore from "@/stores/callStore";
import { Phone } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { openCallModal } = useCallStore();
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-900">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isMobile ? 'mt-14' : ''}`}>
        {!isMobile && <Header />}
        {children}
      </main>
      <CallModal />
      
      {/* Floating Call Button */}
      <button
        onClick={openCallModal}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-colors z-40"
        title="Make a call"
      >
        <Phone className="w-6 h-6" />
      </button>
    </div>
  );
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </AuthProvider>
  );
}
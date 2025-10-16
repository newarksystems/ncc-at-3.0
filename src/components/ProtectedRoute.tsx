'use client';

import React from 'react';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import { UserRole, AdminDesignation } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredDesignation?: AdminDesignation;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requiredDesignation
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
    
    // Check if user has required role/designation
    if (isAuthenticated && user && requiredRole) {
      if (user.role !== requiredRole) {
        router.push('/unauthorized');
      }
      
      if (requiredDesignation && (user as any).designation !== requiredDesignation) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, user, loading, router, requiredRole, requiredDesignation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a2332]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check role/designation requirements
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }
  
  if (requiredDesignation && (user as any)?.designation !== requiredDesignation) {
    return null;
  }

  return <>{children}</>;
};
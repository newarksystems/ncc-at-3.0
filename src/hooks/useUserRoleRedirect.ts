import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import { User } from '@/services/api';

const useUserRoleRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user role and designation
      if (user.role === 'super-admin') {
        // Already on the right page if this is the superadmin dashboard
        return;
      } else if (user.role === 'admin') {
        const designation = user.designation;
        switch (designation) {
          case 'call-center-admin':
            // Already on the right page if this is the callcenter dashboard
            return;
          case 'marketing-admin':
            // Already on the right page if this is the marketing dashboard
            return;
          case 'compliance-admin':
            // Already on the right page if this is the compliance dashboard
            return;
          default:
            // Default to callcenter dashboard
            return;
        }
      } else {
        // For agents or other roles, redirect to a default page
        router.push('/agent-dashboard');
      }
    } else if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, user, loading, router]);

  return { user, isAuthenticated, loading };
};

export default useUserRoleRedirect;
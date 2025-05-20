import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useRoleGuard(allowedRoles: string[]) {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!allowedRoles.includes(role || '')) {
      router.replace('/unauthorized');
    }
  }, []);
}
    
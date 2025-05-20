export function useRole(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userRole');
}

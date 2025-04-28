import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';

interface UserState {
  // User profile
  username: string | null;
  totalSteps: number;
  totalDistance: number; // in meters
  
  // Inventory
  cookies: number;
  tickets: number;
  totalCookies: number;
  totalTickets: number;
  
  // Actions
  saveUsername: (name: string) => void;
  addSteps: (steps: number) => void;
  addDistance: (distance: number) => void;
  collectItem: (type: 'cookie' | 'ticket', value: number) => void;
  initializeUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // Initial state
      username: null,
      totalSteps: 0,
      totalDistance: 0,
      cookies: 0,
      tickets: 0,
      totalCookies: 0,
      totalTickets: 0,
      
      // Initialize user from local storage or create new
      initializeUser: () => {
        const storedUser = getLocalStorage('phillyUser');
        if (storedUser) {
          set(storedUser);
        }
      },
      
      // Save username
      saveUsername: (name: string) => {
        set({ username: name });
      },
      
      // Add steps to counter
      addSteps: (steps: number) => {
        set((state) => ({
          totalSteps: state.totalSteps + steps
        }));
      },
      
      // Add distance walked
      addDistance: (distance: number) => {
        set((state) => ({
          totalDistance: state.totalDistance + distance
        }));
      },
      
      // Collect item (cookie or ticket)
      collectItem: (type: 'cookie' | 'ticket', value: number) => {
        if (type === 'cookie') {
          set((state) => ({
            cookies: state.cookies + value,
            totalCookies: state.totalCookies + value
          }));
        } else {
          set((state) => ({
            tickets: state.tickets + value,
            totalTickets: state.totalTickets + value
          }));
        }
      }
    }),
    {
      name: 'phillyUser',
      getStorage: () => ({
        getItem: getLocalStorage,
        setItem: setLocalStorage,
        removeItem: (key: string) => localStorage.removeItem(key),
      }),
    }
  )
);

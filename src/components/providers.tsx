"use client";

import { AuthProvider } from "@/contexts/auth.context";
import { OrganizationProvider } from "@/contexts/organization.context";
import { Provider } from 'react-redux';
import { store } from '@/store';
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <OrganizationProvider>
          {children}
          <Toaster />
        </OrganizationProvider>
      </AuthProvider>
    </Provider>
  );
} 

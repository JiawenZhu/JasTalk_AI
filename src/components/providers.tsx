"use client";

import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import compose from "@/lib/compose";
import { AuthProvider } from "@/contexts/auth.context";
import { OrganizationProvider } from "@/contexts/organization.context";
import { InterviewerProvider } from "@/contexts/interviewers.context";
import { InterviewProvider } from "@/contexts/interviews.context";
import { ResponseProvider } from "@/contexts/responses.context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store';
import { ClientProvider } from "@/contexts/clients.context";

const queryClient = new QueryClient();

const providers = ({ children }: ThemeProviderProps) => {
  const Provider = compose([
    AuthProvider,
    OrganizationProvider,
    InterviewProvider,
    InterviewerProvider,
    ResponseProvider,
    ClientProvider,
  ]);

  return (
    <NextThemesProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <ReduxProvider store={store}>
          <Provider>{children}</Provider>
        </ReduxProvider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
};

export default providers;

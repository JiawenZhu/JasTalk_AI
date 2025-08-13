"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Organization } from "@/types/organization";
import { useAuth } from "./auth.context";

interface OrganizationContextType {
  organization: Organization | null;
  loading: boolean;
  setOrganization: (org: Organization | null) => void;
  refreshOrganization: () => Promise<void>;
}

// Default organization for all users
const DEFAULT_ORGANIZATION: Organization = {
  id: "default-org-id",
  name: "Jastalk AI",
  slug: "jastalk-ai",
  description: "AI-powered interview practice platform",
  logo_url: "/jastalk.png",
  website_url: "https://jastalk.ai",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owner_id: "default-owner",
  is_active: true,
  subscription_tier: "free",
  subscription_status: "active",
  subscription_expires_at: null,
  settings: {
    allow_public_interviews: true,
    require_approval: false,
    max_interviews_per_month: 10,
    max_team_members: 5
  }
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(DEFAULT_ORGANIZATION);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const refreshOrganization = async () => {
    // For now, just return the default organization
    // In the future, this could fetch from an API if needed
    setOrganization(DEFAULT_ORGANIZATION);
  };

  useEffect(() => {
    // Always set the default organization
    setOrganization(DEFAULT_ORGANIZATION);
    setLoading(false);
  }, []);

  const value: OrganizationContextType = {
    organization,
    loading,
    setOrganization,
    refreshOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    // Return default values instead of throwing an error
    return {
      organization: DEFAULT_ORGANIZATION,
      loading: false,
      setOrganization: () => {},
      refreshOrganization: async () => {},
    };
  }
  
  return context;
} 

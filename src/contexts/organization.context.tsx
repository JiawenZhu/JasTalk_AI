"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Organization } from '@/types/organization';
import { useAuth } from '@/contexts/auth.context';
import { createClient } from '@/lib/supabase';

interface OrganizationContextType {
  organization: Organization | null;
  loading: boolean;
  refetchOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUserOrganization = async () => {
    if (!user?.id) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    // For development, use the same organization ID that the interviews are using
    if (process.env.NODE_ENV === 'development' && user.id === 'test-user-123') {
      const defaultOrg = {
        id: 'test-org-123',
        name: 'Test Organization',
        image_url: '',
        plan: 'free'
      };
      setOrganization(defaultOrg);
      setLoading(false);
      return;
    }

    try {
      // First, get the user to find their organization_id
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.organization_id) {
        // For development, create a default organization if none exists
        const defaultOrg = {
          id: 'dev-org-123',
          name: 'Development Organization',
          image_url: '',
          plan: 'free'
        };
        setOrganization(defaultOrg);
        setLoading(false);
        return;
      }

      // Now get the organization using the organization_id
      const { data: orgData, error: orgError } = await supabase
        .from('organization')
        .select('*')
        .eq('id', userData.organization_id)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
        // For development, create a default organization if none exists
        const defaultOrg = {
          id: 'dev-org-123',
          name: 'Development Organization',
          image_url: '',
          plan: 'free'
        };
        setOrganization(defaultOrg);
      } else {
        setOrganization(orgData);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;

    if (user) {
      fetchUserOrganization();
    } else {
      setOrganization(null);
      setLoading(false);
    }
  }, [user, mounted]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <OrganizationContext.Provider value={{
        organization: null,
        loading: true,
        refetchOrganization: async () => {}
      }}>
        {children}
      </OrganizationContext.Provider>
    );
  }

  const value = {
    organization,
    loading,
    refetchOrganization: fetchUserOrganization,
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
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
} 

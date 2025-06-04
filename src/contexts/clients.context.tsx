"use client";

import React, { useState, useContext, ReactNode, useEffect } from "react";
import { User } from "@/types/user";
import { useAuth } from "@/contexts/auth.context";
import { useOrganization } from "@/contexts/organization.context";
import { ClientService } from "@/services/clients.service";

interface ClientContextProps {
  client?: User;
}

const ClientContext = React.createContext<ClientContextProps>({
  client: undefined,
});

export const useClient = () => useContext(ClientContext);

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  const [client, setClient] = useState<User>();
  const { user } = useAuth();
  const { organization } = useOrganization();

  const [clientLoading, setClientLoading] = useState(true);

  const fetchClient = async () => {
    try {
      setClientLoading(true);
      const response = await ClientService.getClientById(
        user?.id as string,
        user?.email as string,
        organization?.id as string,
      );
      setClient(response);
    } catch (error) {
      console.error(error);
    }
    setClientLoading(false);
  };

  const fetchOrganization = async () => {
    try {
      setClientLoading(true);
      const response = await ClientService.getOrganizationById(
        organization?.id as string,
        organization?.name as string,
      );
    } catch (error) {
      console.error(error);
    }
    setClientLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      fetchClient();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (organization?.id) {
      fetchOrganization();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  return (
    <ClientContext.Provider
      value={{
        client,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

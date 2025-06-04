import Link from "next/link";
import React from "react";
import { useAuth } from "@/contexts/auth.context";
import { useOrganization } from "@/contexts/organization.context";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function Navbar() {
  const { user, signOut } = useAuth();
  const { organization, loading } = useOrganization();

  const handleSignOut = async () => {
    await signOut();
  };

  // Get organization name with fallback for development
  const getOrganizationName = () => {
    if (organization?.name) {
      return organization.name;
    }
    
    // In development mode, show a default name instead of loading
    if (process.env.NODE_ENV === 'development') {
      return "Development Organization";
    }
    
    return loading ? "Loading..." : "No Organization";
  };

  return (
    <div className="fixed inset-x-0 top-0 bg-slate-100 z-[10] h-fit py-4">
      <div className="flex items-center justify-between h-full gap-2 px-8 mx-auto">
        <div className="flex flex-row gap-3 justify-center">
          <Link href={"/dashboard"} className="flex items-center gap-2">
            <p className="px-2 py-1 text-2xl font-bold text-black">
              Folo<span className="text-indigo-600">Up</span>{" "}
              <span className="text-[8px]">Beta</span>
            </p>
          </Link>
          <p className="my-auto text-xl">/</p>
          <div className="my-auto">
            <div className="px-3 py-1 text-sm bg-gray-200 rounded-md">
              {getOrganizationName()}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-8 w-8 rounded-full"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.email || 'dev@example.com'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {getOrganizationName()}
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export default Navbar;

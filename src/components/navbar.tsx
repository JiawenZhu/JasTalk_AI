import Link from "next/link";
import React from "react";
import { useAuth } from "@/contexts/auth.context";
import { useRouter } from "next/navigation";

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
  const { user, signOut, getUserFullName, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        // Redirect to sign-in page after successful logout
        router.push('/sign-in');
      } else {
        console.error('Logout failed:', result.error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    const fullName = getUserFullName(user);
    if (fullName) {
      return fullName;
    }
    
    return user?.email?.split('@')[0] || 'User';
  };

  // Don't render navbar if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 bg-slate-100 z-[10] h-fit py-4">
      <div className="flex items-center h-full gap-2 px-4 sm:px-8 mx-auto">
        <div className="flex flex-row gap-2 sm:gap-3 justify-center">
          <Link href={"/dashboard"} className="flex items-center gap-1 sm:gap-2">
            <p className="px-1 sm:px-2 py-1 text-lg sm:text-2xl font-bold text-black">
              Jas<span className="text-indigo-600">Talk</span> AI{" "}
              <span className="text-[6px] sm:text-[8px]">Beta</span>
            </p>
          </Link>
        </div>
        <div className="flex items-center ml-auto">
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
                    {getUserFullName(user).split(' ').map(n => n[0]).join('').toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {getUserDisplayName()}
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

import { Link } from "react-router-dom";
import { Briefcase, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              PumaJob
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/jobs" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Browse Jobs
            </Link>
            <Link 
              to="/categories" 
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Categories
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
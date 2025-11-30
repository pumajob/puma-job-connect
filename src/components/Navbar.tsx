import { Link } from "react-router-dom";
import { Briefcase, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export const Navbar = () => {
  const [open, setOpen] = useState(false);

  const navLinks = (
    <>
      <Link 
        to="/jobs" 
        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(false)}
      >
        Browse Jobs
      </Link>
      <Link 
        to="/categories" 
        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(false)}
      >
        Categories
      </Link>
      <Link 
        to="/companies" 
        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(false)}
      >
        Companies
      </Link>
      <Link 
        to="/news" 
        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(false)}
      >
        News
      </Link>
      <Link 
        to="/salary-checker" 
        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(false)}
      >
        Salary Checker
      </Link>
      <Link 
        to="/interview-practice" 
        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(false)}
      >
        Interview Practice
      </Link>
      <Link 
        to="/dashboard" 
        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(false)}
      >
        My Progress
      </Link>
      <Link 
        to="/referrals" 
        className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(false)}
      >
        Referrals
      </Link>
    </>
  );

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
            {navLinks}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Link to="/admin" className="hidden md:block">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>
            
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
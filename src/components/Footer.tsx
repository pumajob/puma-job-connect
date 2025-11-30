import { Link } from "react-router-dom";
import { Briefcase, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                PumaJob
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              South Africa's premier job portal connecting talented professionals with 
              leading employers across all provinces.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">For Job Seekers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/jobs" className="hover:text-primary transition-colors">Browse Jobs</Link></li>
              <li><Link to="/categories" className="hover:text-primary transition-colors">Job Categories</Link></li>
              <li><Link to="/provinces" className="hover:text-primary transition-colors">Jobs by Province</Link></li>
              <li><Link to="/qualifications" className="hover:text-primary transition-colors">Jobs by Qualification</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Popular Provinces</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/provinces/gauteng" className="hover:text-primary transition-colors">Gauteng Jobs</Link></li>
              <li><Link to="/provinces/kwazulu-natal" className="hover:text-primary transition-colors">KZN Jobs</Link></li>
              <li><Link to="/provinces/western-cape" className="hover:text-primary transition-colors">Western Cape Jobs</Link></li>
              <li><Link to="/provinces/limpopo" className="hover:text-primary transition-colors">Limpopo Jobs</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">By Qualification</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/qualifications/matric-jobs" className="hover:text-primary transition-colors">Matric Jobs</Link></li>
              <li><Link to="/qualifications/no-experience-jobs" className="hover:text-primary transition-colors">No Experience</Link></li>
              <li><Link to="/qualifications/learnerships" className="hover:text-primary transition-colors">Learnerships</Link></li>
              <li><Link to="/qualifications/government-jobs" className="hover:text-primary transition-colors">Government Jobs</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PumaJob.co.za. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
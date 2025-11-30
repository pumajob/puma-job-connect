import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import Provinces from "./pages/Provinces";
import ProvinceJobs from "./pages/ProvinceJobs";
import Qualifications from "./pages/Qualifications";
import QualificationJobs from "./pages/QualificationJobs";
import Companies from "./pages/Companies";
import CompanyJobs from "./pages/CompanyJobs";
import SalaryChecker from "./pages/SalaryChecker";
import InterviewPractice from "./pages/InterviewPractice";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import CreateJob from "./pages/CreateJob";
import ApplyJob from "./pages/ApplyJob";
import Unsubscribe from "./pages/Unsubscribe";
import Dashboard from "./pages/Dashboard";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/admin" element={<AdminAuth />} />
            <Route path="/" element={<Index />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:slug" element={<JobDetail />} />
            <Route path="/apply/:slug" element={<ProtectedRoute><ApplyJob /></ProtectedRoute>} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:slug" element={<CategoryDetail />} />
            <Route path="/provinces" element={<Provinces />} />
            <Route path="/provinces/:slug" element={<ProvinceJobs />} />
            <Route path="/qualifications" element={<Qualifications />} />
            <Route path="/qualifications/:slug" element={<QualificationJobs />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/:slug" element={<CompanyJobs />} />
            <Route path="/salary-checker" element={<SalaryChecker />} />
            <Route path="/interview-practice" element={<InterviewPractice />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/jobs/new" element={<ProtectedRoute><CreateJob /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

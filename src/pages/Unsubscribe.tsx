import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid unsubscribe link. Missing token.");
        return;
      }

      try {
        // Deactivate the alert
        const { error } = await supabase
          .from("job_alerts")
          .update({ is_active: false })
          .eq("unsubscribe_token", token);

        if (error) {
          throw error;
        }

        setStatus("success");
        setMessage("You've been successfully unsubscribed from job alerts.");
      } catch (error: any) {
        console.error("Error unsubscribing:", error);
        setStatus("error");
        setMessage("Failed to unsubscribe. The link may be invalid or expired.");
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <div className="flex justify-center mb-4">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                </div>
                <CardTitle>Processing...</CardTitle>
                <CardDescription>Please wait while we unsubscribe you</CardDescription>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                <CardTitle>Unsubscribed Successfully</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center mb-4">
                  <XCircle className="w-16 h-16 text-destructive" />
                </div>
                <CardTitle>Unsubscribe Failed</CardTitle>
                <CardDescription>{message}</CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="text-center space-y-4">
            {status === "success" && (
              <p className="text-sm text-muted-foreground">
                You will no longer receive job alert emails. You can always subscribe again from any job listing page.
              </p>
            )}

            <Link to="/">
              <Button className="w-full">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
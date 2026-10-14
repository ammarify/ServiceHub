import { FileQuestion } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <FileQuestion size={28} className="text-text-secondary" />
      <h1 className="text-[20px] font-semibold text-text-primary">Page not found</h1>
      <p className="text-[13px] text-text-secondary">The page you're looking for doesn't exist or has moved.</p>
      <Button variant="primary" className="mt-2" onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </Button>
    </div>
  );
}

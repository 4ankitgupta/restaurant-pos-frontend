import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ReportLayoutProps {
  title: string;
  filters: ReactNode;
  isLoading: boolean;
  error: string | null;
  children: ReactNode;
  reportData: any;
  subtitle?: String;
}

export const ReportLayout = ({
  title,
  filters,
  isLoading,
  error,
  children,
  reportData,
}: ReportLayoutProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        {filters}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && !error && reportData && (
        <div className="pt-4">{children}</div>
      )}
    </div>
  );
};

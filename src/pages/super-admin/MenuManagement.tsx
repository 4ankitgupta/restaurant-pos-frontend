import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSuperAdminAuth } from "@/contexts/SuperAdminAuthContext";
import { SUPER_ADMIN_API_BASE_URL } from "@/config/apiConfig";

const API_URL = SUPER_ADMIN_API_BASE_URL;

interface MenuManagementProps {
  restaurantId: string;
  restaurantName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export const MenuManagement: React.FC<MenuManagementProps> = ({
  restaurantId,
  restaurantName,
  variant = "outline",
  size = "sm",
}) => {
  const { adminToken } = useSuperAdminAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    if (!adminToken) {
      toast({
        title: "Authentication Required",
        description: "Please log in to export menu data",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(
        `${API_URL}/restaurants/${restaurantId}/menu/export`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export menu");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `menu-${restaurantName.replace(
        /\s+/g,
        "-"
      )}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Menu exported successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description:
          error instanceof Error ? error.message : "Failed to export menu",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({
        title: "Invalid File",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    if (!adminToken) {
      toast({
        title: "Authentication Required",
        description: "Please log in to import menu data",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${API_URL}/restaurants/${restaurantId}/menu/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            // Do NOT set Content-Type for FormData - browser sets it automatically with boundary
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to import menu");
      }

      // Show detailed success message with stats
      const stats = result.stats;
      const statsMessage = stats
        ? `Categories: ${stats.categoriesCreated} created, ${stats.categoriesUpdated} updated\n` +
          `Items: ${stats.itemsCreated} created, ${stats.itemsUpdated} updated\n` +
          `Variants: ${stats.variantsCreated} created, ${stats.variantsUpdated} updated` +
          (stats.errors.length > 0
            ? `\n\nWarnings: ${stats.errors.length}`
            : "")
        : "Menu data imported successfully";

      toast({
        title: "Import Successful",
        description: statsMessage,
        duration: 8000,
      });

      // Show errors if any
      if (stats?.errors && stats.errors.length > 0) {
        console.warn("Import errors:", stats.errors);
        // Show first few errors
        setTimeout(() => {
          toast({
            title: "Import Warnings",
            description: stats.errors.slice(0, 3).join("\n"),
            variant: "destructive",
            duration: 10000,
          });
        }, 500);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description:
          error instanceof Error ? error.message : "Failed to import menu",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex gap-2">
      <Button
        size={size}
        variant={variant}
        onClick={handleExport}
        disabled={isExporting || isImporting}
        className="flex-1"
      >
        {isExporting ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Download className="w-3 h-3 mr-1" />
        )}
        Export Menu
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleImport}
        accept=".xlsx,.xls"
        disabled={isExporting || isImporting}
      />

      <Button
        size={size}
        variant={variant}
        onClick={handleUploadClick}
        disabled={isExporting || isImporting}
        className="flex-1"
      >
        {isImporting ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Upload className="w-3 h-3 mr-1" />
        )}
        Import Menu
      </Button>
    </div>
  );
};

// Compact version for table rows
export const MenuManagementCompact: React.FC<MenuManagementProps> = ({
  restaurantId,
  restaurantName,
}) => {
  const { adminToken } = useSuperAdminAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    if (!adminToken) return;
    setIsExporting(true);
    try {
      const response = await fetch(
        `${API_URL}/restaurants/${restaurantId}/menu/export`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `menu-${restaurantName.replace(
        /\s+/g,
        "-"
      )}-${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Menu exported" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Export failed",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;
    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(
        `${API_URL}/restaurants/${restaurantId}/menu/import`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Import failed");
      const result = await response.json();
      toast({
        title: "Success",
        description: result.stats
          ? `${
              result.stats.categoriesCreated +
              result.stats.itemsCreated +
              result.stats.variantsCreated
            } items created`
          : "Menu imported",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Import failed",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleExport}
        disabled={isExporting || isImporting}
        title="Export Menu"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleImport}
        accept=".xlsx,.xls"
        disabled={isExporting || isImporting}
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => fileInputRef.current?.click()}
        disabled={isExporting || isImporting}
        title="Import Menu"
      >
        {isImporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
      </Button>
    </>
  );
};

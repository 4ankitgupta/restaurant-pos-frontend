/**
 * Export Utilities for Reports
 * Provides CSV and PDF export functionality
 *
 * Note: To enable PDF export, install: npm install jspdf jspdf-autotable
 */

/**
 * Convert data to CSV format
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values that contain commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export report to PDF
 * Note: This is a placeholder. To enable PDF export:
 * 1. Install packages: npm install jspdf jspdf-autotable @types/jspdf
 * 2. Uncomment the implementation in this file
 */
export const exportToPDF = async (
  title: string,
  headers: string[],
  data: any[][],
  filename: string,
  summaryData?: { label: string; value: string }[]
) => {
  alert(
    "PDF export is not yet configured.\n\n" +
      "To enable PDF export:\n" +
      "1. Run: npm install jspdf jspdf-autotable\n" +
      "2. Uncomment the PDF implementation in exportUtils.ts\n\n" +
      "For now, please use CSV export."
  );

  // UNCOMMENT BELOW AFTER INSTALLING PACKAGES:
  /*
  try {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 28);
    
    let yPosition = 35;
    
    if (summaryData && summaryData.length > 0) {
      doc.setFontSize(12);
      doc.text("Summary", 14, yPosition);
      yPosition += 7;
      
      doc.setFontSize(10);
      summaryData.forEach((item) => {
        doc.text(`${item.label}: ${item.value}`, 14, yPosition);
        yPosition += 6;
      });
      
      yPosition += 5;
    }
    
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: yPosition,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    });
    
    doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
  } catch (error) {
    console.error("PDF export error:", error);
    alert("Failed to generate PDF. Please try CSV export.");
  }
  */
};

/**
 * Format currency for export
 */
export const formatCurrencyForExport = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

/**
 * Prepare data for table export (flatten nested objects)
 */
export const prepareDataForExport = (data: any[]): any[] => {
  return data.map((item) => {
    const flatItem: any = {};

    Object.keys(item).forEach((key) => {
      const value = item[key];

      // Handle nested objects
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.keys(value).forEach((nestedKey) => {
          flatItem[`${key}_${nestedKey}`] = value[nestedKey];
        });
      } else {
        flatItem[key] = value;
      }
    });

    return flatItem;
  });
};

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BillReceipt } from "@/components/cashier/BillReceipt";
import { Button } from "@/components/ui/button";
import { Printer, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "@/config/apiConfig";

export default function PublicBillView() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Invalid bill link");
      setLoading(false);
      return;
    }

    // Fetch public bill
    fetch(`${API_BASE_URL}/public/bill/${token}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Bill not found or expired");
        }
        return res.json();
      })
      .then((data) => {
        if (data.statusCode === 200 && data.data) {
          setOrder(data.data);
        } else {
          setError(data.message || "Bill not found");
        }
      })
      .catch((err) => {
        console.error("Error fetching bill:", err);
        setError("Failed to load bill. The link may be expired or invalid.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Bill...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Unable to Load Bill
          </h2>
          <p className="text-red-600">{error}</p>
          <p className="text-gray-500 mt-4 text-sm">
            This bill link may have expired or is no longer valid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 print:p-0 print:bg-white">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden mb-4 print:shadow-none print:max-w-full">
        {order && <BillReceipt order={order} />}
      </div>

      <div className="flex gap-4 print:hidden">
        <Button
          onClick={() => window.print()}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Printer className="w-4 h-4 mr-2" /> Print / Download PDF
        </Button>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:max-w-full {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

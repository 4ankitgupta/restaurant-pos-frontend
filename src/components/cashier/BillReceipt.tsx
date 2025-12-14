// src/components/cashier/BillReceipt.tsx
import React from "react";
import { APIOrder } from "@/types/restaurant";
import { API_BASE_URL } from "@/config/apiConfig";
import "./BillReceipt.css"; // We will create this file for styling

interface BillReceiptProps {
  order: APIOrder;
}

// Using React.forwardRef to allow the parent to hold a ref to this component
export const BillReceipt = React.forwardRef<HTMLDivElement, BillReceiptProps>(
  ({ order }, ref) => {
    // Get restaurant details safely from the order relation
    const restaurant = order.restaurant;

    const restaurantName = restaurant?.name || "Rasoi Track";
    const address = restaurant?.address || "";
    const phone = restaurant?.phone || "";
    const phone2 = restaurant?.phone2 || "";
    const gstin = restaurant?.gstin || "";

    // Construct Logo URL - logos are served from the POS backend
    // Remove /api/v1 from API_BASE_URL to get the base domain
    const baseUrl = API_BASE_URL.replace(/\/api\/v1$/, "");
    const logoSrc = restaurant?.logoUrl
      ? `${baseUrl}${restaurant.logoUrl}`
      : null;

    const orderId = order.id.substring(0, 8).toUpperCase();
    const orderDate = new Date(order.createdAt).toLocaleString();
    const tableNumber = order.table?.tableNumber || "Take-away";

    const printableItems = order.orderItems.filter(
      (item) => item.status !== "CANCELLED"
    );

    // Format phone numbers
    const formatPhoneNumbers = () => {
      if (phone && phone2) {
        return `Ph: ${phone}, ${phone2}`;
      } else if (phone) {
        return `Ph: ${phone}`;
      } else if (phone2) {
        return `Ph: ${phone2}`;
      }
      return "";
    };

    return (
      <div className="bill-receipt" ref={ref}>
        <header className="bill-header">
          {/* LOGO */}
          {logoSrc && (
            <div className="bill-logo-container">
              <img src={logoSrc} alt="Logo" className="bill-logo" />
            </div>
          )}

          <h2 className="restaurant-name">{restaurantName}</h2>

          {/* Address */}
          {address && <p className="bill-address">{address}</p>}

          {/* Contact - Only show if at least one phone exists */}
          {(phone || phone2) && (
            <p className="bill-contact">{formatPhoneNumbers()}</p>
          )}

          <div className="bill-meta-grid">
            <p>Date: {orderDate}</p>
            <p>Order: #{orderId}</p>
            <p>Table: {tableNumber}</p>
            {gstin && <p>GSTIN: {gstin}</p>}
          </div>
        </header>

        <Separator />

        <section className="bill-items">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {printableItems.map((item) => {
                // Handle legacy orders without menuItemVariant
                const itemName = item.menuItemVariant?.menuItem?.name || "Item";
                const variantName = item.menuItemVariant?.name || "Standard";

                return (
                  <tr key={item.id}>
                    <td>
                      {itemName} ({variantName})
                    </td>
                    <td>{item.quantity}</td>
                    <td>{Number(item.price).toFixed(2)}</td>
                    <td>{(item.quantity * Number(item.price)).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <Separator />

        <section className="bill-summary">
          <div className="summary-row">
            <span>Total</span>
            <span>₹{Number(order.totalAmount).toFixed(2)}</span>
          </div>
          {/* You can add more summary details here like Tax, Discount, etc. */}
          <div className="summary-row total-due">
            <span>Amount Due</span>
            <span>₹{Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </section>

        <Separator />

        {/* Payment Information */}
        {order.payments && order.payments.length > 0 && (
          <>
            <section className="bill-payment-info">
              <div className="payment-row">
                <span>Mode of Payment:</span>
                <span>
                  {order.payments.map((p) => p.paymentMethod).join(", ")}
                </span>
              </div>
            </section>

            <Separator />
          </>
        )}

        {/* UPI QR Code */}
        {restaurant?.upiQrCodeUrl && (
          <>
            <section className="bill-qr-code-section">
              <p className="qr-code-label">Scan to Pay</p>
              <div className="qr-code-container">
                <img
                  src={`${baseUrl}${restaurant.upiQrCodeUrl}`}
                  alt="UPI QR Code"
                  className="bill-qr-code"
                />
              </div>
            </section>

            <Separator />
          </>
        )}

        <footer className="bill-footer">
          <p>Thank you for visiting!</p>
          <p className="powered-by">Powered by rasoitrack.in</p>
        </footer>
      </div>
    );
  }
);

// Simple separator component - optimized for 80mm width
const Separator = () => (
  <div className="bill-separator">========================================</div>
);

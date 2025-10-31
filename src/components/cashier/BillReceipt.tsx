// src/components/cashier/BillReceipt.tsx
import React from "react";
import { APIOrder } from "@/types/restaurant";
import "./BillReceipt.css"; // We will create this file for styling

interface BillReceiptProps {
  order: APIOrder;
}

// Using React.forwardRef to allow the parent to hold a ref to this component
export const BillReceipt = React.forwardRef<HTMLDivElement, BillReceiptProps>(
  ({ order }, ref) => {
    // A real restaurant name would come from config or context
    const restaurantName = "Rasoi Track";
    const orderId = order.id.substring(0, 8).toUpperCase();
    const orderDate = new Date(order.createdAt).toLocaleString();
    const tableNumber = order.table?.tableNumber || "Take-away";

    return (
      <div className="bill-receipt" ref={ref}>
        <header className="bill-header">
          <h2 className="restaurant-name">{restaurantName}</h2>
          <p>Order: #{orderId}</p>
          <p>Table: {tableNumber}</p>
          <p>Date: {orderDate}</p>
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
              {order.orderItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.menuItemVariant.menuItem.name} (
                    {item.menuItemVariant.name})
                  </td>
                  <td>{item.quantity}</td>
                  <td>{Number(item.price).toFixed(2)}</td>
                  <td>{(item.quantity * Number(item.price)).toFixed(2)}</td>
                </tr>
              ))}
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

        <footer className="bill-footer">
          <p>Thank you for visiting!</p>
        </footer>
      </div>
    );
  }
);

// Simple separator component
const Separator = () => (
  <div className="bill-separator">--------------------</div>
);

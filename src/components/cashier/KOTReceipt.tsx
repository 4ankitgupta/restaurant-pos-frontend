// src/components/cashier/KOTReceipt.tsx
import React from "react";
import { APIOrder } from "@/types/restaurant";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedName } from "@/lib/utils";

interface KOTReceiptProps {
  order: APIOrder;
}

// Using React.forwardRef to allow the parent to hold a ref to this component
export const KOTReceipt = React.forwardRef<HTMLDivElement, KOTReceiptProps>(
  ({ order }, ref) => {
    const { language } = useLanguage();
    const restaurantName = order.restaurant?.name || "Restaurant";
    const orderId = order.id.substring(0, 8).toUpperCase();
    const orderDate = new Date(order.createdAt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const tableNumber = order.table?.tableNumber || "Take-away";

    // Filter only ORDERED/PENDING items (items sent to kitchen but not yet prepared)
    const orderedItems = order.orderItems.filter(
      (item) => item.status === "ORDERED" || item.status === "PENDING"
    );

    if (orderedItems.length === 0) {
      return null; // Don't render if no ordered items
    }

    // Localized strings
    const strings = {
      en: {
        title: "KITCHEN ORDER TICKET",
        order: "Order",
        table: "Table",
        time: "Time",
        item: "Item",
        qty: "Qty",
        note: "Note:",
        footer: "PLEASE PREPARE IMMEDIATELY",
        totalItems: "Total Items:",
      },
      hi: {
        title: "किचन ऑर्डर टिकट",
        order: "ऑर्डर",
        table: "टेबल",
        time: "समय",
        item: "आइटम",
        qty: "मात्रा",
        note: "नोट:",
        footer: "कृपया तुरंत तैयार करें",
        totalItems: "कुल आइटम:",
      },
    };
    const t = strings[language];

    return (
      <div className="kot-receipt" ref={ref}>
        <header className="kot-header">
          <h2 className="kot-title">{t.title}</h2>
          <h3 className="restaurant-name">{restaurantName}</h3>

          <div className="kot-meta">
            <p>
              <strong>{t.order}:</strong> #{orderId}
            </p>
            <p>
              <strong>{t.table}:</strong> {tableNumber}
            </p>
            <p>
              <strong>{t.time}:</strong> {orderDate}
            </p>
          </div>
        </header>

        <KOTSeparator />

        <section className="kot-items">
          <table>
            <thead>
              <tr>
                <th>{t.item}</th>
                <th>{t.qty}</th>
              </tr>
            </thead>
            <tbody>
              {orderedItems.map((item) => (
                <React.Fragment key={item.id}>
                  <tr>
                    <td className="item-name">
                      {getLocalizedName(
                        item.menuItemVariant.menuItem,
                        language
                      )}
                      <br />
                      <span className="variant-name">
                        ({getLocalizedName(item.menuItemVariant, language)})
                      </span>
                    </td>
                    <td className="item-qty">{item.quantity}</td>
                  </tr>
                  {item.note && (
                    <tr>
                      <td colSpan={2} className="item-note">
                        <strong>{t.note}</strong> {item.note}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </section>

        <KOTSeparator />

        <footer className="kot-footer">
          <p className="kot-instruction">{t.footer}</p>
          <p className="kot-count">
            {t.totalItems}{" "}
            {orderedItems.reduce((sum, item) => sum + item.quantity, 0)}
          </p>
        </footer>
      </div>
    );
  }
);

// Simple separator component - optimized for 80mm width
const KOTSeparator = () => (
  <div className="kot-separator">========================================</div>
);

KOTReceipt.displayName = "KOTReceipt";

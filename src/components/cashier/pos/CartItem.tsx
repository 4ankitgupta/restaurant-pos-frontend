import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Minus,
  MessageSquare,
  Clock,
  ChefHat,
  CheckCircle2,
} from "lucide-react";
import { APIMenuItem, APIOrder } from "@/types/restaurant";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedName } from "@/lib/utils";

interface CartItem {
  key: string;
  menuItemId: string;
  variantId: string;
  quantity: number;
  note?: string;
}

interface CartItemComponentProps {
  cartItem?: CartItem;
  orderItem?: APIOrder["orderItems"][0];
  menuItems: APIMenuItem[];
  onQuantityChange?: (key: string, op: "add" | "remove") => void;
  onEditNote?: (key: string, note?: string, itemName?: string) => void;
  isNew?: boolean;
}

export const CartItemComponent: React.FC<CartItemComponentProps> = ({
  cartItem,
  orderItem,
  menuItems,
  onQuantityChange,
  onEditNote,
  isNew = false,
}) => {
  const { language } = useLanguage();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ORDERED":
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-200 bg-amber-50"
          >
            <Clock className="w-3 h-3 mr-1" /> Ordered
          </Badge>
        );
      case "PREPARING":
      case "IN_PROGRESS":
        return (
          <Badge variant="secondary" className="text-blue-600 bg-blue-50">
            <ChefHat className="w-3 h-3 mr-1" /> Preparing
          </Badge>
        );
      case "SERVED":
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Served
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Render cart item (new items)
  if (cartItem) {
    const item = menuItems.find((mi) => mi.id === cartItem.menuItemId);
    const variant = item?.variants.find((v) => v.id === cartItem.variantId);
    if (!item || !variant) return null;

    return (
      <div
        className={`flex flex-col rounded-md border ${
          isNew
            ? "p-3 bg-background border-primary/20 shadow-sm"
            : "p-2 bg-secondary/30 border-transparent hover:border-border transition-colors"
        }`}
      >
        <div className="flex justify-between items-start">
          <div className={isNew ? "" : "flex-1"}>
            <div className="font-medium flex items-center gap-2 text-sm">
              <span className="text-primary">{cartItem.quantity}x</span>
              <span>{getLocalizedName(item as any, language)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {getLocalizedName(variant as any, language)} • ₹
              {parseFloat(variant.price).toFixed(2)}
            </div>
          </div>
          <p className="font-medium text-sm">
            ₹{(parseFloat(variant.price) * cartItem.quantity).toFixed(2)}
          </p>
        </div>

        {cartItem.note && (
          <p className="text-xs text-amber-600 mt-1 italic bg-amber-50 p-1 rounded w-fit">
            "{cartItem.note}"
          </p>
        )}

        {isNew && onQuantityChange && onEditNote && (
          <div className="flex items-center justify-between mt-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => onEditNote(cartItem.key, cartItem.note, item.name)}
            >
              <MessageSquare className="h-3 w-3 mr-1" /> Note
            </Button>
            <div className="flex items-center bg-secondary rounded-md">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-destructive/10"
                onClick={() => onQuantityChange(cartItem.key, "remove")}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="px-3 text-sm font-medium">
                {cartItem.quantity}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-primary/10"
                onClick={() => onQuantityChange(cartItem.key, "add")}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render order item (already in kitchen)
  if (orderItem) {
    return (
      <div className="flex flex-col p-2 md:p-3 rounded-md bg-secondary/30 text-sm border">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-medium flex items-center gap-2">
              <span className="text-primary">{orderItem.quantity}x</span>
              <span>
                {getLocalizedName(
                  orderItem.menuItemVariant.menuItem as any,
                  language
                )}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {getLocalizedName(orderItem.menuItemVariant as any, language)} • ₹
              {parseFloat(String(orderItem.price)).toFixed(2)}
            </div>
            {orderItem.note && (
              <p className="text-xs text-amber-600 mt-1 italic bg-amber-50 p-1 rounded w-fit">
                "{orderItem.note}"
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono font-semibold">
              ₹
              {(
                parseFloat(String(orderItem.price)) * orderItem.quantity
              ).toFixed(2)}
            </span>
            {getStatusBadge(orderItem.status)}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

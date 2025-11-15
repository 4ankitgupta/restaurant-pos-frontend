import { useEffect, useMemo, useState } from "react";
import { APIMenuItem, APITable, APIOrder } from "@/types/restaurant";
import { useApi } from "@/hooks/useApi";
import { apiService } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VariantSelectionDialog } from "./VariantSelectionDialog";
import { EditNoteDialog } from "./EditNoteDialog";
import { toast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  LayoutGrid,
  Utensils,
  Send,
  Printer,
  ArrowLeft,
} from "lucide-react";
import { PaymentDialog } from "./PaymentDialog";

// Local types
interface MenuCategory {
  id: string;
  name: string;
}

type ServiceType = "DINE_IN" | "TAKEAWAY";

interface CartItem {
  key: string; // menuItemId-variantId
  menuItemId: string;
  variantId: string;
  quantity: number;
  note?: string;
}

export const POSTerminal: React.FC = () => {
  // Data
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<APITable[]>([]);

  // Mode and context
  const [serviceType, setServiceType] = useState<ServiceType>("DINE_IN");
  const [selectedTable, setSelectedTable] = useState<APITable | null>(null);
  const [currentOrder, setCurrentOrder] = useState<APIOrder | null>(null);

  // Menu filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");

  // Cart state
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());

  // Variant chooser and notes
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    cartKey: string;
    initialNote?: string;
    itemName: string;
  } | null>(null);

  // Payment dialog state for Express (Settle & Print)
  const [paymentOrder, setPaymentOrder] = useState<APIOrder | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // APIs
  const { execute: execMenu } = useApi<{ data: APIMenuItem[] }>();
  const { execute: execCats } = useApi<{ data: MenuCategory[] }>();
  const { execute: execTables } = useApi<{ data: APITable[] }>();
  const { execute: execActiveOrder } = useApi<{ data: APIOrder | null }>();
  // Some endpoints return ApiResponse<APIOrder>, others return {data: APIOrder}
  // Use a loose type here and normalize below when needed.
  const { loading: kotLoading, execute: execKOT } = useApi<any>();
  const { loading: payLoading, execute: execPay } = useApi();
  const { loading: addItemsLoading, execute: execAddItems } = useApi<{
    data: APIOrder;
  }>();

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [m, c] = await Promise.all([
          execMenu(() => apiService.getMenuItems()),
          execCats(() => apiService.getMenuCategories()),
        ]);
        if (m?.data) setMenuItems(m.data);
        if (Array.isArray(m)) setMenuItems(m as unknown as APIMenuItem[]);
        if (c?.data) setCategories(c.data);
        if (Array.isArray(c)) setCategories(c as unknown as MenuCategory[]);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAll();
  }, []);

  // Fetch tables when DINE_IN mode
  useEffect(() => {
    if (serviceType !== "DINE_IN") return;
    execTables(() => apiService.getTables())
      .then((res) => {
        if (res?.data) setTables(res.data);
      })
      .catch(() => {});
  }, [serviceType]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Derived
  const filteredItems = useMemo(() => {
    return menuItems.filter(
      (item) =>
        (!activeCategory || item.categoryId === activeCategory) &&
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menuItems, activeCategory, searchTerm]);

  const totalItems = Array.from(cart.values()).reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  // Helpers
  const getItemPriceRange = (item: APIMenuItem) => {
    const prices = item.variants.map((v) => parseFloat(v.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice
      ? `₹${minPrice.toFixed(2)}`
      : `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`;
  };

  const resetWorkArea = () => {
    setCart(new Map());
    setSelectedItemId(null);
    setVariantDialogOpen(false);
  };

  // Item selection flow
  const handleItemClick = (menuItem: APIMenuItem) => {
    if (!menuItem.variants || menuItem.variants.length === 0) {
      toast({
        title: "No variants configured",
        description: "Please add a variant before ordering this item.",
        variant: "destructive",
      });
      return;
    }
    if (menuItem.variants.length === 1) {
      handleVariantSelect(menuItem.id, menuItem.variants[0].id);
    } else {
      setSelectedItemId(menuItem.id);
      setVariantDialogOpen(true);
    }
  };

  const handleVariantSelect = (
    menuItemId: string,
    variantId: string,
    note?: string
  ) => {
    const cartKey = `${menuItemId}-${variantId}`;
    const newCart = new Map(cart);
    const current = newCart.get(cartKey);
    if (current) {
      newCart.set(cartKey, {
        ...current,
        quantity: current.quantity + 1,
        note: note ?? current.note,
      });
    } else {
      newCart.set(cartKey, {
        key: cartKey,
        menuItemId,
        variantId,
        quantity: 1,
        note,
      });
    }
    setCart(newCart);
    setSelectedItemId(null);
    setVariantDialogOpen(false);
  };

  const handleQuantityChange = (cartKey: string, op: "add" | "remove") => {
    const newCart = new Map(cart);
    const item = newCart.get(cartKey);
    if (!item) return;
    if (op === "add") {
      newCart.set(cartKey, { ...item, quantity: item.quantity + 1 });
    } else {
      if (item.quantity > 1)
        newCart.set(cartKey, { ...item, quantity: item.quantity - 1 });
      else newCart.delete(cartKey);
    }
    setCart(newCart);
  };

  const toOrderItemsPayload = () =>
    Array.from(cart.values()).map((i) => ({
      menuItemVariantId: i.variantId,
      quantity: i.quantity,
      note: i.note,
    }));

  // Table interactions
  const handleTableClick = async (table: APITable) => {
    setSelectedTable(table);
    // If occupied, load current order
    if (table.status === "Occupied") {
      try {
        const res = await execActiveOrder(() =>
          apiService.getActiveOrderForTable(table.id)
        );
        if (res && "data" in res) {
          // Some backends return {data: null} when no order
          setCurrentOrder((res as any).data || null);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setCurrentOrder(null);
    }
    // Flip to menu after selecting table
    setSearchTerm("");
  };

  // Actions
  const sendToKitchen = async () => {
    const items = toOrderItemsPayload();
    if (items.length === 0 && !currentOrder) {
      toast({
        title: "No items",
        description: "Add items to proceed.",
        variant: "destructive",
      });
      return;
    }

    try {
      let order: APIOrder | null = currentOrder;

      if (serviceType === "TAKEAWAY") {
        if (items.length === 0 && order) {
          toast({
            title: "Nothing to send",
            description: "Cart is empty.",
            variant: "destructive",
          });
          return;
        }
        const res = await execKOT(() => apiService.createTakeawayOrder(items));
        order = (res as any)?.data ?? (res as any);
      } else {
        // DINE_IN
        if (!selectedTable) {
          toast({
            title: "Select a table",
            description: "Pick a table to continue.",
            variant: "destructive",
          });
          return;
        }
        if (order) {
          // Add items to existing order
          if (items.length === 0) {
            toast({
              title: "Nothing to add",
              description: "Cart is empty.",
              variant: "destructive",
            });
            return;
          }
          const res = await execAddItems(() =>
            apiService.addItemsToCashierOrder(order!.id, items)
          );
          order = res.data;
        } else {
          // Create new table order
          const res = await execKOT(() =>
            apiService.createOrder({ tableId: selectedTable.id, items })
          );
          order = (res as any)?.data ?? (res as any);
        }
      }

      if (order) {
        setCurrentOrder(order);
        setCart(new Map());
        toast({ title: "Sent to Kitchen", description: "Order updated." });
        // Refresh tables to reflect occupancy
        if (serviceType === "DINE_IN") {
          const t = await execTables(() => apiService.getTables());
          if (t?.data) setTables(t.data);
        }
      }
    } catch (e: any) {
      const message = e?.message || "Failed to send to kitchen";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const settleAndPrint = async () => {
    try {
      let order: APIOrder | null = currentOrder;
      // If no order yet, create first from cart
      if (!order) {
        const items = toOrderItemsPayload();
        if (items.length === 0) {
          toast({
            title: "No items",
            description: "Add items to proceed.",
            variant: "destructive",
          });
          return;
        }
        if (serviceType === "TAKEAWAY") {
          const res = await execKOT(() =>
            apiService.createTakeawayOrder(items)
          );
          order = (res as any)?.data ?? (res as any);
        } else {
          if (!selectedTable) {
            toast({
              title: "Select a table",
              description: "Pick a table to continue.",
              variant: "destructive",
            });
            return;
          }
          const res = await execKOT(() =>
            apiService.createOrder({ tableId: selectedTable.id, items })
          );
          order = (res as any)?.data ?? (res as any);
        }
      } else if (cart.size > 0) {
        // If there are new items, add them before settling
        const items = toOrderItemsPayload();
        const res = await execAddItems(() =>
          apiService.addItemsToCashierOrder(order!.id, items)
        );
        order = res.data;
      }

      if (!order) return;
      setPaymentOrder(order);
      setPaymentOpen(true);
    } catch (e: any) {
      const message = e?.message || "Failed to create order";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleProcessPayment = async (
    method: "CASH" | "CARD" | "UPI" | "WALLET"
  ) => {
    if (!paymentOrder) return;
    try {
      await execPay(() =>
        apiService.createPayment({
          orderId: paymentOrder.id,
          amount: Number(paymentOrder.totalAmount),
          paymentMethod: method,
        })
      );
      toast({ title: "Payment successful", description: "Order settled." });
      setPaymentOpen(false);
      setPaymentOrder(null);
      setCart(new Map());
      // Refresh tables
      if (serviceType === "DINE_IN") {
        const t = await execTables(() => apiService.getTables());
        if (t?.data) setTables(t.data);
      }
      setCurrentOrder(null);
      setSelectedTable(null);
    } catch (e: any) {
      const message = e?.message || "Payment failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-110px)]">
      {/* Header with mode */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Cashier Station</h1>
          <Badge variant="secondary" className="uppercase">
            POS Mode
          </Badge>
          {serviceType === "DINE_IN" && selectedTable && (
            <Badge>Table {selectedTable.tableNumber}</Badge>
          )}
          {currentOrder && (
            <Badge variant="outline">
              Loaded Order #{currentOrder.id.slice(0, 6)}
            </Badge>
          )}
        </div>

        <Tabs
          value={serviceType}
          onValueChange={(v) => {
            setServiceType(v as ServiceType);
            // Reset table/order on switch
            setSelectedTable(null);
            setCurrentOrder(null);
            setCart(new Map());
          }}
        >
          <TabsList>
            <TabsTrigger value="DINE_IN">
              <Utensils className="h-4 w-4 mr-1" />
              Dine-In
            </TabsTrigger>
            <TabsTrigger value="TAKEAWAY">
              <LayoutGrid className="h-4 w-4 mr-1" />
              Takeaway
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
        {/* Left workspace */}
        <div className="lg:col-span-2 border rounded-md p-3 flex flex-col min-h-0">
          {serviceType === "DINE_IN" && !selectedTable ? (
            // Floor plan (simple grid of tables)
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tables.map((t) => (
                  <button
                    key={t.id}
                    className={`rounded-lg p-4 border text-left transition-colors ${
                      t.status === "Occupied"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : t.status === "Available"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-muted/20"
                    }`}
                    onClick={() => handleTableClick(t)}
                  >
                    <div className="text-sm opacity-70">Table</div>
                    <div className="text-2xl font-bold">{t.tableNumber}</div>
                    {t.status && <div className="mt-2 text-xs">{t.status}</div>}
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            // Menu grid
            <div className="flex flex-col gap-3 min-h-0">
              <div className="flex items-center gap-2">
                {serviceType === "DINE_IN" && selectedTable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTable(null);
                      setCurrentOrder(null);
                      setCart(new Map());
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Tables
                  </Button>
                )}
                <Input
                  placeholder="Search menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>

              <ScrollArea className="flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredItems.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="p-3">
                        <p className="font-medium line-clamp-2 min-h-[2.5rem]">
                          {item.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getItemPriceRange(item)}
                        </p>
                        {item.variants.length > 1 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.variants.length} variants available
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Right cart */}
        <div className="border rounded-md p-3 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Cart</h3>
            <Badge variant="secondary">
              <ShoppingCart className="h-4 w-4 mr-1" /> {totalItems}
            </Badge>
          </div>
          <Separator className="my-3" />

          <ScrollArea className="flex-1">
            {cart.size === 0 ? (
              <div className="text-center text-muted-foreground pt-12">
                <ShoppingCart className="mx-auto h-10 w-10 opacity-50" />
                <p>No items yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from(cart.values()).map((c) => {
                  const item = menuItems.find((mi) => mi.id === c.menuItemId);
                  const variant = item?.variants.find(
                    (v) => v.id === c.variantId
                  );
                  if (!item || !variant) return null;
                  return (
                    <div
                      key={c.key}
                      className="flex flex-col p-2 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm">
                            {variant.name} - ₹
                            {parseFloat(variant.price).toFixed(2)}
                          </p>
                          {c.note && (
                            <p className="text-xs text-muted-foreground italic">
                              Note: {c.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setEditingNote({
                                cartKey: c.key,
                                initialNote: c.note,
                                itemName: item.name,
                              })
                            }
                          >
                            Note
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() =>
                              handleQuantityChange(c.key, "remove")
                            }
                          >
                            -
                          </Button>
                          <span className="font-bold w-5 text-center">
                            {c.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(c.key, "add")}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <Separator className="my-3" />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={sendToKitchen}
              disabled={kotLoading}
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              {kotLoading ? "Sending..." : "Send to Kitchen"}
            </Button>
            <Button
              onClick={settleAndPrint}
              disabled={kotLoading || addItemsLoading}
            >
              <Printer className="h-4 w-4 mr-2" />
              {kotLoading || addItemsLoading ? "Working..." : "Settle & Print"}
            </Button>
          </div>
        </div>
      </div>

      {/* Variant & Note dialogs */}
      <VariantSelectionDialog
        item={menuItems.find((i) => i.id === selectedItemId)}
        open={variantDialogOpen}
        onOpenChange={setVariantDialogOpen}
        onSelect={(variantId) => {
          if (!selectedItemId) return;
          handleVariantSelect(selectedItemId, variantId);
        }}
      />

      <EditNoteDialog
        open={!!editingNote}
        onOpenChange={(isOpen) => !isOpen && setEditingNote(null)}
        initialNote={editingNote?.initialNote}
        onSave={(note) => {
          if (!editingNote) return;
          const newCart = new Map(cart);
          const item = newCart.get(editingNote.cartKey);
          if (item)
            newCart.set(editingNote.cartKey, {
              ...item,
              note: note || undefined,
            });
          setCart(newCart);
          setEditingNote(null);
        }}
        itemName={editingNote?.itemName || ""}
      />

      {/* Payment dialog */}
      {paymentOrder && (
        <PaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          totalAmount={paymentOrder.totalAmount}
          onProcessPayment={handleProcessPayment}
          isLoading={payLoading}
        />
      )}
    </div>
  );
};

export default POSTerminal;

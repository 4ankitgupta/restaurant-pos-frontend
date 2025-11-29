import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import { APIMenuItem } from "@/types/restaurant";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedName } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MenuCategory {
  id: string;
  name: string;
  nameHindi?: string;
}

interface MenuGridProps {
  menuItems: APIMenuItem[];
  categories: MenuCategory[];
  onItemClick: (item: APIMenuItem) => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({
  menuItems,
  categories,
  onItemClick,
  showBackButton,
  onBackClick,
}) => {
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(
    categories.length > 0 ? categories[0].id : ""
  );

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (activeCategory && item.categoryId !== activeCategory) return false;
      const localized = getLocalizedName(item as any, language).toLowerCase();
      return localized.includes(searchTerm.toLowerCase());
    });
  }, [menuItems, activeCategory, searchTerm, language]);

  const getItemPriceRange = (item: APIMenuItem) => {
    const prices = item.variants.map((v) => parseFloat(v.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice
      ? `₹${minPrice.toFixed(2)}`
      : `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`;
  };

  return (
    <div className="flex flex-col gap-2 md:gap-3 min-h-0 h-full">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button variant="outline" size="sm" onClick={onBackClick}>
            <ArrowLeft className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Tables</span>
          </Button>
        )}
        <Input
          placeholder="Search menu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 h-9"
        />
      </div>

      {/* Category Navigation */}
      <div
        className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${
          isMobile
            ? "sticky top-0 bg-background z-10 -mx-4 px-4 py-2 border-b"
            : ""
        }`}
      >
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "outline"}
            size="sm"
            className="whitespace-nowrap text-xs md:text-sm h-8 md:h-9"
            onClick={() => setActiveCategory(cat.id)}
          >
            {getLocalizedName(cat as any, language)}
          </Button>
        ))}
      </div>

      <ScrollArea
        className={`flex-1 ${isMobile ? "-mx-4 px-4" : "-mr-3 pr-3"}`}
      >
        <div
          className={`grid gap-2 md:gap-3 ${
            isMobile
              ? "grid-cols-2 pb-24"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 pb-4"
          }`}
        >
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:bg-accent/50 hover:border-primary/50 transition-colors active:scale-95"
              onClick={() => onItemClick(item)}
            >
              <CardContent className={`${isMobile ? "p-2" : "p-3"}`}>
                <p
                  className={`font-medium line-clamp-2 leading-tight ${
                    isMobile ? "text-sm min-h-[2rem]" : "min-h-[2.5rem]"
                  }`}
                >
                  {getLocalizedName(item as any, language)}
                </p>
                <p
                  className={`text-muted-foreground mt-1 font-mono ${
                    isMobile ? "text-xs" : "text-sm"
                  }`}
                >
                  {getItemPriceRange(item)}
                </p>
                {item.variants.length > 1 && (
                  <Badge
                    variant="secondary"
                    className="mt-1 md:mt-2 text-[9px] md:text-[10px] h-4 md:h-5"
                  >
                    {item.variants.length} options
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

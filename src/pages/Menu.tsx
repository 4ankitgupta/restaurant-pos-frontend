import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Utensils, Tag, DollarSign } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { useApi } from '@/hooks/useApi';
import { toast } from '@/hooks/use-toast';
import { APIMenuItem } from '@/types/restaurant';

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  restaurantId: string;
}

const Menu: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<APIMenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<APIMenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  const { loading: categoriesLoading, execute: executeCategories } = useApi<{ data: MenuCategory[] }>();
  const { loading: itemsLoading, execute: executeItems } = useApi<{ data: APIMenuItem[] }>();
  const { loading: createLoading, execute: executeCreate } = useApi();
  const { loading: updateLoading, execute: executeUpdate } = useApi();
  const { loading: deleteLoading, execute: executeDelete } = useApi();

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        executeCategories(() => apiService.getMenuCategories()),
        executeItems(() => apiService.getMenuItems())
      ]);

      if (categoriesRes) setCategories(categoriesRes.data);
      // Menu items API returns array directly, not wrapped in data property
      if (itemsRes) setMenuItems(Array.isArray(itemsRes) ? itemsRes : []);
    } catch (error) {
      console.error('Failed to fetch menu data:', error);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await executeCreate(() => 
        apiService.createCategory(categoryForm)
      );
      toast({ title: "Success", description: "Category created successfully" });
      setCategoryForm({ name: '', description: '' });
      setIsAddCategoryOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await executeCreate(() => 
        apiService.createMenuItem({
          ...itemForm,
          price: parseFloat(itemForm.price)
        })
      );
      toast({ title: "Success", description: "Menu item created successfully" });
      setItemForm({ name: '', description: '', price: '', categoryId: '', isAvailable: true });
      setIsAddItemOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create menu item:', error);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    try {
      await executeUpdate(() => 
        apiService.updateMenuItem(editingItem.id, {
          ...itemForm,
          price: parseFloat(itemForm.price)
        })
      );
      toast({ title: "Success", description: "Menu item updated successfully" });
      setEditingItem(null);
      setItemForm({ name: '', description: '', price: '', categoryId: '', isAvailable: true });
      fetchData();
    } catch (error) {
      console.error('Failed to update menu item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await executeDelete(() => apiService.deleteMenuItem(itemId));
      toast({ title: "Success", description: "Menu item deleted successfully" });
      fetchData();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await executeDelete(() => apiService.deleteCategory(categoryId));
      toast({ title: "Success", description: "Category deleted successfully" });
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const startEditItem = (item: APIMenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: item.categoryId || '',
      isAvailable: item.isAvailable
    });
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.categoryId === selectedCategory);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const loading = categoriesLoading || itemsLoading || createLoading || updateLoading || deleteLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Menu Management</h1>
        <div className="flex space-x-2">
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Tag className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Name</Label>
                  <Input
                    id="category-name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  Create Category
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddItemOpen || !!editingItem} onOpenChange={(open) => {
            if (!open) {
              setIsAddItemOpen(false);
              setEditingItem(null);
              setItemForm({ name: '', description: '', price: '', categoryId: '', isAvailable: true });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="space-y-4">
                <div>
                  <Label htmlFor="item-name">Name</Label>
                  <Input
                    id="item-name"
                    value={itemForm.name}
                    onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="item-description">Description</Label>
                  <Textarea
                    id="item-description"
                    value={itemForm.description}
                    onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="item-price">Price</Label>
                  <Input
                    id="item-price"
                    type="number"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="item-category">Category</Label>
                  <Select value={itemForm.categoryId} onValueChange={(value) => setItemForm(prev => ({ ...prev, categoryId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading}>
                  {editingItem ? 'Update Item' : 'Create Item'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Section */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Items ({menuItems.length})
            </Button>
            {categories.map((category) => {
              const itemCount = menuItems.filter(item => item.categoryId === category.id).length;
              return (
                <div key={category.id} className="flex items-center">
                  <Button
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name} ({itemCount})
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="ml-1 p-1">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{category.name}"? This will affect all menu items in this category.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => startEditItem(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{item.name}"?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{getCategoryName(item.categoryId)}</Badge>
                <Badge variant={item.isAvailable ? 'default' : 'destructive'}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-primary mr-1" />
                    <span className="text-lg font-bold text-primary">
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Menu Items</h3>
            <p className="text-muted-foreground">
              {selectedCategory === 'all' 
                ? 'No menu items found. Add some items to get started.'
                : 'No items in this category. Try selecting a different category.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Menu;
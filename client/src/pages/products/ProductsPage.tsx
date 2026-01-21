import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Search, MoreHorizontal, PackageOpen, Tag, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { useSettings, formatCurrency } from '@/lib/settings';
import { useI18n } from '@/lib/i18n';

type ProductFormData = {
  name: string;
  category: string;
  price: string;
  stock: number;
  image?: string;
};

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    price: '',
    stock: 0,
    image: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currency } = useSettings();
  const { t } = useI18n();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const createCategoryMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Category Added",
        description: "New category has been created.",
      });
      setIsAddCategoryOpen(false);
      setNewCategoryName('');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "Category Deleted",
        description: "Category has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Product Added",
        description: "New product has been successfully added to inventory.",
      });
      setIsAddProductOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Product Updated",
        description: "Product has been successfully updated.",
      });
      setEditingProduct(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Product Deleted",
        description: "Product has been removed from inventory.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filtered = products.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories.length > 0 ? categories[0].name : '',
      price: '',
      stock: 0,
      image: '',
    });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }
    createCategoryMutation.mutate({ name: newCategoryName.trim() });
  };

  const handleDeleteCategory = (id: string, categoryName: string) => {
    const productsInCategory = products.filter((p: any) => p.category === categoryName);
    if (productsInCategory.length > 0) {
      toast({
        title: "Cannot Delete",
        description: `This category has ${productsInCategory.length} product(s). Remove or reassign them first.`,
        variant: "destructive",
      });
      return;
    }
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    resetForm();
    setIsAddProductOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      image: product.image || '',
    });
    setIsAddProductOpen(true);
  };

  const handleSaveProduct = () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (name, category, and price).",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      ...formData,
      price: formData.price.toString(),
      stock: parseInt(formData.stock.toString()) || 0,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products</h1>
            <p className="text-slate-500 mt-1">Manage your inventory and pricing.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsAddCategoryOpen(true)}
              data-testid="button-add-category"
            >
              <Tag className="mr-2 h-4 w-4" /> Categories
            </Button>
            <Button 
              className="rounded-xl shadow-lg shadow-primary/20"
              onClick={handleOpenAdd}
              data-testid="button-add-product"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 pb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search products..." 
                className="pl-9 bg-slate-50 border-slate-200" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px]">Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product: any) => (
                    <TableRow key={product.id} className="hover:bg-slate-50/50" data-testid={`row-product-${product.id}`}>
                      <TableCell>
                        <img src={product.image || 'https://via.placeholder.com/40'} alt={product.name} className="h-10 w-10 rounded-lg object-cover bg-slate-100" />
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal rounded-md">{product.category}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(parseFloat(product.price), currency)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{product.stock}</span>
                          {product.stock < 20 && <div className="h-2 w-2 rounded-full bg-red-500" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-menu-${product.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(product)} data-testid={`button-edit-${product.id}`}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleDelete(product.id)}
                              data-testid={`button-delete-${product.id}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Product Dialog */}
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information.' : 'Create a new item in your inventory.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-primary hover:text-primary transition-colors bg-slate-50">
                   <PackageOpen className="h-6 w-6 mb-1" />
                   <span className="text-xs">Upload</span>
                </div>
                <div className="flex-1 space-y-2">
                   <Label>Product Name *</Label>
                   <Input 
                     placeholder="e.g. Caramel Macchiato" 
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     data-testid="input-product-name"
                   />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Category *</Label>
                   <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-slate-500">
                            No categories yet. Add one first.
                          </div>
                        ) : (
                          categories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label>Price *</Label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                     <Input 
                       className="pl-7" 
                       placeholder="0.00" 
                       type="number" 
                       step="0.01"
                       value={formData.price}
                       onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                       data-testid="input-price"
                     />
                   </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Stock Quantity *</Label>
                   <Input 
                     type="number" 
                     placeholder="0"
                     value={formData.stock}
                     onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                     data-testid="input-stock"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Image URL (Optional)</Label>
                   <Input 
                     placeholder="https://..." 
                     value={formData.image}
                     onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                     data-testid="input-image"
                   />
                 </div>
              </div>
            </div>

            <DialogFooter>
               <Button variant="outline" onClick={() => setIsAddProductOpen(false)} className="rounded-xl">Cancel</Button>
               <Button 
                 onClick={handleSaveProduct} 
                 className="rounded-xl font-bold shadow-lg shadow-primary/20"
                 disabled={createMutation.isPending || updateMutation.isPending}
                 data-testid="button-save-product"
               >
                 {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Product'}
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Management Dialog */}
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Manage Categories</DialogTitle>
              <DialogDescription>
                Add or remove product categories.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  data-testid="input-new-category"
                />
                <Button 
                  onClick={handleAddCategory}
                  disabled={createCategoryMutation.isPending}
                  data-testid="button-save-category"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No categories yet. Add your first category above.
                  </p>
                ) : (
                  categories.map((cat: any) => (
                    <div 
                      key={cat.id} 
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      data-testid={`category-${cat.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        disabled={deleteCategoryMutation.isPending}
                        data-testid={`button-delete-category-${cat.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)} className="rounded-xl">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, Wallet, ShoppingCart, Lock, Loader2 } from 'lucide-react';
import { productsApi, transactionsApi, categoriesApi } from '@/lib/api';
import { useCart, type CartProduct } from '@/hooks/use-cart';
import { useShift } from '@/hooks/use-shift';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import MainLayout from '@/components/layout/MainLayout';
import { Label } from '@/components/ui/label';
import ReceiptModal from '@/components/ReceiptModal';
import { useI18n } from '@/lib/i18n';
import { useSettings, formatCurrency } from '@/lib/settings';

export default function PosPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [startCashInput, setStartCashInput] = useState('');
  const [endCashInput, setEndCashInput] = useState('');
  const [amountPaidInput, setAmountPaidInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris' | 'ewallet'>('cash');
  const { items, addToCart, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { isShiftOpen, shiftId, openShift, closeShift, checkShift, startTime, startCash, totalSales, transactionCount, loading: shiftLoading } = useShift();
  const { toast } = useToast();
  const { t } = useI18n();
  const { currency, taxEnabled, taxRate } = useSettings();

  // Fetch products from API
  const { data: apiProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  // Fetch categories from API
  const { data: apiCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  // Build categories list with "All" at the start
  const categoryNames = useMemo(() => {
    return ['All', ...apiCategories.map((c: any) => c.name)];
  }, [apiCategories]);

  // Convert API products to cart-compatible format
  const products: CartProduct[] = useMemo(() => {
    return apiProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: parseFloat(p.price),
      stock: p.stock,
      image: p.image,
    }));
  }, [apiProducts]);

  // Check for active shift on load
  useEffect(() => {
    checkShift();
  }, []);


  const handleOpenShift = async () => {
    const cash = parseFloat(startCashInput);
    if (isNaN(cash) || cash < 0) {
      toast({ title: t('pos.invalid_amount'), description: t('pos.enter_valid_cash'), variant: "destructive" });
      return;
    }
    try {
      await openShift(cash);
      setIsShiftModalOpen(false);
      toast({ title: t('pos.shift_opened'), description: `${t('pos.shift_started')} ${formatCurrency(cash, currency)}` });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    }
  };

  const handleCloseShift = async () => {
    const cash = parseFloat(endCashInput);
    if (isNaN(cash) || cash < 0) {
      toast({ title: t('pos.invalid_amount'), description: t('pos.enter_valid_cash'), variant: "destructive" });
      return;
    }
    try {
      await closeShift(cash);
      setIsCloseShiftModalOpen(false);
      setEndCashInput('');
      toast({ title: 'Shift Ditutup', description: 'Shift kasir berhasil ditutup' });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const handleProcessPayment = async () => {
    if (!shiftId) {
      toast({ title: t('common.error'), description: t('pos.no_active_shift'), variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    const subtotal = total();
    const tax = taxEnabled ? subtotal * (taxRate / 100) : 0;
    const totalAmount = subtotal + tax;

    try {
      const transactionData = {
        transaction: {
          shiftId,
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: totalAmount.toFixed(2),
          paymentMethod,
        },
        items: items.map((item) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price.toFixed(2),
          total: (item.price * item.quantity).toFixed(2),
        })),
      };

      const result = await transactionsApi.create(transactionData);

      const amountPaid = paymentMethod === 'cash' ? parseFloat(amountPaidInput) : totalAmount;
      const change = paymentMethod === 'cash' ? Math.max(0, amountPaid - totalAmount) : 0;
      
      setReceiptData({
        transactionId: result.id,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        tax,
        total: totalAmount,
        paymentMethod,
        amountPaid,
        change,
        date: new Date(),
      });
      
      setAmountPaidInput('');
      
      setIsPaymentOpen(false);
      setReceiptOpen(true);
      clearCart();
      checkShift();
    } catch (error: any) {
      toast({ title: t('pos.transaction_failed'), description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const PaymentMethodCard = ({ id, label, icon: Icon }: { id: any, label: string, icon: any }) => (
    <div 
      onClick={() => setPaymentMethod(id)}
      className={`
        cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center gap-3 transition-all
        ${paymentMethod === id 
          ? 'border-primary bg-primary/5 text-primary shadow-sm' 
          : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200'}
      `}
    >
      <Icon className="h-8 w-8" />
      <span className="font-medium text-sm">{label}</span>
    </div>
  );

  if (productsLoading || shiftLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-theme(spacing.16))] md:h-screen overflow-hidden">
        
        {/* LEFT: Product Grid */}
        <div className="flex-1 flex flex-col bg-slate-50/50 p-4 md:p-6 overflow-hidden relative">
          
          {/* Shift Status Header */}
          <div className="absolute top-4 right-4 z-10 hidden md:flex items-center gap-2">
            {isShiftOpen ? (
              <>
                <Badge variant="outline" className="bg-white/80 backdrop-blur border-emerald-200 text-emerald-700 shadow-sm gap-2 py-1.5 px-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t('pos.shift_open')} {startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/80 backdrop-blur border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setIsCloseShiftModalOpen(true)}
                  data-testid="button-close-shift"
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Tutup Kasir
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                className="bg-white/80 backdrop-blur border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={() => setIsShiftModalOpen(true)}
                data-testid="button-open-shift"
              >
                <Lock className="h-4 w-4 mr-2" />
                Buka Kasir
              </Button>
            )}
          </div>

          {/* Header & Filter */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
               <Search className="h-5 w-5 text-slate-400 ml-2" />
               <Input 
                 placeholder="Search products..." 
                 className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-10 text-base"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            
            <ScrollArea className="w-full whitespace-nowrap pb-2">
              <div className="flex gap-2">
                {categoryNames.map((cat) => (
                  <Button
                    key={cat}
                    variant={activeCategory === cat ? 'default' : 'outline'}
                    className={`rounded-full px-6 transition-all ${activeCategory === cat ? 'shadow-md scale-105' : 'border-slate-200 text-slate-600'}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat === 'All' ? t('pos.all') : cat}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Grid */}
          <ScrollArea className="flex-1 pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20 md:pb-0">
              {filteredProducts.map((product) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="group bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative">
                     <img 
                       src={product.image || 'https://via.placeholder.com/200'} 
                       alt={product.name} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                     />
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                     {product.stock < 10 && (
                       <Badge variant="destructive" className="absolute top-2 right-2 shadow-sm">Low Stock</Badge>
                     )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 line-clamp-1 text-sm md:text-base">{product.name}</h3>
                    <p className="text-primary font-bold text-base md:text-lg">${product.price.toFixed(2)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* RIGHT: Cart Sidebar */}
        <div className="w-96 bg-white border-l border-slate-200 shadow-2xl z-10 flex flex-col hidden md:flex">
          <div className="p-6 border-b border-slate-100 bg-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="text-primary" />
              Current Order
            </h2>
            <p className="text-slate-500 text-sm mt-1">Transaction ID: #TRX-8821</p>
          </div>

          <ScrollArea className="flex-1 p-4">
             {items.length === 0 ? (
               <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
                 <div className="bg-slate-50 p-6 rounded-full">
                   <ShoppingCart size={48} className="opacity-20" />
                 </div>
                 <p>Cart is empty</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {items.map((item) => (
                   <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                     <img src={item.image || 'https://via.placeholder.com/64'} className="h-16 w-16 rounded-lg object-cover bg-white" alt={item.name} />
                     <div className="flex-1 flex flex-col justify-between">
                       <div className="flex justify-between items-start">
                         <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                         <p className="font-bold text-slate-700">${(item.price * item.quantity).toFixed(2)}</p>
                       </div>
                       <div className="flex items-center justify-between mt-2">
                         <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                           <button 
                             onClick={() => updateQuantity(item.id, item.quantity - 1)}
                             className="h-6 w-6 flex items-center justify-center hover:bg-slate-100 rounded"
                           >
                             <Minus size={14} />
                           </button>
                           <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                           <button 
                             onClick={() => updateQuantity(item.id, item.quantity + 1)}
                             className="h-6 w-6 flex items-center justify-center hover:bg-slate-100 rounded"
                           >
                             <Plus size={14} />
                           </button>
                         </div>
                         <button 
                           onClick={() => removeFromCart(item.id)}
                           className="text-red-400 hover:text-red-600 transition-colors p-1"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </ScrollArea>

          <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
             <div className="space-y-2 text-sm">
               <div className="flex justify-between text-slate-600">
                 <span>Subtotal</span>
                 <span>{formatCurrency(total(), currency)}</span>
               </div>
               {taxEnabled && (
                 <div className="flex justify-between text-slate-600">
                   <span>Pajak ({taxRate}%)</span>
                   <span>{formatCurrency(total() * (taxRate / 100), currency)}</span>
                 </div>
               )}
               <Separator />
               <div className="flex justify-between text-xl font-bold text-slate-800 pt-2">
                 <span>Total</span>
                 <span>{formatCurrency(taxEnabled ? total() * (1 + taxRate / 100) : total(), currency)}</span>
               </div>
             </div>
             
             {!isShiftOpen ? (
               <Button 
                 className="w-full h-14 text-lg font-bold rounded-xl bg-amber-500 hover:bg-amber-600" 
                 size="lg"
                 onClick={() => setIsShiftModalOpen(true)}
               >
                 <Lock className="h-5 w-5 mr-2" />
                 Buka Kasir Dulu
               </Button>
             ) : (
               <Button 
                 className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/25 rounded-xl" 
                 size="lg"
                 disabled={items.length === 0}
                 onClick={() => setIsPaymentOpen(true)}
               >
                 Process Payment
               </Button>
             )}
          </div>
        </div>

        {/* Mobile Cart Floating Action */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
           <Sheet>
             <SheetTrigger asChild>
               <Button className="h-16 w-16 rounded-full shadow-2xl relative" size="icon">
                  <ShoppingCart className="h-6 w-6" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-white">
                      {items.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
               </Button>
             </SheetTrigger>
             <SheetContent side="bottom" className="h-[80vh] rounded-t-[2rem] p-0 flex flex-col">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold">Current Order</h2>
                </div>
                {/* Re-use same cart content logic here or extract to component */}
                <ScrollArea className="flex-1 p-4">
                  {/* ... Cart items list ... (Simplified for brevity in mobile view but essentially same as desktop) */}
                  {items.map((item) => (
                   <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3">
                     <img src={item.image || 'https://via.placeholder.com/64'} className="h-16 w-16 rounded-lg object-cover bg-white" alt={item.name} />
                     <div className="flex-1 flex flex-col justify-between">
                       <div className="flex justify-between items-start">
                         <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                         <p className="font-bold text-slate-700">${(item.price * item.quantity).toFixed(2)}</p>
                       </div>
                        <div className="flex items-center justify-between mt-2">
                         <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                           <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-6 w-6 flex items-center justify-center"><Minus size={14} /></button>
                           <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-6 w-6 flex items-center justify-center"><Plus size={14} /></button>
                         </div>
                         <button onClick={() => removeFromCart(item.id)} className="text-red-400 p-1"><Trash2 size={16} /></button>
                       </div>
                     </div>
                   </div>
                  ))}
                </ScrollArea>
                <div className="p-6 bg-slate-50 border-t space-y-4">
                   <div className="flex justify-between text-xl font-bold">
                     <span>Total</span>
                     <span>{formatCurrency(taxEnabled ? total() * (1 + taxRate / 100) : total(), currency)}</span>
                   </div>
                   {!isShiftOpen ? (
                     <Button 
                       className="w-full h-14 text-lg font-bold rounded-xl bg-amber-500 hover:bg-amber-600" 
                       onClick={() => setIsShiftModalOpen(true)}
                     >
                       <Lock className="h-5 w-5 mr-2" />
                       Buka Kasir Dulu
                     </Button>
                   ) : (
                     <Button className="w-full h-14 text-lg font-bold rounded-xl" onClick={() => setIsPaymentOpen(true)}>
                       Checkout
                     </Button>
                   )}
                </div>
             </SheetContent>
           </Sheet>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={(open) => {
        setIsPaymentOpen(open);
        if (!open) setAmountPaidInput('');
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Metode Pembayaran</DialogTitle>
            <DialogDescription className="text-center text-lg text-primary font-bold">
              Total: {formatCurrency(taxEnabled ? total() * (1 + taxRate / 100) : total(), currency)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
             <PaymentMethodCard id="cash" label={t('pos.cash')} icon={Banknote} />
             <PaymentMethodCard id="card" label={t('pos.card')} icon={CreditCard} />
             <PaymentMethodCard id="qris" label={t('pos.qris')} icon={QrCode} />
             <PaymentMethodCard id="ewallet" label={t('pos.ewallet')} icon={Wallet} />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
             {paymentMethod === 'cash' && (
               <>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-500">Jumlah Bayar</label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                       {currency === 'idr' ? 'Rp' : '$'}
                     </span>
                     <Input 
                       type="number" 
                       placeholder="0" 
                       className="pl-10 text-right text-lg font-bold h-12" 
                       value={amountPaidInput}
                       onChange={(e) => setAmountPaidInput(e.target.value)}
                       data-testid="input-amount-paid"
                     />
                   </div>
                 </div>
                 {parseFloat(amountPaidInput) > 0 && (
                   <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                     <span className="text-slate-600 font-medium">Kembalian</span>
                     <span className={`text-xl font-bold ${parseFloat(amountPaidInput) >= (taxEnabled ? total() * (1 + taxRate / 100) : total()) ? 'text-green-600' : 'text-red-500'}`}>
                       {formatCurrency(Math.max(0, parseFloat(amountPaidInput) - (taxEnabled ? total() * (1 + taxRate / 100) : total())), currency)}
                     </span>
                   </div>
                 )}
                 {parseFloat(amountPaidInput) > 0 && parseFloat(amountPaidInput) < (taxEnabled ? total() * (1 + taxRate / 100) : total()) && (
                   <p className="text-red-500 text-sm text-center">Jumlah bayar kurang dari total</p>
                 )}
               </>
             )}
             <div className="flex justify-between text-sm text-slate-500">
               <span>{t('pos.transaction_id')}</span>
               <span className="font-mono">#{new Date().getTime().toString().slice(-8)}</span>
             </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setIsPaymentOpen(false)}>{t('pos.cancel')}</Button>
             <Button 
               className="h-12 flex-1 rounded-xl font-bold text-lg shadow-lg shadow-primary/20" 
               onClick={handleProcessPayment}
               disabled={isProcessing || (paymentMethod === 'cash' && (!amountPaidInput || parseFloat(amountPaidInput) < (taxEnabled ? total() * (1 + taxRate / 100) : total())))}
             >
               {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
               {isProcessing ? t('pos.processing') : t('pos.confirm_payment')}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Management Modal */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                 <Lock className="h-8 w-8" />
              </div>
              Open Cashier Shift
            </DialogTitle>
            <DialogDescription className="text-center">
              Please enter the starting cash amount to begin your shift.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Starting Cash</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <Input 
                  type="number" 
                  className="pl-8 h-12 text-lg font-medium" 
                  placeholder="0.00" 
                  value={startCashInput}
                  onChange={(e) => setStartCashInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-2 items-start">
               <div className="mt-0.5 min-w-4">•</div>
               <p>{t('pos.count_cash')}</p>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg font-bold rounded-xl" 
            onClick={handleOpenShift}
          >
            {t('pos.start_shift')}
          </Button>
        </DialogContent>
      </Dialog>

      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        onNewSale={() => setReceiptOpen(false)}
        receipt={receiptData}
      />

      <Dialog open={isCloseShiftModalOpen} onOpenChange={setIsCloseShiftModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                 <Lock className="h-8 w-8" />
              </div>
              Tutup Shift Kasir
            </DialogTitle>
            <DialogDescription className="text-center">
              Masukkan jumlah uang tunai di kasir untuk menutup shift
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Waktu Mulai</span>
                <span className="font-medium">{startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Kas Awal</span>
                <span className="font-medium">{formatCurrency(startCash, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Penjualan</span>
                <span className="font-medium text-primary">{formatCurrency(totalSales, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Jumlah Transaksi</span>
                <span className="font-medium">{transactionCount}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Expected Cash</span>
                <span>{formatCurrency(startCash + totalSales, currency)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Kas Akhir (Hitung Uang di Laci)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                  {currency === 'idr' ? 'Rp' : '$'}
                </span>
                <Input 
                  type="number" 
                  className="pl-10 h-12 text-lg font-medium" 
                  placeholder="0" 
                  value={endCashInput}
                  onChange={(e) => setEndCashInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline"
              className="flex-1 h-12 rounded-xl" 
              onClick={() => setIsCloseShiftModalOpen(false)}
            >
              Batal
            </Button>
            <Button 
              className="flex-1 h-12 text-lg font-bold rounded-xl bg-red-600 hover:bg-red-700" 
              onClick={handleCloseShift}
            >
              Tutup Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
}

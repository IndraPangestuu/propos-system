import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { Receipt, Filter, Loader2, Eye, CreditCard, Banknote, QrCode, Wallet, Clock, ChevronRight, Download } from 'lucide-react';
import { Link } from 'wouter';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { transactionsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSettings, formatCurrency } from '@/lib/settings';

type FilterType = 'all' | 'today' | 'week' | 'month';

interface TransactionItem {
  id: string;
  productName: string;
  quantity: number;
  price: string;
  total: string;
}

export default function ReportsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  
  const { t } = useI18n();
  const { storeName, storeAddress, invoiceHeader, invoiceFooter, currency } = useSettings();

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    const escapeCSV = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };
    
    const headers = ['ID Transaksi', 'Tanggal', 'Waktu', 'Metode Pembayaran', 'Subtotal', 'Pajak', 'Total'];
    const rows = filteredTransactions.map((tx: any) => {
      const date = new Date(tx.createdAt);
      return [
        escapeCSV(tx.id.slice(-8).toUpperCase()),
        escapeCSV(date.toLocaleDateString('id-ID')),
        escapeCSV(date.toLocaleTimeString('id-ID')),
        escapeCSV(tx.paymentMethod),
        tx.subtotal,
        tx.tax,
        tx.total
      ].join(',');
    });
    
    const bom = '\uFEFF';
    const csv = bom + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-transaksi-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: () => transactionsApi.getAll(200),
  });

  const { data: txItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['transaction-items', selectedTx?.id],
    queryFn: () => transactionsApi.getItems(selectedTx.id),
    enabled: !!selectedTx?.id,
  });

  const filteredTransactions = transactions.filter((tx: any) => {
    const txDate = new Date(tx.createdAt);
    const now = new Date();
    
    switch (filter) {
      case 'today':
        return isAfter(txDate, startOfDay(now));
      case 'week':
        return isAfter(txDate, startOfWeek(now, { weekStartsOn: 1 }));
      case 'month':
        return isAfter(txDate, startOfMonth(now));
      default:
        return true;
    }
  });

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'qris': return <QrCode className="h-4 w-4" />;
      case 'ewallet': return <Wallet className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleViewReceipt = (tx: any) => {
    setSelectedTx(tx);
    setReceiptOpen(true);
  };

  if (isLoading) {
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
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('reports.title')}</h1>
            <p className="text-slate-500 mt-1">{filteredTransactions.length} {t('reports.count')}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredTransactions.length === 0}
              className="gap-2"
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {(['all', 'today', 'week', 'month'] as FilterType[]).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-md"
                    onClick={() => setFilter(f)}
                    data-testid={`filter-${f}`}
                  >
                    {t(`reports.${f}`)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Link href="/reports/shift">
          <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" data-testid="link-shift-report">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Laporan Per Shift</p>
                <p className="text-sm text-slate-500">Lihat detail penjualan dan ringkasan per shift kasir</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </div>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {t('reports.transactions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{t('reports.no_transactions')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {getPaymentIcon(tx.paymentMethod)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          #{tx.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="capitalize">
                        {tx.paymentMethod}
                      </Badge>
                      <p className="font-bold text-lg text-slate-800 min-w-[100px] text-right">
                        {formatCurrency(parseFloat(tx.total), currency)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewReceipt(tx)}
                        data-testid={`view-receipt-${tx.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t('reports.view_receipt')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">{t('receipt.title')}</DialogTitle>
          </DialogHeader>

          {selectedTx && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 font-mono text-sm">
              <div className="text-center space-y-1 mb-4">
                <h3 className="font-bold text-lg">{storeName}</h3>
                <p className="text-slate-500 text-xs">{storeAddress}</p>
                {invoiceHeader && <p className="text-slate-600 text-xs italic">{invoiceHeader}</p>}
              </div>

              <Separator className="my-3" />

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('receipt.date')}:</span>
                  <span>{format(new Date(selectedTx.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('pos.transaction_id')}:</span>
                  <span>#{selectedTx.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2">
                <p className="font-semibold text-xs text-slate-600">{t('receipt.items')}:</p>
                {itemsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  txItems.map((item: TransactionItem) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span>{item.quantity}x {item.productName}</span>
                      <span>{formatCurrency(parseFloat(item.total), currency)}</span>
                    </div>
                  ))
                )}
              </div>

              <Separator className="my-3" />

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{t('pos.subtotal')}</span>
                  <span>{formatCurrency(parseFloat(selectedTx.subtotal), currency)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{t('pos.tax')}</span>
                  <span>{formatCurrency(parseFloat(selectedTx.tax), currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2">
                  <span>{t('pos.total')}</span>
                  <span className="text-primary">{formatCurrency(parseFloat(selectedTx.total), currency)}</span>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="text-center text-xs">
                <p className="text-slate-500 capitalize">{t('receipt.payment')}: {selectedTx.paymentMethod}</p>
              </div>

              {invoiceFooter && (
                <>
                  <Separator className="my-3" />
                  <p className="text-center text-xs text-slate-500 italic">{invoiceFooter}</p>
                </>
              )}

              <div className="text-center mt-4">
                <p className="text-slate-600 text-xs">{t('receipt.thank_you')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

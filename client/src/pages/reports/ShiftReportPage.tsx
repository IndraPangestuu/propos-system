import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Receipt, Loader2, Clock, Banknote, CreditCard, QrCode, Wallet, ArrowLeft, TrendingUp, Hash } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { transactionsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useSettings, formatCurrency } from '@/lib/settings';
import { Link } from 'wouter';

interface Shift {
  id: string;
  startTime: string;
  endTime: string | null;
  startCash: string;
  endCash: string | null;
  totalSales: string;
  transactionCount: number;
  status: string;
}

export default function ShiftReportPage() {
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const { t } = useI18n();
  const { currency } = useSettings();

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const response = await fetch('/api/shifts', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch shifts');
      return response.json();
    },
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['shift-transactions', selectedShiftId],
    queryFn: () => transactionsApi.getByShift(selectedShiftId),
    enabled: !!selectedShiftId,
  });

  useEffect(() => {
    if (shifts.length > 0 && !selectedShiftId) {
      setSelectedShiftId(shifts[0].id);
    }
  }, [shifts, selectedShiftId]);

  const selectedShift = shifts.find((s: Shift) => s.id === selectedShiftId);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'qris': return <QrCode className="h-4 w-4" />;
      case 'ewallet': return <Wallet className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const paymentSummary = transactions.reduce((acc: any, tx: any) => {
    acc[tx.paymentMethod] = (acc[tx.paymentMethod] || 0) + parseFloat(tx.total);
    return acc;
  }, {});

  if (shiftsLoading) {
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
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan Per Shift</h1>
            <p className="text-slate-500 text-sm">Lihat detail penjualan per shift kasir</p>
          </div>
          <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
            <SelectTrigger className="w-[280px]" data-testid="select-shift">
              <SelectValue placeholder="Pilih Shift" />
            </SelectTrigger>
            <SelectContent>
              {shifts.map((shift: Shift) => (
                <SelectItem key={shift.id} value={shift.id}>
                  {format(new Date(shift.startTime), 'dd MMM yyyy HH:mm')} 
                  {shift.status === 'open' ? ' (Aktif)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedShift && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Durasi Shift</p>
                      <p className="font-bold text-lg">
                        {format(new Date(selectedShift.startTime), 'HH:mm')} - 
                        {selectedShift.endTime ? format(new Date(selectedShift.endTime), ' HH:mm') : ' Aktif'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-50 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total Penjualan</p>
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(parseFloat(selectedShift.totalSales || '0'), currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 rounded-xl">
                      <Hash className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Jumlah Transaksi</p>
                      <p className="font-bold text-lg">{selectedShift.transactionCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-50 rounded-xl">
                      <Banknote className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Kas Awal / Akhir</p>
                      <p className="font-bold text-lg">
                        {formatCurrency(parseFloat(selectedShift.startCash), currency)}
                        {selectedShift.endCash && ` / ${formatCurrency(parseFloat(selectedShift.endCash), currency)}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    Daftar Transaksi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {txLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Belum ada transaksi di shift ini</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {transactions.map((tx: any) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
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
                                  {format(new Date(tx.createdAt), 'HH:mm:ss')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-slate-800">
                                {formatCurrency(parseFloat(tx.total), currency)}
                              </p>
                              <Badge variant="outline" className="capitalize text-xs">
                                {tx.paymentMethod}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Ringkasan Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.keys(paymentSummary).length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Tidak ada data</p>
                  ) : (
                    <>
                      {paymentSummary.cash > 0 && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-green-600" />
                            <span>Tunai</span>
                          </div>
                          <span className="font-bold">{formatCurrency(paymentSummary.cash, currency)}</span>
                        </div>
                      )}
                      {paymentSummary.card > 0 && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <span>Kartu</span>
                          </div>
                          <span className="font-bold">{formatCurrency(paymentSummary.card, currency)}</span>
                        </div>
                      )}
                      {paymentSummary.qris > 0 && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <QrCode className="h-4 w-4 text-purple-600" />
                            <span>QRIS</span>
                          </div>
                          <span className="font-bold">{formatCurrency(paymentSummary.qris, currency)}</span>
                        </div>
                      )}
                      {paymentSummary.ewallet > 0 && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-orange-600" />
                            <span>E-Wallet</span>
                          </div>
                          <span className="font-bold">{formatCurrency(paymentSummary.ewallet, currency)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-primary text-lg">
                          {formatCurrency(parseFloat(selectedShift.totalSales || '0'), currency)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {shifts.length === 0 && (
          <Card className="border-none shadow-md">
            <CardContent className="py-12 text-center text-slate-400">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Belum ada data shift</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

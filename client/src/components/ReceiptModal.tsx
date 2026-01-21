import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, ShoppingBag } from 'lucide-react';
import { useSettings, formatCurrency } from '@/lib/settings';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/use-auth';

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptData {
  transactionId: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid?: number;
  change?: number;
  date: Date;
}

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  onNewSale: () => void;
  receipt: ReceiptData | null;
}

export default function ReceiptModal({ open, onClose, onNewSale, receipt }: ReceiptModalProps) {
  const { 
    storeName, storeAddress, storePhone, invoiceFooter, currency,
    paperType, showReceiptCode, showUnitBesideQty, showOrderNumber, showLogo, logoImage, logoWidth, autoPrint 
  } = useSettings();
  const { t } = useI18n();
  const { user } = useAuth();
  const hasPrintedRef = useRef(false);

  useEffect(() => {
    if (open && receipt && autoPrint && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      setTimeout(() => {
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        if (printWindow) {
          const receiptContent = document.getElementById('thermal-receipt')?.innerHTML;
          if (receiptContent) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Receipt</title>
                  <style>
                    body { 
                      font-family: 'Courier New', monospace; 
                      font-size: 12px; 
                      margin: 0; 
                      padding: 10px;
                      width: ${paperType === 'thermal57' ? '48mm' : '72mm'};
                    }
                    .center { text-align: center; }
                    .line { border-top: 1px dashed #000; margin: 4px 0; }
                    .row { display: flex; justify-content: space-between; }
                  </style>
                </head>
                <body>${receiptContent}</body>
              </html>
            `);
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
          }
        }
      }, 500);
    }
    if (!open) {
      hasPrintedRef.current = false;
    }
  }, [open, receipt, autoPrint, paperType]);

  if (!receipt) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      const receiptContent = document.getElementById('thermal-receipt')?.innerHTML;
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                margin: 0; 
                padding: 10px;
                width: ${paperType === 'thermal57' ? '48mm' : '72mm'};
              }
              .center { text-align: center; }
              .line { border-top: 1px dashed #000; margin: 4px 0; }
              .row { display: flex; justify-content: space-between; }
              .item-name { margin-bottom: 2px; }
              .item-detail { padding-left: 8px; display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>${receiptContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const formatPrice = (price: number) => {
    if (currency === 'idr') {
      return price.toLocaleString('id-ID');
    }
    return formatCurrency(price, currency);
  };

  const dateStr = receipt.date.toISOString().slice(0, 10);
  const timeStr = receipt.date.toTimeString().slice(0, 8);
  const amountPaid = receipt.amountPaid || receipt.total;
  const change = receipt.change || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {t('receipt.title')}
          </DialogTitle>
        </DialogHeader>

        <div 
          id="thermal-receipt"
          className="bg-white border border-slate-200 rounded-xl p-4 font-mono text-xs mx-auto"
          style={{ 
            maxWidth: paperType === 'thermal57' ? '220px' : '280px',
            fontSize: '11px',
            lineHeight: '1.4'
          }}
        >
          {showLogo && logoImage && (
            <div className="flex justify-center mb-2">
              <img 
                src={logoImage} 
                alt="Logo" 
                style={{ width: `${logoWidth}px`, maxWidth: '100%' }}
              />
            </div>
          )}
          <div className="text-center space-y-0.5 mb-2">
            <div className="font-bold">{storeName.toLowerCase()}</div>
            <div>{storeAddress.toLowerCase()}</div>
            {storePhone && <div>{storePhone}</div>}
          </div>

          <div className="border-t border-dashed border-slate-400 my-2"></div>

          <div className="flex justify-between">
            <span>{dateStr}</span>
            <span>{user?.name || 'Kasir 1'}</span>
          </div>
          <div>{timeStr}</div>

          <div className="border-t border-dashed border-slate-400 my-2"></div>

          {showOrderNumber && (
            <div className="text-center font-bold mb-2">No. Urut: {receipt.transactionId.slice(-3)}</div>
          )}

          {receipt.items.map((item, idx) => (
            <div key={idx} className="mb-1">
              <div>{item.name}</div>
              <div className="flex justify-between pl-2">
                <span>
                  {showUnitBesideQty 
                    ? `${item.quantity} pcs x ${formatPrice(item.price)}` 
                    : `${item.quantity} x ${formatPrice(item.price)}`
                  }
                </span>
                <span>{formatPrice(item.quantity * item.price)}</span>
              </div>
            </div>
          ))}

          <div className="border-t border-dashed border-slate-400 my-2"></div>

          {receipt.tax > 0 && (
            <>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(receipt.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak</span>
                <span>{formatPrice(receipt.tax)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(receipt.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Bayar</span>
            <span>{formatPrice(amountPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kembali</span>
            <span>{formatPrice(change)}</span>
          </div>

          {showReceiptCode && (
            <>
              <div className="border-t border-dashed border-slate-400 my-2"></div>
              <div className="text-center">TRX-{receipt.transactionId.slice(-8).toUpperCase()}</div>
            </>
          )}

          {invoiceFooter && (
            <>
              <div className="border-t border-dashed border-slate-400 my-2"></div>
              <div className="text-center">{invoiceFooter}</div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-2">
          <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('receipt.print')}
          </Button>
          <Button className="flex-1 rounded-xl h-11 font-semibold" onClick={onNewSale}>
            {t('receipt.new_sale')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

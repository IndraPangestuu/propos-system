import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  currency: string;
  invoiceHeader: string;
  invoiceFooter: string;
  paperType: string;
  showLogo: boolean;
  logoImage: string | null;
  logoWidth: number;
  autoPrint: boolean;
  showReceiptCode: boolean;
  showOrderNumber: boolean;
  showUnitBesideQty: boolean;
  taxEnabled: boolean;
  taxRate: number;
  setStoreName: (name: string) => void;
  setStoreAddress: (address: string) => void;
  setStorePhone: (phone: string) => void;
  setCurrency: (currency: string) => void;
  setInvoiceHeader: (header: string) => void;
  setInvoiceFooter: (footer: string) => void;
  setPaperType: (type: string) => void;
  setShowLogo: (show: boolean) => void;
  setLogoImage: (image: string | null) => void;
  setLogoWidth: (width: number) => void;
  setAutoPrint: (auto: boolean) => void;
  setShowReceiptCode: (show: boolean) => void;
  setShowOrderNumber: (show: boolean) => void;
  setShowUnitBesideQty: (show: boolean) => void;
  setTaxEnabled: (enabled: boolean) => void;
  setTaxRate: (rate: number) => void;
  saveSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      storeName: 'ProPOS Coffee Shop',
      storeAddress: 'Jl. Kopi No. 123, Jakarta',
      storePhone: '0812345678',
      currency: 'idr',
      invoiceHeader: '',
      invoiceFooter: 'Terima kasih atas kunjungan Anda',
      paperType: 'thermal57',
      showLogo: false,
      logoImage: null,
      logoWidth: 120,
      autoPrint: true,
      showReceiptCode: true,
      showOrderNumber: false,
      showUnitBesideQty: false,
      taxEnabled: true,
      taxRate: 10,
      setStoreName: (name) => set({ storeName: name }),
      setStoreAddress: (address) => set({ storeAddress: address }),
      setStorePhone: (phone) => set({ storePhone: phone }),
      setCurrency: (currency) => set({ currency }),
      setInvoiceHeader: (header) => set({ invoiceHeader: header }),
      setInvoiceFooter: (footer) => set({ invoiceFooter: footer }),
      setPaperType: (type) => set({ paperType: type }),
      setShowLogo: (show) => set({ showLogo: show }),
      setLogoImage: (image) => set({ logoImage: image }),
      setLogoWidth: (width) => set({ logoWidth: width }),
      setAutoPrint: (auto) => set({ autoPrint: auto }),
      setShowReceiptCode: (show) => set({ showReceiptCode: show }),
      setShowOrderNumber: (show) => set({ showOrderNumber: show }),
      setShowUnitBesideQty: (show) => set({ showUnitBesideQty: show }),
      setTaxEnabled: (enabled) => set({ taxEnabled: enabled }),
      setTaxRate: (rate) => set({ taxRate: rate }),
      saveSettings: (settings) => set(settings),
    }),
    {
      name: 'propos-settings',
    }
  )
);

export const formatCurrency = (amount: number, currency: string = 'usd'): string => {
  const symbols: Record<string, string> = {
    usd: '$',
    idr: 'Rp',
    eur: '€',
  };
  const symbol = symbols[currency] || '$';
  
  if (currency === 'idr') {
    return `${symbol}${amount.toLocaleString('id-ID')}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
};

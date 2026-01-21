import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import { Link } from 'wouter';
import { Printer, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const { language, setLanguage, t } = useI18n();
  const { 
    storeName, storeAddress, currency, invoiceHeader, invoiceFooter,
    taxEnabled, taxRate,
    setStoreName, setStoreAddress, setCurrency, setInvoiceHeader, setInvoiceFooter,
    setTaxEnabled, setTaxRate
  } = useSettings();

  const [formData, setFormData] = useState({
    storeName,
    storeAddress,
    currency,
    invoiceHeader,
    invoiceFooter,
    taxEnabled,
    taxRate,
  });

  const handleSave = () => {
    setStoreName(formData.storeName);
    setStoreAddress(formData.storeAddress);
    setCurrency(formData.currency);
    setInvoiceHeader(formData.invoiceHeader);
    setInvoiceFooter(formData.invoiceFooter);
    setTaxEnabled(formData.taxEnabled);
    setTaxRate(formData.taxRate);
    toast({ title: t('common.success'), description: t('common.settings_saved') });
  };

  return (
    <MainLayout>
       <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('settings.title')}</h1>
          <p className="text-slate-500 mt-1">{t('common.configure')}</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.general')}</CardTitle>
              <CardDescription>{t('settings.general_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('settings.store_name')}</Label>
                  <Input 
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    data-testid="input-store-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.currency')}</Label>
                  <Select 
                    value={formData.currency}
                    onValueChange={(val) => setFormData({ ...formData, currency: val })}
                  >
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue placeholder={t('settings.select_currency')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">{t('settings.currency_usd')}</SelectItem>
                      <SelectItem value="idr">{t('settings.currency_idr')}</SelectItem>
                      <SelectItem value="eur">{t('settings.currency_eur')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                 <Label>{t('settings.address')}</Label>
                 <Input 
                   value={formData.storeAddress}
                   onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                   data-testid="input-store-address"
                 />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pajak</CardTitle>
              <CardDescription>Konfigurasi pengaturan pajak untuk transaksi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Aktifkan Pajak</Label>
                  <p className="text-sm text-muted-foreground">Terapkan pajak pada setiap transaksi</p>
                </div>
                <Switch 
                  checked={formData.taxEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, taxEnabled: checked })}
                  data-testid="switch-tax-enabled" 
                />
              </div>
              {formData.taxEnabled && (
                <div className="space-y-2">
                  <Label>Persentase Pajak (%)</Label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    data-testid="input-tax-rate"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearance')}</CardTitle>
              <CardDescription>{t('settings.appearance_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                   <Label>{t('settings.dark_mode')}</Label>
                   <p className="text-sm text-muted-foreground">{t('settings.dark_mode_desc')}</p>
                 </div>
                 <Switch data-testid="switch-dark-mode" />
               </div>
               
               <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                   <Label>{t('settings.language')}</Label>
                   <p className="text-sm text-muted-foreground">{t('settings.language_desc')}</p>
                 </div>
                 <Select 
                   value={language}
                   onValueChange={(val: 'en' | 'id') => setLanguage(val)}
                 >
                    <SelectTrigger className="w-[180px]" data-testid="select-language">
                      <SelectValue placeholder={t('settings.select_language')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t('settings.lang_english')}</SelectItem>
                      <SelectItem value="id">{t('settings.lang_indonesian')}</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.invoice')}</CardTitle>
              <CardDescription>{t('settings.invoice_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/settings/receipt">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer" data-testid="link-receipt-settings">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Printer className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Pengaturan Printer Dan Struk</p>
                      <p className="text-sm text-slate-500">Konfigurasi format struk dan printer thermal</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </Link>
            </CardContent>
          </Card>

           <div className="flex justify-end gap-4">
             <Button variant="outline" className="rounded-xl" data-testid="button-cancel">{t('settings.cancel')}</Button>
             <Button 
               className="rounded-xl shadow-lg shadow-primary/20" 
               onClick={handleSave}
               data-testid="button-save"
             >
               {t('settings.save')}
             </Button>
           </div>
        </div>
       </div>
    </MainLayout>
  );
}

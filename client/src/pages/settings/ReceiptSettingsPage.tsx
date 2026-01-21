import { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
import { useSettings, formatCurrency } from '@/lib/settings';
import { ArrowLeft, Printer, Upload, X, Image } from 'lucide-react';
import { Link } from 'wouter';

export default function ReceiptSettingsPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const settings = useSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    paperType: settings.paperType,
    showLogo: settings.showLogo,
    logoImage: settings.logoImage,
    logoWidth: settings.logoWidth,
    autoPrint: settings.autoPrint,
    showReceiptCode: settings.showReceiptCode,
    showOrderNumber: settings.showOrderNumber,
    showUnitBesideQty: settings.showUnitBesideQty,
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        toast({ title: 'Error', description: 'Ukuran file maksimal 500KB', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData({ ...formData, logoImage: base64, showLogo: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoImage: null, showLogo: false });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    settings.setPaperType(formData.paperType);
    settings.setShowLogo(formData.showLogo);
    settings.setLogoImage(formData.logoImage);
    settings.setLogoWidth(formData.logoWidth);
    settings.setAutoPrint(formData.autoPrint);
    settings.setShowReceiptCode(formData.showReceiptCode);
    settings.setShowOrderNumber(formData.showOrderNumber);
    settings.setShowUnitBesideQty(formData.showUnitBesideQty);
    toast({ title: t('common.success'), description: t('common.settings_saved') });
  };

  const handleTestPrint = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      const receiptContent = document.getElementById('thermal-receipt-preview')?.innerHTML;
      printWindow.document.write(`
        <html>
          <head>
            <title>Test Print</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                margin: 0; 
                padding: 10px;
                width: ${formData.paperType === 'thermal57' ? '48mm' : '72mm'};
              }
              .center { text-align: center; }
              .right { text-align: right; }
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
  };

  const charWidth = formData.paperType === 'thermal57' ? 32 : 42;

  const sampleItems = [
    { name: 'Jus Apel', qty: 1, price: 3000 },
    { name: 'Jus Mangga', qty: 1, price: 3000 },
  ];

  const total = sampleItems.reduce((sum, item) => sum + (item.qty * item.price), 0);

  const formatPrice = (price: number) => {
    return price.toLocaleString('id-ID');
  };

  const centerText = (text: string, width: number) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8);

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Printer Dan Struk</h1>
            <p className="text-slate-500 text-sm">Konfigurasi format struk dan printer thermal</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Pengaturan Struk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="font-normal">Tampilkan Logo</Label>
                <Switch
                  checked={formData.showLogo}
                  onCheckedChange={(checked) => setFormData({ ...formData, showLogo: checked })}
                  data-testid="switch-show-logo"
                />
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                <Label className="font-medium">Logo Toko</Label>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  className="hidden"
                  data-testid="input-logo-file"
                />
                
                {formData.logoImage ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 bg-white border rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                          src={formData.logoImage} 
                          alt="Logo" 
                          className="max-w-full max-h-full object-contain"
                          style={{ width: `${formData.logoWidth}%` }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-600 mb-2">Logo berhasil diunggah</p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            data-testid="button-change-logo"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Ganti
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleRemoveLogo}
                            className="text-red-600 hover:text-red-700"
                            data-testid="button-remove-logo"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Ukuran Logo</span>
                        <span>{formData.logoWidth}%</span>
                      </div>
                      <Slider
                        value={[formData.logoWidth]}
                        onValueChange={([val]) => setFormData({ ...formData, logoWidth: val })}
                        min={50}
                        max={150}
                        step={10}
                        data-testid="slider-logo-width"
                      />
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full h-24 border-dashed flex flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-logo"
                  >
                    <Image className="h-8 w-8 text-slate-400" />
                    <span className="text-sm text-slate-500">Klik untuk upload logo</span>
                    <span className="text-xs text-slate-400">Max 500KB (PNG, JPG)</span>
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Jenis Kertas</Label>
                <Select
                  value={formData.paperType}
                  onValueChange={(val) => setFormData({ ...formData, paperType: val })}
                >
                  <SelectTrigger className="border-primary" data-testid="select-paper-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal57">Kertas Thermal 57</SelectItem>
                    <SelectItem value="thermal80">Kertas Thermal 80</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="font-normal">Cetak Struk Otomatis</Label>
                <Switch
                  checked={formData.autoPrint}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoPrint: checked })}
                  data-testid="switch-auto-print"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="font-normal">Tampilkan Kode Struk</Label>
                <Switch
                  checked={formData.showReceiptCode}
                  onCheckedChange={(checked) => setFormData({ ...formData, showReceiptCode: checked })}
                  data-testid="switch-show-code"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="font-normal">Tampilkan No Urut</Label>
                <Switch
                  checked={formData.showOrderNumber}
                  onCheckedChange={(checked) => setFormData({ ...formData, showOrderNumber: checked })}
                  data-testid="switch-show-order"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="font-normal">Tampilkan Satuan Sebelah Qty</Label>
                <Switch
                  checked={formData.showUnitBesideQty}
                  onCheckedChange={(checked) => setFormData({ ...formData, showUnitBesideQty: checked })}
                  data-testid="switch-show-unit"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Preview Struk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-xs text-slate-500 mb-2">{charWidth} Karakter</div>
              <div 
                id="thermal-receipt-preview"
                className="bg-white border border-slate-200 rounded-lg p-4 font-mono text-xs mx-auto"
                style={{ 
                  maxWidth: formData.paperType === 'thermal57' ? '220px' : '280px',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}
              >
                {formData.showLogo && formData.logoImage && (
                  <div className="flex justify-center mb-2">
                    <img 
                      src={formData.logoImage} 
                      alt="Logo" 
                      style={{ width: `${formData.logoWidth}px`, maxWidth: '100%' }}
                    />
                  </div>
                )}
                <div className="text-center space-y-0.5 mb-2">
                  <div className="font-bold">{settings.storeName.toLowerCase()}</div>
                  <div>{settings.storeAddress.toLowerCase()}</div>
                  <div>{settings.storePhone}</div>
                </div>

                <div className="border-t border-dashed border-slate-400 my-2"></div>

                <div className="flex justify-between">
                  <span>{dateStr}</span>
                  <span>Kasir 1</span>
                </div>
                <div>{timeStr}</div>

                <div className="border-t border-dashed border-slate-400 my-2"></div>

                {formData.showOrderNumber && (
                  <div className="text-center font-bold mb-2">No. Urut: 001</div>
                )}

                {sampleItems.map((item, idx) => (
                  <div key={idx}>
                    <div>{item.name}</div>
                    <div className="flex justify-between pl-2">
                      <span>{formData.showUnitBesideQty ? `${item.qty} pcs x ${formatPrice(item.price)}` : `${item.qty} x ${formatPrice(item.price)}`}</span>
                      <span>{formatPrice(item.qty * item.price)}</span>
                    </div>
                  </div>
                ))}

                <div className="border-t border-dashed border-slate-400 my-2"></div>

                <div className="flex justify-between">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembali</span>
                  <span>0</span>
                </div>

                {formData.showReceiptCode && (
                  <>
                    <div className="border-t border-dashed border-slate-400 my-2"></div>
                    <div className="text-center text-xs">TRX-{dateStr.replace(/-/g, '')}-001</div>
                  </>
                )}

                {settings.invoiceFooter && (
                  <>
                    <div className="border-t border-dashed border-slate-400 my-2"></div>
                    <div className="text-center text-xs">{settings.invoiceFooter}</div>
                  </>
                )}
              </div>

              <p className="text-xs text-slate-500 text-center mt-4 px-4">
                Struk di atas hanya sebagai contoh untuk mengganti nama &amp; alamat toko dapat dilakukan di pengaturan Toko
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button 
            variant="outline" 
            className="rounded-xl px-8" 
            onClick={handleTestPrint}
            data-testid="button-test-print"
          >
            <Printer className="h-4 w-4 mr-2" />
            Test Print
          </Button>
          <Button 
            className="rounded-xl shadow-lg shadow-primary/20 px-8" 
            onClick={handleSave}
            data-testid="button-save"
          >
            Simpan
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

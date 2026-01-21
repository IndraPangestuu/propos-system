import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";

import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import PosPage from "@/pages/pos/PosPage";
import ProductsPage from "@/pages/products/ProductsPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import ShiftReportPage from "@/pages/reports/ShiftReportPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import ReceiptSettingsPage from "@/pages/settings/ReceiptSettingsPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={LoginPage} />
      <Route path="/" component={DashboardPage} />
      <Route path="/pos" component={PosPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/reports/shift" component={ShiftReportPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/settings/receipt" component={ReceiptSettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

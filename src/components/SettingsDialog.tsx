
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Moon, Sun, DollarSign } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency, Currency } from '@/contexts/CurrencyContext';

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, availableCurrencies } = useCurrency();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your application preferences
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                Dark Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark themes
              </p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Currency
            </Label>
            <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

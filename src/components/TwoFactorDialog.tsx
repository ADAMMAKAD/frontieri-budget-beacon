
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Shield, Key } from 'lucide-react';

export function TwoFactorDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const data = await apiClient.request('/auth/2fa/setup', {
        method: 'POST'
      });

      setQrCode(data.qr_code);
      setSecret(data.secret);
      setStep('verify');
      
      toast({
        title: "Setup Started",
        description: "Scan the QR code with your authenticator app"
      });
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to setup 2FA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await apiClient.request('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({
          secret: secret,
          code: verificationCode
        })
      });

      toast({
        title: "Success",
        description: "Two-factor authentication enabled successfully"
      });

      setOpen(false);
      setStep('setup');
      setVerificationCode('');
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      toast({
        title: "Error",
        description: error.message || "Invalid verification code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Enable 2FA
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Two-Factor Authentication</span>
          </DialogTitle>
          <DialogDescription>
            {step === 'setup' 
              ? "Add an extra layer of security to your account"
              : "Verify your authenticator app setup"
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 'setup' ? (
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <QrCode className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800">Setup Instructions</span>
              </div>
              <ol className="text-sm text-orange-700 space-y-1">
                <li>1. Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>2. Click "Setup 2FA" to generate a QR code</li>
                <li>3. Scan the QR code with your authenticator app</li>
                <li>4. Enter the verification code to complete setup</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {qrCode && (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border inline-block">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Scan this QR code with your authenticator app
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {step === 'setup' ? (
            <Button onClick={handleEnable2FA} disabled={loading}>
              {loading ? "Setting up..." : "Setup 2FA"}
            </Button>
          ) : (
            <Button onClick={handleVerify2FA} disabled={loading || verificationCode.length !== 6}>
              {loading ? "Verifying..." : "Verify & Enable"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

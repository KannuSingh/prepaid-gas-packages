// file :demo-counter-app/components/features/counter/smart-account-info.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useSmartAccount } from '@/context/SmartAccountContext';
import { formatAddress } from '@/lib/utils';

export function SmartAccountInfo() {
  const { smartAccountClient } = useSmartAccount();
  const [copied, setCopied] = useState(false);

  if (!smartAccountClient?.account?.address) return null;

  const address = smartAccountClient.account.address;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // reset after 1.5s
  };

  return (
    <div className="space-y-2 p-3 bg-muted rounded-lg">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Smart Account:</span>
        <p className="text-xs font-mono text-muted-foreground">{formatAddress(address)}</p>
        <Button size="sm" variant="ghost" onClick={copyAddress} className="group relative flex items-center">
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 group-hover:text-primary transition-colors" />
          )}
          <span className="absolute top-full mt-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </Button>
      </div>
    </div>
  );
}

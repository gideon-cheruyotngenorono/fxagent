'use client';
import { DollarSign, Clock, Zap, Server } from 'lucide-react';
import { useAccount, useSession } from '@/lib/api';

export default function TopBar() {
  const { data: account } = useAccount();
  const { data: session } = useSession();

  return (
    <header className="h-14 border-b bg-card flex border-border items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center space-x-6 text-sm">
        {/* Session Info */}
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="hidden sm:inline text-muted-foreground">Session:</span>
          {session ? (
             <span className="font-mono text-primary font-medium">{session.session?.name || 'Tokyo'}</span>
          ) : (
            <div className="w-16 h-4 bg-muted animate-pulse rounded" />
          )}
        </div>
      </div>
      
      {/* Account Mini-cards */}
      <div className="flex items-center space-x-4 xl:space-x-8 text-sm">
        <div className="flex flex-col items-end sm:items-start sm:flex-row sm:space-x-2">
          <span className="text-muted-foreground text-xs sm:text-sm">Balance</span>
          {account ? (
            <span className="font-mono font-medium">${account.balance?.toFixed(2)}</span>
          ) : (
            <div className="w-16 h-4 bg-muted animate-pulse rounded mt-1 sm:mt-0" />
          )}
        </div>
        <div className="hidden sm:flex flex-col items-start sm:flex-row sm:space-x-2">
          <span className="text-muted-foreground text-xs sm:text-sm">Equity</span>
          {account ? (
            <span className="font-mono font-medium">${account.equity?.toFixed(2)}</span>
          ) : (
            <div className="w-16 h-4 bg-muted animate-pulse rounded mt-1 sm:mt-0" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Server className="w-4 h-4 text-trading-green" />
          <span className="hidden sm:inline text-xs text-trading-green font-medium">Live</span>
        </div>
      </div>
    </header>
  );
}

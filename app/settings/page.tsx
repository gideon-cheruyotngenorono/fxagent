'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, ShieldAlert, Key, Database, Bell, LayoutDashboard } from "lucide-react";

export default function SettingsPage() {
  const [balance, setBalance] = useState('10000.00');
  const [risk, setRisk] = useState('1.5');
  const [model, setModel] = useState('groq-llama-3-70b');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure trading parameters, AI models, and MT5 connections.</p>
        </div>
        <Button className="font-semibold bg-primary hover:bg-primary/90 hidden sm:flex">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="space-y-6">
        {/* Account & Risk Settings */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="w-5 h-5 text-trading-purple" />
              Risk Management
            </CardTitle>
            <CardDescription>Default parameters used for mathematical sizing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Simulated Account Balance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">$</span>
                  <input 
                    type="text" 
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full bg-background border border-input rounded-md h-10 pl-7 pr-3 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Risk Per Trade (%)</label>
                <div className="flex gap-2">
                   <input 
                     type="text" 
                     value={risk}
                     onChange={(e) => setRisk(e.target.value)}
                     className="w-full bg-background border border-input rounded-md h-10 px-3 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                   />
                   <div className="flex gap-1 shrink-0">
                     <Button variant="outline" className="px-2" onClick={() => setRisk('1.0')}>1%</Button>
                     <Button variant="outline" className="px-2" onClick={() => setRisk('2.0')}>2%</Button>
                   </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Engine Settings */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="w-5 h-5 text-trading-purple" />
              AI Engine & Models
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium">Primary Analysis Model</label>
                <select 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-background border border-input rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="groq-llama-3-70b">Llama 3 70B (Groq - Fast)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                </select>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Groq API Key</label>
                  <input type="password" placeholder="gsk_..." className="w-full bg-background border border-input rounded-md h-10 px-3 font-mono placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gemini API Key</label>
                  <input type="password" placeholder="AIza..." className="w-full bg-background border border-input rounded-md h-10 px-3 font-mono placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Data Source Configuration */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5 text-trading-purple" />
              Data Source Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-4 border p-4 rounded-md bg-background/50">
                <div className="w-3 h-3 rounded-full bg-trading-green animate-pulse" />
                <div>
                   <div className="font-semibold text-sm">MT5 Native WebSocket</div>
                   <div className="text-xs text-muted-foreground">Currently receiving streaming price data.</div>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">Disconnect</Button>
             </div>
          </CardContent>
        </Card>

        {/* Notification Defaults */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-trading-purple" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {['Sound alerts on high impact news', 'Desktop notification on trade execution', 'Push AI traces to background log'].map((toggle, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 last:pb-0">
                  <span className="text-sm">{toggle}</span>
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer outline-none transition-colors ${i < 2 ? 'bg-primary' : 'bg-muted'}`}>
                     <div className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white transition-transform ${i < 2 ? 'translate-x-5' : 'translate-x-1.5'}`} />
                  </div>
                </div>
             ))}
          </CardContent>
        </Card>

        {/* Save button for mobile */}
        <Button className="w-full font-semibold bg-primary hover:bg-primary/90 mt-6 sm:hidden">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

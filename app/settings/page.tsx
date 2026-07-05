'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Save,
  ShieldAlert,
  Key,
  Database,
  Bell,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Server,
} from 'lucide-react';
import { useSettings, useChatModels, putSettings, AppSettings } from '@/lib/api';

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-[#30363D]'
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0D1117] border border-[#30363D] rounded-md h-10 px-3 pr-9 font-mono text-sm placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { data: serverSettings, isLoading, mutate } = useSettings();
  const { data: modelsData } = useChatModels();
  const models = modelsData?.models ?? [];

  const [form, setForm] = useState<Partial<AppSettings>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  // Seed form from API once loaded
  useEffect(() => {
    if (serverSettings && !dirty) {
      setForm({
        account_balance: serverSettings.account_balance,
        risk_percent: serverSettings.risk_percent,
        default_model: serverSettings.default_model,
        groq_api_key: serverSettings.groq_api_key ?? '',
        gemini_api_key: serverSettings.gemini_api_key ?? '',
        sound_alerts: serverSettings.sound_alerts,
        desktop_notifications: serverSettings.desktop_notifications,
        background_logging: serverSettings.background_logging,
      });
    }
  }, [serverSettings, dirty]);

  function set<K extends keyof AppSettings>(key: K, val: AppSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  }

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await putSettings(form);
      await mutate();
      setDirty(false);
      showToast('success', 'Settings saved successfully');
    } catch (err: any) {
      showToast('error', err.message ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof AppSettings) => ({
    value: (form[key] ?? '') as any,
    onChange: (v: any) => set(key, v),
  });

  const notifications = [
    { key: 'sound_alerts' as const, label: 'Sound alerts on high impact news' },
    { key: 'desktop_notifications' as const, label: 'Desktop notification on trade execution' },
    { key: 'background_logging' as const, label: 'Push AI traces to background log' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium shadow-2xl ${
              toast.type === 'success'
                ? 'bg-[#00C853]/20 border-[#00C853]/40 text-[#00C853]'
                : 'bg-[#FF1744]/20 border-[#FF1744]/40 text-[#FF1744]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-[#30363D] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure trading parameters, AI models, and MT5 connections.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="hidden sm:flex bg-primary hover:bg-primary/90 gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      {/* ── Risk Management ── */}
      <Card className="bg-[#161B22] border-[#30363D]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="w-4 h-4 text-primary" />
            Risk Management
          </CardTitle>
          <CardDescription>Default parameters used for mathematical position sizing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 bg-[#21262D] animate-pulse rounded" />
                  <div className="h-10 w-full bg-[#21262D] animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Balance ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">$</span>
                  <input
                    type="number"
                    value={form.account_balance ?? ''}
                    onChange={(e) => set('account_balance', Number(e.target.value))}
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded-md h-10 pl-7 pr-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Risk Per Trade — <span className="text-primary font-mono">{form.risk_percent ?? 1}%</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.25}
                    max={5}
                    step={0.25}
                    value={form.risk_percent ?? 1}
                    onChange={(e) => set('risk_percent', Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[1, 2].map((v) => (
                      <Button
                        key={v}
                        variant="outline"
                        size="sm"
                        className="px-2 h-8 text-xs"
                        onClick={() => set('risk_percent', v)}
                      >
                        {v}%
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── AI Engine ── */}
      <Card className="bg-[#161B22] border-[#30363D]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="w-4 h-4 text-primary" />
            AI Engine & Models
          </CardTitle>
          <CardDescription>Configure AI model preferences and API credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Primary Analysis Model</label>
            {isLoading ? (
              <div className="h-10 w-full bg-[#21262D] animate-pulse rounded" />
            ) : (
              <select
                value={form.default_model ?? ''}
                onChange={(e) => set('default_model', e.target.value)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {models.length > 0
                  ? models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.provider} ({m.speed} · {m.cost})
                      </option>
                    ))
                  : [
                      { id: 'groq-llama-3-70b', label: 'Llama 3.3 70B (Groq — Fast)' },
                      { id: 'gemini-flash', label: 'Gemini 2.5 Flash' },
                    ].map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Groq API Key</label>
              <PasswordInput
                value={(form.groq_api_key as string) ?? ''}
                onChange={(v) => set('groq_api_key', v)}
                placeholder="gsk_..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gemini API Key</label>
              <PasswordInput
                value={(form.gemini_api_key as string) ?? ''}
                onChange={(v) => set('gemini_api_key', v)}
                placeholder="AIza..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Connection Status ── */}
      <Card className="bg-[#161B22] border-[#30363D]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4 text-primary" />
            Data Source Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 border border-[#30363D] p-4 rounded-lg bg-[#0D1117]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00C853] animate-pulse" />
            <div>
              <div className="font-semibold text-sm flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-muted-foreground" />
                MT5 Native WebSocket
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Connected · Streaming live price data
              </div>
            </div>
            <Button variant="outline" size="sm" className="ml-auto h-8 text-xs">
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Notifications ── */}
      <Card className="bg-[#161B22] border-[#30363D]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-primary" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 divide-y divide-[#30363D]/50">
          {notifications.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <span className="text-sm">{label}</span>
              {isLoading ? (
                <div className="w-10 h-5 bg-[#21262D] animate-pulse rounded-full" />
              ) : (
                <Toggle
                  checked={Boolean(form[key])}
                  onChange={(v) => set(key, v as any)}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Mobile Save ── */}
      <Button
        onClick={handleSave}
        disabled={saving || !dirty}
        className="w-full sm:hidden bg-primary hover:bg-primary/90 gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  );
}

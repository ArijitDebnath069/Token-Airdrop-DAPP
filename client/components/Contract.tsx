"use client";

import { useState, useCallback } from "react";
import {
  airdrop,
  airdropCustom,
  getAirdropCount,
  getTotalDistributed,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
          {label}
        </label>
        {hint && <span className="text-[10px] text-white/20">{hint}</span>}
      </div>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({ name, params, returns, color }: { name: string; params: string; returns?: string; color: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && <span className="ml-auto text-white/15 text-[10px]">{returns}</span>}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────

type Tab = "equal" | "custom" | "stats";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

// ── Main Component ───────────────────────────────────────────

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("equal");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Equal airdrop
  const [eqToken, setEqToken] = useState("");
  const [eqAmount, setEqAmount] = useState("");
  const [eqRecipients, setEqRecipients] = useState<string[]>([""]);
  const [isSendingEq, setIsSendingEq] = useState(false);

  // Custom airdrop
  const [cxToken, setCxToken] = useState("");
  const [cxRows, setCxRows] = useState<{ address: string; amount: string }[]>([{ address: "", amount: "" }]);
  const [isSendingCx, setIsSendingCx] = useState(false);

  // Stats
  const [statsToken, setStatsToken] = useState("");
  const [statsData, setStatsData] = useState<{ count: number; total: bigint } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // ── Equal airdrop handlers ───────────────────────────────

  const handleEqualAirdrop = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    const validRecipients = eqRecipients.filter(r => r.trim().length > 0);
    if (!eqToken.trim()) return setError("Enter the token contract address");
    if (!eqAmount.trim() || isNaN(Number(eqAmount)) || Number(eqAmount) <= 0) return setError("Enter a valid amount per recipient");
    if (validRecipients.length === 0) return setError("Add at least one recipient");
    setError(null);
    setIsSendingEq(true);
    setTxStatus("Awaiting signature...");
    try {
      // Convert amount to stroops/base units (multiply by 10^7 for 7-decimal tokens)
      const amountBigInt = BigInt(Math.round(Number(eqAmount) * 1e7));
      await airdrop(walletAddress, eqToken.trim(), validRecipients, amountBigInt);
      setTxStatus(`Airdropped ${eqAmount} tokens to ${validRecipients.length} recipients!`);
      setTimeout(() => setTxStatus(null), 6000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsSendingEq(false);
    }
  }, [walletAddress, eqToken, eqAmount, eqRecipients]);

  // ── Custom airdrop handlers ──────────────────────────────

  const handleCustomAirdrop = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    const validRows = cxRows.filter(r => r.address.trim() && r.amount.trim() && Number(r.amount) > 0);
    if (!cxToken.trim()) return setError("Enter the token contract address");
    if (validRows.length === 0) return setError("Add at least one valid recipient with amount");
    setError(null);
    setIsSendingCx(true);
    setTxStatus("Awaiting signature...");
    try {
      const recipients = validRows.map(r => r.address.trim());
      const amounts = validRows.map(r => BigInt(Math.round(Number(r.amount) * 1e7)));
      await airdropCustom(walletAddress, cxToken.trim(), recipients, amounts);
      setTxStatus(`Custom airdrop sent to ${validRows.length} recipients!`);
      setTimeout(() => setTxStatus(null), 6000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsSendingCx(false);
    }
  }, [walletAddress, cxToken, cxRows]);

  // ── Stats handlers ───────────────────────────────────────

  const handleLoadStats = useCallback(async () => {
    if (!statsToken.trim()) return setError("Enter a token address");
    setError(null);
    setIsLoadingStats(true);
    setStatsData(null);
    try {
      const [count, total] = await Promise.all([
        getAirdropCount(statsToken.trim(), walletAddress || undefined),
        getTotalDistributed(statsToken.trim(), walletAddress || undefined),
      ]);
      setStatsData({ count, total });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsLoadingStats(false);
    }
  }, [statsToken, walletAddress]);

  // ── Tab config ───────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "equal", label: "Equal Drop", icon: <SendIcon />, color: "#7c6cf0" },
    { key: "custom", label: "Custom Drop", icon: <ZapIcon />, color: "#f472b6" },
    { key: "stats", label: "Stats", icon: <SearchIcon />, color: "#4fc3f7" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("!") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#f472b6]/20 border border-white/[0.06]">
                <ZapIcon />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Token Airdrop Tool</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="info" className="text-[10px]">Permissionless</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); setStatsData(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">

            {/* ── Equal Airdrop ── */}
            {activeTab === "equal" && (
              <div className="space-y-5">
                <MethodSignature
                  name="airdrop"
                  params="(sender, token, recipients: Vec<Address>, amount: i128)"
                  returns="-> ()"
                  color="#7c6cf0"
                />

                <Input
                  label="Token Contract Address"
                  hint="C... address"
                  value={eqToken}
                  onChange={(e) => setEqToken(e.target.value)}
                  placeholder="e.g. CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
                />

                <Input
                  label="Amount Per Recipient"
                  hint="in token units"
                  value={eqAmount}
                  onChange={(e) => setEqAmount(e.target.value)}
                  placeholder="e.g. 100"
                  type="number"
                  min="0"
                />

                {/* Recipient list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                      Recipients
                    </label>
                    <span className="text-[10px] text-white/20">{eqRecipients.filter(r => r.trim()).length} valid</span>
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {eqRecipients.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="group flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30">
                          <input
                            value={r}
                            onChange={(e) => {
                              const next = [...eqRecipients];
                              next[i] = e.target.value;
                              setEqRecipients(next);
                            }}
                            placeholder={`Recipient ${i + 1} (G...)`}
                            className="w-full rounded-[11px] bg-transparent px-4 py-2.5 font-mono text-xs text-white/90 placeholder:text-white/15 outline-none"
                          />
                        </div>
                        {eqRecipients.length > 1 && (
                          <button
                            onClick={() => setEqRecipients(eqRecipients.filter((_, idx) => idx !== i))}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/25 hover:border-[#f87171]/20 hover:text-[#f87171]/60 transition-all"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setEqRecipients([...eqRecipients, ""])}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.08] bg-transparent py-2 text-xs text-white/25 hover:border-[#7c6cf0]/20 hover:text-[#7c6cf0]/60 transition-all"
                  >
                    <PlusIcon /> Add Recipient
                  </button>
                </div>

                {/* Total preview */}
                {eqAmount && eqRecipients.filter(r => r.trim()).length > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                    <span className="text-xs text-white/30">Total to send</span>
                    <span className="font-mono text-sm text-[#7c6cf0]/80">
                      {(Number(eqAmount) * eqRecipients.filter(r => r.trim()).length).toLocaleString()} tokens
                    </span>
                  </div>
                )}

                {walletAddress ? (
                  <ShimmerButton onClick={handleEqualAirdrop} disabled={isSendingEq} shimmerColor="#7c6cf0" className="w-full">
                    {isSendingEq ? <><SpinnerIcon /> Sending Airdrop...</> : <><SendIcon /> Send Equal Airdrop</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {isConnecting ? "Connecting..." : "Connect wallet to airdrop"}
                  </button>
                )}
              </div>
            )}

            {/* ── Custom Airdrop ── */}
            {activeTab === "custom" && (
              <div className="space-y-5">
                <MethodSignature
                  name="airdrop_custom"
                  params="(sender, token, recipients: Vec<Address>, amounts: Vec<i128>)"
                  returns="-> ()"
                  color="#f472b6"
                />

                <Input
                  label="Token Contract Address"
                  hint="C... address"
                  value={cxToken}
                  onChange={(e) => setCxToken(e.target.value)}
                  placeholder="e.g. CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
                />

                {/* Recipient + amount rows */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                      Recipients &amp; Amounts
                    </label>
                    <span className="text-[10px] text-white/20">{cxRows.filter(r => r.address.trim() && Number(r.amount) > 0).length} valid</span>
                  </div>

                  {/* Column headers */}
                  <div className="flex items-center gap-2 px-1">
                    <span className="flex-1 text-[10px] text-white/20 uppercase tracking-wider">Address (G...)</span>
                    <span className="w-28 text-[10px] text-white/20 uppercase tracking-wider">Amount</span>
                    <span className="w-9" />
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {cxRows.map((row, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="group flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#f472b6]/30">
                          <input
                            value={row.address}
                            onChange={(e) => {
                              const next = [...cxRows];
                              next[i] = { ...next[i], address: e.target.value };
                              setCxRows(next);
                            }}
                            placeholder="GABC..."
                            className="w-full rounded-[11px] bg-transparent px-4 py-2.5 font-mono text-xs text-white/90 placeholder:text-white/15 outline-none"
                          />
                        </div>
                        <div className="group w-28 rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#f472b6]/30">
                          <input
                            value={row.amount}
                            onChange={(e) => {
                              const next = [...cxRows];
                              next[i] = { ...next[i], amount: e.target.value };
                              setCxRows(next);
                            }}
                            placeholder="0"
                            type="number"
                            min="0"
                            className="w-full rounded-[11px] bg-transparent px-3 py-2.5 font-mono text-xs text-white/90 placeholder:text-white/15 outline-none"
                          />
                        </div>
                        {cxRows.length > 1 && (
                          <button
                            onClick={() => setCxRows(cxRows.filter((_, idx) => idx !== i))}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/25 hover:border-[#f87171]/20 hover:text-[#f87171]/60 transition-all"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setCxRows([...cxRows, { address: "", amount: "" }])}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.08] bg-transparent py-2 text-xs text-white/25 hover:border-[#f472b6]/20 hover:text-[#f472b6]/60 transition-all"
                  >
                    <PlusIcon /> Add Row
                  </button>
                </div>

                {/* Total preview */}
                {cxRows.some(r => r.address.trim() && Number(r.amount) > 0) && (
                  <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                    <span className="text-xs text-white/30">Total to send</span>
                    <span className="font-mono text-sm text-[#f472b6]/80">
                      {cxRows.filter(r => r.address.trim() && Number(r.amount) > 0).reduce((acc, r) => acc + Number(r.amount), 0).toLocaleString()} tokens
                    </span>
                  </div>
                )}

                {walletAddress ? (
                  <ShimmerButton onClick={handleCustomAirdrop} disabled={isSendingCx} shimmerColor="#f472b6" className="w-full">
                    {isSendingCx ? <><SpinnerIcon /> Sending Airdrop...</> : <><ZapIcon /> Send Custom Airdrop</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#f472b6]/20 bg-[#f472b6]/[0.03] py-4 text-sm text-[#f472b6]/60 hover:border-[#f472b6]/30 hover:text-[#f472b6]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {isConnecting ? "Connecting..." : "Connect wallet to airdrop"}
                  </button>
                )}
              </div>
            )}

            {/* ── Stats ── */}
            {activeTab === "stats" && (
              <div className="space-y-5">
                <MethodSignature
                  name="get_airdrop_count / get_total_distributed"
                  params="(token: Address)"
                  returns="-> u32 / i128"
                  color="#4fc3f7"
                />

                <Input
                  label="Token Contract Address"
                  hint="C... address"
                  value={statsToken}
                  onChange={(e) => setStatsToken(e.target.value)}
                  placeholder="e.g. CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
                />

                <ShimmerButton onClick={handleLoadStats} disabled={isLoadingStats} shimmerColor="#4fc3f7" className="w-full">
                  {isLoadingStats ? <><SpinnerIcon /> Loading...</> : <><SearchIcon /> Fetch Stats</>}
                </ShimmerButton>

                {statsData && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up">
                    <div className="border-b border-white/[0.06] px-4 py-3">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Airdrop Statistics</span>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Total Airdrops Run</span>
                        <span className="font-mono text-xl font-bold text-[#4fc3f7]">{statsData.count}</span>
                      </div>
                      <div className="h-px bg-white/[0.04]" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Total Tokens Distributed</span>
                        <div className="text-right">
                          <p className="font-mono text-xl font-bold text-[#7c6cf0]">
                            {(Number(statsData.total) / 1e7).toLocaleString(undefined, { maximumFractionDigits: 7 })}
                          </p>
                          <p className="text-[10px] text-white/20 font-mono">{statsData.total.toString()} stroops</p>
                        </div>
                      </div>
                      <div className="h-px bg-white/[0.04]" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Token Address</span>
                        <span className="font-mono text-xs text-white/50">{truncate(statsToken)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info note */}
                <div className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
                  <span className="mt-0.5 text-white/20"><AlertIcon /></span>
                  <p className="text-xs text-white/25 leading-relaxed">
                    Stats are per-token. Each airdrop (equal or custom) increments the count and adds to the total distributed for that token.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Token Airdrop &middot; Soroban &middot; Testnet</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#7c6cf0]/50" />
                <span className="font-mono text-[9px] text-white/15">Equal</span>
              </span>
              <span className="text-white/10 text-[8px]">&bull;</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#f472b6]/50" />
                <span className="font-mono text-[9px] text-white/15">Custom</span>
              </span>
              <span className="text-white/10 text-[8px]">&bull;</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#4fc3f7]/50" />
                <span className="font-mono text-[9px] text-white/15">Permissionless</span>
              </span>
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}

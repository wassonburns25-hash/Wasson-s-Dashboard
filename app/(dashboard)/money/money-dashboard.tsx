"use client";

import { useState, useEffect, useTransition } from "react";
import { saveAccountBalance } from "./actions";
import { toast } from "sonner";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

type Account = {
  id: string;
  label: string;
  balance: number;
  color: string;
  icon: string;
};

const ACCOUNT_META: Omit<Account, "balance">[] = [
  { id: "venmo", label: "Venmo", color: "#3D9BE9", icon: "V" },
  { id: "bank", label: "Bank Account", color: "#00C896", icon: "B" },
  { id: "cash", label: "Cash", color: "#F5C542", icon: "$" },
  { id: "invested", label: "Invested", color: "#A78BFA", icon: "↑" },
];

const INVESTMENT_OPTIONS = [
  {
    name: "High-Yield Savings Account",
    risk: "None",
    returns: "4.5–5.2% APY",
    minAmount: 1,
    description:
      "Park your cash safely. FDIC insured. Best for your emergency fund or money you'll need within a year.",
    tag: "START HERE",
    tagColor: "#00C896",
    examples: "Marcus (Goldman Sachs), SoFi, Ally Bank",
  },
  {
    name: "S&P 500 Index Fund (ETF)",
    risk: "Medium",
    returns: "~10% avg/yr historically",
    minAmount: 1,
    description:
      "Buy tiny slices of the 500 biggest U.S. companies at once. The #1 wealth-building tool for most people. Set it and forget it.",
    tag: "BEST LONG-TERM",
    tagColor: "#3D9BE9",
    examples: "VOO (Vanguard), SPY, IVV (iShares)",
  },
  {
    name: "Roth IRA",
    risk: "Varies",
    returns: "Tax-free growth forever",
    minAmount: 1,
    description:
      "Contribute up to $7,000/yr of earned income. Grows tax-FREE. At 19, even $1,000 here could be $50,000+ at retirement. Open one ASAP.",
    tag: "HIGHEST PRIORITY",
    tagColor: "#F5C542",
    examples: "Fidelity, Schwab, Vanguard",
  },
  {
    name: "Treasury Bills (T-Bills)",
    risk: "None",
    returns: "4.5–5.3% APY",
    minAmount: 100,
    description:
      "Backed by the U.S. government. Short-term (4–52 weeks). Great place for money you won't need for a few months.",
    tag: "SAFE & LIQUID",
    tagColor: "#A78BFA",
    examples: "TreasuryDirect.gov or Fidelity",
  },
  {
    name: "Individual Stocks",
    risk: "High",
    returns: "Varies wildly",
    minAmount: 1,
    description:
      "Betting on single companies. Can win big or lose big. Only do this once you have an index fund foundation — and only with money you can afford to lose.",
    tag: "ADVANCED",
    tagColor: "#EF4444",
    examples: "Robinhood, Fidelity, Schwab",
  },
];

const TIPS = [
  "💡 Move your Venmo balance to your bank ASAP — it earns 0% sitting there.",
  "📈 Open a Roth IRA before you turn 20 — compound interest is your biggest asset at 19.",
  "🏦 High-yield savings accounts pay 5x more than regular savings right now.",
  "🎓 As a student, Fidelity and Schwab have $0 minimums and no fees.",
  "💸 The 50/30/20 rule: 50% needs, 30% wants, 20% savings/investing.",
  "⚡ Even investing $100/mo starting at 19 can become $500K+ by retirement.",
];

export function MoneyDashboard({ initial }: { initial: Record<string, number> }) {
  const [accounts, setAccounts] = useState<Account[]>(
    ACCOUNT_META.map((a) => ({ ...a, balance: initial[a.id] ?? 0 }))
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [tipIndex, setTipIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"dashboard" | "invest" | "calculator">(
    "dashboard"
  );
  const [calcAmount, setCalcAmount] = useState("");
  const [calcYears, setCalcYears] = useState(10);
  const [calcRate, setCalcRate] = useState(10);
  const [, startTransition] = useTransition();

  const total = accounts.reduce((s, a) => s + a.balance, 0);

  useEffect(() => {
    const t = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleEdit = (id: string) => {
    setEditing(id);
    const acc = accounts.find((a) => a.id === id);
    setInputVal(acc && acc.balance !== 0 ? String(acc.balance) : "");
  };

  const handleSave = (id: string) => {
    const val = parseFloat(inputVal);
    if (!isNaN(val) && val >= 0) {
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, balance: val } : a)));
      startTransition(async () => {
        try {
          await saveAccountBalance(id, val);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed to save");
        }
      });
    }
    setEditing(null);
    setInputVal("");
  };

  const compound = () => {
    const p = parseFloat(calcAmount) || 0;
    const r = calcRate / 100;
    const t = calcYears;
    return p * Math.pow(1 + r, t);
  };

  return (
    <div
      style={{
        background: "#0A0E1A",
        fontFamily: "'DM Mono', 'Courier New', monospace",
        color: "#E8EAF0",
        padding: "0",
        border: "1px solid #1E2A40",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F1629 0%, #1A0A2E 100%)",
          borderBottom: "1px solid #1E2A40",
          padding: "24px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 4,
              color: "#A78BFA",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            WASSON BURNS · CLASS OF 2029
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>
            Money Dashboard
          </h1>
        </div>
        <div
          style={{
            background: "rgba(0,200,150,0.1)",
            border: "1px solid rgba(0,200,150,0.3)",
            borderRadius: 12,
            padding: "12px 20px",
            textAlign: "right",
          }}
        >
          <div style={{ fontSize: 11, color: "#00C896", letterSpacing: 2, textTransform: "uppercase" }}>
            Net Worth
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#00C896", letterSpacing: -1 }}>
            {formatCurrency(total)}
          </div>
        </div>
      </div>

      {/* Tip Banner */}
      <div
        style={{
          background: "rgba(167,139,250,0.08)",
          borderBottom: "1px solid rgba(167,139,250,0.15)",
          padding: "10px 32px",
          fontSize: 13,
          color: "#C4B5FD",
          transition: "all 0.3s",
        }}
      >
        {TIPS[tipIndex]}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "20px 32px 0", borderBottom: "1px solid #1E2A40" }}>
        {(["dashboard", "invest", "calculator"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? "#A78BFA" : "transparent",
              color: activeTab === tab ? "#0A0E1A" : "#8892A4",
              border: activeTab === tab ? "none" : "1px solid #1E2A40",
              borderBottom: "none",
              borderRadius: "8px 8px 0 0",
              padding: "8px 20px",
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: activeTab === tab ? 700 : 400,
              transition: "all 0.2s",
            }}
          >
            {tab === "dashboard" ? "💰 Accounts" : tab === "invest" ? "📈 How to Invest" : "🧮 Calculator"}
          </button>
        ))}
      </div>

      <div style={{ padding: "32px" }}>
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginBottom: 32,
              }}
            >
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    background: "linear-gradient(135deg, #0F1629, #111827)",
                    border: `1px solid ${acc.color}33`,
                    borderRadius: 16,
                    padding: 20,
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 8px 32px ${acc.color}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${acc.color}22`,
                      border: `1px solid ${acc.color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: acc.color,
                    }}
                  >
                    {acc.icon}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: 2,
                      color: "#8892A4",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    {acc.label}
                  </div>
                  {editing === acc.id ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                      <input
                        type="number"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave(acc.id)}
                        autoFocus
                        placeholder="0.00"
                        style={{
                          background: "#1E2A40",
                          border: `1px solid ${acc.color}`,
                          borderRadius: 8,
                          color: "#fff",
                          padding: "6px 10px",
                          fontSize: 16,
                          fontFamily: "inherit",
                          width: "100%",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => handleSave(acc.id)}
                        style={{
                          background: acc.color,
                          border: "none",
                          borderRadius: 8,
                          color: "#0A0E1A",
                          padding: "6px 14px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: acc.color,
                          letterSpacing: -1,
                          margin: "8px 0",
                        }}
                      >
                        {formatCurrency(acc.balance)}
                      </div>
                      <button
                        onClick={() => handleEdit(acc.id)}
                        style={{
                          background: "transparent",
                          border: `1px solid ${acc.color}33`,
                          borderRadius: 6,
                          color: "#8892A4",
                          padding: "4px 12px",
                          fontSize: 11,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          letterSpacing: 1,
                          textTransform: "uppercase",
                        }}
                      >
                        Edit
                      </button>
                    </>
                  )}
                  <div style={{ marginTop: 16, height: 3, background: "#1E2A40", borderRadius: 2 }}>
                    <div
                      style={{
                        height: "100%",
                        width: total > 0 ? `${Math.min(100, (acc.balance / total) * 100)}%` : "0%",
                        background: acc.color,
                        borderRadius: 2,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "#8892A4", marginTop: 4 }}>
                    {total > 0 ? `${((acc.balance / total) * 100).toFixed(1)}% of total` : "0% of total"}
                  </div>
                </div>
              ))}
            </div>

            {total > 0 && (
              <div style={{ background: "#0F1629", border: "1px solid #1E2A40", borderRadius: 16, padding: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 3,
                    color: "#8892A4",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Allocation
                </div>
                <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", gap: 2 }}>
                  {accounts
                    .filter((a) => a.balance > 0)
                    .map((acc) => (
                      <div
                        key={acc.id}
                        title={`${acc.label}: ${formatCurrency(acc.balance)}`}
                        style={{
                          width: `${(acc.balance / total) * 100}%`,
                          background: acc.color,
                          transition: "width 0.5s ease",
                          borderRadius: 3,
                        }}
                      />
                    ))}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8892A4" }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: acc.color }} />
                      {acc.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 20,
                padding: "14px 20px",
                background: "rgba(245,197,66,0.08)",
                border: "1px solid rgba(245,197,66,0.2)",
                borderRadius: 12,
                fontSize: 13,
                color: "#F5C542",
              }}
            >
              ⚠️ <strong>Action item:</strong> Transfer your Venmo balance to a High-Yield Savings
              Account. It&apos;s earning nothing sitting in Venmo.
            </div>
          </>
        )}

        {/* INVEST TAB */}
        {activeTab === "invest" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 18, color: "#fff" }}>Where to Put Your Money</h2>
              <p style={{ margin: 0, color: "#8892A4", fontSize: 13, lineHeight: 1.6 }}>
                At 19, time is your #1 asset. Here&apos;s the order of operations — read top to bottom.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {INVESTMENT_OPTIONS.map((opt, i) => (
                <div
                  key={i}
                  style={{
                    background: "#0F1629",
                    border: "1px solid #1E2A40",
                    borderRadius: 16,
                    padding: 20,
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{opt.name}</span>
                      <span
                        style={{
                          fontSize: 9,
                          letterSpacing: 2,
                          color: opt.tagColor,
                          background: `${opt.tagColor}22`,
                          border: `1px solid ${opt.tagColor}44`,
                          padding: "2px 8px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                        }}
                      >
                        {opt.tag}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 10px", fontSize: 13, color: "#8892A4", lineHeight: 1.6 }}>
                      {opt.description}
                    </p>
                    <div style={{ fontSize: 12, color: "#4B5563" }}>
                      Where to open: <span style={{ color: "#6B7280" }}>{opt.examples}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 100 }}>
                    <div style={{ fontSize: 11, color: "#8892A4", marginBottom: 4 }}>Returns</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: opt.tagColor }}>{opt.returns}</div>
                    <div style={{ fontSize: 11, color: "#8892A4", marginTop: 8 }}>Risk</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: opt.risk === "None" ? "#00C896" : opt.risk === "High" ? "#EF4444" : "#F5C542",
                      }}
                    >
                      {opt.risk}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 24,
                padding: 20,
                background: "linear-gradient(135deg, rgba(0,200,150,0.05), rgba(61,155,233,0.05))",
                border: "1px solid rgba(0,200,150,0.2)",
                borderRadius: 16,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#00C896", marginBottom: 8 }}>
                🎯 Wasson&apos;s Recommended Game Plan
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, color: "#8892A4", fontSize: 13, lineHeight: 2 }}>
                <li>
                  Keep <strong style={{ color: "#E8EAF0" }}>1–2 months expenses</strong> in a High-Yield
                  Savings Account as emergency fund
                </li>
                <li>
                  Open a <strong style={{ color: "#E8EAF0" }}>Roth IRA at Fidelity</strong> — contribute up
                  to $7K/year of any earned income
                </li>
                <li>
                  Inside that Roth IRA, buy <strong style={{ color: "#E8EAF0" }}>FZROX or VOO</strong> (total
                  market or S&P 500 index fund)
                </li>
                <li>Move Venmo balance → bank → HYSA regularly</li>
                <li>Anything extra → taxable brokerage account with more index funds</li>
              </ol>
            </div>
          </div>
        )}

        {/* CALCULATOR TAB */}
        {activeTab === "calculator" && (
          <div style={{ maxWidth: 520 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, color: "#fff" }}>Compound Growth Calculator</h2>
            <p style={{ margin: "0 0 24px", color: "#8892A4", fontSize: 13 }}>
              See what your money becomes over time. This is why starting at 19 matters so much.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    color: "#8892A4",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Starting Amount ($)
                </label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  style={{
                    width: "100%",
                    background: "#0F1629",
                    border: "1px solid #1E2A40",
                    borderRadius: 10,
                    color: "#fff",
                    padding: "12px 16px",
                    fontSize: 16,
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    color: "#8892A4",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Years: {calcYears}
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={calcYears}
                  onChange={(e) => setCalcYears(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#A78BFA" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8892A4" }}>
                  <span>1 yr</span>
                  <span>50 yrs</span>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    color: "#8892A4",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Annual Return: {calcRate}%
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#00C896" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8892A4" }}>
                  <span>1% (savings)</span>
                  <span>20% (stocks)</span>
                </div>
              </div>

              <div
                style={{
                  background: "linear-gradient(135deg, #0F1629, #1A0A2E)",
                  border: "1px solid #A78BFA44",
                  borderRadius: 16,
                  padding: 24,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#A78BFA", textTransform: "uppercase", marginBottom: 8 }}>
                  After {calcYears} years
                </div>
                <div style={{ fontSize: 42, fontWeight: 700, color: "#A78BFA", letterSpacing: -2 }}>
                  {formatCurrency(compound())}
                </div>
                {calcAmount && (
                  <div style={{ fontSize: 13, color: "#8892A4", marginTop: 8 }}>
                    Gain:{" "}
                    <span style={{ color: "#00C896" }}>
                      {formatCurrency(compound() - parseFloat(calcAmount))}
                    </span>{" "}
                    on your {formatCurrency(parseFloat(calcAmount))}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 11, letterSpacing: 2, color: "#8892A4", textTransform: "uppercase", marginBottom: 12 }}>
                  Quick Scenarios
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "$500 in S&P 500 for 10 years", amount: 500, rate: 10, years: 10 },
                    { label: "$1,000 in Roth IRA for 46 years", amount: 1000, rate: 10, years: 46 },
                    { label: "$5,000 in HYSA for 2 years", amount: 5000, rate: 5, years: 2 },
                  ].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setCalcAmount(String(s.amount));
                        setCalcRate(s.rate);
                        setCalcYears(s.years);
                      }}
                      style={{
                        background: "#0F1629",
                        border: "1px solid #1E2A40",
                        borderRadius: 8,
                        color: "#8892A4",
                        padding: "10px 16px",
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                        transition: "border-color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#A78BFA")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E2A40")}
                    >
                      {s.label} →{" "}
                      <span style={{ color: "#A78BFA" }}>
                        {formatCurrency(s.amount * Math.pow(1 + s.rate / 100, s.years))}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

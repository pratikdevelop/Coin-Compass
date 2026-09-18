import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WalletSummary = {
  balance: number;
  currency: string;
  transactions: {
    id: string;
    type: "deposit" | "withdrawal";
    amount: number;
    status: string;
    description: string | null;
    created_at: string;
  }[];
};

async function loadWallet(supabase: any, userId: string): Promise<WalletSummary> {
  const { data: account, error } = await supabase
    .from("wallet_accounts")
    .select("balance, currency")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Wallet is unavailable right now.");

  let balance = Number(account?.balance ?? 0);
  let currency = account?.currency ?? "USD";
  if (!account) {
    const { data: created, error: createError } = await supabase
      .from("wallet_accounts")
      .insert({ user_id: userId })
      .select("balance, currency")
      .single();
    if (createError) throw new Error("Could not create your wallet.");
    balance = Number(created.balance);
    currency = created.currency;
  }

  const { data: tx } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount, status, description, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    balance,
    currency,
    transactions: (tx ?? []).map((t: any) => ({ ...t, amount: Number(t.amount) })),
  };
}

export const getWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => loadWallet(context.supabase, context.userId));

const amountSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  description: z.string().max(140).optional(),
});

/**
 * Simulated deposit. No payment provider is connected, so every record is
 * stored with status "simulated" and is never presented as a real transfer.
 */
export const depositFunds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => amountSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const wallet = await loadWallet(supabase, userId);
    const next = wallet.balance + data.amount;

    const { error: txError } = await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: data.amount,
      status: "simulated",
      description: data.description ?? "Simulated deposit (no payment provider connected)",
    });
    if (txError) throw new Error("Could not record the deposit.");

    const { error } = await supabase
      .from("wallet_accounts")
      .update({ balance: next })
      .eq("user_id", userId);
    if (error) throw new Error("Could not update your balance.");
    return { balance: next };
  });

export const withdrawFunds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => amountSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const wallet = await loadWallet(supabase, userId);
    // Balance is always recomputed server-side; the client never supplies it.
    if (data.amount > wallet.balance) {
      throw new Error("Amount exceeds your available balance.");
    }
    const next = wallet.balance - data.amount;

    const { error: txError } = await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: "withdrawal",
      amount: data.amount,
      status: "simulated",
      description: data.description ?? "Simulated withdrawal (no payout provider connected)",
    });
    if (txError) throw new Error("Could not record the withdrawal.");

    const { error } = await supabase
      .from("wallet_accounts")
      .update({ balance: next })
      .eq("user_id", userId);
    if (error) throw new Error("Could not update your balance.");
    return { balance: next };
  });

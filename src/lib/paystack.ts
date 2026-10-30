import "server-only";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

interface InitializeTransactionParams {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
}

interface InitializeTransactionResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function initializeTransaction({
  email,
  amountKobo,
  reference,
  callbackUrl,
}: InitializeTransactionParams): Promise<InitializeTransactionResponse> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      amount: amountKobo,
      reference,
      callback_url: callbackUrl,
    }),
  });

  if (!res.ok) {
    throw new Error(`Paystack initialize failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data: {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    currency: string;
  };
}

export async function verifyTransaction(reference: string): Promise<VerifyTransactionResponse> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Paystack verify failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

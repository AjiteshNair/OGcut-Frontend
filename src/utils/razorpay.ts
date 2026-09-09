// utils/razorpay.ts

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

interface WindowWithRazorpay extends Window {
  Razorpay: new (options: RazorpayOptions) => { open: () => void };
}

declare const window: WindowWithRazorpay;

// Dynamically inject Razorpay's checkout script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const processRazorpayPayment = async ({
  apiBaseUrl,
  token,
  orderId,
  orderCode,
  userEmail,
  userName,
  userPhone,
  onSuccess,
  onError,
}: {
  apiBaseUrl: string;
  token: string;
  orderId: number;
  orderCode: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  onSuccess: (orderCode: string) => void;
  onError: (errorMessage: string) => void;
}) => {
  // 1. Load Razorpay JS SDK
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    onError('Razorpay SDK failed to load. Check your internet connection.');
    return;
  }

  try {
    // 2. Request backend to create Razorpay Order
    const res = await fetch(`${apiBaseUrl}/orders/create-razorpay-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Failed to initialize payment gateway.');
    }

    const { razorpayOrderId, amount, currency, keyId } = result.data;

    // 3. Configure Checkout Modal Options
    const options: RazorpayOptions = {
      key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount,
      currency,
      name: 'Custom Apparel Store',
      description: `Payment for Order #${orderCode}`,
      order_id: razorpayOrderId,
      prefill: {
        name: userName || '',
        email: userEmail || '',
        contact: userPhone || '',
      },
      theme: {
        color: '#000000',
      },
      // 4. Called upon payment completion inside modal
      handler: async (paymentResponse: RazorpayResponse) => {
        try {
          // 5. Send Payment Signature to Backend for Verification
          const verifyRes = await fetch(`${apiBaseUrl}/orders/verify-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              orderId,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            }),
          });

          const verifyResult = await verifyRes.json();

          if (verifyRes.ok && verifyResult.success) {
            onSuccess(orderCode);
          } else {
            onError(verifyResult.message || 'Payment verification failed.');
          }
        } catch (err: any) {
          onError(err.message || 'Error executing verification request.');
        }
      },
    };

    // 6. Open Modal
    const paymentModal = new window.Razorpay(options);
    paymentModal.open();
  } catch (err: any) {
    onError(err.message || 'Failed to process payment');
  }
};
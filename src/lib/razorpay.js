import { supabase } from './supabase'

/**
 * Razorpay payment integration helper.
 * 
 * Flow:
 * 1. Call createOrder() to get a Razorpay order from our Edge Function
 * 2. Open Razorpay checkout modal
 * 3. On payment success, call verifyPayment() to verify signature server-side
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Create a Razorpay order via Supabase Edge Function
 */
export async function createRazorpayOrder({ userId, userEmail, userName }) {
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      amount: 99,
      currency: 'INR',
      userId,
      userEmail,
      userName,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create order')
  }

  return response.json()
}

/**
 * Verify payment signature via Supabase Edge Function
 */
export async function verifyRazorpayPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  userId,
}) {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-razorpay-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Payment verification failed')
  }

  return response.json()
}

/**
 * Open Razorpay checkout modal
 * Returns a promise that resolves with payment details on success
 */
export function openRazorpayCheckout({ orderId, amount, currency, keyId, user }) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay SDK not loaded. Please refresh the page.'))
      return
    }

    const options = {
      key: keyId,
      amount: amount,
      currency: currency,
      name: 'NoteNook',
      description: 'Master Tier — Unlock all features',
      order_id: orderId,
      prefill: {
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
      },
      theme: {
        color: '#CC4B2C', // Primary brand color
        backdrop_color: 'rgba(0,0,0,0.7)',
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled'))
        },
        confirm_close: true,
        animation: true,
      },
      handler: (response) => {
        resolve({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'))
    })
    rzp.open()
  })
}

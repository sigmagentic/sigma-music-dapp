import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import { getApiWeb2Apps } from "libs/utils/misc";

const CheckoutForm = ({ clientSecret }: { clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement as StripeCardElement },
    });

    if (error) {
      setError(error.message || "An unknown error occurred");
    } else if (paymentIntent.status === "succeeded") {
      const paymentIntentId = paymentIntent.id;

      // ✅ Send to backend for verification
      const response = await fetch(`${getApiWeb2Apps()}/sigma/paymentVerifyPayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Payment verified! Minting NFT... 🚀");
        // Call your minting API here
      } else {
        alert("Payment verification failed! ❌");
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? "Processing..." : "Pay"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default CheckoutForm;

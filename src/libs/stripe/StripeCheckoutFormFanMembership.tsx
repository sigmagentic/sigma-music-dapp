import React, { useState, useEffect } from "react";
import { PaymentElement, useStripe, useElements, AddressElement } from "@stripe/react-stripe-js";
import { Loader } from "lucide-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";

type StripeCheckoutFormFanMembershipProps = {
  membershipProfile: {
    artistSlug: string;
    artistName: string;
    membershipId: string;
    tokenImg: string;
    membershipPriceUSD: number;
    membershipLabel: string;
    creatorPaymentsWallet: string;
  };
  closeStripePaymentPopup: () => void;
};

const StripeCheckoutFormFanMembership = ({ membershipProfile, closeStripePaymentPopup }: StripeCheckoutFormFanMembershipProps) => {
  const { publicKey } = useSolanaWallet();
  const { userInfo } = useWeb3Auth();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [email, setEmail] = useState(userInfo.email || "");
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (stripe && elements) {
      setIsReady(true);
    }
  }, [stripe, elements]);

  const validateEmail = (_email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!_email) {
      return "Email is required so we can send you the payment receipt";
    }
    if (!emailRegex.test(_email)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailError(validateEmail(newEmail));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError("Payment system is not ready yet. Please wait a moment.");
      return;
    }

    const emailValidationError = validateEmail(email);

    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      /* on the payment success page, we need some params so we can display the album purchase details and also redirect when it's done */
      const membershipId = membershipProfile.membershipId;
      const artistSlug = membershipProfile.artistSlug;
      const albumImg = membershipProfile.tokenImg;
      const albumTitle = membershipProfile.membershipLabel;
      const albumArtist = membershipProfile.artistName;
      const creatorWallet = membershipProfile.creatorPaymentsWallet;
      const buyerSolAddress = publicKey?.toBase58();
      const priceInUSDString = membershipProfile.membershipPriceUSD.toString();

      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?membershipId=${membershipId}&artist=${artistSlug}&albumImg=${encodeURIComponent(albumImg)}&albumTitle=${albumTitle}&albumArtist=${albumArtist}&creatorWallet=${creatorWallet}&buyerSolAddress=${buyerSolAddress}&priceInUSD=${priceInUSDString}&billingEmail=${encodeURIComponent(email)}`,
          receipt_email: email,
        },
      });

      if (submitError) {
        setError(submitError.message || "An unknown error occurred");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
        <p className="mt-2 text-gray-400">Initializing payment form...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {!paymentElementReady && (
        <div className="flex justify-center items-center">
          <Loader className="animate-spin" />
        </div>
      )}
      <div className="flex flex-col gap-4 mb-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email Address (for the payment receipt)
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Enter your email for the payment receipt"
            required
          />
          {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
        </div>
      </div>
      <PaymentElement onReady={() => setPaymentElementReady(true)} />
      <AddressElement options={{ mode: "billing" }} />
      <button
        className="mt-5 bg-gray-600 text-primary-foreground font-bold py-2 px-4 rounded-lg hover:opacity-90 mr-3"
        type="button"
        onClick={() => {
          closeStripePaymentPopup();
        }}>
        Cancel
      </button>
      <button
        className="mt-5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={loading || !stripe || !elements || !paymentElementReady || !!emailError}>
        {loading ? "Processing..." : "Pay"}
      </button>

      {error && (
        <div className="flex flex-col gap-4 mt-2">
          <p className="bg-red-600 p-2 rounded-lg text-sm">⚠️ {error}</p>
        </div>
      )}
    </form>
  );
};

export default StripeCheckoutFormFanMembership;

import React, { useState, useEffect } from "react";
import { PaymentElement, useStripe, useElements, AddressElement } from "@stripe/react-stripe-js";
import { Loader } from "lucide-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { Artist, Album } from "libs/types";
import { useAccountStore } from "store/account";

type StripeCheckoutFormAlbumProps = {
  artistProfile: Artist;
  albumToBuyAndMint: Album;
  priceInUSD: string | null;
  albumSaleTypeOption: string | null;
  closeStripePaymentPopup: () => void;
};

const StripeCheckoutFormAlbum = ({
  artistProfile,
  albumToBuyAndMint,
  priceInUSD,
  albumSaleTypeOption,
  closeStripePaymentPopup,
}: StripeCheckoutFormAlbumProps) => {
  const { publicKey } = useSolanaWallet();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const { userWeb2AccountDetails } = useAccountStore();

  useEffect(() => {
    if (stripe && elements) {
      setIsReady(true);
    }
  }, [stripe, elements]);

  useEffect(() => {
    if (
      userWeb2AccountDetails &&
      Object.keys(userWeb2AccountDetails).length > 0 &&
      userWeb2AccountDetails.billingEmail &&
      userWeb2AccountDetails.billingEmail !== ""
    ) {
      setEmail(userWeb2AccountDetails.billingEmail);
    }
  }, [userWeb2AccountDetails]);

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

    if (!priceInUSD) {
      setError("Price is not set.");
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
      const albumId = albumToBuyAndMint.albumId;
      const artistSlug = artistProfile.slug;
      const albumImg = albumToBuyAndMint.img;
      const albumTitle = albumToBuyAndMint.title;
      const albumArtist = artistProfile.name;
      const creatorWallet = artistProfile.creatorPaymentsWallet;
      const buyerSolAddress = publicKey?.toBase58();

      // do we have an iptoken configured for priceOption3? if so, we need to pass it to the payment success page
      let IpTokenId = "";

      if (albumSaleTypeOption === "priceOption3" && albumToBuyAndMint._buyNowMeta?.priceOption3?.IpTokenId) {
        IpTokenId = albumToBuyAndMint._buyNowMeta?.priceOption3?.IpTokenId || "";
      }

      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?albumId=${albumId}&artist=${artistSlug}&albumImg=${encodeURIComponent(albumImg)}&albumTitle=${albumTitle}&albumArtist=${albumArtist}&creatorWallet=${creatorWallet}&buyerSolAddress=${buyerSolAddress}&priceInUSD=${priceInUSD}&billingEmail=${encodeURIComponent(email)}&albumSaleTypeOption=${albumSaleTypeOption}&IpTokenId=${IpTokenId}`,
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
          <p className="bg-red-500 p-2 rounded-lg text-sm">⚠️ {error}</p>
        </div>
      )}
    </form>
  );
};

export default StripeCheckoutFormAlbum;

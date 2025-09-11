import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { X, ChevronLeft, ChevronRight, Music2, Mic2, Headphones, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { SOL_ENV_ENUM } from "config";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { Button } from "libComponents/Button";
import { Input } from "libComponents/Input";
import { InfoTooltip } from "libComponents/Tooltip";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { Artist } from "libs/types";
import {
  toastSuccess,
  updateUserProfileOnBackEndAPI,
  updateArtistProfileOnBackEndAPI,
  checkIfArtistSlugIsAvailableViaAPI,
  saveMediaToServerViaAPI,
} from "libs/utils";
import { isValidUrl, toastError } from "libs/utils/ui";
import { useAccountStore } from "store/account";
import { MediaUpdate } from "libComponents/MediaUpdate";

interface ExtendedProfileSetupWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  setHomeMode: (homeMode: string) => void;
}

interface ProfileFormData {
  profileTypes: string[];
  name: string;
  primaryAccountEmail: string;
  billingEmail: string;
  profileImage: string;
}

interface ArtistProfileData {
  name: string;
  bio: string;
  img: string;
  slug: string;
  altMainPortfolioLink: string;
  xLink: string;
  ytLink: string;
  tikTokLink: string;
  instaLink: string;
  webLink: string;
}

type WorkflowStep = "welcome" | "profileType" | "personalInfo" | "artistProfile" | "saving" | "success" | "error";

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidUrlInput = (url: string): boolean => {
  if (!url.trim()) return true; // Empty URLs are valid (optional field)
  return isValidUrl(url);
};

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export const ExtendedProfileSetupWorkflow: React.FC<ExtendedProfileSetupWorkflowProps> = ({ isOpen, onClose, setHomeMode }) => {
  const { userInfo, web3auth, signMessageViaWeb3Auth } = useWeb3Auth();
  const { publicKey: solanaPublicKey, walletType } = useSolanaWallet();
  const addressSol = solanaPublicKey?.toBase58();
  const { signMessage } = useWallet();
  const {
    updateUserWeb2AccountDetails,
    updateUserArtistProfile,
    solPreaccessNonce,
    solPreaccessSignature,
    solPreaccessTimestamp,
    updateSolPreaccessNonce,
    updateSolSignedPreaccess,
    updateSolPreaccessTimestamp,
  } = useAccountStore();

  const [currentStep, setCurrentStep] = useState<WorkflowStep>("welcome");
  const [userProfileData, setUserProfileData] = useState<ProfileFormData>({
    profileTypes: [],
    name: "",
    primaryAccountEmail: "",
    billingEmail: "",
    profileImage: "",
  });
  const [artistProfileData, setArtistProfileData] = useState<ArtistProfileData>({
    name: "",
    bio: "",
    img: "",
    slug: "",
    altMainPortfolioLink: "",
    xLink: "",
    ytLink: "",
    tikTokLink: "",
    instaLink: "",
    webLink: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [artistErrors, setArtistErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<"available" | "unavailable" | "unchecked" | "checking">("unchecked");
  const [newSelectedProfileImageFile, setNewSelectedProfileImageFile] = useState<File | null>(null); // keeps track if a new file is selected for edit so we can save it to the server to get back a https url for profileImage
  const [newSelectedArtistProfileImageFile, setNewSelectedArtistProfileImageFile] = useState<File | null>(null);

  // Add effect to prevent body scrolling when modal is open
  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Pre-populate account email if available from web3auth
      if (walletType === "web3auth" && userInfo?.email) {
        setUserProfileData((prev) => ({
          ...prev,
          primaryAccountEmail: userInfo.email || "",
          billingEmail: userInfo.email || "",
          profileImage: userInfo.profileImage || "",
        }));
      }
    }
  }, [isOpen, walletType, userInfo]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep === "welcome") {
      setCurrentStep("profileType");
    } else if (currentStep === "profileType") {
      if (userProfileData.profileTypes.length === 0) {
        setErrors({ profileTypes: "Please select at least one profile type" });
        return;
      }
      setCurrentStep("personalInfo");
      setErrors({});
    } else if (currentStep === "personalInfo") {
      if (validatePersonalInfo()) {
        // Check if user needs to fill artist profile data
        if (userProfileData.profileTypes.includes("remixer") || userProfileData.profileTypes.includes("composer")) {
          setCurrentStep("artistProfile");
        } else {
          setCurrentStep("saving");
          handleProfileSave();
        }
      }
    } else if (currentStep === "artistProfile") {
      if (validateArtistProfile()) {
        setCurrentStep("saving");
        handleProfileSave();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep === "profileType") {
      setCurrentStep("welcome");
    } else if (currentStep === "personalInfo") {
      setCurrentStep("profileType");
    } else if (currentStep === "artistProfile") {
      setCurrentStep("personalInfo");
    }
  };

  const handleProfileTypeChange = (profileType: string, isChecked: boolean) => {
    setUserProfileData((prev) => {
      const currentTypes = prev.profileTypes || [];
      if (isChecked) {
        if (!currentTypes.includes(profileType)) {
          return { ...prev, profileTypes: [...currentTypes, profileType] };
        }
      } else {
        return { ...prev, profileTypes: currentTypes.filter((type) => type !== profileType) };
      }
      return prev;
    });

    if (errors.profileTypes) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.profileTypes;
        return newErrors;
      });
    }
  };

  const handleFormChange = (field: keyof ProfileFormData, value: string) => {
    setUserProfileData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleArtistProfileChange = (field: keyof ArtistProfileData, value: string) => {
    setArtistProfileData((prev) => ({ ...prev, [field]: value }));
    if (artistErrors[field]) {
      setArtistErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleArtistNameChange = (name: string) => {
    handleArtistProfileChange("name", name);
    // Auto-generate slug when name changes
    const generatedSlug = generateSlug(name);
    // handleArtistProfileChange("slug", generatedSlug);

    handleArtistProfileChange("slug", generatedSlug);
    // Reset availability status when slug changes
    setSlugAvailability("unchecked");
    // Clear any existing slug errors
    if (artistErrors.slug) {
      setArtistErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.slug;
        return newErrors;
      });
    }
  };

  const handleSlugChange = (slug: string) => {
    handleArtistProfileChange("slug", slug);
    // Reset availability status when slug changes
    setSlugAvailability("unchecked");
    // Clear any existing slug errors
    if (artistErrors.slug) {
      setArtistErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.slug;
        return newErrors;
      });
    }
  };

  const checkSlugAvailability = async () => {
    if (!artistProfileData.slug.trim()) {
      setArtistErrors((prev) => ({ ...prev, slug: "Please enter a slug first" }));
      return;
    }

    if (!/^[a-z0-9-]+$/.test(artistProfileData.slug)) {
      setArtistErrors((prev) => ({ ...prev, slug: "Profile URL slug can only contain lowercase letters, numbers, and hyphens" }));
      return;
    }

    setIsCheckingSlug(true);
    setSlugAvailability("checking");

    try {
      const result = await checkIfArtistSlugIsAvailableViaAPI(artistProfileData.slug);
      if (result.isAvailable) {
        setSlugAvailability("available");
        setArtistErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.slug;
          return newErrors;
        });
      } else {
        setSlugAvailability("unavailable");
        setArtistErrors((prev) => ({ ...prev, slug: "This slug is already taken. Please try another one." }));
      }
    } catch (error) {
      setSlugAvailability("unchecked");
      setArtistErrors((prev) => ({ ...prev, slug: "Error checking slug availability. Please try again." }));
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const validateArtistProfile = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Artist name validation - required, max 50 characters
    if (!artistProfileData.name.trim()) {
      newErrors.name = "Artist name is required";
    } else if (artistProfileData.name.length > 50) {
      newErrors.name = "Artist name must be 50 characters or less";
    } else if (!/^[a-zA-Z0-9- ]+$/.test(artistProfileData.name)) {
      newErrors.name = "Artist name can only contain letters, numbers, spaces, and hyphens";
    }

    // Bio validation - required, max 1000 characters
    if (!artistProfileData.bio.trim()) {
      newErrors.bio = "Artist bio is required";
    } else if (artistProfileData.bio.length > 1000) {
      newErrors.bio = "Artist bio must be 1000 characters or less";
    }

    // Image validation - required, must be valid HTTPS URL
    if (!newSelectedArtistProfileImageFile) {
      newErrors.img = "Profile image is required";
    }

    // check if the profile image is less than 3MB
    if (newSelectedArtistProfileImageFile) {
      if (newSelectedArtistProfileImageFile.size > 3 * 1024 * 1024) {
        newErrors.img = "Profile image must be less than 3MB";
      }

      // Validate file type
      const fileName = newSelectedArtistProfileImageFile.name.toLowerCase();
      const validExtensions = [".gif", ".png", ".jpg"];
      const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

      if (!hasValidExtension) {
        newErrors.img = "Cover art must be a GIF, PNG, or JPG file";
      }

      // Check for JPEG and ask to rename to JPG
      if (fileName.endsWith(".jpeg")) {
        newErrors.img = "Please rename your JPEG file to JPG and try again";
      }
    }

    // Slug validation - required, max 80 characters, no spaces or special chars, and must be available
    if (!artistProfileData.slug.trim()) {
      newErrors.slug = "Profile URL slug is required";
    } else if (artistProfileData.slug.length > 80) {
      newErrors.slug = "Profile URL slug must be 80 characters or less";
    } else if (!/^[a-z0-9-]+$/.test(artistProfileData.slug)) {
      newErrors.slug = "Profile URL slug can only contain lowercase letters, numbers, and hyphens";
    } else if (slugAvailability !== "available") {
      newErrors.slug = "Please check slug availability before proceeding";
    }

    // Optional link validations - if provided, must be valid HTTPS URLs
    if (artistProfileData.altMainPortfolioLink.trim() && !isValidUrlInput(artistProfileData.altMainPortfolioLink)) {
      newErrors.altMainPortfolioLink = "Please enter a valid HTTPS URL";
    }
    if (artistProfileData.xLink.trim() && !isValidUrlInput(artistProfileData.xLink)) {
      newErrors.xLink = "Please enter a valid HTTPS URL";
    }
    if (artistProfileData.ytLink.trim() && !isValidUrlInput(artistProfileData.ytLink)) {
      newErrors.ytLink = "Please enter a valid HTTPS URL";
    }
    if (artistProfileData.tikTokLink.trim() && !isValidUrlInput(artistProfileData.tikTokLink)) {
      newErrors.tikTokLink = "Please enter a valid HTTPS URL";
    }
    if (artistProfileData.instaLink.trim() && !isValidUrlInput(artistProfileData.instaLink)) {
      newErrors.instaLink = "Please enter a valid HTTPS URL";
    }
    if (artistProfileData.webLink.trim() && !isValidUrlInput(artistProfileData.webLink)) {
      newErrors.webLink = "Please enter a valid HTTPS URL";
    }

    setArtistErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePersonalInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation - optional but if provided, must be under 300 characters
    if (userProfileData.name.trim() && userProfileData.name.length > 300) {
      newErrors.name = "Name must be 300 characters or less";
    }

    // Account email validation - optional but if provided, must be valid email
    if (userProfileData.primaryAccountEmail.trim() && !isValidEmail(userProfileData.primaryAccountEmail)) {
      newErrors.primaryAccountEmail = "Please enter a valid email address";
    }

    // Billing email validation - optional but if provided, must be valid email
    if (userProfileData.billingEmail.trim() && !isValidEmail(userProfileData.billingEmail)) {
      newErrors.billingEmail = "Please enter a valid email address";
    }

    // Profile image URL validation - optional but if provided, must be valid HTTPS URL
    if (userProfileData.profileImage.trim() && !isValidUrlInput(userProfileData.profileImage)) {
      newErrors.profileImage = "Please enter a valid HTTPS URL";
    }

    // check if the profile image is less than 3MB
    if (newSelectedProfileImageFile) {
      if (newSelectedProfileImageFile.size > 3 * 1024 * 1024) {
        newErrors.profileImage = "Profile image must be less than 3MB";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSave = async () => {
    try {
      if (!addressSol) {
        throw new Error("No wallet address found");
      }

      setIsSubmitting(true);
      setErrorMessage("");

      const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;

      // Get the pre-access nonce and signature
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
        publicKey: solanaPublicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      if (!usedPreAccessNonce || !usedPreAccessSignature) {
        throw new Error("Failed to get valid signature to prove account ownership");
      }

      if (newSelectedProfileImageFile) {
        const fileUploadResponse = await saveMediaToServerViaAPI(newSelectedProfileImageFile, usedPreAccessSignature, usedPreAccessNonce, addressSol);

        if (fileUploadResponse) {
          userProfileData.profileImage = fileUploadResponse;
        } else {
          toastError("Error uploading profile image but other profile data was saved. You can upload a profile image later.");
          return;
        }
      }

      const profileDataToSave: Record<string, any> = {
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        addr: addressSol,
        chainId: chainId,
        displayName: userProfileData.name,
        billingEmail: userProfileData.billingEmail,
        profileTypes: userProfileData.profileTypes,
        profileImage: userProfileData.profileImage,
      };

      // If the user is using a native wallet, we need to save the primary account email
      if (walletType !== "web3auth" && userProfileData.primaryAccountEmail) {
        profileDataToSave.primaryAccountEmail = userProfileData.primaryAccountEmail;
      }

      const response = await updateUserProfileOnBackEndAPI(profileDataToSave);

      const updatedUserWeb2AccountDetails = { ...response };
      delete updatedUserWeb2AccountDetails.chainId;

      updateUserWeb2AccountDetails(updatedUserWeb2AccountDetails);

      // If user is an artist, also save artist profile
      if (userProfileData.profileTypes.includes("remixer") || userProfileData.profileTypes.includes("composer")) {
        try {
          if (newSelectedArtistProfileImageFile) {
            const fileUploadResponse = await saveMediaToServerViaAPI(newSelectedArtistProfileImageFile, usedPreAccessSignature, usedPreAccessNonce, addressSol);

            if (fileUploadResponse) {
              artistProfileData.img = fileUploadResponse;
            } else {
              toastError("Error uploading artist profile image but other artist profile data was saved. You can upload a profile image later.");
              return;
            }
          }

          const artistProfileDataToSave = {
            solSignature: usedPreAccessSignature,
            signatureNonce: usedPreAccessNonce,
            callerAsCreatorWallet: addressSol,
            artistFieldsObject: {
              name: artistProfileData.name,
              bio: artistProfileData.bio,
              img: artistProfileData.img,
              slug: artistProfileData.slug,
              altMainPortfolioLink: artistProfileData.altMainPortfolioLink,
              xLink: artistProfileData.xLink,
              ytLink: artistProfileData.ytLink,
              tikTokLink: artistProfileData.tikTokLink,
              instaLink: artistProfileData.instaLink,
              webLink: artistProfileData.webLink,
            },
          };

          const artistResponse = await updateArtistProfileOnBackEndAPI(artistProfileDataToSave);

          if (artistResponse.created) {
            toastSuccess("Artist profile created successfully!", true);

            // artists.fullArtistData will return the FULL artist profile data
            // we need to update the userWeb2AccountDetails with the full artist profile data
            updateUserArtistProfile(artistResponse.fullArtistData as Artist);
          }
        } catch (artistError) {
          console.error("Error saving artist profile:", artistError);
          const artistErrorMsg = (artistError as Error).message || "Unknown error occurred";
          setErrorMessage(`Profile saved but artist profile failed: ${artistErrorMsg}`);
          setCurrentStep("error");
          return;
        }
      } else {
        toastSuccess("Profile saved successfully!", true);
      }

      setCurrentStep("success");
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMsg = (error as Error).message || "Unknown error occurred";
      setErrorMessage(errorMsg);
      setCurrentStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipPersonalInfo = () => {
    if (userProfileData.profileTypes.includes("remixer") || userProfileData.profileTypes.includes("composer")) {
      setCurrentStep("artistProfile");
    } else {
      setCurrentStep("saving");
      handleProfileSave();
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center py-8">
      <h2 className="font-bold mb-2 !text-white">Welcome to Sigma Music!</h2>
      <p className="text-lg mb-8 text-gray-300">Let's take a few seconds to setup your profile.</p>
      <Button
        onClick={handleNext}
        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-3 rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all duration-200 font-semibold">
        Next, Pick Your Profile Type
      </Button>
    </div>
  );

  const renderProfileTypeStep = () => (
    <div className="py-6">
      <div className="text-center mb-8">
        <h2 className="!text-2xl font-bold mb-2 !text-yellow-500">Choose Your Profile Type</h2>
        <p className="text-gray-300 mb-2">Select the option that's MOST relevant to you so we can best optimize your app experience.</p>
        <p className="text-sm text-gray-400">You can select multiple options if needed. At least one selection is required.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            id: "fan",
            title: "Fan Only",
            description: "You only want to stream music or follow, support and collect music from your favorite artists or discover new music.",
            icon: Headphones,
            color: "from-blue-500 to-purple-600",
          },
          {
            id: "composer",
            title: "Composing Artist",
            description:
              "You compose original music! You can publish your work to Sigma Music and sell digital albums, collectibles, AI remix licenses & fan memberships.",
            icon: Music2,
            color: "from-green-500 to-teal-600",
          },
          {
            id: "remixer",
            title: "Remix Artist",
            description: "You will use AI tools to remix original music from real-world artists and publish them yourself on your own 'remix artist' profile.",
            icon: Mic2,
            color: "from-orange-500 to-red-600",
          },
        ].map((option) => {
          const IconComponent = option.icon;
          const isSelected = userProfileData.profileTypes.includes(option.id);

          return (
            <div key={option.id} className="relative">
              <button
                onClick={() => handleProfileTypeChange(option.id, !isSelected)}
                className={`w-[90%] md:w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? `border-transparent bg-gradient-to-br ${option.color} shadow-lg scale-105`
                    : "border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700"
                }`}>
                <div className="flex items-center justify-between mb-4">
                  <IconComponent size={32} className={isSelected ? "text-white" : "text-gray-400"} />
                  {isSelected && <CheckCircle2 size={24} className="text-white" />}
                </div>
                <h3 className={`mb-2 ${isSelected ? "text-white" : "text-white"}`}>{option.title}</h3>
              </button>
              <p className={`mt-5 text-[12px] text-center ${isSelected ? "text-white/90" : "text-gray-400"}`}>{option.description}</p>
            </div>
          );
        })}
      </div>

      {errors.profileTypes && <div className="text-red-400 text-center mb-4">{errors.profileTypes}</div>}

      <div className="flex justify-between">
        <Button onClick={handlePrevious} variant="outline" className="border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white">
          <ChevronLeft size={20} className="mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-2 rounded-lg hover:from-yellow-400 hover:to-orange-400">
          Next
          <ChevronRight size={20} className="ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderPersonalInfoStep = () => (
    <div className="py-6 bgx-green-500 w-full md:w-3/4">
      <div className="text-center mb-8">
        <h2 className="!text-2xl font-bold mb-2 !text-yellow-500">Personal Information</h2>
        <p className="text-gray-400 text-sm">Let's get to know you better. All fields are optional and can be updated later.</p>
      </div>

      <div className="space-y-6 mb-8 flex md:flex-row flex-col gap-4 bgx-red-500">
        <div className="flex flex-col gap-4 md:w-2/3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
              <InfoTooltip content="This is your account name, it's separate from your artist name (if you are joining as an artist)." position="right" />
            </label>
            <Input
              type="text"
              value={userProfileData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              placeholder="Enter your full name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Email
              <InfoTooltip content="This is your account email. Any emails relating to your account are sent here." position="right" />
            </label>
            <Input
              type="email"
              value={userProfileData.primaryAccountEmail}
              onChange={(e) => handleFormChange("primaryAccountEmail", e.target.value)}
              placeholder="Enter your account email"
              disabled={walletType === "web3auth"}
              className={errors.primaryAccountEmail ? "border-red-500" : ""}
            />
            {walletType === "web3auth" && <p className="text-gray-400 text-sm mt-1">Email from Web3Auth account</p>}
            {errors.primaryAccountEmail && <p className="text-red-400 text-xs mt-1">{errors.primaryAccountEmail}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Billing / Payouts Email
              <InfoTooltip content="Any billing, invoices and payouts related emails are sent here." position="right" />
            </label>
            <Input
              type="email"
              value={userProfileData.billingEmail}
              onChange={(e) => handleFormChange("billingEmail", e.target.value)}
              placeholder="Enter your billing / payouts email"
              className={errors.billingEmail ? "border-red-500" : ""}
            />
            {errors.billingEmail && <p className="text-red-400 text-xs mt-1">{errors.billingEmail}</p>}
          </div>
        </div>
        <div className="md:w-1/3 flex flex-col items-center justify-top">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Profile Image URL
            <InfoTooltip content="Enter a direct link to your profile image. Must be an HTTPS URL." position="right" />
          </label>
          <div className="mb-3">
            <MediaUpdate
              imageUrl={userProfileData.profileImage}
              size="md"
              onFileSelect={(file) => {
                console.log("Selected file:", file);
                setNewSelectedProfileImageFile(file);
              }}
              onFileRevert={() => {
                console.log("File reverted");
                setNewSelectedProfileImageFile(null);
              }}
              alt="Profile"
            />
          </div>
          {/* <Input
            type="url"
            value={userProfileData.profileImage}
            onChange={(e) => handleFormChange("profileImage", e.target.value)}
            placeholder="https://example.com/image.jpg"
            className={errors.profileImage ? "border-red-500" : ""}
          /> */}
          {errors.profileImage && <p className="text-red-400 text-xs mt-1">{errors.profileImage}</p>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between bgx-blue-500">
        <Button onClick={handlePrevious} variant="outline" className="border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white ">
          <ChevronLeft size={20} className="mr-2" />
          Back
        </Button>
        <div className="flex gap-3">
          <Button onClick={handleSkipPersonalInfo} variant="outline" className="border-gray-600 text-gray-300 hover:border-gray-500 hover:text-whit md:ml-2 ">
            Skip for now
          </Button>
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-2 rounded-lg hover:from-yellow-400 hover:to-orange-400">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );

  const renderArtistProfileStep = () => (
    <div className="py-6 bgx-green-500 w-full md:w-3/4">
      <div className="text-center mb-8">
        <h2 className="!text-2xl font-bold mb-2 !text-yellow-500">Artist Profile Setup</h2>
        <p className="text-gray-300 mb-2">Let's set up your artist profile to showcase your music and connect with fans.</p>
      </div>

      <div className="">
        <div className="space-y-6 mb-8 flex md:flex-row flex-col gap-4 bgx-red-500">
          <div className="flex flex-col gap-4 md:w-2/3">
            {/* Artist Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Artist Name *
                <InfoTooltip content="This is your Artist Name" position="right" />
              </label>
              <Input
                type="text"
                value={artistProfileData.name}
                onChange={(e) => handleArtistNameChange(e.target.value)}
                placeholder="Enter your artist name - e.g. Young Buck"
                maxLength={50}
                className={artistErrors.name ? "border-red-500" : ""}
              />
              {artistErrors.name && <p className="text-red-400 text-xs mt-1">{artistErrors.name}</p>}
              <p className="text-gray-600 text-xs mt-2">{artistProfileData.name.length}/50 characters</p>
            </div>

            {/* Artist Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Artist Bio *
                <InfoTooltip content="This is your Artist Bio" position="right" />
              </label>
              <textarea
                value={artistProfileData.bio}
                onChange={(e) => handleArtistProfileChange("bio", e.target.value)}
                placeholder="Tell us about your music, style, and what makes you unique..."
                maxLength={1000}
                rows={4}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
                  artistErrors.bio ? "border-red-500" : "border-gray-600"
                }`}
              />
              {artistErrors.bio && <p className="text-red-400 text-xs mt-1">{artistErrors.bio}</p>}
              <p className="text-gray-600 text-xs mt-1">{artistProfileData.bio.length}/1000 characters</p>
            </div>
          </div>

          <div className="md:w-1/3 flex flex-col items-center justify-top">
            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Profile Image *
                <InfoTooltip content="Enter a direct link to your profile image. Must be an HTTPS URL." position="right" />
              </label>

              <div className="mb-3">
                <MediaUpdate
                  imageUrl={artistProfileData.img}
                  size="md"
                  onFileSelect={(file) => {
                    console.log("Selected file:", file);
                    setNewSelectedArtistProfileImageFile(file);
                  }}
                  onFileRevert={() => {
                    console.log("File reverted");
                    setNewSelectedArtistProfileImageFile(null);
                  }}
                  alt="Profile"
                />
              </div>

              {/* <Input
            type="url"
            value={artistProfileData.img}
            onChange={(e) => handleArtistProfileChange("img", e.target.value)}
            placeholder="https://example.com/artist-image.jpg"
            className={artistErrors.img ? "border-red-500" : ""}
          /> */}
              {artistErrors.img && <p className="text-red-400 text-xs mt-1">{artistErrors.img}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {/* Profile URL Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profile URL Slug *
              <InfoTooltip
                content="This friendly URL slug is used for your profile page and helps with profile discovery and sharing. It's best if it matches your artist name and it must be unique."
                position="right"
              />
            </label>
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  type="text"
                  value={artistProfileData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="young-buck"
                  maxLength={80}
                  className={`flex-1 ${artistErrors.slug ? "border-red-500" : ""}`}
                />
                <Button
                  onClick={checkSlugAvailability}
                  disabled={!artistProfileData.slug.trim() || isCheckingSlug}
                  variant="outline"
                  className="px-4 py-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                  {isCheckingSlug ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check Availability"
                  )}
                </Button>
              </div>

              {/* Availability Status */}
              {slugAvailability === "available" && (
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4 mr-2" />✓ Slug is available!
                </div>
              )}
              {slugAvailability === "unavailable" && (
                <div className="flex items-center text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 mr-2" />✗ Slug is already taken
                </div>
              )}
              {slugAvailability === "checking" && (
                <div className="flex items-center text-yellow-400 text-sm">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking availability...
                </div>
              )}
            </div>
            {artistErrors.slug && <p className="text-red-400 text-xs mt-1">{artistErrors.slug}</p>}
            <p className="text-gray-400 text-xs mt-1">Your profile will be available at: sigma-music.com/artist/{artistProfileData.slug}</p>
            {slugAvailability !== "available" && (
              <p className="text-xs mt-1">Click the "Check Availability" button to verify if the slug is available to proceed.</p>
            )}
          </div>

          {/* Social Media Links Section */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-2">Social Media & Links</h3>
            <p className="text-gray-400 text-xs mb-10">
              All social media links are optional. <br />
              We'll verify by sending you a DM or validating your content, and once confirmed, you'll get a "Verified Artist" badge!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Music Portfolio Account (Soundcloud, Bandcamp, Spotify, Apple Music, etc) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Main Music Portfolio
                  <InfoTooltip
                    content="Enter Full URL of your preferred Music Portfolio profile (Soundcloud, Bandcamp, Spotify, Apple Music, YouTube, etc)"
                    position="right"
                  />
                </label>
                <Input
                  type="url"
                  value={artistProfileData.altMainPortfolioLink}
                  onChange={(e) => handleArtistProfileChange("altMainPortfolioLink", e.target.value)}
                  placeholder="https://x.com/yourusername"
                  className={artistErrors.altMainPortfolioLink ? "border-red-500" : ""}
                />
                {artistErrors.altMainPortfolioLink && <p className="text-red-400 text-xs mt-1">{artistErrors.altMainPortfolioLink}</p>}
              </div>

              {/* X Account */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  X Account
                  <InfoTooltip content="Enter Full URL of your X Account" position="right" />
                </label>
                <Input
                  type="url"
                  value={artistProfileData.xLink}
                  onChange={(e) => handleArtistProfileChange("xLink", e.target.value)}
                  placeholder="https://x.com/yourusername"
                  className={artistErrors.xLink ? "border-red-500" : ""}
                />
                {artistErrors.xLink && <p className="text-red-400 text-xs mt-1">{artistErrors.xLink}</p>}
              </div>

              {/* YouTube Account */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  YouTube Account
                  <InfoTooltip content="Enter Full URL of your YouTube Account" position="right" />
                </label>
                <Input
                  type="url"
                  value={artistProfileData.ytLink}
                  onChange={(e) => handleArtistProfileChange("ytLink", e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className={artistErrors.ytLink ? "border-red-500" : ""}
                />
                {artistErrors.ytLink && <p className="text-red-400 text-xs mt-1">{artistErrors.ytLink}</p>}
              </div>

              {/* TikTok Account */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  TikTok Account
                  <InfoTooltip content="Enter Full URL of your TikTok Account" position="right" />
                </label>
                <Input
                  type="url"
                  value={artistProfileData.tikTokLink}
                  onChange={(e) => handleArtistProfileChange("tikTokLink", e.target.value)}
                  placeholder="https://tiktok.com/@yourusername"
                  className={artistErrors.tikTokLink ? "border-red-500" : ""}
                />
                {artistErrors.tikTokLink && <p className="text-red-400 text-xs mt-1">{artistErrors.tikTokLink}</p>}
              </div>

              {/* Instagram Account */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instagram Account
                  <InfoTooltip content="Enter Full URL of your Instagram Account" position="right" />
                </label>
                <Input
                  type="url"
                  value={artistProfileData.instaLink}
                  onChange={(e) => handleArtistProfileChange("instaLink", e.target.value)}
                  placeholder="https://instagram.com/yourusername"
                  className={artistErrors.instaLink ? "border-red-500" : ""}
                />
                {artistErrors.instaLink && <p className="text-red-400 text-xs mt-1">{artistErrors.instaLink}</p>}
              </div>

              {/* Website */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website or any other link
                  <InfoTooltip content="Enter Full URL of your Website" position="right" />
                </label>
                <Input
                  type="url"
                  value={artistProfileData.webLink}
                  onChange={(e) => handleArtistProfileChange("webLink", e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className={artistErrors.webLink ? "border-red-500" : ""}
                />
                {artistErrors.webLink && <p className="text-red-400 text-xs mt-1">{artistErrors.webLink}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={handlePrevious} variant="outline" className="border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white">
          <ChevronLeft size={20} className="mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isCheckingSlug || slugAvailability !== "available"}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-2 rounded-lg hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed">
          Continue
        </Button>
      </div>
    </div>
  );

  const renderSavingStep = () => (
    <div className="text-center py-12">
      <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mx-auto mb-6" />
      <h2 className="!text-2xl font-bold mb-4 text-white">Setting up your profile...</h2>
      <p className="text-gray-300">Please wait while we save your information.</p>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-12">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
      <h2 className="!text-2xl font-bold mb-4 text-white">Profile Setup Complete!</h2>
      <p className="text-gray-300 mb-8">Your profile has been setup successfully. Let's explore the app now!</p>

      <div className="flex justify-center gap-4">
        {(userProfileData.profileTypes.includes("remixer") || userProfileData.profileTypes.includes("composer")) && (
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-[1px] px-[2px] rounded-lg justify-center">
            <Button
              onClick={() => {
                setHomeMode("profile");
                onClose();
              }}
              className="bg-background text-foreground hover:bg-background/90 border-0 rounded-md font-medium tracking-wide !text-sm"
              variant="outline">
              Launch your First Album!
            </Button>
          </div>
        )}

        <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-[1px] px-[2px] rounded-lg justify-center">
          <Button
            onClick={onClose}
            className="bg-background text-foreground hover:bg-background/90 border-0 rounded-md font-medium tracking-wide !text-sm"
            variant="outline">
            Close & Explore App
          </Button>
        </div>
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
      <h2 className="!text-2xl font-bold mb-4 text-white">Something went wrong</h2>
      <p className="text-gray-300 mb-4 text-sm">We encountered an error while setting up your profile.</p>
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6 max-w-md mx-auto">
        <p className="text-red-400 text-xs">{errorMessage}</p>
      </div>
      <p className="text-gray-300 mb-8 text-sm">You can still explore the app and complete your profile setup later.</p>
      <div className="flex justify-center gap-4">
        <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-[1px] px-[2px] rounded-lg justify-center">
          <Button
            onClick={onClose}
            className="bg-background text-foreground hover:bg-background/90 border-0 rounded-md font-medium tracking-wide !text-sm"
            variant="outline">
            Close & Explore App
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "welcome":
        return renderWelcomeStep();
      case "profileType":
        return renderProfileTypeStep();
      case "personalInfo":
        return renderPersonalInfoStep();
      case "artistProfile":
        return renderArtistProfileStep();
      case "saving":
        return renderSavingStep();
      case "success":
        return renderSuccessStep();
      case "error":
        return renderErrorStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-yellow-400 bg-opacity-30 p-4">
        <div className="bg-black rounded-lg p-6 max-w-4xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
          {currentStep !== "saving" && currentStep !== "success" && currentStep !== "error" && (
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          )}

          <div className="flex flex-col items-center">{renderCurrentStep()}</div>
        </div>
      </div>
    </>
  );
};

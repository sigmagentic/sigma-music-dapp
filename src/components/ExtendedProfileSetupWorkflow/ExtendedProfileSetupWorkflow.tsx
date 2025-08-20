import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Music2, Mic2, Headphones, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "libComponents/Button";
import { InfoTooltip } from "libComponents/Tooltip";
import { Input } from "libComponents/Input";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { SOL_ENV_ENUM } from "config";
import { toastError, toastSuccess, updateUserProfileOnBackEndAPI } from "libs/utils";
import { useAccountStore } from "store/account";
import { isValidUrl } from "libs/utils/ui";

interface ExtendedProfileSetupWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileFormData {
  profileTypes: string[];
  name: string;
  primaryAccountEmail: string;
  billingEmail: string;
  profileImage: string;
}

type WorkflowStep = "welcome" | "profileType" | "personalInfo" | "saving" | "success" | "error";

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidUrlInput = (url: string): boolean => {
  if (!url.trim()) return true; // Empty URLs are valid (optional field)
  return isValidUrl(url);
};

export const ExtendedProfileSetupWorkflow: React.FC<ExtendedProfileSetupWorkflowProps> = ({ isOpen, onClose }) => {
  const { isConnected: isLoggedInSol } = useSolanaWallet();
  const { userInfo, publicKey: web3AuthPublicKey } = useWeb3Auth();
  const { publicKey: solanaPublicKey, walletType } = useSolanaWallet();
  const { signMessage } = useWallet();
  const { userWeb2AccountDetails, updateUserWeb2AccountDetails, solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolSignedPreaccess, updateSolPreaccessTimestamp } = useAccountStore();

  const [currentStep, setCurrentStep] = useState<WorkflowStep>("welcome");
  const [formData, setFormData] = useState<ProfileFormData>({
    profileTypes: [],
    name: "",
    primaryAccountEmail: "",
    billingEmail: "",
    profileImage: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Use the appropriate public key based on wallet type
  const displayPublicKey = walletType === "web3auth" ? web3AuthPublicKey : solanaPublicKey;

  useEffect(() => {
    if (isOpen) {
      // Pre-populate account email if available from web3auth
      if (walletType === "web3auth" && userInfo?.email) {
        setFormData(prev => ({
          ...prev,
          primaryAccountEmail: userInfo.email || "",
          billingEmail: userInfo.email || "",
          profileImage: userInfo.profileImage || ""
        }));
      }
    }
  }, [isOpen, walletType, userInfo]);

  if (!isOpen) return null;

  const handleNext = () => {
    debugger;
    if (currentStep === "welcome") {
      setCurrentStep("profileType");
    } else if (currentStep === "profileType") {
      if (formData.profileTypes.length === 0) {
        setErrors({ profileTypes: "Please select at least one profile type" });
        return;
      }
      setCurrentStep("personalInfo");
      setErrors({});
    } else if (currentStep === "personalInfo") {
      if (validatePersonalInfo()) {
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
    }
  };

  const handleProfileTypeChange = (profileType: string, isChecked: boolean) => {
    setFormData(prev => {
      const currentTypes = prev.profileTypes || [];
      if (isChecked) {
        if (!currentTypes.includes(profileType)) {
          return { ...prev, profileTypes: [...currentTypes, profileType] };
        }
      } else {
        return { ...prev, profileTypes: currentTypes.filter(type => type !== profileType) };
      }
      return prev;
    });
    
    if (errors.profileTypes) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.profileTypes;
        return newErrors;
      });
    }
  };

  const handleFormChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validatePersonalInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation - optional but if provided, must be under 300 characters
    if (formData.name.trim() && formData.name.length > 300) {
      newErrors.name = "Name must be 300 characters or less";
    }

    // Account email validation - optional but if provided, must be valid email
    if (formData.primaryAccountEmail.trim() && !isValidEmail(formData.primaryAccountEmail)) {
      newErrors.primaryAccountEmail = "Please enter a valid email address";
    }

    // Billing email validation - optional but if provided, must be valid email
    if (formData.billingEmail.trim() && !isValidEmail(formData.billingEmail)) {
      newErrors.billingEmail = "Please enter a valid email address";
    }

    // Profile image URL validation - optional but if provided, must be valid HTTPS URL
    if (formData.profileImage.trim() && !isValidUrlInput(formData.profileImage)) {
      newErrors.profileImage = "Please enter a valid HTTPS URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSave = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;

      // Get the pre-access nonce and signature
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage,
        publicKey: solanaPublicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      if (!usedPreAccessNonce || !usedPreAccessSignature) {
        throw new Error("Failed to get valid signature to prove account ownership");
      }

      const profileDataToSave: Record<string, any> = {
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        addr: displayPublicKey,
        chainId: chainId,
        displayName: formData.name,
        billingEmail: formData.billingEmail,
        profileTypes: formData.profileTypes,
        profileImage: formData.profileImage,
      };

      // If the user is using a native wallet, we need to save the primary account email
      if (walletType !== "web3auth" && formData.primaryAccountEmail) {
        profileDataToSave.primaryAccountEmail = formData.primaryAccountEmail;
      }

      const response = await updateUserProfileOnBackEndAPI(profileDataToSave);
      console.log("Profile saved:", response);

      const updatedUserWeb2AccountDetails = { ...response };
      delete updatedUserWeb2AccountDetails.chainId;

      updateUserWeb2AccountDetails(updatedUserWeb2AccountDetails);

      toastSuccess("Profile saved successfully", true);
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

  const handleSkip = () => {
    setCurrentStep("saving");
    handleProfileSave();
  };

  const renderWelcomeStep = () => (
    <div className="text-center py-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Welcome to Sigma Music!</h2>
      <p className="text-lg mb-8 text-gray-300">Let's take a few seconds to setup your profile.</p>
      <Button 
        onClick={handleNext} 
        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-3 rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all duration-200 font-semibold"
      >
        Next, Pick Your Profile Type
      </Button>
    </div>
  );

  const renderProfileTypeStep = () => (
    <div className="py-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Choose Your Profile Type</h2>
        <p className="text-gray-300 mb-6">Select the option that's MOST relevant to you so we can best optimize your app experience.</p>
        <p className="text-sm text-gray-400">You can select multiple options if needed. At least one selection is required.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            id: "fan",
            title: "Fan Only",
            description: "You only want to stream music or follow and support your favorite artists.",
            icon: Headphones,
            color: "from-blue-500 to-purple-600"
          },
          {
            id: "remixer",
            title: "Remix Artist",
            description: "You will use Sigma AI tools to remix original music from real-world artists and publish them yourself on your own 'remix artist' profile.",
            icon: Mic2,
            color: "from-green-500 to-teal-600"
          },
          {
            id: "composer",
            title: "Composing Artist",
            description: "You compose original music, you are the OG of the music industry. You can publish your original tracks to Sigma Music and sell digital albums, collectibles, AI remix licenses, fan memberships etc.",
            icon: Music2,
            color: "from-orange-500 to-red-600"
          }
        ].map((option) => {
          const IconComponent = option.icon;
          const isSelected = formData.profileTypes.includes(option.id);
          
          return (
            <div key={option.id} className="relative">
              <button
                onClick={() => handleProfileTypeChange(option.id, !isSelected)}
                className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected 
                    ? `border-transparent bg-gradient-to-br ${option.color} shadow-lg scale-105` 
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <IconComponent 
                    size={32} 
                    className={isSelected ? "text-white" : "text-gray-400"} 
                  />
                  {isSelected && (
                    <CheckCircle2 size={24} className="text-white" />
                  )}
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isSelected ? 'text-white' : 'text-white'}`}>
                  {option.title}
                </h3>
                <p className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                  {option.description}
                </p>
              </button>
            </div>
          );
        })}
      </div>

      {errors.profileTypes && (
        <div className="text-red-400 text-center mb-4">{errors.profileTypes}</div>
      )}

      <div className="flex justify-between">
        <Button 
          onClick={handlePrevious}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white"
        >
          <ChevronLeft size={20} className="mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleNext}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-2 rounded-lg hover:from-yellow-400 hover:to-orange-400"
        >
          Next
          <ChevronRight size={20} className="ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderPersonalInfoStep = () => (
    <div className="py-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Personal Information</h2>
        <p className="text-gray-300">Let's get to know you better. All fields are optional.</p>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name (Optional)
            <InfoTooltip content="This is your account name, it's separate from your artist name." position="right" />
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleFormChange("name", e.target.value)}
            placeholder="Enter your full name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Account Email (Optional)
            <InfoTooltip content="This is your account email. Any emails relating to your account are sent here." position="right" />
          </label>
          <Input
            type="email"
            value={formData.primaryAccountEmail}
            onChange={(e) => handleFormChange("primaryAccountEmail", e.target.value)}
            placeholder="Enter your account email"
            disabled={walletType === "web3auth"}
            className={errors.primaryAccountEmail ? "border-red-500" : ""}
          />
          {walletType === "web3auth" && (
            <p className="text-gray-400 text-sm mt-1">Email from Web3Auth account</p>
          )}
          {errors.primaryAccountEmail && <p className="text-red-400 text-sm mt-1">{errors.primaryAccountEmail}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Billing Email (Optional)
            <InfoTooltip content="Any billing, invoices and payouts related emails are sent here." position="right" />
          </label>
          <Input
            type="email"
            value={formData.billingEmail}
            onChange={(e) => handleFormChange("billingEmail", e.target.value)}
            placeholder="Enter your billing email"
            className={errors.billingEmail ? "border-red-500" : ""}
          />
          {errors.billingEmail && <p className="text-red-400 text-sm mt-1">{errors.billingEmail}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Profile Image URL (Optional)
            <InfoTooltip content="Enter a direct link to your profile image. Must be an HTTPS URL." position="right" />
          </label>
          <Input
            type="url"
            value={formData.profileImage}
            onChange={(e) => handleFormChange("profileImage", e.target.value)}
            placeholder="https://example.com/image.jpg"
            className={errors.profileImage ? "border-red-500" : ""}
          />
          {errors.profileImage && <p className="text-red-400 text-sm mt-1">{errors.profileImage}</p>}
        </div>
      </div>

      <div className="flex justify-between">
        <Button 
          onClick={handlePrevious}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white"
        >
          <ChevronLeft size={20} className="mr-2" />
          Back
        </Button>
        <div className="flex gap-3">
          <Button 
            onClick={handleSkip}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:border-gray-500 hover:text-whit md:ml-2 "
          >
            Skip for now
          </Button>
          <Button 
            onClick={handleNext}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-2 rounded-lg hover:from-yellow-400 hover:to-orange-400"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSavingStep = () => (
    <div className="text-center py-12">
      <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mx-auto mb-6" />
      <h2 className="text-2xl font-bold mb-4 text-white">Setting up your profile...</h2>
      <p className="text-gray-300">Please wait while we save your information.</p>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-12">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold mb-4 text-white">Profile Setup Complete!</h2>
      <p className="text-gray-300 mb-8">Your profile has been setup successfully. Let's explore the app now!</p>
      <Button 
        onClick={onClose}
        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-3 rounded-lg hover:from-yellow-400 hover:to-orange-400 font-semibold"
      >
        Close & Explore App
      </Button>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold mb-4 text-white">Something went wrong</h2>
      <p className="text-gray-300 mb-4">We encountered an error while setting up your profile:</p>
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-8 max-w-md mx-auto">
        <p className="text-red-400 text-sm">{errorMessage}</p>
      </div>
      <p className="text-gray-300 mb-8">You can still explore the app and complete your profile setup later.</p>
      <Button 
        onClick={onClose}
        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-3 rounded-lg hover:from-yellow-400 hover:to-orange-400 font-semibold"
      >
        Close & Explore App
      </Button>
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
      <div className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-[100]">
        <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-4xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
          {currentStep !== "saving" && currentStep !== "success" && currentStep !== "error" && (
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          )}

          <div className="flex flex-col items-center">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </>
  );
};

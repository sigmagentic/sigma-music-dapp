import { useEffect, useState } from "react";
import { Loader, Music, Plus } from "lucide-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { Album, Artist, MusicTrack, PaymentLog } from "libs/types";
import { fetchArtistSalesViaAPI, getAlbumTracksFromDBViaAPI, getPayoutLogsViaAPI } from "libs/utils";
import { isUserArtistType } from "libs/utils/ui";
import { useAccountStore } from "store/account";
import { UserIcon } from "@heroicons/react/24/outline";
import { EditArtistProfileModal, ArtistProfileFormData } from "./EditArtistProfileModal";
import { EditAlbumModal, AlbumFormData } from "./EditAlbumModal";
import { SOL_ENV_ENUM } from "config";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { toastSuccess, toastError, updateArtistProfileOnBackEndAPI, getAlbumFromDBViaAPI, updateAlbumOnBackEndAPI } from "libs/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { Badge } from "libComponents/Badge";
import { Button } from "libComponents/Button";
import { Card } from "libComponents/Card";
import { TrackListModal } from "pages/MUI/components/TrackListModal";
import { useAppStore } from "store/app";
import ratingE from "assets/img/icons/rating-E.png";

type ArtistProfileProps = {
  onCloseMusicPlayer: () => void;
  viewSolData: (e: number, f?: any, g?: boolean, h?: MusicTrack[]) => void;
  setHomeMode: (homeMode: string) => void;
  navigateToDeepAppView: (logicParams: any) => void;
};

// Render the artist profile content
export const ArtistProfile = ({ onCloseMusicPlayer, viewSolData, setHomeMode, navigateToDeepAppView }: ArtistProfileProps) => {
  const { publicKey: web3AuthPublicKey, web3auth, signMessageViaWeb3Auth } = useWeb3Auth();
  const { userWeb2AccountDetails, userArtistProfile, updateUserArtistProfile } = useAccountStore();
  const { publicKey: publicKeySol, walletType, isLoading: isLoadingSolanaWallet } = useSolanaWallet();
  const displayPublicKey = walletType === "web3auth" ? web3AuthPublicKey : publicKeySol; // Use the appropriate public key based on wallet type
  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();
  const { signMessage } = useWallet();
  const { albumLookup } = useAppStore();

  const [payoutLogs, setPayoutLogs] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState<boolean>(false);
  const [totalPayout, setTotalPayout] = useState<number>(0);
  const [showEditArtistProfileModal, setShowEditArtistProfileModal] = useState<boolean>(false);
  const [albumsLoading, setAlbumsLoading] = useState<boolean>(true);
  const [noArtistIdError, setNoArtistIdError] = useState<boolean>(false); //there can be a situation where the artist profile is not yet created, so we need to handle that
  const [myAlbums, setMyAlbums] = useState<Album[]>([]);
  const [showEditAlbumModal, setShowEditAlbumModal] = useState<boolean>(false);
  const [selectedAlbumForEdit, setSelectedAlbumForEdit] = useState<Album | null>(null);
  const [showEditTrackModal, setShowEditTrackModal] = useState<boolean>(false);
  const [selectedAlbumTracks, setSelectedAlbumTracks] = useState<MusicTrack[]>([]);
  const [selectedAlbumMeta, setSelectedAlbumMeta] = useState<any>({});
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);
  const [isLoadingTracksForAlbumId, setIsLoadingTracksForAlbumId] = useState<string>("");
  const [showVerificationInfoModal, setShowVerificationInfoModal] = useState<boolean>(false);
  const [artistSales, setArtistSales] = useState<PaymentLog[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState<boolean>(false);

  const showVerificationInfo = () => {
    setShowVerificationInfoModal(true);
  };

  // Fetch payout logs when artist profile is active
  useEffect(() => {
    if (isLoadingSolanaWallet || !publicKeySol) return;

    if (isUserArtistType(userWeb2AccountDetails.profileTypes) && !loadingPayouts) {
      const fetchPayoutLogs = async () => {
        setLoadingPayouts(true);
        try {
          const payouts = await getPayoutLogsViaAPI({ addressSol: displayPublicKey?.toString() || "" });
          setTotalPayout(payouts.reduce((acc: number, log: any) => acc + parseFloat(log.amount), 0));
          setPayoutLogs(payouts || []);
        } catch (error) {
          console.error("Error fetching payout logs:", error);
          setPayoutLogs([]);
        } finally {
          setLoadingPayouts(false);
        }
      };

      fetchPayoutLogs();
    }
  }, [userWeb2AccountDetails, isLoadingSolanaWallet, publicKeySol]);

  useEffect(() => {
    if (isLoadingSolanaWallet || !publicKeySol) return;

    if (userArtistProfile && userArtistProfile.artistId) {
      setAlbumsLoading(true);
      getAlbumFromDBViaAPI(userArtistProfile.artistId).then((albums) => {
        setMyAlbums(albums);
        setAlbumsLoading(false);
      });
    } else {
      setNoArtistIdError(true);
    }
  }, [userArtistProfile, isLoadingSolanaWallet, publicKeySol]);

  useEffect(() => {
    if (isLoadingSolanaWallet || !publicKeySol) return;

    const loadArtistData = async () => {
      try {
        const [salesData] = await Promise.all([fetchArtistSalesViaAPI(userArtistProfile.creatorPaymentsWallet, userArtistProfile.artistId)]);

        // append _albumName to the salesData
        salesData.forEach((sale: any) => {
          if (sale.task === "buyAlbum") {
            sale._albumName = albumLookup[sale.albumId]?.title;
          }
        });

        setArtistSales(salesData);
      } catch (error) {
        console.error("Error fetching artist sales data:", error);
      } finally {
        setIsLoadingSales(false);
      }
    };

    if (userArtistProfile && !isLoadingSales && Object.keys(albumLookup).length > 0) {
      loadArtistData();
    }
  }, [userArtistProfile, isLoadingSolanaWallet, publicKeySol, albumLookup]);

  const parseTypeCodeToLabel = (typeCode: string) => {
    switch (typeCode) {
      case "bonus":
        return "Bonus Payout";
      case "sales-split":
        return "Artist revenue from sales";
      default:
        return typeCode;
    }
  };

  const handleEditAlbum = (album: Album) => {
    setSelectedAlbumForEdit(album);
    setShowEditAlbumModal(true);
  };

  const handleAddNewAlbum = () => {
    if (!userArtistProfile) return;

    // Generate a new album ID
    const newAlbumId = generateNextAlbumId(userArtistProfile.artistId, myAlbums);

    // Create a placeholder album for the new album
    const newAlbum: Album = {
      albumId: newAlbumId,
      solNftName: "",
      title: "",
      desc: "",
      ctaPreviewStream: "",
      ctaBuy: "",
      bountyId: "",
      img: "",
      isExplicit: "0",
      isPodcast: "0",
      isPublished: "0",
      isFeatured: "0",
      isSigmaRemixAlbum: "0",
    };

    setSelectedAlbumForEdit(newAlbum);
    setShowEditAlbumModal(true);
  };

  const handleAlbumSave = async (albumData: AlbumFormData): Promise<boolean> => {
    if (!selectedAlbumForEdit || !userArtistProfile) {
      return false;
    }

    try {
      // Get the pre-access nonce and signature
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
        publicKey: publicKeySol,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      if (!usedPreAccessNonce || !usedPreAccessSignature) {
        throw new Error("Failed to get valid signature to prove account ownership");
      }

      const albumDataToSave = {
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        creatorWallet: displayPublicKey,
        artistId: userArtistProfile.artistId,
        albumId: selectedAlbumForEdit.albumId,
        albumFieldsObject: {
          title: albumData.title,
          desc: albumData.desc,
          img: albumData.img,
          isExplicit: albumData.isExplicit,
          isPodcast: albumData.isPodcast,
          isPublished: albumData.isPublished,
          albumPriceOption1: albumData.albumPriceOption1,
          albumPriceOption2: albumData.albumPriceOption2,
          albumPriceOption3: albumData.albumPriceOption3,
          albumPriceOption4: albumData.albumPriceOption4,
        },
      };

      const response = await updateAlbumOnBackEndAPI(albumDataToSave);

      if (response.updated && response.fullAlbumData) {
        // Update existing album locally in myAlbums
        setMyAlbums((prevAlbums) =>
          prevAlbums.map((album) => (album.albumId === selectedAlbumForEdit.albumId ? { ...album, ...response.fullAlbumData } : album))
        );
        toastSuccess("Album updated successfully");
      } else if (response.created && response.fullAlbumData) {
        // Add new album to myAlbums
        setMyAlbums((prevAlbums) => [...prevAlbums, response.fullAlbumData]);
        toastSuccess("Album created successfully");
      } else {
        throw new Error("Failed to save album");
      }

      return true;
    } catch (error) {
      console.error("Error saving album:", error);
      toastError("Error saving album - " + (error as Error).message);
      return false;
    }
  };

  const handleArtistProfileSave = async (artistProfileData: ArtistProfileFormData) => {
    try {
      // Here you would typically make an API call to update the user's profile
      console.log("Saving artist profile data:", artistProfileData);

      const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;

      // Get the pre-access nonce and signature
      const { usedPreAccessNonce, usedPreAccessSignature } = await getOrCacheAccessNonceAndSignature({
        solPreaccessNonce,
        solPreaccessSignature,
        solPreaccessTimestamp,
        signMessage: walletType === "web3auth" && web3auth?.provider ? signMessageViaWeb3Auth : signMessage,
        publicKey: publicKeySol,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      if (!usedPreAccessNonce || !usedPreAccessSignature) {
        throw new Error("Failed to valid signature to prove account ownership");
      }

      // only send the changed form data to the server to save
      const changedFormData: Partial<ArtistProfileFormData> = {
        name: artistProfileData.name,
        bio: artistProfileData.bio,
        img: artistProfileData.img,
        slug: artistProfileData.slug,
      };

      if (artistProfileData.altMainPortfolioLink && artistProfileData.altMainPortfolioLink !== "") {
        changedFormData.altMainPortfolioLink = artistProfileData.altMainPortfolioLink;
      }

      if (artistProfileData.xLink && artistProfileData.xLink !== "") {
        changedFormData.xLink = artistProfileData.xLink;
      }

      if (artistProfileData.ytLink && artistProfileData.ytLink !== "") {
        changedFormData.ytLink = artistProfileData.ytLink;
      }

      if (artistProfileData.tikTokLink && artistProfileData.tikTokLink !== "") {
        changedFormData.tikTokLink = artistProfileData.tikTokLink;
      }

      if (artistProfileData.instaLink && artistProfileData.instaLink !== "") {
        changedFormData.instaLink = artistProfileData.instaLink;
      }

      if (artistProfileData.webLink && artistProfileData.webLink !== "") {
        changedFormData.webLink = artistProfileData.webLink;
      }

      const artistProfileDataToSave = {
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        callerAsCreatorWallet: displayPublicKey,
        artistId: userArtistProfile.artistId, // this will trigger the edit workflow
        artistFieldsObject: changedFormData,
      };

      const response = await updateArtistProfileOnBackEndAPI(artistProfileDataToSave);
      console.log("Artist profile saved:", response);

      // const updatedUserWeb2AccountDetails = { ...response };
      // delete updatedUserWeb2AccountDetails.chainId;

      updateUserArtistProfile(response.fullArtistData as Artist);
      if (noArtistIdError) {
        setNoArtistIdError(false); // reset this flag as we have now created the artist profile
      }

      toastSuccess("Profile saved successfully");

      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toastError("Error updating profile - " + (error as Error).message);
      throw error;
    }
  };

  const handleViewCurrentTracks = async ({
    albumId,
    albumTitle,
    albumImg,
    albumIsPublished,
    onlyRefresh = false,
  }: {
    albumId: string;
    albumTitle: string;
    albumImg: string;
    albumIsPublished?: string;
    onlyRefresh?: boolean;
  }) => {
    setIsLoadingTracks(true);
    setIsLoadingTracksForAlbumId(albumId);

    try {
      const albumTracksFromDb: MusicTrack[] = await getAlbumTracksFromDBViaAPI(userArtistProfile.artistId, albumId, true, true);

      if (albumTracksFromDb.length > 0) {
        setSelectedAlbumTracks(albumTracksFromDb);
      } else {
        setSelectedAlbumTracks([]);
      }

      // the user just added or edited a track, so we just need to refresh the track list, we don't need to open the track list modal as its already one open
      if (onlyRefresh) {
        return;
      }

      setSelectedAlbumMeta({
        albumId: albumId,
        albumTitle: albumTitle,
        albumImg: albumImg,
        albumIsPublished: albumIsPublished,
      });

      setShowEditTrackModal(true);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setIsLoadingTracks(false);
      setIsLoadingTracksForAlbumId("");
    }
  };

  return (
    <>
      {/* Music Catalog Section */}
      <div className="rounded-lg p-6 mb-6 border-b border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-0">
          <h2 className="!text-xl font-bold mb-4">Your Album Catalog</h2>

          {myAlbums.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {myAlbums.length} {myAlbums.length === 1 ? "Album" : "Albums"}
                </Badge>
                {myAlbums.some((album) => album.isPublished === "1") && (
                  <Badge variant="secondary" className="bg-yellow-400 text-black text-xs">
                    {myAlbums.filter((album) => album.isPublished === "1").length} Published
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {albumsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            {!noArtistIdError ? (
              <Loader className="animate-spin text-yellow-300" size={20} />
            ) : (
              <p className="text-red-400">Your artist profile is not yet created. Please click on 'Edit Artist Profile' below to create it.</p>
            )}
          </div>
        ) : (
          userArtistProfile && (
            <ArtistAlbumList
              albums={myAlbums || []}
              isLoadingTracks={isLoadingTracks}
              isLoadingTracksForAlbumId={isLoadingTracksForAlbumId}
              onEditAlbum={handleEditAlbum}
              onAddNewAlbum={handleAddNewAlbum}
              onViewCurrentTracks={handleViewCurrentTracks}
              navigateToDeepAppView={navigateToDeepAppView}
            />
          )
        )}

        {myAlbums.length > 0 && (
          <div className="flex justify-end">
            <Button
              className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 mt-4"
              onClick={handleAddNewAlbum}>
              Create New Album
            </Button>
          </div>
        )}
      </div>

      {/* Artist Profile Section */}
      <div className="rounded-lg p-6 mb-6 border-b border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-0">
          <h2 className="!text-xl font-bold mb-4">Your Artist Profile</h2>

          <div
            className={`text-md font-bold border-2 rounded-lg p-2 ${userWeb2AccountDetails.isVerifiedArtist ? "bg-yellow-300 text-black" : "bg-gray-500 text-white"}`}>
            {userWeb2AccountDetails.isVerifiedArtist ? "☑️ Verified Artist Account" : "Unverified Artist Account"}
            {!userWeb2AccountDetails.isVerifiedArtist && (
              <button type="button" onClick={showVerificationInfo} className="text-gray-400 hover:text-yellow-400 transition-colors p-1 ml-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {userArtistProfile && (
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Image */}
            <div className="w-32 h-32 md:w-60 md:h-[auto] md:aspect-square rounded-md overflow-hidden bg-gray-900 border-2 border-gray-700">
              {userArtistProfile.img ? (
                <img src={userArtistProfile.img} alt="Artist Profile Image" className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                  <UserIcon className="w-16 h-16 text-gray-600" />
                </div>
              )}
            </div>

            {/* User Information */}
            <div className="flex flex-col space-y-2 overflow-x-auto w-full">
              <>
                <div>
                  <label className="text-gray-400 text-sm flex items-center">Artist ID</label>
                  {!userArtistProfile.artistId ? (
                    <p className="text-xs text-red-400">Not created yet. Required!</p>
                  ) : (
                    <p className="text-lg">{userArtistProfile.artistId}</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist Name</label>
                  {!userArtistProfile.name ? (
                    <p className="text-xs text-red-400">Not created yet. Required!</p>
                  ) : (
                    <p className="text-lg">{userArtistProfile.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist Bio</label>
                  {!userArtistProfile.bio ? (
                    <p className="text-xs text-red-400">Not created yet. Required!</p>
                  ) : (
                    <p className="text-lg">{userArtistProfile.bio}</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist Slug (Do not edit often as it will impact search and discoverability)</label>
                  {!userArtistProfile.slug ? (
                    <p className="text-xs text-red-400">Not created yet. Required!</p>
                  ) : (
                    <p className="text-lg">{userArtistProfile.slug}</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Creator Wallet</label>
                  <p className="text-lg font-mono">{userArtistProfile.creatorWallet}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">X Link</label>
                  {userArtistProfile.xLink ? (
                    <a
                      href={userArtistProfile.xLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono cursor-pointer text-yellow-300 hover:text-yellow-200 hover:underline">
                      {userArtistProfile.xLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">YouTube Link</label>
                  {userArtistProfile.ytLink ? (
                    <a
                      href={userArtistProfile.ytLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono cursor-pointer text-yellow-300 hover:text-yellow-200 hover:underline">
                      {userArtistProfile.ytLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">TikTok Link</label>
                  {userArtistProfile.tikTokLink ? (
                    <a
                      href={userArtistProfile.tikTokLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono cursor-pointer text-yellow-300 hover:text-yellow-200 hover:underline">
                      {userArtistProfile.tikTokLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Instagram Link</label>
                  {userArtistProfile.instaLink ? (
                    <a
                      href={userArtistProfile.instaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono cursor-pointer text-yellow-300 hover:text-yellow-200 hover:underline">
                      {userArtistProfile.instaLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Website Link</label>
                  {userArtistProfile.webLink ? (
                    <a
                      href={userArtistProfile.webLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono cursor-pointer text-yellow-300 hover:text-yellow-200 hover:underline">
                      {userArtistProfile.webLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Alternate Portfolio Link</label>
                  {userArtistProfile.altMainPortfolioLink ? (
                    <a
                      href={userArtistProfile.altMainPortfolioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono cursor-pointer text-yellow-300 hover:text-yellow-200 hover:underline">
                      {userArtistProfile.altMainPortfolioLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>

                <div className="flex justify-center md:justify-end space-x-2">
                  {!userArtistProfile.artistId && noArtistIdError && (
                    <div className="flex flex-col justify-center mr-2 p-2 mt-3">
                      <p className="text-red-400">Artist Profile Not Created! Get Started 👉</p>
                    </div>
                  )}

                  {userArtistProfile.artistId && (
                    <Button
                      className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 mt-4"
                      onClick={() => navigateToDeepAppView({ artistSlug: userArtistProfile.slug })}>
                      View Public Profile
                    </Button>
                  )}

                  <Button
                    className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 mt-4"
                    onClick={() => setShowEditArtistProfileModal(true)}>
                    Edit Artist Profile
                  </Button>
                </div>
              </>
            </div>
          </div>
        )}
      </div>

      {/* Sales Insights Section */}
      <div className="rounded-lg p-6 border-b border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
          <h2 className="!text-xl !md:text-xl font-bold mb-4 text-center md:text-left">Sales</h2>
        </div>

        {isLoadingSales ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="animate-spin text-yellow-300" size={20} />
          </div>
        ) : artistSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-md text-gray-400">No sales found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3 text-xs">Date</th>
                  <th className="pb-3 text-xs">What Was Bought</th>
                  <th className="pb-3 text-xs">Purchase Status</th>
                  <th className="pb-3 text-xs">Payment Method</th>
                  <th className="pb-3 text-xs">Amount</th>
                  <th className="pb-3 text-xs">Amount in USD</th>
                </tr>
              </thead>
              <tbody>
                {artistSales.map((log, index) => (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="text-xs py-3">{new Date(log.createdOn).toLocaleString()}</td>
                    <td className="text-xs py-3">
                      {log.task === "buyAlbum" && (
                        <>
                          <div className="text-orange-500">Album: {log._albumName}</div>
                          <div className="text-sm text-gray-400">
                            {log.albumSaleTypeOption === "1" && "Digital Album + Download Only"}
                            {log.albumSaleTypeOption === "2" && "Digital Album + Download + Collectible (NFT)"}
                            {log.albumSaleTypeOption === "3" && "Digital Album + Commercial License + Download + Collectible (NFT)"}
                            {log.albumSaleTypeOption === "4" && "Digital Album + Commercial License + Download"}
                          </div>
                        </>
                      )}

                      {log.task === "joinFanClub" && <div>Inner Circle Membership ID: {log.membershipId}</div>}
                    </td>
                    <td className="text-xs py-3">
                      <span
                        className={`px-2 py-1 rounded ${
                          log.paymentStatus === "success"
                            ? "bg-green-900 text-green-300"
                            : log.paymentStatus === "failed"
                              ? "bg-red-900 text-red-300"
                              : "bg-yellow-900 text-yellow-300"
                        }`}>
                        {log.paymentStatus.charAt(0).toUpperCase() + log.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="text-xs py-3">{log.type === "sol" ? "SOL" : log.type === "xp" ? "XP" : "Credit Card"}</td>
                    <td className="text-xs py-3">{log.type === "cc" ? `$${log.amount}` : log.type === "xp" ? `${log.amount} XP` : `${log.amount} SOL`}</td>
                    <td className="text-xs py-3">{log.priceInUSD ? `$${log.priceInUSD}` : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Artist Payouts Section */}
      <div className="rounded-lg p-6 border-b border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
          <h2 className="!text-xl !md:text-xl font-bold mb-4 text-center md:text-left">Artist Payouts</h2>
          {payoutLogs.length > 0 && (
            <div className="text-md text-yellow-300 font-bold border-2 border-yellow-300 rounded-lg p-2">
              Total Payout: <span className="text-2xl font-bold">${totalPayout.toFixed(2)}</span>
            </div>
          )}
        </div>

        {loadingPayouts ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="animate-spin text-yellow-300" size={20} />
          </div>
        ) : payoutLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-md text-gray-400">No payouts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3 text-xs">Date</th>
                  <th className="pb-3 text-xs">Amount</th>
                  <th className="pb-3 text-xs">Type</th>
                  <th className="pb-3 text-xs">Info</th>
                  <th className="pb-3 text-xs">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {payoutLogs.map((log, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="text-xs py-3">{new Date(log.paymentTS).toLocaleString()}</td>
                    <td className="text-xs py-3">
                      {log.amount} {log.token}
                    </td>
                    <td className="text-xs py-3">
                      <span className="capitalize">{parseTypeCodeToLabel(log.type)}</span>
                    </td>
                    <td className="text-xs py-3">{log.info}</td>
                    <td className="text-xs py-3">
                      {log.tx && (
                        <a
                          href={`https://solscan.io/tx/${log.tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-300 hover:text-yellow-200 hover:underline">
                          View on Solscan
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Album Modal */}
      {selectedAlbumForEdit && (
        <EditAlbumModal
          isOpen={showEditAlbumModal}
          onClose={() => {
            setShowEditAlbumModal(false);
            setSelectedAlbumForEdit(null);
          }}
          onSave={handleAlbumSave}
          initialData={{
            albumId: selectedAlbumForEdit.albumId || "",
            title: selectedAlbumForEdit.title || "",
            desc: selectedAlbumForEdit.desc || "",
            img: selectedAlbumForEdit.img || "",
            isExplicit: selectedAlbumForEdit.isExplicit || "0",
            isPodcast: selectedAlbumForEdit.isPodcast || "0",
            isPublished: selectedAlbumForEdit.isPublished || "0",
            albumPriceOption1: selectedAlbumForEdit.albumPriceOption1 || "",
            albumPriceOption2: selectedAlbumForEdit.albumPriceOption2 || "",
            albumPriceOption3: selectedAlbumForEdit.albumPriceOption3 || "",
            albumPriceOption4: selectedAlbumForEdit.albumPriceOption4 || "",
          }}
          albumTitle={selectedAlbumForEdit.title || ""}
          isNewAlbum={!selectedAlbumForEdit.title} // If no title, it's a new album
        />
      )}

      {/* Edit User Profile Modal */}
      <EditArtistProfileModal
        isOpen={showEditArtistProfileModal}
        onClose={() => setShowEditArtistProfileModal(false)}
        onSave={handleArtistProfileSave}
        initialData={{
          name: userArtistProfile.name || "",
          bio: userArtistProfile.bio || "",
          img: userArtistProfile.img || "",
          slug: userArtistProfile.slug || "",
          altMainPortfolioLink: userArtistProfile.altMainPortfolioLink || "",
          xLink: userArtistProfile.xLink || "",
          ytLink: userArtistProfile.ytLink || "",
          tikTokLink: userArtistProfile.tikTokLink || "",
          instaLink: userArtistProfile.instaLink || "",
          webLink: userArtistProfile.webLink || "",
        }}
      />

      {/* Edit Track modal */}
      <TrackListModal
        isOpen={showEditTrackModal}
        isNonMUIMode={true}
        tracks={selectedAlbumTracks as any}
        albumTitle={selectedAlbumMeta.albumTitle}
        artistId={userArtistProfile.artistId}
        albumId={selectedAlbumMeta.albumId}
        albumImg={selectedAlbumMeta.albumImg}
        albumIsPublished={selectedAlbumMeta.albumIsPublished}
        onClose={() => setShowEditTrackModal(false)}
        onTracksUpdated={() => {
          handleViewCurrentTracks({ albumId: selectedAlbumMeta.albumId, albumTitle: selectedAlbumMeta.albumTitle, albumImg: selectedAlbumMeta.albumImg });
        }}
      />

      {/* Verification Info Modal */}
      {showVerificationInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Artist Verification Information</h3>
              <button onClick={() => setShowVerificationInfoModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-white space-y-4 text-sm leading-relaxed">
              <p>
                All artist profiles and content are fully public and visible but{" "}
                <span className="text-yellow-400 font-bold">
                  only Verified Artists will be able to monetize their content, sell on-chain Story Protocol powered licenses and music and fan club
                  collectibles.
                </span>
              </p>

              <p>
                More on how you can get verified is{" "}
                <a href="/faq#get-verified-artist-status" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300 underline">
                  here
                </a>
              </p>
            </div>

            <div className="flex justify-center mt-6">
              <Button variant="outline" className="text-sm px-6" onClick={() => setShowVerificationInfoModal(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Artist Album List Component for Music Catalog Management
const ArtistAlbumList: React.FC<{
  albums: Album[];
  isLoadingTracks: boolean;
  isLoadingTracksForAlbumId: string;
  onEditAlbum: (album: Album) => void;
  onAddNewAlbum: () => void;
  onViewCurrentTracks: ({
    albumId,
    albumTitle,
    albumImg,
    albumIsPublished,
  }: {
    albumId: string;
    albumTitle: string;
    albumImg: string;
    albumIsPublished?: string;
  }) => void;
  navigateToDeepAppView: (logicParams: any) => void;
}> = ({ albums, isLoadingTracks, isLoadingTracksForAlbumId, onEditAlbum, onAddNewAlbum, onViewCurrentTracks, navigateToDeepAppView }) => {
  const { artistLookupEverything } = useAppStore();

  return (
    <div className="space-y-6">
      {albums.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album: Album) => (
            <Card key={album.albumId} className="p-6 hover:shadow-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="!text-md font-semibold text-gray-200 mb-1">{album.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">id: {album.albumId}</p>
                  <p className="text-sm text-gray-400 mb-2">
                    Status:{" "}
                    {album?.isPublished === "1" ? (
                      <span className="text-yellow-400 font-medium">Published</span>
                    ) : (
                      <span className="text-gray-400 font-medium">Draft</span>
                    )}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    {album?.isExplicit === "1" && <img src={ratingE} alt="Explicit" title="Explicit" className="w-3 h-3 text-gray-400" />}
                  </div>
                </div>
                {album.img && (
                  <div
                    className="ml-4 cursor-alias hover:scale-110 transition-transform duration-200"
                    onClick={() => {
                      const slug = artistLookupEverything[album.albumId.split("_")[0]]?.slug;
                      navigateToDeepAppView({
                        artistSlug: slug,
                        albumId: album.albumId,
                      });
                    }}>
                    <img src={album.img} alt={album.title} className="w-16 h-16 rounded-lg object-cover" />
                  </div>
                )}
              </div>

              {album.bountyId && (
                <div className="mb-2 -ml-2">
                  <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
                    Bounty: {album.bountyId}
                  </Badge>
                </div>
              )}

              <div className="flex gap-2 flex-wrap mt-auto">
                <Button
                  className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 text-sm rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200"
                  onClick={() => onEditAlbum(album)}>
                  Edit Album
                </Button>

                <Button
                  className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 text-sm rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200"
                  onClick={() =>
                    onViewCurrentTracks({ albumId: album.albumId, albumTitle: album.title, albumImg: album.img, albumIsPublished: album.isPublished })
                  }
                  disabled={isLoadingTracks}>
                  Edit Tracks {isLoadingTracks && isLoadingTracksForAlbumId === album.albumId ? <Loader className="animate-spin ml-2" size={16} /> : null}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-200 mb-2">No Albums Found</h3>
          <p className="text-gray-400">You haven't created any albums yet.</p>
          <Button
            onClick={onAddNewAlbum}
            className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Album
          </Button>
        </div>
      )}
    </div>
  );
};

// Utility function to generate the next album ID
export const generateNextAlbumId = (artistId: string, existingAlbums: Album[]): string => {
  if (existingAlbums.length === 0) {
    return `${artistId}_a1`;
  }

  // Extract all the sequence numbers from existing album IDs
  const sequenceNumbers: number[] = [];

  existingAlbums.forEach((album) => {
    const match = album.albumId.match(/_a(\d+)$/);
    if (match) {
      sequenceNumbers.push(parseInt(match[1]));
    }
  });

  if (sequenceNumbers.length === 0) {
    return `${artistId}_a1`;
  }

  // Find the highest sequence number and increment it
  const maxSequence = Math.max(...sequenceNumbers);
  const nextSequence = maxSequence + 1;

  return `${artistId}_a${nextSequence}`;
};

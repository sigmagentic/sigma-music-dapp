import { useEffect, useState } from "react";
import { Loader, Music, Plus } from "lucide-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { AiRemixRawTrack, Album, Artist, MusicTrack } from "libs/types";
import { getAlbumTracksFromDBViaAPI, getPayoutLogsViaAPI, getRemixLaunchesViaAPI, mapRawAiRemixTracksToMusicTracks } from "libs/utils";
import { isUserArtistType, mergeRawAiRemixTracks } from "libs/utils/ui";
import { useAccountStore } from "store/account";
import { useAudioPlayerStore } from "store/audioPlayer";
import { TrackList } from "../components/TrackList";
import { UserIcon } from "@heroicons/react/24/outline";
import { EditArtistProfileModal, ArtistProfileFormData } from "./EditArtistProfileModal";
import { EditAlbumModal, AlbumFormData } from "./EditAlbumModal";
import { SOL_ENV_ENUM } from "config";
import { getOrCacheAccessNonceAndSignature } from "libs/sol/SolViewData";
import { toastSuccess, toastError, updateArtistProfileOnBackEndAPI, getAlbumFromDBViaAPI, updateAlbumOnBackEndAPI } from "libs/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { InfoTooltip } from "libComponents/Tooltip";
import { Badge } from "libComponents/Badge";
import { Button } from "libComponents/Button";
import { Card } from "libComponents/Card";
import { TrackListModal } from "pages/MUI/components/TrackListModal";

type ArtistProfileProps = {
  onCloseMusicPlayer: () => void;
  viewSolData: (e: number, f?: any, g?: boolean, h?: MusicTrack[]) => void;
};

// Render the artist profile content
export const ArtistProfile = ({ onCloseMusicPlayer, viewSolData }: ArtistProfileProps) => {
  const { publicKey: web3AuthPublicKey } = useWeb3Auth();
  const { userWeb2AccountDetails, myAiRemixRawTracks, updateMyAiRemixRawTracks, userArtistProfile, updateUserArtistProfile } = useAccountStore();
  const { publicKey: solanaPublicKey, walletType } = useSolanaWallet();
  const { updateAssetPlayIsQueued } = useAudioPlayerStore();
  const [payoutLogs, setPayoutLogs] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState<boolean>(false);
  const [totalPayout, setTotalPayout] = useState<number>(0);
  // Use the appropriate public key based on wallet type
  const displayPublicKey = walletType === "web3auth" ? web3AuthPublicKey : solanaPublicKey;
  const [virtualAiRemixAlbum, setVirtualAiRemixAlbum] = useState<Album | null>(null);
  const [virtualAiRemixAlbumTracks, setVirtualAiRemixAlbumTracks] = useState<MusicTrack[]>([]);
  const [showEditArtistProfileModal, setShowEditArtistProfileModal] = useState<boolean>(false);
  const [albumsLoading, setAlbumsLoading] = useState<boolean>(true);
  const [myAlbums, setMyAlbums] = useState<Album[]>([]);
  const [showEditAlbumModal, setShowEditAlbumModal] = useState<boolean>(false);
  const [selectedAlbumForEdit, setSelectedAlbumForEdit] = useState<Album | null>(null);

  const [showEditTrackModal, setShowEditTrackModal] = useState<boolean>(false);
  const [selectedAlbumTracks, setSelectedAlbumTracks] = useState<MusicTrack[]>([]);
  const [selectedAlbumTitle, setSelectedAlbumTitle] = useState<string>("");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);

  const { solPreaccessNonce, solPreaccessSignature, solPreaccessTimestamp, updateSolPreaccessNonce, updateSolPreaccessTimestamp, updateSolSignedPreaccess } =
    useAccountStore();
  const { signMessage } = useWallet();

  useEffect(() => {
    if (myAiRemixRawTracks.length === 0 && displayPublicKey) {
      // we need to check if this user has made any remixes and if so, we can flag them as an artist
      try {
        const fetchRemixLaunches = async () => {
          const responseA = await getRemixLaunchesViaAPI({ launchStatus: "new", addressSol: displayPublicKey?.toString() || null });
          const responseB = await getRemixLaunchesViaAPI({ launchStatus: "graduated", addressSol: displayPublicKey?.toString() || null });
          const responseC = await getRemixLaunchesViaAPI({ launchStatus: "launched", addressSol: displayPublicKey?.toString() || null });

          if (responseA.length > 0 || responseB.length > 0 || responseC.length > 0) {
            const allMyRemixes: AiRemixRawTrack[] = mergeRawAiRemixTracks(responseA, responseB, responseC);

            const { virtualAlbum, allMyRemixesAsMusicTracks } = mapRawAiRemixTracksToMusicTracks(allMyRemixes);
            setVirtualAiRemixAlbum(virtualAlbum);
            setVirtualAiRemixAlbumTracks(allMyRemixesAsMusicTracks);

            updateMyAiRemixRawTracks(allMyRemixes);
          }
        };

        fetchRemixLaunches();
      } catch (error) {
        console.error("Error refreshing graduated data:", error);
      }
    } else if (myAiRemixRawTracks.length > 0) {
      const { virtualAlbum, allMyRemixesAsMusicTracks } = mapRawAiRemixTracksToMusicTracks(myAiRemixRawTracks);
      setVirtualAiRemixAlbum(virtualAlbum);
      setVirtualAiRemixAlbumTracks(allMyRemixesAsMusicTracks);
    }
  }, [myAiRemixRawTracks, displayPublicKey]);

  // Fetch payout logs when artist profile is active
  useEffect(() => {
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
  }, [userWeb2AccountDetails]);

  useEffect(() => {
    if (userArtistProfile && userArtistProfile.artistId) {
      setAlbumsLoading(true);
      getAlbumFromDBViaAPI(userArtistProfile.artistId).then((albums) => {
        setMyAlbums(albums);
        setAlbumsLoading(false);
      });
    }
  }, [userArtistProfile]);

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

  // Handle profile edit save
  const handleEditAlbum = (album: Album) => {
    setSelectedAlbumForEdit(album);
    setShowEditAlbumModal(true);
  };

  // Utility function to generate the next album ID
  const generateNextAlbumId = (artistId: string, existingAlbums: Album[]): string => {
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
        },
      };

      const response = await updateAlbumOnBackEndAPI(albumDataToSave);

      if (response.updated && response.fullAlbumData) {
        // Update existing album locally in myAlbums
        setMyAlbums((prevAlbums) =>
          prevAlbums.map((album) => (album.albumId === selectedAlbumForEdit.albumId ? { ...album, ...response.fullAlbumData } : album))
        );
        toastSuccess("Album updated successfully", true);
      } else if (response.created && response.fullAlbumData) {
        // Add new album to myAlbums
        setMyAlbums((prevAlbums) => [...prevAlbums, response.fullAlbumData]);
        toastSuccess("Album created successfully", true);
      } else {
        throw new Error("Failed to save album");
      }

      return true;
    } catch (error) {
      console.error("Error saving album:", error);
      toastError("Error saving album - " + (error as Error).message, true);
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
        signMessage,
        publicKey: solanaPublicKey,
        updateSolPreaccessNonce,
        updateSolSignedPreaccess,
        updateSolPreaccessTimestamp,
      });

      if (!usedPreAccessNonce || !usedPreAccessSignature) {
        throw new Error("Failed to valid signature to prove account ownership");
      }

      const artistProfileDataToSave = {
        solSignature: usedPreAccessSignature,
        signatureNonce: usedPreAccessNonce,
        creatorWallet: displayPublicKey,
        artistId: userArtistProfile.artistId, // this will trigger the edit workflow
        artistFieldsObject: {
          name: artistProfileData.name,
          bio: artistProfileData.bio,
          img: artistProfileData.img,
          altMainPortfolioLink: artistProfileData.altMainPortfolioLink,
          xLink: artistProfileData.xLink,
          ytLink: artistProfileData.ytLink,
          tikTokLink: artistProfileData.tikTokLink,
          instaLink: artistProfileData.instaLink,
          webLink: artistProfileData.webLink,
        },
      };

      const response = await updateArtistProfileOnBackEndAPI(artistProfileDataToSave);
      console.log("Artist profile saved:", response);

      // const updatedUserWeb2AccountDetails = { ...response };
      // delete updatedUserWeb2AccountDetails.chainId;

      updateUserArtistProfile(response.fullArtistData as Artist);

      toastSuccess("Profile saved successfully", true);

      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      toastError("Error updating profile - " + (error as Error).message, true);
      throw error;
    }
  };

  const handleViewCurrentTracks = async (albumId: string, albumTitle: string) => {
    setIsLoadingTracks(true);
    try {
      const albumTracksFromDb: MusicTrack[] = await getAlbumTracksFromDBViaAPI(userArtistProfile.artistId, albumId, true, true);

      if (albumTracksFromDb.length > 0) {
        setSelectedAlbumTracks(albumTracksFromDb);
      }

      setSelectedAlbumTitle(albumTitle);
      setSelectedAlbumId(albumId);
      setShowEditTrackModal(true);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  return (
    <>
      {/* Music Catalog Management Section */}
      <div className="bg-black rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-0">
          <h2 className="!text-2xl font-bold mb-4">Music Catalog Management</h2>

          {myAlbums.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{myAlbums.length} Albums</Badge>
                {myAlbums.some((album) => album.isPublished === "1") && (
                  <Badge variant="secondary" className="bg-green-600 text-white">
                    {myAlbums.filter((album) => album.isPublished === "1").length} Published
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {albumsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="animate-spin" size={30} />
          </div>
        ) : (
          userArtistProfile && (
            <ArtistAlbumList
              albums={myAlbums || []}
              onEditAlbum={handleEditAlbum}
              onAddNewAlbum={handleAddNewAlbum}
              onViewCurrentTracks={handleViewCurrentTracks}
              isLoadingTracks={isLoadingTracks}
            />
          )
        )}

        {myAlbums.length > 0 && (
          <div className="flex justify-end">
            <Button
              className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 mt-4"
              onClick={handleAddNewAlbum}>
              Add New Album
            </Button>
          </div>
        )}
      </div>

      {/* Artist Profile Section */}
      <div className="bg-black rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-0">
          <h2 className="!text-2xl font-bold mb-4">Your Artist Profile</h2>
          <div
            className={`text-md font-bold border-2 rounded-lg p-2 ${userArtistProfile.isVerifiedArtist ? "bg-yellow-300text-black" : "bg-gray-500 text-white"}`}>
            {userWeb2AccountDetails.isVerifiedArtist ? "Verified Artist Account" : "Unverified Artist Account"}
            {!userWeb2AccountDetails.isVerifiedArtist && (
              <InfoTooltip
                content="Once you are verified, your artist profile will be public and visible to all users. To get Verified, make sure you have provided 'Artist Alt Main Portfolio Link' (so we can review some of your music) and also provide AT LEAST a X, TikTok or Instagram link and we will DM you to verify your identity on one of these social channels."
                position="right"
              />
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
                  <p className="text-lg">{userArtistProfile.artistId}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist Name</label>
                  <p className="text-lg">{userArtistProfile.name}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist Bio</label>
                  <p className="text-lg">{userArtistProfile.bio}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist Slug (Not editable)</label>
                  <p className="text-lg">{userArtistProfile.slug}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Creator Wallet</label>
                  <p className="text-lg font-mono">{userArtistProfile.creatorWallet}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist X Link</label>
                  {userArtistProfile.xLink ? (
                    <a
                      href={userArtistProfile.xLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono text-blue-400 hover:text-blue-300">
                      {userArtistProfile.xLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist YT Link</label>
                  {userArtistProfile.ytLink ? (
                    <a
                      href={userArtistProfile.ytLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono text-blue-400 hover:text-blue-300">
                      {userArtistProfile.ytLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist TikTok Link</label>
                  {userArtistProfile.tikTokLink ? (
                    <a
                      href={userArtistProfile.tikTokLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono text-blue-400 hover:text-blue-300">
                      {userArtistProfile.tikTokLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist Instagram Link</label>
                  {userArtistProfile.instaLink ? (
                    <a
                      href={userArtistProfile.instaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono text-blue-400 hover:text-blue-300">
                      {userArtistProfile.instaLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist Web Link</label>
                  {userArtistProfile.webLink ? (
                    <a
                      href={userArtistProfile.webLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono text-blue-400 hover:text-blue-300">
                      {userArtistProfile.webLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Artist Alt Main Portfolio Link</label>
                  {userArtistProfile.altMainPortfolioLink ? (
                    <a
                      href={userArtistProfile.altMainPortfolioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm font-mono text-blue-400 hover:text-blue-300">
                      {userArtistProfile.altMainPortfolioLink}
                    </a>
                  ) : (
                    <p className="text-sm font-mono">Not provided</p>
                  )}
                </div>

                <div className="flex justify-center md:justify-end">
                  <button
                    className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 mt-4"
                    onClick={() => setShowEditArtistProfileModal(true)}>
                    Edit Artist Profile
                  </button>
                </div>
              </>
            </div>
          </div>
        )}
      </div>

      {/* Artist Remixes Section */}
      <div className="bg-black rounded-lg p-6 mb-6">
        <h2 className="!text-2xl font-bold mb-4">Your Music - AI Remixes</h2>

        {myAiRemixRawTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-xl text-gray-400">No remixes found</p>
          </div>
        ) : (
          <>
            {virtualAiRemixAlbum && virtualAiRemixAlbumTracks.length > 0 && (
              <div className="mx-auto md:m-[initial] p-3">
                <TrackList
                  album={virtualAiRemixAlbum}
                  artistId={"virtual-artist-id-" + displayPublicKey?.toString()}
                  artistName={"My AI Remixes"}
                  virtualTrackList={virtualAiRemixAlbumTracks}
                  onBack={() => {
                    onCloseMusicPlayer();
                  }}
                  onPlayTrack={(album, jumpToPlaylistTrackIndex) => {
                    updateAssetPlayIsQueued(true);
                    onCloseMusicPlayer();

                    setTimeout(() => {
                      viewSolData(
                        0,
                        {
                          artistId: "virtual-artist-id-" + displayPublicKey?.toString(),
                          albumId: virtualAiRemixAlbum.albumId,
                          jumpToPlaylistTrackIndex: jumpToPlaylistTrackIndex,
                        },
                        false,
                        virtualAiRemixAlbumTracks
                      );

                      updateAssetPlayIsQueued(false);
                    }, 5000);
                  }}
                  checkOwnershipOfMusicAsset={() => 0}
                  trackPlayIsQueued={false}
                  assetPlayIsQueued={false}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Artist Payouts Section */}
      <div className="bg-black rounded-lg p-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
          <h2 className="!text-2xl !md:text-2xl font-bold mb-4 text-center md:text-left">Artist Payouts</h2>
          {payoutLogs.length > 0 && (
            <div className="text-md text-yellow-300 font-bold border-2 border-yellow-300 rounded-lg p-2">
              Total Payout: <span className="text-2xl font-bold">${totalPayout.toFixed(2)}</span>
            </div>
          )}
        </div>

        {loadingPayouts ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="animate-spin" size={30} />
          </div>
        ) : payoutLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-xl text-gray-400">No payouts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3 px-4 py-2 border border-gray-700 border-r-2 border-r-gray-700 bg-gray-800">Date</th>
                  <th className="pb-3 px-4 py-2 border border-gray-700 border-r-2 border-r-gray-700 bg-gray-800">Amount</th>
                  <th className="pb-3 px-4 py-2 border border-gray-700 border-r-2 border-r-gray-700 bg-gray-800">Type</th>
                  <th className="pb-3 px-4 py-2 border border-gray-700 border-r-2 border-r-gray-700 bg-gray-800">Info</th>
                  <th className="pb-3 px-4 py-2 border border-gray-700 border-r-2 border-r-gray-700 bg-gray-800">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {payoutLogs.map((log, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-3 px-4 border border-gray-700 border-r-2 border-r-gray-700">{new Date(log.paymentTS).toLocaleString()}</td>
                    <td className="py-3 px-4 border border-gray-700 border-r-2 border-r-gray-700">
                      {log.amount} {log.token}
                    </td>
                    <td className="py-3 px-4 border border-gray-700 border-r-2 border-r-gray-700">
                      <span className="capitalize">{parseTypeCodeToLabel(log.type)}</span>
                    </td>
                    <td className="py-3 px-4 border border-gray-700 border-r-2 border-r-gray-700">{log.info}</td>
                    <td className="py-3 px-4 border border-gray-700 border-r-2 border-r-gray-700">
                      {log.tx && (
                        <a href={`https://solscan.io/tx/${log.tx}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
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

      {/* Edit Album Modal */}
      {selectedAlbumForEdit && (
        <EditAlbumModal
          isOpen={showEditAlbumModal}
          onClose={() => {
            setShowEditAlbumModal(false);
            setSelectedAlbumForEdit(null);
          }}
          onSave={handleAlbumSave}
          initialData={{
            title: selectedAlbumForEdit.title || "",
            desc: selectedAlbumForEdit.desc || "",
            img: selectedAlbumForEdit.img || "",
            isExplicit: selectedAlbumForEdit.isExplicit || "0",
            isPodcast: selectedAlbumForEdit.isPodcast || "0",
            isPublished: selectedAlbumForEdit.isPublished || "0",
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
        onClose={() => setShowEditTrackModal(false)}
        tracks={selectedAlbumTracks as any}
        albumTitle={selectedAlbumTitle}
        artistId={userArtistProfile.artistId}
        albumId={selectedAlbumId}
        onTracksUpdated={() => {
          setShowEditTrackModal(false);
          toastSuccess("Tracks updated successfully", true);
        }}
      />
    </>
  );
};

// Artist Album List Component for Music Catalog Management
const ArtistAlbumList: React.FC<{
  albums: Album[];
  onEditAlbum: (album: Album) => void;
  onAddNewAlbum: () => void;
  onViewCurrentTracks: (albumId: string, albumTitle: string) => void;
  isLoadingTracks: boolean;
}> = ({ albums, onEditAlbum, onAddNewAlbum, onViewCurrentTracks, isLoadingTracks }) => {
  return (
    <div className="space-y-6">
      {albums.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Card key={album.albumId} className="p-6 hover:shadow-lg transition-shadow bg-black border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-200 mb-1">{album.title}</h3>
                  <p className="text-sm text-gray-400 mb-2">ID: {album.albumId}</p>
                  <p className="text-sm text-gray-400 mb-2">
                    Status:{" "}
                    {album?.isPublished === "1" ? (
                      <span className="text-green-400 font-medium">Published</span>
                    ) : (
                      <span className="text-yellow-400 font-medium">Draft</span>
                    )}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    {album?.isExplicit === "1" && (
                      <Badge variant="destructive" className="text-xs">
                        Explicit
                      </Badge>
                    )}
                    {album?.isPublished === "1" && (
                      <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                        Published
                      </Badge>
                    )}
                  </div>
                </div>
                {album.img && (
                  <div className="ml-4">
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

              <div className="space-x-2">
                <Button
                  className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 mt-4"
                  onClick={() => onEditAlbum(album)}>
                  Edit Album
                </Button>

                <Button
                  className="bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-8 py-3 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-600 transition-all duration-200 mt-4"
                  onClick={() => onViewCurrentTracks(album.albumId, album.title)}
                  disabled={isLoadingTracks}>
                  Edit Tracks {isLoadingTracks ? <Loader className="animate-spin ml-2" size={16} /> : null}
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

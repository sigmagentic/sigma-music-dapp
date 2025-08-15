import React, { useState, useEffect } from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { Loader } from "lucide-react";
import { GetNFMeModal } from "components/GetNFMeModal";
import { NFMePreferencesModal } from "components/NFMePreferencesModal";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { Album, AiRemixRawTrack, MusicTrack } from "libs/types";
import { getPayoutLogsViaAPI, getRemixLaunchesViaAPI, mergeRawAiRemixTracks, mapRawAiRemixTracksToMusicTracks } from "libs/utils";
import { useAccountStore } from "store/account";
import { useAudioPlayerStore } from "store/audioPlayer";
import { useNftsStore } from "store/nfts";
import { TrackList } from "./components/TrackList";

const nfMeIdBrandingHide = true;

type MyProfileProps = {
  navigateToDeepAppView: (e: any) => any;
  viewSolData: (e: number, f?: any, g?: boolean, h?: MusicTrack[]) => void;
  onCloseMusicPlayer: () => void;
};

type ProfileTab = "artist" | "app";

export const MyProfile = ({ navigateToDeepAppView, viewSolData, onCloseMusicPlayer }: MyProfileProps) => {
  const { userInfo, publicKey: web3AuthPublicKey } = useWeb3Auth();
  const { publicKey: solanaPublicKey, walletType } = useSolanaWallet();
  const { solNFMeIdNfts } = useNftsStore();
  const [showNfMeIdModal, setShowNfMeIdModal] = useState<boolean>(false);
  const [showNfMePreferencesModal, setShowNfMePreferencesModal] = useState<boolean>(false);
  const [nfMeIdImageUrl, setNfMeIdImageUrl] = useState<string | null>(null);
  const [payoutLogs, setPayoutLogs] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState<boolean>(false);
  const { userWeb2AccountDetails, myPaymentLogs, myMusicAssetPurchases, myAiRemixRawTracks, updateMyAiRemixRawTracks } = useAccountStore();
  const [totalPayout, setTotalPayout] = useState<number>(0);

  // Tab state - default to "artist" if user is an artist, otherwise "app"
  const [activeTab, setActiveTab] = useState<ProfileTab>(userWeb2AccountDetails.isArtist ? "artist" : "app");
  const [isUserArtist, setIsUserArtist] = useState<boolean>(userWeb2AccountDetails.isArtist);
  const [virtualAiRemixAlbum, setVirtualAiRemixAlbum] = useState<Album | null>(null);
  const [virtualAiRemixAlbumTracks, setVirtualAiRemixAlbumTracks] = useState<MusicTrack[]>([]);
  const { updateAssetPlayIsQueued } = useAudioPlayerStore();

  // Use the appropriate public key based on wallet type
  const displayPublicKey = walletType === "web3auth" ? web3AuthPublicKey : solanaPublicKey;

  useEffect(() => {
    if (solNFMeIdNfts.length > 0) {
      const nfMeId = solNFMeIdNfts[0] as (DasApiAsset & { content: NFMeIdContent }) | undefined;
      const nfmeImg = nfMeId?.content?.links?.image;
      if (nfmeImg) {
        sessionStorage.removeItem("sig-nfme-later");
        setNfMeIdImageUrl(nfmeImg);
      } else {
        setNfMeIdImageUrl(null);
      }
    }
  }, [solNFMeIdNfts]);

  // Fetch payout logs when artist profile is active
  useEffect(() => {
    if (activeTab === "artist" && userWeb2AccountDetails.isArtist && !loadingPayouts) {
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
  }, [activeTab, userWeb2AccountDetails.isArtist]);

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
            setIsUserArtist(true);
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
      // if the user has made tracks, then we can flag them as an artist (in runtime)
      setIsUserArtist(true);
    }
  }, [myAiRemixRawTracks, displayPublicKey]);

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

  // Render the app profile content
  const renderAppProfile = () => (
    <>
      {/* User Details Section */}
      <div className="bg-black rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 md:mb-0">
          <h2 className="!text-2xl !md:text-2xl font-bold mb-4 text-center md:text-left">Your Details</h2>
          {userWeb2AccountDetails.isArtist && (
            <div className="text-lg text-yellow-300 font-bold border-2 border-yellow-300 rounded-lg p-2">Verified Artist Account</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* Profile Image */}
          <div className="w-32 h-32 rounded-md overflow-hidden bg-gray-900 border-2 border-gray-700">
            {userInfo.profileImage ? (
              <img src={userInfo.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <UserIcon className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>

          {/* User Information */}
          <div className="flex flex-col space-y-2 overflow-x-auto w-full">
            <div>
              <label className="text-gray-400 text-sm">Name</label>
              <p className="text-lg">{userInfo.name || userWeb2AccountDetails.displayName || "Not provided"}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Account Email</label>
              <p className="text-lg">{userInfo.email || userWeb2AccountDetails.primaryAccountEmail || "Not provided"}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Billing Email</label>
              <p className="text-lg">{userWeb2AccountDetails.billingEmail || "Not provided"}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Solana Wallet Address</label>
              <p className="text-lg font-mono">{displayPublicKey ? displayPublicKey.toString() : "Not connected"}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Story Protocol Address</label>
              <p className="text-lg font-mono">{userWeb2AccountDetails.storyProtocolAddress || "Not connected"}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Last Login Session</label>
              <p className="text-lg font-mono">
                {userWeb2AccountDetails.lastLoginTS ? new Date(userWeb2AccountDetails.lastLoginTS).toLocaleString() : "Not Known"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NFMe ID Section */}
      <div className="bg-black hidden rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Your NFMe ID</h2>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* NFMe ID Image */}
          <div className="w-32 h-32 rounded-md overflow-hidden bg-gray-900 border-2 border-gray-700">
            {nfMeIdImageUrl ? (
              <img src={nfMeIdImageUrl} alt="NFMe ID" className="w-full h-full object-cover cursor-pointer" onClick={() => setShowNfMePreferencesModal(true)} />
            ) : (
              <div
                onClick={() => setShowNfMeIdModal(true)}
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 cursor-pointer">
                <UserIcon className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </div>

          {/* NFMe ID Information */}
          <div className="flex flex-col space-y-2">
            <div>
              <label className="text-gray-400 text-sm">Status</label>
              <p className="text-lg">{nfMeIdImageUrl ? "Connected" : "Not Connected"}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Description</label>
              <p className="text-lg">
                Your NFMe ID is a special NFT that you can use to store your personal data like your music preferences which is then used to personalize your
                Sigma Music experience!
              </p>
            </div>
            {!nfMeIdImageUrl && (
              <button
                onClick={() => setShowNfMeIdModal(true)}
                className="mt-4 bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 rounded-lg w-[250px]">
                Claim Your NFMe ID
              </button>
            )}
            <button
              className="mt-4 bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 rounded-lg w-[250px]"
              onClick={() => setShowNfMePreferencesModal(true)}>
              Save App Preferences
            </button>
          </div>
        </div>
      </div>

      <div className="bg-black rounded-lg p-6 mb-6">
        <h2 className="!text-2xl !md:text-2xl font-bold mb-4 text-center md:text-left">Your App Preferences</h2>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <div className="flex flex-col space-y-2">
            <button
              className="mt-4 bg-gradient-to-r from-yellow-300 to-orange-500 text-black px-6 py-2 rounded-lg w-[250px]"
              onClick={() => {
                setShowNfMePreferencesModal(true);
              }}>
              Save Music Genre Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Music Asset Purchases Section */}
      <div className="bg-black rounded-lg p-6">
        <h2 className="!text-2xl font-bold mb-4">Your Music Asset Purchases</h2>
        {myMusicAssetPurchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-xl text-gray-400">No logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">What You Bought</th>
                  <th className="pb-3">Sale Type</th>
                </tr>
              </thead>
              <tbody>
                {myMusicAssetPurchases.map((log, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-3">{new Date(log.purchasedOn).toLocaleString()}</td>
                    <td className="py-3">
                      <>
                        <div
                          className="cursor-pointer hover:underline text-blue-400"
                          onClick={() => navigateToDeepAppView({ artistSlug: log._artistSlug, albumId: log.albumId })}>
                          Album: {log._albumName} by {log._artistName}
                        </div>
                      </>
                    </td>
                    <td className="py-3">
                      <div className="text-sm text-gray-400">
                        {log.albumSaleTypeOption === "1" && "Digital Album + Download Only"}
                        {log.albumSaleTypeOption === "2" && "Digital Album + Download + Collectible (NFT)"}
                        {log.albumSaleTypeOption === "3" && "Digital Album + Commercial License + Download + Collectible (NFT)"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Purchase Log Section */}
      <div className="bg-black rounded-lg p-6">
        <h2 className="!text-2xl font-bold mb-4">Your Full Purchase Log</h2>
        {myPaymentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-xl text-gray-400">No logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">What You Bought</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {myPaymentLogs.map((log, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-3">{new Date(log.createdOn).toLocaleString()}</td>
                    <td className="py-3">
                      {log.task === "buyAlbum" && (
                        <>
                          <div
                            className="cursor-pointer hover:underline text-blue-400"
                            onClick={() => navigateToDeepAppView({ artistSlug: log._artistSlug, albumId: log.albumId })}>
                            Album: {log._albumName} by {log._artistName}
                          </div>
                          <div className="text-sm text-gray-400">
                            {log.albumSaleTypeOption === "1" && "Digital Album + Download Only"}
                            {log.albumSaleTypeOption === "2" && "Digital Album + Download + Collectible (NFT)"}
                            {log.albumSaleTypeOption === "3" && "Digital Album + Commercial License + Download + Collectible (NFT)"}
                          </div>
                        </>
                      )}

                      {log.task === "joinFanClub" && (
                        <>
                          <div
                            className="cursor-pointer hover:underline text-blue-400"
                            onClick={() => {
                              const campaign = log._artistCampaignCode;
                              const country = log._artistSubGroup1Code;
                              const team = log._artistSubGroup2Code;

                              if (campaign && country && team) {
                                navigateToDeepAppView({
                                  artistCampaignCode: campaign,
                                  artistSubGroup1Code: country,
                                  artistSubGroup2Code: team,
                                  artistSlug: log._artistSlug,
                                  artistProfileTab: "fan",
                                });
                              } else {
                                navigateToDeepAppView({ artistSlug: log._artistSlug, artistProfileTab: "fan" });
                              }
                            }}>
                            Artist: {log._artistName}
                          </div>
                          <div>Membership ID: {log.membershipId}</div>
                        </>
                      )}

                      {log.task === "remix" && (
                        <>
                          <div
                            className="cursor-pointer hover:underline text-blue-400"
                            onClick={() => navigateToDeepAppView({ appSection: "remix", sectionView: "myRemixJobs" })}>
                            Remix Track: {log.promptParams?.songTitle} based on {log.promptParams?.refTrack_alId}
                          </div>
                        </>
                      )}

                      {log.task === "buyXP" && (
                        <>
                          <div className="cursor-pointer hover:underline text-blue-400">XP Boost for {log?.XPBeingBought || "N/A"} XP</div>
                        </>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded ${
                          log.paymentStatus === "success"
                            ? "bg-green-900 text-green-300"
                            : log.paymentStatus === "failed"
                              ? "bg-red-900 text-red-300"
                              : "bg-yellow-900 text-yellow-300"
                        }`}>
                        {log.task === "remix" && log.paymentStatus === "new" && "Pending AI Remix..."}
                        {!(log.task === "remix" && log.paymentStatus === "new") && log.paymentStatus.charAt(0).toUpperCase() + log.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="py-3">{log.type === "cc" ? `$${log.amount}` : `${log.amount} SOL`}</td>
                    <td className="py-3">{log.type === "sol" ? "SOL" : "Credit Card"}</td>
                    <td className="py-3">
                      {log.type === "sol" && log.tx && (
                        <a href={`https://solscan.io/tx/${log.tx}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          View on Blockchain Explorer
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
    </>
  );

  // Render the artist profile content
  const renderArtistProfile = () => (
    <>
      {/* Artist Remixes Section */}
      <div className="bg-black rounded-lg p-6">
        <h2 className="!text-2xl font-bold mb-4">Your Music</h2>

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
      <div className="bg-black rounded-lg p-6 mt-6">
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
    </>
  );

  return (
    <div className="flex flex-col w-full px-4">
      {/* Tab Navigation - Only show if user is an artist */}
      {(userWeb2AccountDetails.isArtist || isUserArtist) && (
        <div className="mt-3 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("artist")}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "artist" ? "bg-yellow-300 text-black" : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              }`}>
              Artist Profile
            </button>
            <button
              onClick={() => setActiveTab("app")}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "app" ? "bg-yellow-300 text-black" : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              }`}>
              App Profile
            </button>
          </div>
        </div>
      )}

      {/* Render content based on active tab */}
      {activeTab === "artist" ? renderArtistProfile() : renderAppProfile()}

      {/* NFMe ID Claim Modal */}
      {showNfMeIdModal && <GetNFMeModal setShowNfMeIdModal={setShowNfMeIdModal} setShowNfMePreferencesModal={setShowNfMePreferencesModal} />}

      {/* NFMe Preferences Modal */}
      <NFMePreferencesModal isOpen={showNfMePreferencesModal} onClose={() => setShowNfMePreferencesModal(false)} nfMeIdBrandingHide={nfMeIdBrandingHide} />
    </div>
  );
};

interface NFMeIdContent {
  links: {
    image: string;
  };
  metadata: {
    name: string;
    description: string;
  };
}

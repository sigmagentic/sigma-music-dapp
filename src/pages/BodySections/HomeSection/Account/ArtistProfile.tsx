import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { useSolanaWallet } from "contexts/sol/useSolanaWallet";
import { useWeb3Auth } from "contexts/sol/Web3AuthProvider";
import { AiRemixRawTrack, Album } from "libs/types";
import { MusicTrack } from "libs/types";
import { getPayoutLogsViaAPI, getRemixLaunchesViaAPI, mapRawAiRemixTracksToMusicTracks } from "libs/utils";
import { isUserArtistType, mergeRawAiRemixTracks } from "libs/utils/ui";
import { useAccountStore } from "store/account";
import { useAudioPlayerStore } from "store/audioPlayer";
import { TrackList } from "../components/TrackList";

type ArtistProfileProps = {
  onCloseMusicPlayer: () => void;
  viewSolData: (e: number, f?: any, g?: boolean, h?: MusicTrack[]) => void;
};

// Render the artist profile content
export const ArtistProfile = ({ onCloseMusicPlayer, viewSolData }: ArtistProfileProps) => {
  const { publicKey: web3AuthPublicKey } = useWeb3Auth();
  const { userWeb2AccountDetails, myAiRemixRawTracks, updateMyAiRemixRawTracks } = useAccountStore();
  const { publicKey: solanaPublicKey, walletType } = useSolanaWallet();
  const { updateAssetPlayIsQueued } = useAudioPlayerStore();
  const [payoutLogs, setPayoutLogs] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState<boolean>(false);
  const [totalPayout, setTotalPayout] = useState<number>(0);

  // Use the appropriate public key based on wallet type
  const displayPublicKey = walletType === "web3auth" ? web3AuthPublicKey : solanaPublicKey;

  const [virtualAiRemixAlbum, setVirtualAiRemixAlbum] = useState<Album | null>(null);
  const [virtualAiRemixAlbumTracks, setVirtualAiRemixAlbumTracks] = useState<MusicTrack[]>([]);

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
    if (isUserArtistType(userWeb2AccountDetails.isVerifiedArtist, userWeb2AccountDetails.profileTypes) && !loadingPayouts) {
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

  return (
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
};

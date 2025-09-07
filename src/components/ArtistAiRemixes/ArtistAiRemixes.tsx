import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { AiRemixRawTrack, Album, MusicTrack } from "libs/types/common";
import { getArtistAiRemixViaAPI, mergeRawAiRemixTracks, mapRawAiRemixTracksToMusicTracks } from "libs/utils";
import { TrackList } from "pages/BodySections/HomeSection/components/TrackList";
import { useAudioPlayerStore } from "store/audioPlayer";

interface ArtistAiRemixesProps {
  artistId: string;
  setActiveTab: (tab: string) => void;
  onFeaturedArtistDeepLinkSlug: (artistSlug: string, albumId?: string) => void;
  onCloseMusicPlayer: () => void;
  viewSolData: (e: number, f?: any, g?: boolean, h?: MusicTrack[]) => void;
}

export default function ArtistAiRemixes({ artistId, setActiveTab, onFeaturedArtistDeepLinkSlug, onCloseMusicPlayer, viewSolData }: ArtistAiRemixesProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [virtualAiRemixAlbum, setVirtualAiRemixAlbum] = useState<Album | null>(null);
  const [virtualAiRemixAlbumTracks, setVirtualAiRemixAlbumTracks] = useState<MusicTrack[]>([]);
  const { updateAssetPlayIsQueued } = useAudioPlayerStore();

  useEffect(() => {
    const fetchRemixLaunches = async () => {
      const artistAiRemixData = await getArtistAiRemixViaAPI({ artistId: artistId });

      if (artistAiRemixData.length > 0) {
        const allMyRemixes: AiRemixRawTrack[] = mergeRawAiRemixTracks(artistAiRemixData);

        const { virtualAlbum, allMyRemixesAsMusicTracks } = mapRawAiRemixTracksToMusicTracks(allMyRemixes);
        setVirtualAiRemixAlbum(virtualAlbum);
        setVirtualAiRemixAlbumTracks(allMyRemixesAsMusicTracks);
      }

      setIsLoading(false);
    };

    fetchRemixLaunches();
  }, [artistId]);

  return (
    <>
      {isLoading ? (
        <div className="h-[100px] flex items-center justify-center">
          <Loader className="animate-spin text-yellow-300" size={30} />
        </div>
      ) : (
        <>
          <>
            {virtualAiRemixAlbum && virtualAiRemixAlbumTracks.length > 0 ? (
              <div className="mx-auto md:m-[initial] p-3">
                <TrackList
                  album={virtualAiRemixAlbum}
                  artistId={"virtual-artist-id-PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD"}
                  artistName={"Fan Made AI Remixes"}
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
                          artistId: "virtual-artist-id-PF6xCtUzeCMqXVdvqLCkZGsajKoz2XZ5JJJjuMRcjxD",
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
            ) : (
              <div className="streams-leaderboard-container">
                <h1 className="!text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent text-center md:text-left mt-5">
                  My AI Remixes
                </h1>
                <p className="text-xl mb-10 text-center md:text-left opacity-50">No official AI remixes found</p>
              </div>
            )}
          </>
        </>
      )}
    </>
  );
}

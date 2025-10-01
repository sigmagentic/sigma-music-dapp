import React from "react";
import { Music, Settings } from "lucide-react";
import { Button } from "libComponents/Button";
import { Card } from "libComponents/Card";

interface MainMenuProps {
  onMusicCatalogClick: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onMusicCatalogClick }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Music Catalog */}
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={onMusicCatalogClick}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gray-800 rounded-lg">
              <Music className="w-8 h-8 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Music Catalog</h3>
              <p className="text-gray-600 mb-4">Manage artists, albums, and tracks</p>
              <Button className="">Manage Catalog</Button>
            </div>
          </div>
        </Card>

        {/* App Settings */}
        <Card className="p-6 opacity-50 cursor-not-allowed">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-400 mb-2">App Settings</h3>
              <p className="text-gray-400 mb-4">Configure platform settings and preferences</p>
              <Button className="bg-gray-400 text-white" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

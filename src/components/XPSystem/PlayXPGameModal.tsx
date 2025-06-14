import React, { useState } from "react";
import { LuSpeaker } from "react-icons/lu";
import useSolBitzStore from "store/solBitz";
import GetXPGame from "./GetXPGame";

type PlayXPGameModalProps = {
  showPlayBitzModel?: boolean;
  handleHideBitzModel?: any;
};

export const PlayXPGameModal: React.FC<PlayXPGameModalProps> = (props) => {
  const { showPlayBitzModel, handleHideBitzModel } = props;
  const bitzBalance = useSolBitzStore((state: any) => state.bitzBalance);
  const [isFetchingDataMarshal, setIsFetchingDataMarshal] = useState<boolean>(false);

  return (
    <div
      id="static-modal"
      aria-hidden="true"
      className={`${showPlayBitzModel ? "visible" : "hidden"} flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 bg-[#000000d9]`}>
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg dark:bg-[#171717] drop-shadow-[0_0px_100px_rgba(250,250,250,.8)]">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mr-auto">Win Sigma XP</h3>
            <div className="flex flex-row text-gray-900 dark:text-white">
              {bitzBalance === -2 ? <span>...</span> : <>{bitzBalance === -1 ? <div>0</div> : <div>{bitzBalance}</div>}</>}
              <LuSpeaker fontSize="1.4rem" />
            </div>
            <div>
              <button
                type="button"
                className={` ${isFetchingDataMarshal ? "opacity-30 pointer-events-none" : "text-gray-400"} text-gray-400 ml-2 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white`}
                onClick={handleHideBitzModel}
                data-modal-hide="static-modal">
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
          </div>
          <div className="p-1 md:p-1">
            <GetXPGame
              modalMode={true}
              onIsDataMarshalFetching={(isFetching: boolean) => {
                setIsFetchingDataMarshal(isFetching);
              }}
              onHideBitzModel={handleHideBitzModel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

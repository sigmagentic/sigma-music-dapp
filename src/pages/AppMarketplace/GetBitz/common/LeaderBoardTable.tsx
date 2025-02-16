import React from "react";
import { SolAddressLink } from "components/SolAddressLink";
import { LeaderBoardItemType } from "./interfaces";

interface LeaderBoardTableProps {
  leaderBoardData: LeaderBoardItemType[];
  address: string;
  showMyPosition?: boolean;
}

const LeaderBoardTable: React.FC<LeaderBoardTableProps> = (props) => {
  const { leaderBoardData, address, showMyPosition = false } = props;
  const myPosition = showMyPosition ? leaderBoardData.findIndex((item) => item.playerAddr === address) : -1;
  return (
    <div className="flex flex-col justify-center items-center w-full">
      {showMyPosition && <span className="text-xs text-center mb-2">Your position * {myPosition >= 0 ? myPosition + 1 : "20+"} *</span>}

      <table className="border border-[#fde047]/60 text-center m-auto w-[90%] max-w-[500px]">
        <thead>
          <tr className="border border-[#fde047]/30 ">
            <th className="p-2">Rank</th>
            <th className=" ">User</th>
            <th className="p-2 ">{`BiTz`} Points</th>
          </tr>
        </thead>
        <tbody>
          {leaderBoardData.map((item, rank) => (
            <tr key={rank} className="border border-[#fde047]/30 ">
              <td className=" p-2">
                #{rank + 1} {rank + 1 === 1 && <span> 🥇</span>} {rank + 1 === 2 && <span> 🥈</span>} {rank + 1 === 3 && <span> 🥉</span>}
              </td>
              <td className=" flex items-center justify-center ">
                {item.playerAddr === address ? (
                  "It's YOU! 🫵 🎊"
                ) : (
                  <>
                    <SolAddressLink
                      textStyle="!text-[#fde047]  hover:!text-[#fde047] hover:underline"
                      explorerAddress={"explorerAddress"}
                      address={item.playerAddr}
                      precision={4}
                    />
                  </>
                )}
              </td>
              <td className="p-2 ">{item.bits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderBoardTable;

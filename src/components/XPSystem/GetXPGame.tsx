import React from "react";
import GetXPRouletteGame from "./indexRoulette";

const GetXPGame: React.FC<any> = (props) => {
  const { modalMode, onIsDataMarshalFetching, onHideBitzModel } = props;

  return <div>{<GetXPRouletteGame modalMode={modalMode} onIsDataMarshalFetching={onIsDataMarshalFetching} onHideBitzModel={onHideBitzModel} />}</div>;
};

export default GetXPGame;

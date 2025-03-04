import React from "react";
import GetBitzGame from "./GetBitzSol/indexRoulette";

const GetBitz: React.FC<any> = (props) => {
  const { modalMode, onIsDataMarshalFetching, onHideBitzModel } = props;

  return <div>{<GetBitzGame modalMode={modalMode} onIsDataMarshalFetching={onIsDataMarshalFetching} onHideBitzModel={onHideBitzModel} />}</div>;
};

export default GetBitz;

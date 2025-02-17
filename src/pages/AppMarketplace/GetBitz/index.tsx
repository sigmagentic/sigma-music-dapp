import React from "react";
// import GetBitzSol from "./GetBitzSol";
import GetBitzSol from "./GetBitzSol/indexRoulette";

const GetBitz: React.FC<any> = (props) => {
  const { modalMode, onIsDataMarshalFetching, onHideBitzModel } = props;

  return <div>{<GetBitzSol modalMode={modalMode} onIsDataMarshalFetching={onIsDataMarshalFetching} onHideBitzModel={onHideBitzModel} />}</div>;
};

export default GetBitz;

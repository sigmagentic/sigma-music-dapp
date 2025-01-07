import React from "react";
import GetBitzSol from "./GetBitzSol";

const GetBitz: React.FC<any> = (props) => {
  const { modalMode } = props;

  return <div>{<GetBitzSol modalMode={modalMode} />}</div>;
};

export default GetBitz;

import React from "react";
import HelmetPageMeta from "components/HelmetPageMeta";
import GetBitzSol from "./GetBitzSol";

const GetBitz: React.FC<any> = (props) => {
  const { modalMode } = props;

  return (
    <div>
      <HelmetPageMeta
        title="Itheum BiTz XP App"
        shortTitle="Itheum BiTz XP App"
        desc="Earn Itheum XP for playing a simple proof-of-activity game every few hours."
        shareImgUrl="https://explorer.itheum.io/socialshare/itheum_bitzxp_social_hero.png"
      />

      {<GetBitzSol modalMode={modalMode} />}
    </div>
  );
};

export default GetBitz;

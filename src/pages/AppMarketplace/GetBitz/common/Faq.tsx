import React from "react";
import QuestionCard from "./QuestionCard";
import { faqs as solFaqs } from "../GetBitzSol/configSol";

const Faq: React.FC = () => {
  return (
    <div id="faq" className="flex flex-col max-w-[100%] border border-[#fde047] p-[2rem] rounded-[1rem] mt-[3rem]">
      <div className="flex flex-col mb-8 items-center justify-center">
        <span className="text-foreground text-4xl mb-2">FAQs</span>
        <span className="text-base text-foreground/75 text-center ">Explore our frequently asked questions and answers.</span>
      </div>
      <div className="flex flex-col gap-4 justify-center items-center ">
        {solFaqs.map((pair, index) => (
          <QuestionCard key={index} title={pair.title} content={pair.content} />
        ))}
      </div>
    </div>
  );
};

export default Faq;

import React, { FC } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "libs/utils";

interface SolAddressLinkPropsType {
  explorerAddress: string;
  address: string;
  textStyle?: string;
  precision?: number;
}

export const SolAddressLink: FC<SolAddressLinkPropsType> = ({ explorerAddress, address, textStyle, precision = 6 }) => {
  return (
    <a
      className={cn("text-decoration-none flex flex-row items-center !text-yellow-300 hover:!text-yellow-200 hover:!underline", textStyle)}
      href={`${explorerAddress}/address/${address}`}
      target="_blank">
      {precision > 0 ? address.slice(0, precision) + " ... " + address.slice(-precision) : address}
      <ExternalLink strokeWidth={2.5} size={16} className="ml-1" />
    </a>
  );
};

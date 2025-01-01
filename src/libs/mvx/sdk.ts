import { DataNft, DataNftMarket } from "@itheum/sdk-mx-data-nft";
import { apiTimeout, APP_NETWORK } from "config";

// if we don't do this here, the SDK throw an error when we try and use it inside components
DataNft.setNetworkConfig(APP_NETWORK);

export const dataNftMarket = new DataNftMarket(APP_NETWORK, apiTimeout);

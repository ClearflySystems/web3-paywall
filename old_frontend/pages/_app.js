import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { QueryClient, QueryClientProvider } from "react-query";
const queryClient = new QueryClient();

import {getDefaultWallets, RainbowKitProvider} from "@rainbow-me/rainbowkit";
import {configureChains, createClient, useAccount, WagmiConfig, useContractWrite, usePrepareContractWrite} from "wagmi";
import {
    sepolia,
    goerli,
    localhost
} from "wagmi/chains";
import {alchemyProvider} from "wagmi/providers/alchemy";
import {publicProvider} from "wagmi/providers/public";
import MainLayout from "../layout/mainLayout";

import * as payWallConnect from "../services/payWallConnect";

const {chains, provider} = configureChains(
    [
        sepolia,
        goerli,
        localhost
    ],
    [alchemyProvider({apiKey: process.env.ALCHEMY_API_KEY}), publicProvider()]
);

const {connectors} = getDefaultWallets({
    appName: "My Alchemy DApp",
    chains,
});

const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
});

export {WagmiConfig, RainbowKitProvider};


const { config } = usePrepareContractWrite({
    address: '0xecb504d39723b0be0e3a9aa33d646642d1051ee1',
    abi: wagmigotchiABI,
    functionName: 'feed',
})





function MyApp({Component, pageProps}) {

    const account = useAccount({
        onConnect({address, connector, isReconnected}) {
            if (!isReconnected) router.reload();

            console.log(address);

            payWallConnect.init(wagmiClient, address, RainbowKitProvider, account).catch(e => {
                console.log(e);
            });

        },
    });

    return (
        <WagmiConfig client={wagmiClient}>
            <RainbowKitProvider
                modalSize="compact"
                initialChain={process.env.NEXT_PUBLIC_DEFAULT_CHAIN}
                chains={chains}
            >
                <MainLayout>
                    <Component {...pageProps} />
                </MainLayout>
            </RainbowKitProvider>
        </WagmiConfig>
    );
}

export default MyApp;

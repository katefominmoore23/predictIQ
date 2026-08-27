'use client';
import { createContext,useContext,useMemo,ReactNode } from 'react';
type Wallet={network?:string};type Ctx={networkMismatch:boolean;submitTransaction:<T>(fn:()=>Promise<T>)=>Promise<T>};
const WalletContext=createContext<Ctx|null>(null);
export function WalletProvider({children,wallet,submit}:{children:ReactNode;wallet:Wallet;submit:(fn:()=>Promise<any>)=>Promise<any>}){const expected=process.env.NEXT_PUBLIC_STELLAR_NETWORK||'PUBLIC';const networkMismatch=!!wallet.network&&wallet.network!==expected;const value=useMemo(()=>({networkMismatch,submitTransaction:<T,>(fn:()=>Promise<T>)=>networkMismatch?Promise.reject(Error(`Wallet network mismatch: expected ${expected}`)):submit(fn)}),[networkMismatch,expected,submit]);return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>}
export const useWallet=()=>{const c=useContext(WalletContext);if(!c)throw Error('WalletProvider required');return c};

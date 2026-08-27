import { useCallback,useEffect,useState } from 'react';
type Status='pending'|'confirmed'|'failed'|'dropped';
const KEY='predictiq:pending-transaction';
export function useTransaction(hash:string|null,check:(hash:string)=>Promise<Status>){const [status,setStatus]=useState<Status|null>(()=>{if(typeof window==='undefined')return null;const v=sessionStorage.getItem(KEY);return v?JSON.parse(v).status:null});const poll=useCallback(async()=>{if(!hash)return;const next=await check(hash);setStatus(next);if(next==='pending')sessionStorage.setItem(KEY,JSON.stringify({hash,status:next}));else sessionStorage.removeItem(KEY)},[hash,check]);useEffect(()=>{if(!hash)return;poll();const id=setInterval(poll,3000);return()=>clearInterval(id)},[hash,poll]);return {status,pending:status==='pending'};}

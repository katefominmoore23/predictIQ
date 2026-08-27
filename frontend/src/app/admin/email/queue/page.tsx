'use client';
import { useEffect, useState } from 'react';
type Job={id:string;recipient?:string;template?:string;failure?:string;status?:string};
export default function EmailQueue(){const [jobs,setJobs]=useState<Job[]>([]),[stats,setStats]=useState<Record<string,unknown>>({}),[error,setError]=useState('');
 const load=async()=>{try{const r=await fetch('/api/v1/email/queue/dead-letter');if(!r.ok)throw Error('Unable to load email queue');const d=await r.json();setJobs(d.jobs??d.items??[]);setStats(d.stats??{})}catch(e){setError((e as Error).message)}};
 useEffect(()=>{load()},[]); const requeue=async(id:string)=>{const r=await fetch(`/api/v1/email/queue/dead-letter/${id}/requeue`,{method:'POST'});if(r.ok)setJobs(x=>x.filter(j=>j.id!==id));else setError('Requeue failed')};
 return <main><h1>Email queue</h1>{error&&<p role="alert">{error}</p>}<pre>{JSON.stringify(stats,null,2)}</pre>{jobs.length?<table><thead><tr><th>Recipient</th><th>Template</th><th>Failure</th><th/></tr></thead><tbody>{jobs.map(j=><tr key={j.id}><td>{j.recipient}</td><td>{j.template}</td><td>{j.failure}</td><td><button onClick={()=>requeue(j.id)}>Requeue</button></td></tr>)}</tbody></table>:<p role="status">No dead-letter jobs.</p>}</main>}

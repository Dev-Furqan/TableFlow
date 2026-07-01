import axios from 'axios';
const isNetlify=()=>location.hostname.endsWith('.netlify.app');
const railwayApi='https://tableflowserver-production-bf0b.up.railway.app/api';
export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||(isNetlify()?railwayApi:'/api'),withCredentials:true});
let refreshing=false;let waiting:((ok:boolean)=>void)[]=[];
api.interceptors.response.use(r=>r,async error=>{const original=error.config;if(error.response?.status===401&&!original?._retry&&!original?.url?.includes('/auth/')){original._retry=true;if(refreshing){const ok=await new Promise<boolean>(resolve=>waiting.push(resolve));return ok?api(original):Promise.reject(error)}refreshing=true;try{await api.post('/auth/refresh');waiting.splice(0).forEach(fn=>fn(true));return api(original)}catch(e){waiting.splice(0).forEach(fn=>fn(false));throw e}finally{refreshing=false}}throw error});
export const messageOf=(e:any)=>e?.response?.data?.message||e?.message||'Something went wrong';

import request from 'supertest';
import {app} from './app.js';

const origin = 'https://table-flow-client-1jg9.vercel.app';

async function run() {
  const preflight = await request(app)
    .options('/api/auth/login')
    .set('Origin', origin)
    .set('Access-Control-Request-Method', 'POST');
  console.log('OPTIONS status', preflight.status);
  console.log('OPTIONS headers', JSON.stringify(preflight.headers, null, 2));

  const login = await request(app)
    .post('/api/auth/login')
    .set('Origin', origin)
    .send({email:'x',password:'x'});
  console.log('POST status', login.status);
  console.log('POST headers', JSON.stringify(login.headers, null, 2));
}

run().catch((err)=>{ console.error(err); process.exit(1); });

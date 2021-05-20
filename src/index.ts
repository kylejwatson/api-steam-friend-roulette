import express from 'express';
import { config } from 'dotenv';
import { initAuth } from './auth';
import steamWeb from 'steam-web';
import { initFriendEndpoints } from './friends';
import { initAppEndpoints } from './apps';

config();

const steam = new steamWeb({ apiKey: process.env.STEAM_API_KEY, format: 'json' });
const app = express();

initAuth(app);
initFriendEndpoints(app, steam);
initAppEndpoints(app, steam);

const port = process.env.PORT;
app.listen(port, () => {
    // tslint:disable-next-line: no-console
    console.log(`steam-friend-roulette listening at http://localhost:${port}`);
});

# Stack Prep: full stack prep tracker

React (Vite) frontend + Node.js serverless API, ready for Vercel.

Isme ye sab hai:

- **Overview**: is hafte ka study time (track-wise colour blocks), weekly goal, streak, track progress, aur "Up next" tasks
- **Board**: To do / In progress / Done kanban. Drag and drop (desktop) ya ‹ › buttons (mobile). Add, edit, delete, filter by track, priority, due date
- **Roadmap**: React, Node.js, Python and FastAPI, REST API, Database and DevOps, Interview and System Design. Har topic ko Not started, Learning, Done mark karo. Apne topics aur tracks bhi add kar sakte ho
- **Study log**: focus timer (refresh karne par bhi chalta rehta hai) aur manual session entry
- **Settings**: weekly goal, backup download/restore, optional cloud sync

## Local run

```bash
npm install
npm run dev
```

Is mode me data sirf browser (localStorage) me save hota hai. API ke saath test karna ho to `npx vercel dev` chalao.

## Vercel par deploy

1. Project ko GitHub repo me push karo.
2. Vercel me **Add New, Project** karke repo import karo. Framework "Vite" apne aap detect hoga. Koi setting badalni nahi hai.
3. **Deploy** dabao. App turant kaam karega, data usi browser me save hoga.

## Cross-device sync (optional)

Phone aur laptop dono par same data chahiye to:

1. Vercel project me **Storage** tab kholo, **Upstash Redis** (Marketplace) add karke project se connect karo. Environment variables apne aap add ho jaate hain.
2. **Settings, Environment Variables** me `APP_PASSWORD` naam se ek password add karo.
3. Project ko **Redeploy** karo.
4. App me **Settings, Sync across devices** me wahi password daalo aur "Save and connect" dabao.

Notes:

- `APP_PASSWORD` set na ho to API sync band rehta hai (taaki koi bhi tumhara data na padh/likh sake).
- Har device par password ek baar daalna hota hai.
- Offline ya sync off hone par bhi app chalta hai, data browser me save rehta hai.
- Settings se "Download backup" karke JSON backup rakhna achhi aadat hai.

## Project structure

```
api/state.js          Node.js serverless function (GET/POST, password protected)
src/App.jsx           state, sync logic, navigation
src/data.js           starter roadmap and tasks (yahan topics edit kar sakte ho)
src/views/            Overview, Board, Roadmap, StudyLog, Settings
src/styles.css        saari styling
```

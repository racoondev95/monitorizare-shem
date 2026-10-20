# Shem – Jurnal de evocări

Aplicație Next.js + PostgreSQL (Docker) pentru monitorizarea evocărilor celor 72 de îngeri Shem HaMephorash.

## Pornire (Docker – aplicație + bază de date)

```bash
cp .env.example .env     # apoi editează parolele / contul de admin
docker compose up -d --build
```

Aplicația rulează la http://localhost:3000. La prima pornire se creează automat tabelele,
lista celor 72 de îngeri și contul de administrator (`ADMIN_EMAIL` / `ADMIN_PASSWORD` din `.env`).

Date persistente: volumul Docker `shem_pgdata`. Oprire: `docker compose down` (datele se păstrează;
`docker compose down -v` le șterge).

## Dezvoltare locală

```bash
docker compose up -d db   # doar baza de date (port 5432, doar pe localhost)
npm install
npm run dev               # necesită DATABASE_URL, SESSION_SECRET etc. în .env
```

## Cum funcționează

- **User**: se înregistrează, alege un înger, salvează evocarea (dată, mesaj, senzație), apoi
  completează zilnic, 7 zile (inclusiv ziua evocării), nivelurile Fizic / Emoțional / Mental / Spiritual.
  Zilele viitoare sunt blocate.
- **Admin**: vede toți utilizatorii, activitatea recentă și toate evocările (doar citire).
- **Export CSV**: user – doar datele proprii; admin – toți utilizatorii sau un singur user.
  Separator `;`, UTF-8 cu BOM (se deschide direct în Excel).

## Variabile de mediu

| Variabilă | Rol |
|---|---|
| `DB_PASSWORD` | parola Postgres |
| `SESSION_SECRET` | cheia de semnare a sesiunilor (min. 16 caractere) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | contul de admin creat la prima pornire |
| `APP_PORT`, `APP_TIMEZONE` | portul expus, fusul orar pentru „azi” |
| `COOKIE_SECURE` | `true` când rulează în spatele HTTPS |
| `ALLOW_REGISTRATION` | `false` dezactivează înregistrarea liberă |

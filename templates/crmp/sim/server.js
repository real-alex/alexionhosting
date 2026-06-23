'use strict';
/**
 * Alexion dev simulator (CRMP variant).
 *
 * A stand-in for a real CRMP server so the hosting platform can be developed
 * and tested end-to-end without the proprietary game binary. It binds the game
 * UDP port, prints a realistic console, and shuts down cleanly on
 * SIGTERM/SIGINT (so "stop"/"restart" behave correctly).
 */
const dgram = require('node:dgram');

const port = Number.parseInt(process.env.GAME_PORT || '7777', 10);
const hostname = process.env.SERVER_HOSTNAME || 'Alexion Server';
const maxPlayers = Number.parseInt(process.env.MAX_PLAYERS || '50', 10);
const type = (process.env.SERVER_TYPE || 'crmp').toUpperCase();

function log(message) {
  process.stdout.write(`${message}\n`);
}

log('===================================================');
log(`  Alexion ${type} dev simulator`);
log(`  Server name : ${hostname}`);
log(`  Max players : ${maxPlayers}`);
log(`  Port        : ${port} (UDP)`);
log('===================================================');
log('[sim] This is a placeholder process. Provide the real');
log('[sim] server binary to host an actual game server.');

const socket = dgram.createSocket('udp4');

socket.on('error', (err) => {
  log(`[sim] socket error: ${err.message}`);
});

socket.on('message', (msg, rinfo) => {
  log(`[sim] query packet from ${rinfo.address}:${rinfo.port} (${msg.length} bytes)`);
});

socket.bind(port, () => {
  log(`[sim] Listening for game traffic on UDP ${port}.`);
  log('[sim] Server is ready.');
});

let players = 0;
const heartbeat = setInterval(() => {
  const roll = Math.random();
  if (roll < 0.2 && players < maxPlayers) {
    players += 1;
    log(`[sim] Player connected (${players}/${maxPlayers}).`);
  } else if (roll > 0.85 && players > 0) {
    players -= 1;
    log(`[sim] Player disconnected (${players}/${maxPlayers}).`);
  } else {
    log(`[sim] heartbeat — ${players}/${maxPlayers} players online`);
  }
}, 5000);

function shutdown(signal) {
  log(`[sim] Received ${signal}, shutting down...`);
  clearInterval(heartbeat);
  socket.close(() => {
    log('[sim] Goodbye.');
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

import sharp from 'sharp';
import { mkdirSync } from 'fs';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="102" fill="#0a0a0f"/>
  <rect x="77" y="77" width="358" height="358" rx="51" fill="none" stroke="#22d3ee" stroke-width="30"/>
  <circle cx="256" cy="256" r="62" fill="#22d3ee"/>
  <circle cx="256" cy="256" r="30" fill="#0a0a0f"/>
</svg>`;

mkdirSync('public/icons', { recursive: true });

await sharp(Buffer.from(SVG)).resize(192, 192).png().toFile('public/icons/icon-192.png');
await sharp(Buffer.from(SVG)).resize(512, 512).png().toFile('public/icons/icon-512.png');

console.log('Icons generated: 192x192 and 512x512');

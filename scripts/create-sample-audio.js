const fs = require('fs');
const path = require('path');

// Create a simple WAV file header (1 second of silence)
function createWavHeader(sampleRate = 44100, channels = 1, bitsPerSample = 16) {
  const byteRate = sampleRate * channels * bitsPerSample / 8;
  const blockAlign = channels * bitsPerSample / 8;
  const dataSize = sampleRate * channels * bitsPerSample / 8; // 1 second
  
  const buffer = Buffer.alloc(44);
  
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  return buffer;
}

// Create sample audio files
const audioDir = path.join(__dirname, '../public/audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const sampleFiles = [
  'sample-response-1.mp3',
  'sample-response-2.mp3', 
  'sample-response-3.mp3',
  'sample-response-4.mp3'
];

sampleFiles.forEach((filename, index) => {
  const filePath = path.join(audioDir, filename);
  
  // Create a simple MP3-like file (just a placeholder)
  const header = createWavHeader();
  const silence = Buffer.alloc(44100 * 2); // 1 second of silence
  
  // Write a simple audio file
  fs.writeFileSync(filePath, Buffer.concat([header, silence]));
  
  console.log(`Created ${filename}`);
});

console.log('Sample audio files created successfully!'); 

import fs from 'fs';

// Helper to use native fetch or minimal polyfill if needed
// Assuming Node 18+ which has global fetch.

async function testUpload() {
    const boundary = '--------------------------testboundary123';
    const filename = 'test-sample.wav';
    const fileContent = 'fake audio content';
    
    // Create a dummy file
    fs.writeFileSync(filename, fileContent);

    const body = 
`--${boundary}\r\n` +
`Content-Disposition: form-data; name="name"\r\n\r\n` +
`My Sample Name\r\n` +
`--${boundary}\r\n` +
`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
`Content-Type: audio/wav\r\n\r\n` +
`${fileContent}\r\n` +
`--${boundary}--\r\n`;

    console.log("Sending upload request to http://localhost:3000/api/upload/test-preset-debug");
    try {
        const res = await fetch('http://localhost:3000/api/upload/test-preset-debug', {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: Buffer.from(body)
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${text}`);
    } catch (e) {
        console.error("Request failed:", e);
    } finally {
        if (fs.existsSync(filename)) {
           fs.unlinkSync(filename);
        }
    }
}

testUpload();

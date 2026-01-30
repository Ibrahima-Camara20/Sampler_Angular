import fs from 'fs';

async function uploadFile(i) {
    const boundary = '--------------------------testboundary123';
    const filename = `test-sample-${i}.wav`;
    const fileContent = 'fake audio content';
    fs.writeFileSync(filename, fileContent);

    const body = 
`--${boundary}\r\n` +
`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
`Content-Type: audio/wav\r\n\r\n` +
`${fileContent}\r\n` +
`--${boundary}--\r\n`;

    try {
        const res = await fetch('http://localhost:3000/api/upload/test-preset-limit', {
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
            body: Buffer.from(body)
        });
        const text = await res.text();
        return { status: res.status, body: text };
    } finally {
        if (fs.existsSync(filename)) fs.unlinkSync(filename);
    }
}

async function testLimit() {
    console.log("Testing 17 uploads...");
    for (let i = 1; i <= 17; i++) {
        const res = await uploadFile(i);
        console.log(`Upload ${i}: Status ${res.status}`);
        if (res.status !== 201 && i <= 16) {
             console.error(`Unexpected failure at ${i}:`, res.body);
        }
        if (i === 17) {
            if (res.status === 409) {
                console.log("SUCCESS: Limit reached correctly (409).");
                console.log(res.body);
            } else {
                console.error("FAILURE: 17th upload should have failed.", res.body);
            }
        }
    }
}

testLimit();

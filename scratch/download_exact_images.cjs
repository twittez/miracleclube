const fs = require('fs');
const path = require('path');

async function downloadImages() {
  console.log("Fetching reference page HTML...");
  const res = await fetch('https://www.miraclebelt.com.br/cinta-modeladora-feminina-body-pre-moldado');
  const html = await res.text();

  // Find all AWSLI CDN image URLs that are product images
  const matches = [...html.matchAll(/(https:\/\/cdn\.awsli\.com\.br\/[^\s"'\)]+\.(png|jpg|webp|jpeg))/gi)].map(m => m[1]);
  
  // Filter for high resolution product gallery images (2500x2500 or 800x800 or 600x1000)
  const productImgs = matches.filter(url => url.includes('/produto/66441620/'));
  
  // Unique base image filenames
  const uniqueUrls = [...new Set(productImgs)];
  console.log(`Found ${uniqueUrls.length} total product image matches.`);

  // Group by unique hash (e.g. 2289070e6fd54494929dcb6ea94f6bf3-v6fssm6hej.png)
  const hashes = new Map();
  uniqueUrls.forEach(url => {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    // Prefer 800x800 or 2500x2500
    if (!hashes.has(filename) || url.includes('2500x2500') || url.includes('800x800')) {
      hashes.set(filename, url);
    }
  });

  const selectedUrls = Array.from(hashes.values()).slice(0, 10);
  console.log("Selected high-res images to download:", selectedUrls);

  const targetDir = 'C:\\Users\\luanl\\.gemini\\antigravity\\scratch\\body-shapewear-lp\\public\\images\\product';
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const downloadedPaths = [];

  for (let i = 0; i < selectedUrls.length; i++) {
    const imgUrl = selectedUrls[i];
    console.log(`Downloading (${i + 1}/${selectedUrls.length}): ${imgUrl}`);
    try {
      const imgRes = await fetch(imgUrl);
      const buffer = await imgRes.arrayBuffer();
      
      const ext = path.extname(imgUrl) || '.png';
      const fileName = `ref_${String(i + 1).padStart(2, '0')}${ext}`;
      const filePath = path.join(targetDir, fileName);
      
      fs.writeFileSync(filePath, Buffer.from(buffer));
      downloadedPaths.push(`/images/product/${fileName}`);
      console.log(`Saved -> ${fileName}`);
    } catch (err) {
      console.error(`Failed to download ${imgUrl}:`, err);
    }
  }

  console.log("Downloaded paths:", downloadedPaths);

  // Update product.ts to use these exact reference images!
  const productTsPath = 'C:\\Users\\luanl\\.gemini\\antigravity\\scratch\\body-shapewear-lp\\src\\data\\product.ts';
  let productTsContent = fs.readFileSync(productTsPath, 'utf-8');

  // Replace images array in product.ts
  const imagesJsonStr = JSON.stringify(downloadedPaths, null, 4);
  productTsContent = productTsContent.replace(
    /images:\s*\[[\s\S]*?\],/,
    `images: ${imagesJsonStr},`
  );

  fs.writeFileSync(productTsPath, productTsContent);
  console.log("Updated src/data/product.ts with exact reference images!");
}

downloadImages().catch(console.error);

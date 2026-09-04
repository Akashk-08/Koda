// To use this file run this command: node backend/scripts/categorizeAssets.js
const API_URL = 'http://localhost:8080';
const ORG_ID = 'b263d052-265f-4da1-82c6-4706a7de9955'; 

async function runCategorization() {
  console.log("Starting Asset Categorization Script...");
  
  // Construct the URL with orgId if provided
  const fetchUrl = ORG_ID ? `${API_URL}/api/assets?orgId=${ORG_ID}` : `${API_URL}/api/assets`;
  console.log(`Fetching assets from: ${fetchUrl}`);

  try {
    const response = await fetch(fetchUrl);
    
    // Check if the API actually accepted the request
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      console.log(`Response body:`, await response.text());
      return;
    }

    const data = await response.json();
    const assets = Array.isArray(data) ? data : (data.data || data.assets || []);

    console.log(`\n📦 Found ${assets.length} total assets from API.`);

    if (assets.length === 0) {
      console.log("⚠️ Stopping: No assets were returned. Check your API_URL port or add your ORG_ID.");
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const asset of assets) {
      // Safely grab the current category and name
      const currentCategory = asset.category || "Uncategorized";
      const name = (asset.name || "").toLowerCase();

      // Check if it's already categorized correctly to skip it
      if (currentCategory !== "Uncategorized" && currentCategory !== "ASSETS" && currentCategory !== "GENERAL") {
        skippedCount++;
        continue;
      }
      
      let newCategory = "GENERAL"; 

      // --- CLASSIFICATION RULES ---
      if (name.includes('pc') || name.match(/\b(vc|bpc|vcm|cpc|mini)\d+/)) {
          newCategory = "PC";
      } else if (name.includes('mat vr') || name.includes('dito')) {
          newCategory = "MAT_VR";
      } else if (name.startsWith('vra')) {
          newCategory = "VR_ARENA";
      } else if (name.includes('headset') || name.includes('dpvr') || name.includes('reverb') || name.includes('cosmos') || name.includes('quest') || name.includes('pico') || name.match(/\b(e4c|hp|hc|vp|q2)\d+/)) {
          newCategory = "HEADSET";
      } else if (name.includes('4dx') || name.includes('i360') || name.includes('esp') || name.includes('psb') || name.includes('vrt')) {
          newCategory = "MACHINE";
      }

      // Update the database if we assigned it a new category
      if (newCategory !== currentCategory) {
        console.log(`🔄 Updating [${asset.name}] -> Current: "${currentCategory}" | New: "${newCategory}"`);
        
        await fetch(`${API_URL}/api/assets/${asset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: newCategory }) 
        });
        
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Categorization Complete!`);
    console.log(`📈 Updated: ${updatedCount}`);
    console.log(`⏭️ Skipped (Already matched or Unchanged): ${skippedCount}`);

  } catch (error) {
    console.error("❌ Error running script:", error.message);
    console.log("Hint: Make sure your backend server is currently running so the script can connect to it!");
  }
}

runCategorization();
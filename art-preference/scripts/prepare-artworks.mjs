// Candidate discovery only: does NOT claim popularity ranking or final licensing approval.
// Run with: node scripts/prepare-artworks.mjs > data/chicago-candidates.json
const BASE="https://api.artic.edu/api/v1/artworks/search";
const out=[];let page=1;
while(out.length<1200&&page<=40){
 const url=new URL(BASE);url.searchParams.set("query[term][is_public_domain]","true");url.searchParams.set("fields","id,title,artist_title,date_display,image_id,is_public_domain,artwork_type_title,classification_title");url.searchParams.set("limit","100");url.searchParams.set("page",String(page));
 const response=await fetch(url);if(!response.ok)throw new Error("Art Institute API: "+response.status);
 const json=await response.json();if(!json.data?.length)break;
 for(const a of json.data){if(a.is_public_domain!==true||!a.image_id)continue;if(!/painting/i.test((a.artwork_type_title||"")+" "+(a.classification_title||"")))continue;
 out.push({source:"Art Institute of Chicago",source_id:a.id,title:a.title,artist:a.artist_title,date:a.date_display,image_id:a.image_id,image_url:"https://www.artic.edu/iiif/2/"+a.image_id+"/full/1600,/0/default.jpg",candidate_only:true});}
 page++;
}
process.stdout.write(JSON.stringify({status:"UNRANKED_LICENSE_REVIEW_REQUIRED",count:out.length,source:"Art Institute of Chicago public API",items:out},null,2)+"\n");
